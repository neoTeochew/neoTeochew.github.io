#!/usr/bin/env python3
"""删除前的安全检查：找出「定义了但没人用」和「用了但没定义」的东西。

用法：
    python check.py

检查项：
  1. CSS 里的类名 / id 选择器是否在 HTML 或 app.js 里出现
  2. I18N 三语 key 是否齐全、是否有未使用的
  3. app.js 里的函数是否被调用
  4. app.js 用 getElementById 取的 id 是否存在于 index.html
  5. HTML 里的 data-i18n key 是否都有对应文案

它只做「静态文本匹配」，不执行代码。动态拼接出的类名可能会被误报，
所以报告里每一条都给出出现位置，人工确认后再删。
"""

import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent
PAGES = ['orthography', 'grammar', 'resource', 'about']

app_js = (ROOT / 'app.js').read_text(encoding='utf-8')

# 从 app.js 的 LANGUAGES 里读语言与目录，避免这里再写死一份
_lang_block = app_js[app_js.index('const LANGUAGES = ['):]
_lang_block = _lang_block[:_lang_block.index('\n  ];')]
LANGS = []
for _block in re.split(r'\n    \{\n', _lang_block)[1:]:
    _code = re.search(r"code:\s*'([^']*)'", _block).group(1)
    _path = re.search(r"path:\s*'([^']*)'", _block).group(1)
    LANGS.append((_code, _path))
LANG_CODES = [code for code, _ in LANGS]
DEFAULT_LANG = next((code for code, path in LANGS if path == ''), LANG_CODES[0])

HTML_FILES = ['%sindex.html' % path for _, path in LANGS]
for _path in [path for _, path in LANGS]:
    for _slug in PAGES:
        HTML_FILES.append('%s%s/index.html' % (_path, _slug))

css = (ROOT / 'styles.css').read_text(encoding='utf-8')
html_all = ''
for name in HTML_FILES:
    path = ROOT / name
    if path.exists():
        html_all += path.read_text(encoding='utf-8') + '\n'
elsewhere = html_all + app_js


def selector_text(source):
    """只保留选择器文本：逐字扫描，跳过 {} 里的声明。"""
    result = []
    depth = 0
    for char in source:
        if char == '{':
            depth += 1
        elif char == '}':
            depth -= 1
            if depth == 0:
                result.append('\n')
        elif depth == 0:
            result.append(char)
    return ''.join(result)


SELECTORS = selector_text(css)


def token_used(name, text):
    """name 作为独立标识符出现过（前后不是字母数字下划线连字符）。"""
    return re.search(r'(?<![A-Za-z0-9_-])%s(?![A-Za-z0-9_-])' % re.escape(name), text) is not None


print('=' * 60)
print('1. CSS 类名未被使用')
classes = sorted(set(re.findall(r'\.([A-Za-z][A-Za-z0-9_-]*)', SELECTORS)))
dead = [name for name in classes if not token_used(name, elsewhere)]
for name in dead:
    line = next((i + 1 for i, text in enumerate(css.splitlines()) if '.' + name in text), 0)
    print('   .%-28s styles.css:%s' % (name, line))
if not dead:
    print('   （无）')

print('=' * 60)
print('2. CSS id 选择器未在 HTML 中出现')
ids_css = sorted(set(re.findall(r'#([A-Za-z][A-Za-z0-9_-]*)', SELECTORS)))
declared = set(re.findall(r'id="([^"]+)"', html_all))
dead_ids = [name for name in ids_css if name not in declared]
for name in dead_ids:
    line = next((i + 1 for i, text in enumerate(css.splitlines()) if '#' + name in text), 0)
    print('   #%-27s styles.css:%s' % (name, line))
if not dead_ids:
    print('   （无）')

print('=' * 60)
print('3. I18N 文案 key')
blocks = {}
for code in LANG_CODES:
    match = re.search(r"\n    %s: \{\n(.*?)\n    \}" % code, app_js, re.S)
    blocks[code] = set(re.findall(r'\n      ([A-Za-z0-9_]+):', match.group(1))) if match else set()
used = set(re.findall(r"t\('([A-Za-z0-9_]+)'", app_js))
used |= set(re.findall(r'data-i18n(?:-placeholder|-title|-aria)?="([A-Za-z0-9_]+)"', html_all))
used |= set(re.findall(r"'(?:[A-Za-z]+)' % slug", app_js))
build_py = (ROOT / 'build_site.py').read_text(encoding='utf-8')
used |= set(re.findall(r"strings\['([A-Za-z0-9_]+)'\]", build_py))
for code in LANG_CODES:
    for slug in PAGES:
        used.update({'%sTitle' % slug, '%sLead' % slug})
    used.add('pageTitle')
for code in LANG_CODES:
    if code == DEFAULT_LANG:
        continue
    missing = blocks[DEFAULT_LANG] - blocks[code]
    print('   %s 缺少：%s' % (code, sorted(missing) if missing else '无'))
unused = sorted(blocks[DEFAULT_LANG] - used)
print('   未使用：%s' % (unused if unused else '无'))

print('=' * 60)
print('4. app.js 里定义但没被调用的函数')
for name in set(re.findall(r'function ([A-Za-z0-9_]+)\(', app_js)):
    if len(re.findall(r'\b%s\b' % re.escape(name), app_js)) <= 1:
        line = next(i + 1 for i, text in enumerate(app_js.splitlines())
                    if re.search(r'function %s\(' % re.escape(name), text))
        print('   %-28s app.js:%s' % (name, line))

print('=' * 60)
print('5. app.js 取用的 DOM id 是否存在于 index.html')
ids_js = set(re.findall(r"getElementById\('([^']+)'\)", app_js))
ids_html = set(re.findall(r'id="([^"]+)"', (ROOT / 'index.html').read_text(encoding='utf-8')))
missing = sorted(ids_js - ids_html)
print('   缺失：%s' % (missing if missing else '无'))

print('=' * 60)
print('6. HTML 里 data-i18n 的 key 是否有文案')
keys = set(re.findall(r'data-i18n(?:-placeholder|-title|-aria)?="([^"]+)"', html_all))
missing = sorted(keys - blocks[DEFAULT_LANG])
print('   缺失：%s' % (missing if missing else '无'))

print('=' * 60)
print('7. 生成物是否过期（源文件改过但没重新构建）')
stale = []
data_json, data_js = ROOT / 'data.json', ROOT / 'data.js'
if data_json.exists() and data_js.exists() and data_json.stat().st_mtime > data_js.stat().st_mtime:
    stale.append('data.json 比 data.js 新')

pages = []
for _path in [path for _, path in LANGS]:
    for _slug in PAGES:
        pages.append(ROOT / ('%s%s/index.html' % (_path, _slug)))
pages += [ROOT / ('%sindex.html' % path) for _, path in LANGS]
pages.append(ROOT / 'sitemap.xml')
pages = [path for path in pages if path.exists()]

sources = [ROOT / name for name in ['app.js', 'index.html', 'build_site.py']]
content_dir = ROOT / 'content'
if content_dir.exists():
    sources += list(content_dir.rglob('*.html'))
if pages:
    newest = max(sources, key=lambda path: path.stat().st_mtime)
    oldest_page = min(pages, key=lambda path: path.stat().st_mtime)
    if newest.stat().st_mtime > oldest_page.stat().st_mtime:
        stale.append('%s 比 %s 新'
                     % (newest.relative_to(ROOT), oldest_page.relative_to(ROOT)))
for item in stale:
    print('   过期：%s，请运行 python build_site.py' % item)
if not stale:
    print('   无（生成物都是最新的）')
print('=' * 60)
