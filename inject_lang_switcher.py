#!/usr/bin/env python3
"""批量注入 lang-switcher.js 到三语 HTML 页面（按相对深度计算路径，跳过已注入）"""
import os
import sys

BASE = '/Users/andy/Downloads/wiki-multilang'
LANGS = ['en', 'es', 'ja']
ROOT_JS = os.path.join(BASE, 'lang-switcher.js')

def inject(filepath):
    """返回 (injected_bool, skipped_reason)"""
    try:
        with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
            content = f.read()
    except Exception as e:
        return False, f'read_error:{e}'
    if 'lang-switcher.js' in content:
        return False, 'already'
    if '</body>' not in content:
        return False, 'no_body'
    # 计算 lang-switcher.js 相对路径
    rel = os.path.relpath(ROOT_JS, os.path.dirname(filepath))
    if not rel.startswith('.'):
        rel = './' + rel
    tag = f'<script src="{rel}"></script>\n'
    content = content.replace('</body>', tag + '</body>', 1)
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
    except Exception as e:
        return False, f'write_error:{e}'
    return True, 'ok'

def main():
    total = injected = skipped_already = skipped_nobody = skipped_err = 0
    for lang in LANGS:
        lang_dir = os.path.join(BASE, lang)
        for root, dirs, files in os.walk(lang_dir):
            for fn in files:
                if not fn.endswith('.html'):
                    continue
                fp = os.path.join(root, fn)
                total += 1
                ok, reason = inject(fp)
                if ok:
                    injected += 1
                elif reason == 'already':
                    skipped_already += 1
                elif reason == 'no_body':
                    skipped_nobody += 1
                else:
                    skipped_err += 1
                    if skipped_err <= 5:
                        print(f'ERR {fp}: {reason}', file=sys.stderr)
    print(f'扫描 {total} 个 HTML | 注入 {injected} | 已存在 {skipped_already} | 无body {skipped_nobody} | 错误 {skipped_err}')

if __name__ == '__main__':
    main()
