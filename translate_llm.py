#!/usr/bin/env python3
"""基于阿里云通义API的专业翻译脚本 - 批量翻译HTML正文"""
import os, re, json, time, glob, sys, threading
from concurrent.futures import ThreadPoolExecutor, as_completed
from bs4 import BeautifulSoup, NavigableString
import urllib.request, urllib.error

BASE = "/Users/andy/Downloads/wiki-multilang"
# 火山引擎API模式
API_BASE = "https://ark.cn-beijing.volces.com/api/v3"
API_KEY = "ark-eb44c125-75ab-415a-bf4b-75c622239533-8060c"
MODEL = "deepseek-v4-flash-ga-260731"
PROGRESS_FILE = "/tmp/llm_translate_{lang}.json"
SEP = "\n<<<SEP>>>\n"
MAX_BATCH_CHARS = 4000
MAX_WORKERS = 4  # API模式，4并发

SKIP_TAGS = {'script', 'style', 'code', 'pre', 'textarea', 'noscript', 'kbd', 'samp'}

SYSTEM_PROMPTS = {
    'en': """You are a professional technical documentation translator. Translate Chinese to English.
Rules:
1. Translate ONLY the text content, preserve all code, syntax, URLs, and technical terms
2. Keep technical accuracy - use standard English terminology for programming concepts
3. Do not add explanations, notes, or markdown formatting
4. Respond with a JSON array of translated strings only - same length as input, no extra text""",
    'es': """You are a professional technical documentation translator. Translate Chinese to Spanish.
Rules:
1. Translate ONLY the text content, preserve all code, syntax, URLs, and technical terms
2. Keep technical accuracy - use standard Spanish terminology for programming concepts
3. Do not add explanations, notes, or markdown formatting
4. Respond with a JSON array of translated strings only - same length as input, no extra text""",
    'ja': """You are a professional technical documentation translator. Translate Chinese to Japanese.
Rules:
1. Translate ONLY the text content, preserve all code, syntax, URLs, and technical terms
2. Keep technical accuracy - use standard Japanese terminology for programming concepts
3. Do not add explanations, notes, or markdown formatting
4. Respond with a JSON array of translated strings only - same length as input, no extra text"""
}

_lock = threading.Lock()
_stats = {'ok': 0, 'fail': 0, 'chars': 0}

def is_chinese(text):
    return bool(re.search(r'[\u4e00-\u9fff]', text))

def call_api(messages, max_retries=5):
    """调用阿里云API"""
    payload = json.dumps({
        "model": MODEL,
        "messages": messages,
        "temperature": 0.1,
        "max_tokens": 16384
    }).encode('utf-8')
    for attempt in range(max_retries):
        try:
            req = urllib.request.Request(
                f"{API_BASE}/chat/completions",
                data=payload,
                headers={
                    "Authorization": f"Bearer {API_KEY}",
                    "Content-Type": "application/json"
                },
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=300) as resp:
                data = json.loads(resp.read().decode('utf-8'))
                return data['choices'][0]['message']['content'].strip()
        except urllib.error.HTTPError as e:
            if e.code == 429:
                # 限流：固定退避30秒，最多5次
                wait = 30
                print(f"  [429限流] 等待{wait}秒后重试({attempt+1}/{max_retries})", flush=True)
                time.sleep(wait)
            elif attempt < max_retries - 1:
                wait = min(2 ** attempt, 30)
                time.sleep(wait)
            else:
                raise e
        except Exception as e:
            if attempt < max_retries - 1:
                wait = 2 ** attempt
                time.sleep(wait)
            else:
                raise e

def translate_batch(texts, lang):
    """批量翻译一组文本，用编号方式输出"""
    if not texts:
        return []
    target = {'en': 'English', 'es': 'Spanish', 'ja': 'Japanese'}.get(lang, 'Japanese')
    # 构造带编号的输入
    numbered = "\n".join(f"[{i+1}] {t}" for i, t in enumerate(texts))
    messages = [
        {"role": "system", "content": f"You are a professional technical translator. Translate Chinese to {target}. Preserve code, URLs, technical terms. Output translations in the same numbered format [1] [2] etc., no explanations."},
        {"role": "user", "content": f"Translate each numbered segment from Chinese to {target}, keeping the [number] prefix:\n{numbered}"}
    ]
    try:
        result = call_api(messages)
    except Exception as e:
        print(f"  [API ERROR] {e}", flush=True)
        return texts
    # 解析编号输出
    translated = []
    # 匹配 [数字] 开头的段
    pattern = re.compile(r'\[(\d+)\]\s*(.*?)(?=\[\d+\]|$)', re.DOTALL)
    matches = pattern.findall(result)
    if matches:
        # 按编号排序
        match_dict = {int(num): text.strip() for num, text in matches}
        for i in range(len(texts)):
            if i+1 in match_dict:
                translated.append(match_dict[i+1])
            else:
                translated.append(texts[i])  # 缺失则保留原文
        if len(translated) == len(texts):
            return translated
    # 降级：逐段翻译
    print(f"  [WARN] 编号解析失败({len(texts)}段), 降级逐段", flush=True)
    result_list = []
    for t in texts:
        try:
            single = call_api([
                {"role": "user", "content": f"Translate to {target}, output ONLY the translation:\n{t}"}
            ])
            result_list.append(single.strip())
        except:
            result_list.append(t)
    return result_list

def extract_texts(soup):
    """提取div.article内的文本 + title + 标题，返回(NavigableString对象, 文本)"""
    texts = []
    # title - 用.string（NavigableString）而非Tag
    if soup.title and soup.title.string and is_chinese(str(soup.title.string)):
        t = str(soup.title.string).strip()
        if t:
            texts.append((soup.title.string, t))
    # h1, h2, h3 - 遍历子节点找NavigableString
    for tag in soup.find_all(['h1', 'h2', 'h3']):
        for child in tag.children:
            if isinstance(child, NavigableString):
                t = str(child).strip()
                if is_chinese(t) and len(t) > 1:
                    texts.append((child, t))
    # div.article
    article = soup.find('div', class_='article')
    if article:
        for element in article.descendants:
            if isinstance(element, NavigableString):
                text = str(element).strip()
                if not text or not is_chinese(text) or len(text) < 2:
                    continue
                parent = element.parent
                if parent and parent.name in SKIP_TAGS:
                    continue
                texts.append((element, text))
    return texts

def translate_file(html_path, lang):
    """翻译单个HTML文件"""
    rel = os.path.relpath(html_path, BASE)
    try:
        with open(html_path, 'r', encoding='utf-8', errors='replace') as f:
            html = f.read()
    except Exception:
        return (rel, False, "读取失败")
    if not is_chinese(html):
        return (rel, True, "无中文")
    soup = BeautifulSoup(html, 'html.parser')
    texts = extract_texts(soup)
    if not texts:
        return (rel, True, "无待翻译文本")
    # 分批翻译
    raw_texts = [t for _, t in texts]
    translated = []
    i = 0
    while i < len(raw_texts):
        batch = []
        batch_len = 0
        while i < len(raw_texts) and batch_len + len(raw_texts[i]) < MAX_BATCH_CHARS:
            batch.append(raw_texts[i])
            batch_len += len(raw_texts[i]) + len(SEP)
            i += 1
        if not batch:
            batch = [raw_texts[i]]
            i += 1
        try:
            result = translate_batch(batch, lang)
            translated.extend(result)
        except Exception as e:
            # 失败则保留原文
            translated.extend(batch)
    # 替换回HTML
    for (elem, _), tr in zip(texts, translated):
        try:
            elem.replace_with(tr)
        except:
            pass
    # 写回（断开硬链接）
    try:
        os.remove(html_path)
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(str(soup))
    except Exception:
        return (rel, False, "写入失败")
    with _lock:
        _stats['ok'] += 1
        _stats['chars'] += sum(len(t) for t in raw_texts)
    return (rel, True, f"翻译{len(texts)}段")

def main():
    lang = sys.argv[1] if len(sys.argv) > 1 else 'en'
    workers = int(sys.argv[2]) if len(sys.argv) > 2 else MAX_WORKERS
    target_dir = os.path.join(BASE, lang)
    html_files = sorted(glob.glob(os.path.join(target_dir, '**', '*.html'), recursive=True))
    pp = PROGRESS_FILE.format(lang=lang)
    progress = json.load(open(pp)) if os.path.exists(pp) else {'translated': [], 'failed': []}
    todo = [f for f in html_files if os.path.relpath(f, BASE) not in progress['translated']]
    print(f"语言:{lang} 并发:{workers} 总文件:{len(html_files)} 待翻译:{len(todo)}", flush=True)
    if not todo:
        print("全部完成!")
        return
    start = time.time()
    done = 0
    with ThreadPoolExecutor(max_workers=workers) as executor:
        futures = {executor.submit(translate_file, f, lang): f for f in todo}
        for future in as_completed(futures):
            try:
                rel, ok, msg = future.result()
            except Exception as e:
                fpath = futures[future]
                rel = os.path.relpath(fpath, BASE)
                ok, msg = False, f"异常: {e}"
                print(f"  [ERROR] {rel}: {e}", flush=True)
            done += 1
            with _lock:
                if ok:
                    progress['translated'].append(rel)
                else:
                    progress['failed'].append(rel)
            if done % 20 == 0:
                json.dump(progress, open(pp, 'w'))
                elapsed = time.time() - start
                rate_per_min = done / elapsed * 60
                eta = (len(todo) - done) / rate_per_min / 60 if rate_per_min > 0 else 0
                with _lock:
                    print(f"[{done}/{len(todo)}] {rate_per_min:.1f}文件/分 成功{_stats['ok']} 失败{_stats['fail']} 已译{_stats['chars']//1000}K字 预计{eta:.1f}h", flush=True)
    json.dump(progress, open(pp, 'w'))
    elapsed = time.time() - start
    print(f"完成! {done}文件 {elapsed/3600:.1f}小时", flush=True)

if __name__ == '__main__':
    main()
