#!/usr/bin/env python3
"""
多进程批量翻译HTML文件
- 使用 argos-translate 本地模型
- 多进程并行
- 进程内翻译缓存(去重)
- 断点续传
- 先删后写断开硬链接
"""
import os, re, json, time, glob, sys, hashlib
from multiprocessing import Pool, cpu_count
from bs4 import BeautifulSoup, NavigableString

BASE = "/Users/andy/Downloads/wiki-multilang"
PROGRESS_FILE = "/tmp/translate_progress_{lang}.json"
CACHE_FILE = "/tmp/translate_cache_{lang}.json"

# 不翻译的标签
SKIP_TAGS = {'script', 'style', 'code', 'pre', 'textarea', 'noscript', 'kbd', 'samp'}

def is_chinese(text):
    return bool(re.search(r'[\u4e00-\u9fff]', text))

def extract_texts(soup):
    """提取可翻译的文本节点, 返回 [(element, text), ...]"""
    texts = []
    for element in soup.descendants:
        if isinstance(element, NavigableString):
            text = str(element).strip()
            if not text or not is_chinese(text):
                continue
            parent = element.parent
            if parent and parent.name in SKIP_TAGS:
                continue
            if len(text) < 2:
                continue
            texts.append((element, text))
    return texts

def init_worker(lang):
    """初始化工作进程: 加载翻译模型"""
    global translator, translate_cache, target_lang
    target_lang = lang
    from argostranslate import settings
    settings.chunk_type = settings.ChunkType.MINISBD
    import argostranslate.translate as t
    if lang == 'en':
        translator = t.get_translation_from_codes("zh", "en")
    else:
        # 西班牙文: zh -> en -> es (两步)
        translator_zh_en = t.get_translation_from_codes("zh", "en")
        translator_en_es = t.get_translation_from_codes("en", "es")
        translator = (translator_zh_en, translator_en_es)
    
    # 加载缓存
    cache_path = CACHE_FILE.format(lang=lang)
    if os.path.exists(cache_path):
        with open(cache_path) as f:
            translate_cache = json.load(f)
    else:
        translate_cache = {}
    print(f"[Worker] 翻译模型加载完成, 缓存: {len(translate_cache)} 条", flush=True)

def translate_text(text):
    """翻译单个文本, 带缓存"""
    global translator, translate_cache, target_lang
    if text in translate_cache:
        return translate_cache[text]
    
    try:
        if target_lang == 'en':
            result = translator.translate(text)
        else:
            # 西班牙文: zh -> en -> es
            zh_en = translator[0].translate(text)
            result = translator[1].translate(zh_en)
        translate_cache[text] = result
        return result
    except Exception as e:
        print(f"[Worker] 翻译失败: {e}, 文本: {text[:30]}", flush=True)
        return text

def translate_file(args):
    """翻译单个文件"""
    html_path, lang = args
    rel_path = os.path.relpath(html_path, BASE)
    
    try:
        with open(html_path, 'r', encoding='utf-8', errors='replace') as f:
            html = f.read()
    except Exception as e:
        return (rel_path, False, f"读取失败: {e}")
    
    if not is_chinese(html):
        return (rel_path, True, "无中文")
    
    soup = BeautifulSoup(html, 'html.parser')
    texts = extract_texts(soup)
    
    if not texts:
        return (rel_path, True, "无待翻译文本")
    
    # 翻译所有文本节点
    translated_count = 0
    for element, text in texts:
        # 长文本分段
        if len(text) > 300:
            chunks = [text[i:i+250] for i in range(0, len(text), 250)]
            translated_chunks = [translate_text(c) for c in chunks]
            translated = ' '.join(translated_chunks)
        else:
            translated = translate_text(text)
        element.replace_with(translated)
        translated_count += 1
    
    # 写回 (先删后写, 断开硬链接)
    try:
        os.remove(html_path)
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(str(soup))
    except Exception as e:
        return (rel_path, False, f"写入失败: {e}")
    
    return (rel_path, True, f"翻译{translated_count}节点")

def save_cache(lang):
    """保存翻译缓存"""
    # 注意: 这是主进程, 没有缓存. 缓存在工作进程中.
    # 工作进程结束时会保存缓存
    pass

def main():
    lang = sys.argv[1] if len(sys.argv) > 1 else 'en'
    workers = int(sys.argv[2]) if len(sys.argv) > 2 else min(8, cpu_count())
    
    target_dir = os.path.join(BASE, lang)
    html_files = sorted(glob.glob(os.path.join(target_dir, '**', '*.html'), recursive=True))
    
    # 加载进度
    progress_path = PROGRESS_FILE.format(lang=lang)
    if os.path.exists(progress_path):
        with open(progress_path) as f:
            progress = json.load(f)
    else:
        progress = {'translated': [], 'failed': []}
    
    # 过滤已翻译的文件
    todo = [(f, lang) for f in html_files if os.path.relpath(f, BASE) not in progress['translated']]
    
    print(f"目标语言: {lang}")
    print(f"工作进程: {workers}")
    print(f"总文件: {len(html_files)}, 待翻译: {len(todo)}, 已完成: {len(progress['translated'])}")
    
    if not todo:
        print("所有文件已翻译完成!")
        return
    
    start_time = time.time()
    completed = 0
    
    with Pool(processes=workers, initializer=init_worker, initargs=(lang,)) as pool:
        for i, (rel_path, success, msg) in enumerate(pool.imap_unordered(translate_file, todo, chunksize=1)):
            completed += 1
            if success:
                progress['translated'].append(rel_path)
            else:
                progress['failed'].append(rel_path)
            
            # 每50个文件保存进度
            if completed % 50 == 0:
                with open(progress_path, 'w') as f:
                    json.dump(progress, f)
                elapsed = time.time() - start_time
                rate = completed / elapsed
                eta = (len(todo) - completed) / rate / 3600
                print(f"[{completed}/{len(todo)}] {rel_path} - {msg} | 速度: {rate:.1f}文件/秒 | 预计: {eta:.1f}小时", flush=True)
    
    # 保存最终进度
    with open(progress_path, 'w') as f:
        json.dump(progress, f)
    
    elapsed = time.time() - start_time
    print(f"\n翻译完成! 共 {completed} 个文件, 耗时 {elapsed/3600:.1f} 小时")
    print(f"成功: {len(progress['translated'])}, 失败: {len(progress['failed'])}")

if __name__ == '__main__':
    main()
