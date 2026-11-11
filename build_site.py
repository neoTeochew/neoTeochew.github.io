#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
潮州话词典 · 构建脚本（无第三方依赖，仅需 Python 3）

做五件事：
  1. 由 data.json 生成 data.js（页面实际读取的数据文件）
  2. 由 index.html 生成 en/index.html、fr/index.html 两份语言落地页（供搜索引擎收录）
  3. 生成导航独立页（orthography / grammar / resource / about）的三语静态版本
  4. 更新所有页面里的 canonical / hreflang / OG 块
  5. 生成 sitemap.xml 与 robots.txt

用法：
  python build_site.py --site-url https://你的域名
  （省略 --site-url 时使用占位域名 example.com，仅适合本地预览）

注意：
  - 改了 index.html 或 app.js 的 I18N 文案后，必须重新运行本脚本，
    否则 en/ fr/ 里的静态文字会与主站不一致（不影响用户看到的内容，但影响爬虫看到的）。
  - en/index.html、fr/index.html 是生成产物，不要直接编辑。
"""

import argparse
import html
import json
import os
import re
import sys
from datetime import date

ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_JSON = os.path.join(ROOT, 'data.json')
DATA_JS = os.path.join(ROOT, 'data.js')
INDEX_HTML = os.path.join(ROOT, 'index.html')
APP_JS = os.path.join(ROOT, 'app.js')

SEO_START = '<!-- SEO:start -->'
SEO_END = '<!-- SEO:end -->'

# 根目录使用的默认语言（对应 app.js 里 LANGUAGES 中 path 为 '' 的那一项）
DEFAULT_LANG = 'te'

# 其余语言：各自占一个以 code 命名的目录（zh/ en/ fr/）
LANDING_LANGS = ['zh', 'en', 'fr']

# 全部语言，只用于循环生成
SITE_LANGS = [DEFAULT_LANG] + LANDING_LANGS

# 导航里的独立页面（slug 同时对应 I18N 的 <slug>Title / <slug>Lead 两个键）
SITE_PAGES = ['orthography', 'grammar', 'resource', 'about']

# 页面正文来源：content/<lang>/<slug>.html；文件不存在时输出“内容筹备中”占位卡
CONTENT_DIR = os.path.join(ROOT, 'content')

META_DESCRIPTION = {
    # 潮汕话界面文案暂沿用普通话，待补
    'te': '潮语辞典：按词语、汉字、释义与多语言译文检索潮汕话、潮州话、潮语，支持声韵调、词性与分类筛选。',
    'zh': '潮语辞典：按词语、汉字、释义与多语言译文检索潮汕话、潮州话、潮语，支持声韵调、词性与分类筛选。',
    'en': 'Neo-Teochew Dictionary: searched by words, hanzi, definitions, and translations in different languages. Filters by pronunciation, part of speech, and category are supported.',
    'fr': 'Neo-Teochew Dictionnaire: recherche par mots, caractères chinois, définitions et traductions en beaucoup de langues. Les filtres par prononciation, partie de la phrase et catégorie sont supportés.',
}

OG_LOCALE = {'te': 'nan_CN', 'zh': 'zh_CN', 'en': 'en_US', 'fr': 'fr_FR'}
HTML_LANG = {'te': 'nan', 'zh': 'zh-CN', 'en': 'en', 'fr': 'fr'}
HREFLANG = {'te': 'nan', 'zh': 'zh-Hans', 'en': 'en', 'fr': 'fr'}


# ---------------------------------------------------------------- 极简 JS 对象解析

class JsObjectParser:
    """只解析 I18N 这种「标识符键 + 单/双引号字符串 + 嵌套对象」的字面量。"""

    def __init__(self, text, pos=0):
        self.s = text
        self.i = pos

    def skip(self):
        while self.i < len(self.s) and self.s[self.i] in ' \t\r\n,':
            self.i += 1

    def string(self):
        quote = self.s[self.i]
        self.i += 1
        out = []
        while True:
            ch = self.s[self.i]
            if ch == '\\':
                out.append(self.s[self.i + 1])
                self.i += 2
                continue
            if ch == quote:
                self.i += 1
                break
            out.append(ch)
            self.i += 1
        return ''.join(out)

    def ident(self):
        start = self.i
        while self.i < len(self.s) and (self.s[self.i].isalnum() or self.s[self.i] in '_$'):
            self.i += 1
        return self.s[start:self.i]

    def value(self):
        self.skip()
        ch = self.s[self.i]
        if ch == '{':
            self.i += 1
            return self.obj()
        if ch in "'\"":
            return self.string()
        raise ValueError('无法解析的值类型：%r（位置 %d）' % (ch, self.i))

    def obj(self):
        result = {}
        while True:
            self.skip()
            if self.s[self.i] == '}':
                self.i += 1
                return result
            key = self.ident()
            self.skip()
            if self.s[self.i] != ':':
                raise ValueError('缺少冒号：%r（位置 %d）' % (self.s[self.i], self.i))
            self.i += 1
            result[key] = self.value()


def extract_i18n(js_text):
    """从 app.js 中取出 I18N 对象（以 app.js 为唯一文案源，避免重复维护）。"""
    anchor = js_text.index('const I18N = {')
    start = anchor + len('const I18N = {')
    parser = JsObjectParser(js_text, start)
    return parser.obj()


def extract_languages(js_text):
    """从 app.js 的 LANGUAGES 数组里取出每种语言的元信息（与界面按钮保持一致）。"""
    anchor = js_text.index('const LANGUAGES = [')
    chunk = js_text[anchor:js_text.index('\n  ];', anchor)]
    items = []
    for block in re.split(r'\n    \{\n', chunk)[1:]:
        def grab(field):
            match = re.search(r"%s:\s*'([^']*)'" % field, block)
            return match.group(1) if match else ''
        items.append({
            'code': grab('code'),
            'label': grab('label'),
            'short': grab('short'),
            'path': grab('path'),
            'contentLang': grab('contentLang'),
        })
    return items


# ---------------------------------------------------------------- 数据

def load_data():
    with open(DATA_JSON, encoding='utf-8') as handle:
        return json.load(handle)


def build_stats(data, languages):
    words = data.get('words', [])
    speech = {}
    categories = {}
    langs = set()
    senses = 0

    content_langs = {item['contentLang'] for item in languages}

    for entry in words:
        for definition in entry.get('definitions', []):
            senses += 1
            for value in definition.get('speech', []):
                speech[value] = speech.get(value, 0) + 1
            for value in definition.get('categories', []):
                categories[value] = categories.get(value, 0) + 1
            for item in definition.get('translations', []):
                if item.get('lang') in content_langs and item.get('text'):
                    langs.add(item['lang'])

    return {
        'entries': len(words),
        'senses': senses,
        'initials': len({entry.get('shengmu') for entry in words if entry.get('shengmu')}),
        'finals': len({entry.get('yunmu') for entry in words if entry.get('yunmu')}),
        'categories': len(categories),
        'languages': len(langs),
    }


def write_data_js(data):
    payload = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
    with open(DATA_JS, 'w', encoding='utf-8', newline='\n') as handle:
        handle.write('window.DICTIONARY_DATA=' + payload + ';\n')
    return os.path.getsize(DATA_JS)


# ---------------------------------------------------------------- SEO 头块

def page_path(slug, lang):
    """某页在某语言下的站点相对路径；目录形式，末尾带斜杠，首页为 ''。"""
    parts = []
    if lang != DEFAULT_LANG:
        parts.append(lang)
    if slug:
        parts.append(slug)
    return '/'.join(parts) + '/' if parts else ''


def seo_block(site, lang, title, description=None, slug=None):
    """生成 canonical / hreflang / OG 块。site 不带末尾斜杠。"""
    lines = [
        SEO_START,
        '  <!-- 由 build_site.py 生成，请勿手改；上线前用 --site-url 指定真实域名后重跑 -->',
        '  <link rel="canonical" href="%s/%s">' % (site, page_path(slug, lang)),
    ]
    for code in SITE_LANGS:
        lines.append('  <link rel="alternate" hreflang="%s" href="%s/%s">'
                     % (HREFLANG[code], site, page_path(slug, code)))
    lines.append('  <link rel="alternate" hreflang="x-default" href="%s/%s">'
                 % (site, page_path(slug, DEFAULT_LANG)))
    lines.append('  <meta property="og:type" content="website">')
    lines.append('  <meta property="og:site_name" content="潮语辞典 · Neo-Teochew Dictionary">')
    lines.append('  <meta property="og:locale" content="%s">' % OG_LOCALE[lang])
    lines.append('  <meta property="og:title" content="%s">' % html.escape(title, quote=True))
    lines.append('  <meta property="og:description" content="%s">'
                 % html.escape(description or META_DESCRIPTION[lang], quote=True))
    lines.append('  ' + SEO_END)
    return '\n'.join(lines)


def replace_seo_block(page_html, block):
    if SEO_START in page_html and SEO_END in page_html:
        pattern = re.compile(re.escape(SEO_START) + r'.*?' + re.escape(SEO_END), re.S)
        return pattern.sub(lambda _: block, page_html, count=1)
    return page_html.replace('</head>', block + '\n</head>')


# ---------------------------------------------------------------- 语言落地页

TEXT_NODE_RE = re.compile(r'<([a-zA-Z][\w-]*)([^>]*\bdata-i18n="([^"]+)"[^>]*)>([^<]*)</\1>')


def fill_static_text(page_html, strings):
    def repl(match):
        tag, attrs, key, _old = match.group(1), match.group(2), match.group(3), match.group(4)
        if key not in strings:
            return match.group(0)
        return '<%s%s>%s</%s>' % (tag, attrs, html.escape(strings[key]), tag)

    return TEXT_NODE_RE.sub(repl, page_html)


def fill_attr(page_html, key_attr, target_attr, strings):
    """保留 data-i18n-* 的 key，只翻译它对应的 placeholder / title / aria-label 属性值。"""
    pattern = re.compile(r'<[a-zA-Z][\w-]*[^>]*\b%s="([^"]+)"[^>]*>' % re.escape(key_attr))

    def repl(match):
        tag = match.group(0)
        key = match.group(1)
        if key not in strings:
            return tag
        value = html.escape(strings[key], quote=True)
        return re.sub(r'(\b%s=")[^"]*(")' % re.escape(target_attr),
                      lambda m: m.group(1) + value + m.group(2), tag, count=1)

    return pattern.sub(repl, page_html)


def prefill_home(page, strings, stats_text):
    """把首屏统计数字与说明写进静态 HTML，让爬虫不执行 JS 也能读到内容。"""
    hero_desc = strings['heroDesc'].format(**stats_text)
    results = strings['resultsCount'].format(n=stats_text['entries'])

    page = re.sub(r'(id="stat-entries">)[^<]*(<)', lambda m: m.group(1) + stats_text['entries'] + m.group(2), page, count=1)
    page = re.sub(r'(id="stat-senses">)[^<]*(<)', lambda m: m.group(1) + stats_text['senses'] + m.group(2), page, count=1)
    page = re.sub(r'(<p class="hero-desc" id="hero-desc">)[^<]*(</p>)',
                  lambda m: m.group(1) + html.escape(hero_desc) + m.group(2), page, count=1)
    page = re.sub(r'(<span id="results-count">)[^<]*(</span>)',
                  lambda m: m.group(1) + html.escape(results) + m.group(2), page, count=1)
    return page


def build_landing_page(template, lang, site, i18n, stats, languages):
    strings = i18n[lang]
    page = template

    page = re.sub(r'<html lang="[^"]*">', '<html lang="%s">' % HTML_LANG[lang], page, count=1)
    page = re.sub(r'<title>.*?</title>',
                  '<title>%s</title>' % html.escape(strings['pageTitle']), page, count=1, flags=re.S)
    page = re.sub(r'(<meta name="description" content=")[^"]*(">)',
                  lambda m: m.group(1) + html.escape(META_DESCRIPTION[lang], quote=True) + m.group(2),
                  page, count=1)

    page = fill_static_text(page, strings)
    page = fill_attr(page, 'data-i18n-placeholder', 'placeholder', strings)
    page = fill_attr(page, 'data-i18n-title', 'title', strings)
    page = fill_attr(page, 'data-i18n-aria', 'aria-label', strings)

    stats_text = {key: f'{value:,}' for key, value in stats.items()}
    page = prefill_home(page, strings, stats_text)

    # 品牌名与筛选器默认项（运行时会由 app.js 覆盖，这里只为不执行 JS 的爬虫准备）
    site_name = {
        'te': '潮州话词典',
        'zh': '潮州话词典',
        'en': 'Teochew Dictionary',
        'fr': 'Dictionnaire de teochew',
    }.get(lang, '潮州话词典')
    page = page.replace('aria-label="潮州话词典"', 'aria-label="%s"' % html.escape(site_name, quote=True))
    page = page.replace('<option value="">全部</option>',
                        '<option value="">%s</option>' % html.escape(strings['anyOption']))

    # 资源相对路径 + 默认语言
    page = page.replace('href="styles.css"', 'href="../styles.css"')
    page = page.replace('src="data.js"', 'src="../data.js"')
    page = page.replace('src="app.js"', 'src="../app.js"')
    page = page.replace('<script src="../app.js"></script>',
                        "<script>window.DEFAULT_LANG='%s';</script>\n  <script src=\"../app.js\"></script>" % lang)

    page = replace_seo_block(page, seo_block(site, lang, strings['pageTitle']))
    page = fill_lang_switch(page, lang_switch_html(lang, None, languages, '../'))
    page = page.replace('<!DOCTYPE html>',
                        '<!DOCTYPE html>\n<!-- 自动生成：源文件 ../index.html，请修改源文件后运行 build_site.py -->', 1)
    return page


# ---------------------------------------------------------------- 独立内容页

NAV_LINK_RE = re.compile(r'<a class="([^"]*)"([^>]*?)data-nav="([^"]+)"')
LANG_SWITCH_RE = re.compile(r'<div class="lang-switch"([^>]*)></div>')
SCRIPT_RE = re.compile(r'[ \t]*<script src="(?:data|app)\.js"></script>\n?')
HREF_RE = re.compile(r'href="(\./|(?:%s)/)"' % '|'.join(SITE_PAGES))
ASSET_RE = re.compile(r'href="(styles\.css)"')


def lang_switch_html(lang, slug, languages, prefix):
    """静态语言切换按钮：爬虫不执行 JS 也能看到其他语言版本。"""
    items = []
    for item in languages:
        code = item['code']
        if code not in SITE_LANGS:
            continue
        href = prefix + item['path'] + (slug + '/' if slug else '')
        active = code == lang
        items.append(
            '<a class="lang-btn%s" href="%s" hreflang="%s"%s>'
            '<span class="lang-full">%s</span>'
            '<span class="lang-short">%s</span></a>'
            % (' is-active' if active else '', href, HREFLANG.get(code, code),
               ' aria-current="page"' if active else '',
               html.escape(item['label']), html.escape(item['short'] or code.upper())))
    return '\n          ' + '\n          '.join(items)


def fill_lang_switch(page_html, markup):
    return LANG_SWITCH_RE.sub(
        lambda m: '<div class="lang-switch"%s>%s</div>' % (m.group(1), markup), page_html, count=1)


def set_active_nav(page_html, slug):
    def repl(match):
        classes = [name for name in match.group(1).split() if name != 'is-active']
        if match.group(3) == slug:
            classes.append('is-active')
        return '<a class="%s"%sdata-nav="%s"' % (' '.join(classes), match.group(2), match.group(3))

    return NAV_LINK_RE.sub(repl, page_html)


def prefix_links(page_html, link_prefix, asset_prefix):
    """站内链接退一级留在同语言目录；静态资源要退到站点根。"""
    def repl(match):
        target = match.group(1)
        # 首页就是当前语言目录本身，退一级即可，不必拼出 .././
        if target == './':
            return 'href="%s"' % link_prefix
        return 'href="%s%s"' % (link_prefix, target)

    page_html = HREF_RE.sub(repl, page_html)
    return ASSET_RE.sub(lambda m: 'href="%s%s"' % (asset_prefix, m.group(1)), page_html)


def content_body(lang, slug, strings):
    """正文来自 content/<lang>/<slug>.html；没有该文件时输出占位卡。"""
    path = os.path.join(CONTENT_DIR, lang, slug + '.html')
    if os.path.exists(path):
        with open(path, encoding='utf-8') as handle:
            body = handle.read().strip()
        if body:
            return body
    return ('<section class="page-card reserved-panel">\n'
            '            <h2>%s</h2>\n'
            '            <p>%s</p>\n'
            '          </section>'
            % (html.escape(strings['pagePendingTitle']), html.escape(strings['pagePending'])))


def content_main(lang, slug, strings, stats, prefix):
    stats_line = ''
    if slug == 'about':
        stats_line = '<p class="page-lead">%s</p>\n        ' % html.escape(
            strings['aboutStats'].format(
                entries='{:,}'.format(stats['entries']),
                senses='{:,}'.format(stats['senses']),
                initials='{:,}'.format(stats['initials']),
                finals='{:,}'.format(stats['finals']),
                categories='{:,}'.format(stats['categories'])))

    return (
        '<main id="app">\n'
        '    <div class="page">\n'
        '      <div class="page-topbar">\n'
        '        <a class="back-link" href="%s">\n'
        '          <svg class="icon"><use href="#i-arrow-left"></use></svg>\n'
        '          <span>%s</span>\n'
        '        </a>\n'
        '      </div>\n'
        '      <div class="page-inner">\n'
        '        <p class="eyebrow">%s</p>\n'
        '        <h1 class="page-title">%s</h1>\n'
        '        %s<p class="page-lead">%s</p>\n'
        '        <div class="page-body">\n'
        '          %s\n'
        '        </div>\n'
        '      </div>\n'
        '    </div>\n'
        '  </main>'
        % (prefix, html.escape(strings['backToDictionary']), html.escape(strings['eyebrow']),
           html.escape(strings['%sTitle' % slug]), stats_line,
           html.escape(strings['%sLead' % slug]), content_body(lang, slug, strings)))


def build_content_page(template, slug, lang, site, i18n, stats, languages):
    strings = i18n[lang]
    brand = strings['pageTitle'].split(' · ')[0]
    title = strings['%sTitle' % slug]
    page_title = '%s · %s' % (title, brand)
    # 页面本身在 <lang>/<slug>/ 里，站内链接只需退一级就能留在同一语言
    prefix = '../'
    # 语言切换要退回站点根再进入目标语言目录
    root_prefix = '../' if lang == DEFAULT_LANG else '../../'
    page = template

    page = re.sub(r'<html lang="[^"]*">', '<html lang="%s">' % HTML_LANG[lang], page, count=1)
    page = re.sub(r'<title>.*?</title>', '<title>%s</title>' % html.escape(page_title),
                  page, count=1, flags=re.S)
    page = re.sub(r'(<meta name="description" content=")[^"]*(">)',
                  lambda m: m.group(1) + html.escape(strings['%sLead' % slug], quote=True) + m.group(2),
                  page, count=1)

    page = fill_static_text(page, strings)
    page = fill_attr(page, 'data-i18n-placeholder', 'placeholder', strings)
    page = fill_attr(page, 'data-i18n-title', 'title', strings)
    page = fill_attr(page, 'data-i18n-aria', 'aria-label', strings)

    page = set_active_nav(page, slug)
    page = fill_lang_switch(page, lang_switch_html(lang, slug, languages, root_prefix))
    page = SCRIPT_RE.sub('', page)
    page = re.sub(r'<main id="app">.*?</main>',
                  lambda m: content_main(lang, slug, strings, stats, prefix),
                  page, count=1, flags=re.S)
    page = prefix_links(page, prefix, root_prefix)
    page = replace_seo_block(page, seo_block(site, lang, page_title, strings['%sLead' % slug], slug))
    page = page.replace('<!DOCTYPE html>',
                        '<!DOCTYPE html>\n<!-- 自动生成：源文件 ../index.html，请修改源文件后运行 build_site.py -->', 1)
    return page


# ---------------------------------------------------------------- sitemap / robots

def build_sitemap(site, today):
    langs = SITE_LANGS
    parts = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" '
        'xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ]
    for slug in [None] + SITE_PAGES:
        for code in langs:
            parts.append('  <url>')
            parts.append('    <loc>%s/%s</loc>' % (site, page_path(slug, code)))
            parts.append('    <lastmod>%s</lastmod>' % today)
            parts.append('    <changefreq>%s</changefreq>' % ('weekly' if slug is None else 'monthly'))
            parts.append('    <priority>%s</priority>' % ('1.0' if slug is None else '0.8'))
            for alt in langs:
                parts.append('    <xhtml:link rel="alternate" hreflang="%s" href="%s/%s"/>'
                             % (HREFLANG[alt], site, page_path(slug, alt)))
            parts.append('    <xhtml:link rel="alternate" hreflang="x-default" href="%s/%s"/>'
                         % (site, page_path(slug, 'zh')))
            parts.append('  </url>')
    parts.append('</urlset>')
    return '\n'.join(parts) + '\n'


def build_robots(site):
    return 'User-agent: *\nAllow: /\n\nSitemap: %s/sitemap.xml\n' % site


# ---------------------------------------------------------------- 主流程

def main():
    parser = argparse.ArgumentParser(description='生成 data.js、语言落地页、sitemap 与 robots.txt')
    parser.add_argument('--site-url', default='https://example.com',
                        help='站点根地址，不带末尾斜杠；省略时为占位域名，仅适合本地预览')
    args = parser.parse_args()

    site = args.site_url.rstrip('/')
    if site.endswith('/'):
        site = site[:-1]

    for path in [DATA_JSON, INDEX_HTML, APP_JS]:
        if not os.path.exists(path):
            sys.exit('缺少必要文件：%s' % path)

    data = load_data()
    with open(APP_JS, encoding='utf-8') as handle:
        app_js = handle.read()

    i18n = extract_i18n(app_js)
    languages = extract_languages(app_js)
    stats = build_stats(data, languages)

    size = write_data_js(data)
    print('data.js 已生成：%s（%.0f KB，%s 条词目 / %s 个义项）'
          % (DATA_JS, size / 1024, stats['entries'], stats['senses']))

    with open(INDEX_HTML, encoding='utf-8') as handle:
        template = handle.read()

    # 主站（默认语言）SEO 块 + 首屏静态文案
    root_title = i18n[DEFAULT_LANG]['pageTitle']
    stats_text = {key: f'{value:,}' for key, value in stats.items()}
    template_with_seo = replace_seo_block(template, seo_block(site, DEFAULT_LANG, root_title))
    template_with_seo = prefill_home(template_with_seo, i18n[DEFAULT_LANG], stats_text)
    template_with_seo = re.sub(r'<html lang="[^"]*">',
                               '<html lang="%s">' % HTML_LANG[DEFAULT_LANG],
                               template_with_seo, count=1)
    if template_with_seo != template:
        with open(INDEX_HTML, 'w', encoding='utf-8', newline='\n') as handle:
            handle.write(template_with_seo)
        print('index.html 的 canonical / hreflang 与首屏静态文案已更新')

    for lang in LANDING_LANGS:
        if lang not in i18n:
            print('跳过 %s：app.js 中没有对应 I18N 文案块' % lang)
            continue
        folder = os.path.join(ROOT, lang)
        os.makedirs(folder, exist_ok=True)
        page = build_landing_page(template_with_seo, lang, site, i18n, stats, languages)
        target = os.path.join(folder, 'index.html')
        with open(target, 'w', encoding='utf-8', newline='\n') as handle:
            handle.write(page)
        print('已生成 %s' % target)

    # 导航里的独立页面（每种语言一份，静态正文，不依赖 JS）
    for slug in SITE_PAGES:
        for lang in SITE_LANGS:
            if lang not in i18n:
                continue
            page = build_content_page(template_with_seo, slug, lang, site, i18n, stats, languages)
            folder = os.path.join(ROOT, page_path(slug, lang))
            os.makedirs(folder, exist_ok=True)
            target = os.path.join(folder, 'index.html')
            with open(target, 'w', encoding='utf-8', newline='\n') as handle:
                handle.write(page)
            print('已生成 %s' % target)

    today = date.today().isoformat()
    with open(os.path.join(ROOT, 'sitemap.xml'), 'w', encoding='utf-8', newline='\n') as handle:
        handle.write(build_sitemap(site, today))
    with open(os.path.join(ROOT, 'robots.txt'), 'w', encoding='utf-8', newline='\n') as handle:
        handle.write(build_robots(site))

    print('sitemap.xml / robots.txt 已生成')
    if 'example.com' in site:
        print('提醒：当前使用占位域名 example.com。上线前请运行：python build_site.py --site-url https://你的域名')


if __name__ == '__main__':
    main()
