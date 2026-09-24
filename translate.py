#!/usr/bin/env python3
"""优化版翻译: 只翻译正文(div.article)+标题, 2进程, 批量合并"""
import os, re, json, time, glob, sys
from multiprocessing import Pool
from bs4 import BeautifulSoup, NavigableString

BASE = "/Users/andy/Downloads/wiki-multilang"
PROGRESS_FILE = "/tmp/translate_progress_{lang}.json"
SEP = "\n<<<>>>\n"
SKIP_TAGS = {'script', 'style', 'code', 'pre', 'textarea', 'noscript', 'kbd', 'samp'}

def is_chinese(text):
    return bool(re.search(r'[\u4e00-\u9fff]', text))

def extract_texts(soup):
    """只提取 div.article 内的文本 + title + h1"""
    texts = []
    # title
    if soup.title and soup.title.string and is_chinese(str(soup.title.string)):
        texts.append((soup.title, str(soup.title.string).strip()))
    # h1
    for h1 in soup.find_all('h1'):
        for s in h1.stripped_strings:
            if is_chinese(s):
                texts.append((s, s))
    # div.article 内的文本
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

def init_worker(lang):
    global translator, cache, target_lang
    target_lang = lang
    from argostranslate import settings
    settings.chunk_type = settings.ChunkType.MINISBD
    import argostranslate.translate as t
    if lang == 'en':
        translator = t.get_translation_from_codes("zh", "en")
    else:
        translator = (t.get_translation_from_codes("zh", "en"), t.get_translation_from_codes("en", "es"))
    cache = {}
    print(f"[Worker] {lang} 模型加载完成", flush=True)

def translate_batch(texts):
    global translator, cache, target_lang
    unique = list(dict.fromkeys(texts))
    uncached = [t for t in unique if t not in cache]
    if uncached:
        combined = SEP.join(uncached)
        if len(combined) > 2500:
            results = []
            batch, blen = [], 0
            for t in uncached:
                if blen + len(t) + len(SEP) > 2500 and batch:
                    cb = SEP.join(batch)
                    try:
                        if target_lang == 'en':
                            tr = translator.translate(cb)
                        else:
                            en = translator[0].translate(cb)
                            tr = translator[1].translate(en)
                    except:
                        tr = cb
                    results.extend(tr.split(SEP.strip()))
                    batch, blen = [], 0
                batch.append(t)
                blen += len(t) + len(SEP)
            if batch:
                cb = SEP.join(batch)
                try:
                    if target_lang == 'en':
                        tr = translator.translate(cb)
                    else:
                        en = translator[0].translate(cb)
                        tr = translator[1].translate(en)
                except:
                    tr = cb
                results.extend(tr.split(SEP.strip()))
            for i, t in enumerate(uncached):
                cache[t] = results[i].strip() if i < len(results) else t
        else:
            try:
                if target_lang == 'en':
                    tr = translator.translate(combined)
                else:
                    en = translator[0].translate(combined)
                    tr = translator[1].translate(en)
            except:
                tr = combined
            parts = tr.split(SEP.strip())
            for i, t in enumerate(uncached):
                cache[t] = parts[i].strip() if i < len(parts) else t
    return [cache.get(t, t) for t in texts]

def translate_file(args):
    html_path, lang = args
    rel = os.path.relpath(html_path, BASE)
    try:
        with open(html_path, 'r', encoding='utf-8', errors='replace') as f:
            html = f.read()
    except Exception as e:
        return (rel, False, f"读取失败")
    if not is_chinese(html):
        return (rel, True, "无中文")
    soup = BeautifulSoup(html, 'html.parser')
    texts = extract_texts(soup)
    if not texts:
        return (rel, True, "无待翻译文本")
    raw = [t for _, t in texts]
    translated = translate_batch(raw)
    for (elem, _), tr in zip(texts, translated):
        try:
            elem.replace_with(tr)
        except:
            pass
    try:
        os.remove(html_path)
        with open(html_path, 'w', encoding='utf-8') as f:
            f.write(str(soup))
    except Exception as e:
        return (rel, False, f"写入失败")
    return (rel, True, f"翻译{len(texts)}节点")

def main():
    lang = sys.argv[1] if len(sys.argv) > 1 else 'en'
    workers = int(sys.argv[2]) if len(sys.argv) > 2 else 2
    target_dir = os.path.join(BASE, lang)
    html_files = sorted(glob.glob(os.path.join(target_dir, '**', '*.html'), recursive=True))
    pp = PROGRESS_FILE.format(lang=lang)
    progress = json.load(open(pp)) if os.path.exists(pp) else {'translated': [], 'failed': []}
    todo = [(f, lang) for f in html_files if os.path.relpath(f, BASE) not in progress['translated']]
    print(f"语言:{lang} 进程:{workers} 总文件:{len(html_files)} 待翻译:{len(todo)}")
    if not todo:
        print("全部完成!")
        return
    start = time.time()
    done = 0
    with Pool(processes=workers, initializer=init_worker, initargs=(lang,)) as pool:
        for rel, ok, msg in pool.imap_unordered(translate_file, todo, chunksize=1):
            done += 1
            if ok:
                progress['translated'].append(rel)
            else:
                progress['failed'].append(rel)
            if done % 10 == 0:
                json.dump(progress, open(pp, 'w'))
                elapsed = time.time() - start
                rate = done / elapsed
                eta = (len(todo) - done) / rate / 3600 if rate > 0 else 0
                print(f"[{done}/{len(todo)}] {rate:.2f}文件/秒 预计{eta:.1f}h", flush=True)
    json.dump(progress, open(pp, 'w'))
    print(f"完成! {done}文件 {(time.time()-start)/3600:.1f}小时")

if __name__ == '__main__':
    main()
