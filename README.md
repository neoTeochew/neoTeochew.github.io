# 潮州话词典 · 项目说明与维护手册

> 更新日期：2026-11-10
> 用途：记录当前进度、实现思路、文件职责，以及以后改数据 / 改样式 / 加语言 / 加文章 / 加导航时的操作清单。
> 隔一段时间回来看，先读第 5 节「改动速查表」。

---

## 1. 项目是什么，怎么打开

一个**纯静态单页词典**，没有前端构建工具、没有后端、不依赖 npm。只有一个可选的 Python 脚本 `build_site.py`，用来生成数据文件和语言落地页。

- 打开方式：直接双击 `index.html` 即可（`file://` 协议下也能正常工作）。
- 也可以用本地服务器预览（更接近线上环境）：

  ```powershell
  python -m http.server 8765
  # 然后访问 http://localhost:8765
  ```

- 之所以 `file://` 能用，是因为数据被写成 **`data.js`（一个 JS 全局变量赋值）**，而不是用 `fetch('data.json')` 读取——后者在 `file://` 下会被浏览器的 CORS 策略拦截。这是本项目第一个关键设计决策。

目录里需要关心的文件：

```
index.html      主站（中文）骨架；头部 SEO 块与首屏数字由构建脚本写入
styles.css      全部样式（设计系统 + 响应式）
app.js          全部逻辑（渲染、路由、语言、交互）
data.json       词条数据源（你编辑这个）
data.js         词条数据（由 data.json 生成，不要手改）
build_site.py   构建脚本：重建 data.js、生成语言落地页、导航独立页、sitemap、robots
check.py        删除前自检：找出没用的 CSS / 文案 key / 函数，并提示生成物是否过期
content/        独立页正文（按 content/<语言>/<页面>.html 存放，可缺省）
zh/index.html   普通话落地页（生成产物，不要手改）
en/index.html   英文落地页（生成产物，不要手改）
fr/index.html   法文落地页（生成产物，不要手改）
orthography/    拼写规则页（生成产物，含 zh/、en/、fr/ 版本）
grammar/        语法页（生成产物，含 zh/、en/、fr/ 版本）
resource/       资源页（生成产物，含 zh/、en/、fr/ 版本）
about/          关于页（生成产物，含 zh/、en/、fr/ 版本）
sitemap.xml     站点地图（生成）
robots.txt      爬虫规则（生成）
```

---

## 2. 各文件的作用

### 2.1 `index.html` — 结构层

只放**不随数据变化**的骨架，数据相关的内容全部由 JS 生成。

| 位置 | 内容 |
| --- | --- |
| `<head>` | 标题、描述、Google Fonts（Noto Serif SC / EB Garamond / Inter）、引入 `styles.css` |
| `.icon-sprite` | 内联 SVG 图标库（搜索、随机、网格、列表、左右箭头），用 `<use href="#i-xxx">` 引用 |
| `.site-header` | 页头：印章 Logo、导航（辞典 / 拼写规则 / 语法 / 资源 / 关于，**都是真实文件链接**）、语言按钮容器 `.lang-switch`（主站由 JS 填充，生成页里是静态 `<a>`） |
| `#view-home` | 首页：hero 标题、统计数字、检索表单（含检索范围复选框、5 个筛选下拉）、浏览区（排序 / 视图切换 / 随机 / 结果列表） |
| `#view-detail` | 详情页容器，**空**，由 JS 渲染 |
| `.site-footer` | 页脚说明 |
| `#toast` | 轻提示容器 |
| 底部 | `<script src="data.js">` 然后 `<script src="app.js">`（**顺序不能反**） |

约定：凡是写在 HTML 里的可翻译文字，都带 `data-i18n="key"`（占位符用 `data-i18n-placeholder`，标题用 `data-i18n-title`，aria 用 `data-i18n-aria`）。

> **重要**：这些文字只是**兜底副本**。页面启动时 `applyStaticI18n()` 会用 `app.js` 里的 `I18N` 覆盖它们，所以**直接改 `index.html` 的正文文字不会生效**。要改界面文案，请改 `I18N`，详见 6.7。

### 2.2 `styles.css` — 样式层

一套完整的设计系统，全部用 CSS 变量，没有预处理器。

- 顶部 `:root` 定义色板、字体、圆角、阴影、最大宽度。
- 中途按功能分区块，用注释横幅分隔（见第 4.4 节的区块地图）。
- 底部三段媒体查询：`1000px` / `860px` / `640px`，外加 `prefers-reduced-motion`。
- 列表性能：结果卡片使用 `content-visibility: auto`，2500+ 条一次性渲染也不会明显卡顿。

### 2.3 `app.js` — 逻辑层

一个 IIFE，内部按功能分区。主要函数（按出现顺序）：

| 分组 | 函数 | 作用 |
| --- | --- | --- |
| 数据入口 | `WORDS` | 从 `window.DICTIONARY_DATA` 取词条数组 |
| 语言注册表 | `LANGUAGES` / `currentLanguage()` / `translationChain()` | 界面语言与译文语言、回退链 |
| 文案 | `I18N`（zh / en / fr 三块） / `t(key, vars)` | 界面多语言；缺失 key 回退中文 |
| 状态 | `state = { lang, view, sort }` | 当前语言、网格/列表、排序方式 |
| 统计 | `buildStats()`、`stats` | 一次性算出条目数、义项数、声母/韵母/分类数、译文语种数 |
| 静态文案 | `applyStaticI18n()` | 把 `data-i18n*` 属性填成当前语言 |
| 语言按钮 | `renderLanguageSwitch()` / `updateLangButtons()` | 按注册表动态生成按钮（无 I18N 的语言自动 `disabled`） |
| 统计显示 | `updateStatsText()` | 首页大数字、hero 说明、关于页统计句 |
| 筛选器 | `fillFilters()` 等 | 用数据里真实出现的值填充 5 个下拉 |
| 排序 | `sortList()` / `SHUFFLE_RANK` | 随机乱序（默认，加载时打乱一次）/ 拼音 A–Z（`Intl.Collator`） |
| 译文选取 | `findTranslation()` / `bestTranslation()` / `orderedTranslations()` | 按回退链找最佳译文、详情页译文排序 |
| 卡片 | `renderEntryCard()` / `renderCardSense()` | 条目卡片：**每个义项一行**，行内含该义项全部汉字 + 词性 + 当前语言译文 |
| 结果区 | `renderResults()` / `appendResultBatch()` / `showAllResults()` | 默认只渲染前 60 条；列表底部出现"显示全部"按钮，点击后分帧补齐剩余条目，全部加载完才显示"已显示全部" |
| 详情页 | `renderSenseBlock()` / `renderExample()` / `renderDetail()` | 详情页整页渲染（义项块、译文、例句、词组、备注、其他读音、其他口音） |
| 视图切换 | `showDetail()` / `showHome()` / `setActiveNav()` | 两个容器用 `hidden` 互斥切换；导航高亮 |
| 路由 | `handleRoute()` | 解析 hash：`#/`、`#/entry/<词>`；`#/about`、`#/articles` 会被重定向到对应的真实页面 |
| 其他 | `openRandomEntry()` / `toast()` / `bindEvents()` / `init()` | 随机、提示、事件绑定、初始化 |

工具函数：`esc()`（HTML 转义，所有数据写入模板前必须过一遍）、`fmt()`（按当前语言格式化数字）、`unique()`、`pad2()`、`cleanHanzi()`（过滤 `'*'` 占位并去重）。

### 2.4 `data.js` — 生成产物

内容只有一行：

```js
window.DICTIONARY_DATA={"words":[ ... ]};
```

- **不要手改**，它由 `data.json` 经 `build_site.py` 生成。
- 约 840 KB，压缩成一行、`ensure_ascii=False`（保留 `â`、`ê` 等拼音字符，不转成 `\u00e2`）。
- 换成 JSON 的好处：只有一个全局变量、无网络请求、无 CORS、`file://` 直接可用。

### 2.5 `data.json` — 唯一数据源

见第 3 节的数据结构。

### 2.6 `build_site.py` — 构建脚本

纯 Python 3、无第三方依赖。一次运行做五件事：

1. `data.json` → `data.js`
2. `index.html` → `zh/index.html`、`en/index.html`、`fr/index.html`（把 `data-i18n` 的静态文字、首屏数字预填成对应语言，并注入 `window.DEFAULT_LANG`）
3. 生成导航独立页：`orthography/`、`grammar/`、`resource/`、`about/`，每种语言一份（`/about/`、`/zh/about/`、`/en/about/`、`/fr/about/`）。页面是**纯静态 HTML，不加载 `data.js` / `app.js`**，正文来自 `content/<语言>/<页面>.html`，文件不存在时输出"内容筹备中"占位卡
4. 重写所有页面的 `canonical` / `hreflang` / OG 块（HTML 里用 `<!-- SEO:start -->` 标记），并把语言切换写成静态 `<a>`，让不执行 JS 的爬虫也能发现其他语言版本
5. 生成 `sitemap.xml` 与 `robots.txt`（首页 4 条 + 4 个内容页 × 4 语言）

语言与目录的对应关系由两个常量决定：`DEFAULT_LANG`（根目录 `''`，当前是 `te` 潮汕话）与 `LANDING_LANGS`（`zh` / `en` / `fr`，各自占同名目录）。要增删语言，这两处和 `app.js` 的 `LANGUAGES` 必须一起改。

关键点：**语言文案的唯一来源仍是 `app.js` 的 `I18N`**，脚本会解析它，不会另存一份翻译，所以改文案只需改 `app.js`。

```powershell
python build_site.py --site-url https://你的域名
```

省略 `--site-url` 时会写入占位域名 `example.com`，只适合本地预览。

---

## 3. 数据结构

顶层：

```json
{ "words": [ { "word": "...", ... } ] }
```

### 3.1 条目（word）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `word` | string | 拼写，唯一标识，也用于详情页路由 |
| `pronunciations` | string | 读音备注（多为空） |
| `accents` | array | 其他口音（方言读音，多为空） |
| `shengmu` / `yunmu` / `tone` | string | 声母 / 韵母 / 声调；零声母写作 `"0"`，界面显示为「零声母」 |
| `categories` | array | 条目级分类 |
| `definitions` | array | 义项列表（**可有多个**） |
| `phrases` | array | 词组（字符串数组） |
| `tips` | string | 备注（多为空） |

### 3.2 义项（definitions[]）

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `hanzi` | array | 该义项的汉字。**多个义项的汉字常常不同**（如 `sái` 有 屎 / 使 / 驶駛）；`["*"]` 表示没有汉字 |
| `categories` | array | 义项级分类 |
| `speech` | array | 词性，如 `["动词"]` |
| `meaning` | string | 潮语释义（拼音书写） |
| `meaning_hanzi` | string | 汉字释义 |
| `translations` | array | `{lang, text}`；`lang` 取值为 **`普通话` / `English` / `français`** |
| `examples` | array | `{sentence, sentence_hanzi, translations[]}` |

### 3.3 三条必须记住的数据约定

1. **`*` 是占位符**，不是汉字。所有展示路径都必须经过 `cleanHanzi()` 过滤，否则会出现一个叫"*"的汉字。
2. **`translations[].lang` 必须与 `LANGUAGES[].contentLang` 逐字符相同**（大小写、语言自称都算）。写成 `"French"` 或 `"Français"` 都读不到。
3. **一个条目可能有 0 个义项**，卡片和详情页都必须能处理空数组。

---

## 4. 已完成 / 未完成

### 4.1 已完成的功能与实现思路

| 功能 | 实现方法 |
| --- | --- |
| 结果渲染 | 默认只渲染前 60 条（`RESULT_BATCH`），底部提供"显示全部"按钮；点击后按 `requestAnimationFrame` 分批追加，避免一次构建 2,500+ 卡片卡住界面 |
| 降级视图 | 网格 / 列表只切 `data-view`，不重渲染 |
| 统计条目 / 义项 | `buildStats()` 在启动时遍历一次，结果缓存在 `stats`，之后只读不重算 |
| 关键词检索 | 表单提交时把关键词与检索范围写入 `state`，`matchesKeyword()` 对 `word` / `hanzi` / `meaning` + `meaning_hanzi` / `translations` 逐项做小写子串匹配；其中 `word` 范围同时匹配条目主拼写、`pronunciations`（其他读音）与 `accents[].pengim`（其他口音），命中任一条目即整条返回 |
| 检索范围复选框 | `data-scope` 四项；已有关键词时勾选变化立即重查；全部取消且有关键词时弹提示，不执行空匹配 |
| 筛选条件 | `state.filters` 五项；声母 / 韵母 / 声调按条目级字段比对，词性按"任一义项命中"保留条目，分类用 `entryCategories()` 汇总；下拉 change 即生效 |
| 已选条件 | `#active-filters` 渲染可删除的 chip（如"声调 · 8"），点击即清掉该项并重查 |
| 空状态 | 有关键词且 0 结果时显示"没有找到匹配「{q}」的条目"，否则显示通用空态 |
| 重置 | "重置"只清 5 个筛选下拉，不清搜索关键词（关键词用输入框自行清空） |
| 条目卡片 | **每个义项单独一行**：序号（多义项时）+ 该义项全部汉字小标签 + 词性 + 当前语言译文预览。设计上刻意不做"只显示第一个义项"的截断 |
| 卡片关键词高亮 | 有关键词时，卡片默认展示的部分（词头、其他读音、其他口音、汉字、译文预览）用 `<mark>` 标出命中片段；默认不展示的部分（`meaning` / `meaning_hanzi` / 其他语言译文）只在命中时追加一行 `.card-match` 摘录（`excerptHtml()` 截取命中词附近并补省略号），未命中不显示；无关键词时卡片与原来完全一致 |
| 详情页 | `#/entry/<encodeURIComponent(word)>`；卡片的词写在 `data-word`，点击用事件委托统一处理 |
| 页面切换 | 两个容器 `#view-home` / `#view-detail` 用 `hidden` 属性互斥；返回时恢复首页滚动位置。内容页是独立 HTML，不参与这套切换 |
| 网格 / 列表视图 | `state.view` 写到 `#results[data-view]`，样式在 CSS 里用 `.results[data-view="list"] .entry-card` 控制，不重渲染 |
| 排序 | `sortList()` 两种模式：随机乱序（默认）、拼音 A–Z（`Intl.Collator`）。乱序在页面加载时用 Fisher–Yates 打乱一次，名次存进 `SHUFFLE_RANK`；每次打开都不同，同一次浏览内筛选、检索、切视图不重排 |
| 随机条目 | 随机取一条 → 走正常的 `#/entry/...` 路由 |
| 多语言界面 | 三层：`LANGUAGES` 注册表（语言元信息）→ `I18N`（界面文案）→ `translationChain()`（译文回退） |
| 语言回退 | 当前语言缺译文时，按 `fallback` 链依次回退。fr → English → 普通话，te → 普通话，并在详情页提示"暂无法语译文" |
| 语言记忆 | 选择语言后写入 `localStorage['teochew.lang']`；语言页面本身又以 URL 为准（`/zh/`、`/en/`、`/fr/`），回到主站时若记住的是其他语言，会自动跳到对应语言页，保证"看到的语言"和"地址栏"始终一致 |
| 语言落地页 / SEO | `build_site.py` 从 `index.html` 生成 `zh/` `en/` `fr/` 三份静态页，预填该语言的静态文案与首屏数字，写入 `canonical` / `hreflang` / OG，并生成 `sitemap.xml`、`robots.txt` |
| 语言切换方式 | 点语言按钮 = **跳到对应语言的页面**（`/`、`/zh/`、`/en/`、`/fr/`），并保留当前 hash（如 `#/entry/sái`）；不再原地换文字 |
| 数字格式化 | `Intl.NumberFormat(uiLocale)`，中英法数字分隔符自动正确 |
| 导航 | 「辞典 / 拼写规则 / 语法 / 资源 / 关于」都是**真实文件链接**（`./`、`orthography/` …，目录形式），不是 hash 路由，所以每个页面都能被搜索引擎单独收录；高亮由 `data-nav` 与 `setActiveNav()` 控制，生成页在构建时就把 `is-active` 写死 |
| 内容页 | 4 个页面 × 4 种语言，由 `build_site.py` 生成纯静态 HTML；正文放在 `content/<语言>/<页面>.html`，没有文件就显示"内容筹备中"占位卡。页面不加载 JS，语言切换是静态 `<a>` |
| 旧 hash 内容页 | `#/about`、`#/articles` 仍能打开，会立即跳转到对应的真实页面（`about/`），避免旧链接 404 |
| 地址规范 | 站内链接统一用目录形式；直接访问 `/xxx/index.html` 时由内联脚本跳到 `/xxx/`（`file://` 本地预览不跳）；详情页返回会清掉空 `#/`，但保留 `#/entry/...` |
| 键盘与可访问性 | 卡片支持 Enter / Space 打开；`aria-pressed` / `aria-selected` 同步；`focus-visible` 描边；Toast 用 `aria-live` |
| 移动端 | `860px` 页头导航换行居中；`640px` 语言按钮显示简写（中 / EN / FR） |

### 4.2 已删除的尝试（避免重复走弯路）

- **曾有一个"全部义项"页签**：把所有义项拆成一条条卡片。因为条目卡已经内联展示全部义项的全部汉字，这个页签没有任何信息增量，且和"全部条目"语义重复，已彻底删除（含 `state.tab`、`renderSenseCard()`、`sortSenses()` 和相关 CSS、文案）。
- **曾有一套 `.sense-card` 卡片样式**（独立的义项卡片）。随页签一起删除。详情页的 `.sense-hanzi` 样式已合并为一条独立规则。
- **曾按"第一个义项"取汉字**：被否掉了。现在的规则是：**要么显示该义项自己的全部汉字，要么一个都不显示**。

### 4.3 后续可做 + 计划做法

#### （1）分页的进阶选项

**已实现"显示全部"**：默认 60 条，底部按钮点一下补齐全部（分帧追加），完成后显示"已显示全部"。
刻意没有做滚动自动加载，避免用户只是想看完当前一屏时被不断追加打断。
后续可选：每批条数可调（`RESULT_BATCH`）、页码跳转，或数据量再翻十倍时改虚拟滚动。

#### （2）内容页正文

现状：`orthography/` `grammar/` `resource/` `about/` 四页已能正常访问、被 sitemap 收录，但正文是占位卡。写正文只需在 `content/<语言>/<页面>.html` 里写 HTML 片段，再跑一次构建（见 6.5）。关于页的统计句由脚本自动生成，不需要手写。

#### （3）内容多到一页放不下时

一个页面正文太长（比如"语法"要拆成十几篇）时，有两条路：

- **简单拆分**：把页面改成一个目录，手写子页 `grammar/tones/index.html`，导航仍指向 `grammar/index.html`，在正文里列出子页链接。子页要自己写 head/页头，或用 `build_site.py` 的 `build_content_page()` 扩一个 `subpages` 配置。
- **文章系统**：把 `content/` 里的长文当成文章列表页，另建数据文件驱动（类似 `data.js` 的模式），见 4.5。

#### （4）详情页内的关联跳转

- 词组（`phrases`）目前是纯字符串，如数据能拆成"拼写 + 汉字"，可做成可点击（这是条目间最主要的关联形式）。
- "其他读音 / 其他口音"目前只展示，未互相链接。

#### （5）工程化（非必需）

无构建、无测试、无 lint。若以后多人协作或文章很多，再考虑引入 Vite / 拆模块；当前规模不建议，纯静态的简单性更有价值。

---

## 5. 改动速查表（最常用）

| 我想…… | 要改哪里 |
| --- | --- |
| 删东西前 / 不确定某段样式还有没有用 | 先跑 `python check.py`，删完再跑一次对比 |
| 加词条 / 改词条 | `data.json` → **重新生成 `data.js`** → 刷新 |
| 加一种译文语言（数据已有该 lang） | `app.js` 的 `LANGUAGES` 加一项 |
| 加一种界面语言（含界面文字） | `LANGUAGES` 加一项 + `I18N` 加一个完整块 + `build_site.py` 的 `LANDING_LANGS` 加 code + 四个 SEO 映射表各加一项 |
| 改默认语言（根目录用哪种） | `app.js` 里把该语言的 `path` 改成 `''`（其余语言改用同名目录），再改 `build_site.py` 的 `DEFAULT_LANG` / `LANDING_LANGS` |
| 改颜色 / 字体 / 最大宽度 | `styles.css` 的 `:root` |
| 改某个区块的样式 | `styles.css` 对应区块（见 4.4 节地图） |
| 给内容页写正文 | 新建 `content/<语言>/<页面>.html` → 重跑构建（见 6.5） |
| 加一个导航栏链接（新独立页） | `index.html` 加 `<a href="<slug>/">` + 各语 `I18N`（`navXxx` / `xxxTitle` / `xxxLead`）+ `build_site.py` 的 `SITE_PAGES` 加 slug（**见 6.6**） |
| 加页面上一句新文案 | `I18N` 的 te / zh / en / fr **四块都加**，HTML 用 `data-i18n` |
| 加卡片 / 详情页新字段 | `data.json` + 重建 `data.js` + `renderEntryCard`/`renderDetail` + CSS + `I18N` |
| 改排序选项 | `index.html` 的 `#sort` options + `sortList()` + 各语 `I18N` |
| 部署上线 / 更新 SEO | `python build_site.py --site-url https://你的域名`（重跑即可，别手改 zh/ en/ fr/ sitemap） |

---

## 6. 维护手册（逐步操作）

### 6.1 新增 / 修改数据

1. 编辑 `data.json`（保持 UTF-8；`word` 不要重复，它是主键）。
2. 运行构建脚本（同时重建 `data.js`、语言落地页与 sitemap）：

   ```powershell
   python build_site.py --site-url https://你的域名
   ```

   还没部署、只在本地预览时可省略 `--site-url`（会写入占位域名 example.com）。
3. 刷新页面。统计数字、筛选项、随机池、详情页都会**自动跟随**，不需要改代码。
4. 抽查：新词的卡片是否显示全部义项；`hanzi` 为 `["*"]` 时是否不显示汉字；法语/英语译文是否出现。

> **最常见的"改了没反应"**：忘了执行第 2 步。`data.json` 永远不会被页面读取，页面只读 `data.js`。
>
> **统计数字不是写死的**：`buildStats()` 在每次打开页面时从 `data.js` 现算条目数、义项数、声母 / 韵母 / 分类 / 译文语言数；`index.html` 里能搜到的那些数字只是 `build_site.py` 预填的静态副本（给爬虫和首屏用），重跑脚本就会刷新，运行时也会被 JS 覆盖。**所以改 `data.json` 后没重跑脚本，页面上的一切数字（包括统计）都还是旧的**。
>
> **第二个常见问题**：只改了 `index.html` 或 `I18N` 文案却没重跑脚本，主站正常但 `zh/` `en/` `fr/` 里的静态文字还是旧的。改了这两处也要跑一次。

### 6.2 新增一种**译文**语言（数据里已存在该 `lang`）

只改 `app.js` 的 `LANGUAGES`（约第 25 行）：

```js
{
  code: 'ja',                 // 界面语言标识，也会作为按钮 data-lang
  label: '日本語',             // 按钮完整名称（宽屏）
  short: 'JA',                // 按钮简写（640px 以下）
  uiLocale: 'ja',             // <html lang> 与数字格式化
  contentLang: '日本語',       // 必须与 data.json 里 translations[].lang 完全一致
  contentLabel: '日本語',      // 界面上显示"暂无日本語译文"时用的名字
  fallback: ['English', '普通话'],  // 缺译文时的回退顺序
  path: 'ja/'                 // 该语言页面所在目录（根目录那一项为 ''）；要让切换跳转必须和 build_site.py 一致
}
```

改完即生效：语言按钮自动出现、卡片预览自动改用它、详情页译文按新回退链排序。

> 如果新语言的 `path` 不是 `''`，还要按 6.3 第 5 步让 `build_site.py` 生成它的页面，否则切换会 404。

**唯一要小心**：如果 `data.json` 里这个语言写成 `"Japanese"`，这里也必须写 `"Japanese"`，不能用界面显示名替代。

### 6.3 新增一种**界面**语言（连界面文字也要翻译）

按顺序做完这 5 步，漏一步就会出现"按钮是外语、界面还是中文"。

1. **`LANGUAGES`**：加一项（字段同上）。
2. **`I18N`**：复制 `te: { ... }` 整块（当前它是根目录默认语言，也是最新的模板），改成新语言，key 一个都别删（缺 key 会静默回退，不会报错，所以最容易漏）。改完 `python check.py` 会逐语列出缺失的 key。
3. **不需要改 HTML**：语言按钮由 `renderLanguageSwitch()` 生成；`applyStaticI18n()` 会自动把每个 `data-i18n` 填成新语言。
4. **验证清单**（逐页点一遍）：
   - 首页：标题、副标题、hero 说明、统计标签
   - 检索面板：输入框占位、检索按钮、检索范围 4 项、5 个筛选标签、"全部"选项、重置
   - 浏览区：排序 2 项、视图按钮 tooltip、随机按钮、结果计数、底部的"显示全部"按钮、预览徽章
   - 卡片：义项数、详情、暂无译文
   - 详情页：返回、面包屑、义项/词组计数、潮语释义、汉字释义、译文、例句、词组、备注、其他读音、其他口音
   - 内容页（拼写规则 / 语法 / 资源 / 关于）：导航文字、页面标题、导语、占位卡、返回按钮
   - 页脚、Toast 文案、浏览器标签页标题

> 检查工具：`renderLanguageSwitch()` 会给**没有 `I18N` 块的语言按钮加 `disabled`**。如果按钮是灰的，说明第 2 步没做。

5. **如果要给这个语言生成独立落地页**（供搜索引擎收录）：改 `build_site.py` 顶部的映射——`LANDING_LANGS` 加上该 `code`，并补齐 `META_DESCRIPTION`、`OG_LOCALE`、`HTML_LANG`、`HREFLANG` 四个字典和 `build_landing_page()` 里的 `site_name`，然后重跑脚本。**同时在 `LANGUAGES` 里填好 `path`（如 `'ja/'`）**，否则语言按钮会跳到一个空地址。`path` 为 `''` 的那一项就是根目录默认语言，只有一项能留空。

### 6.4 修改样式

先看 `styles.css` 的区块地图（按注释横幅搜索即可）：

| 区块 | 内容 |
| --- | --- |
| 文件头 + `:root` | 设计变量：色板、字体、圆角、阴影、`--maxw` |
| 基础 | `body` 纸纹背景、`a`、`button`、`:focus-visible`、`.sr-only`、`.icon` |
| 顶部导航 | `.site-header`、`.brand`/`.seal`、`.header-nav`/`.header-link`（含 `.is-active` 朱砂下划线）、`.lang-switch` |
| 首页 · 头部 | `.hero`、`h1`、`.hero-stats` |
| 检索面板 | `.search-panel`、`.search-row`、`.scope-chip`（用 `:has(input:checked)` 实现选中态）、`.filter-row` |
| 浏览区 | `.browse-head`、`.browse-actions`、`.view-toggle`、`.random-btn`、`.active-filters`、`.results-meta`、`.results`（网格 / 列表两种布局） |
| 结果卡片 | `.entry-card`、`.entry-word`、`.card-senses` / `.card-sense` / `.hanzi-chip`、`.badge`、`.entry-card-foot` |
| 文章 / 关于页 | `.page`、`.page-topbar`、`.back-link`、`.page-inner`、`.page-title`、`.page-card`、`.reserved-panel` |
| 详情页 | `.detail`、`.detail-head`、`.sense-block`、`.sense-hanzi`、`.def-row`、`.translation-row`、`.examples`、`.detail-side` |
| 页脚 / Toast | `.site-footer`、`.toast` |
| 响应式 | `1000px` / `860px` / `640px` / `prefers-reduced-motion` |

改样式时的三个注意点：

1. **优先改 `:root` 变量**，不要在每个规则里硬编码颜色，否则换色要改几十处。
2. **`.sense-hanzi` 同时用于详情页义项标题**，改它会连带影响详情页（这是有意保留的共用规则）。
3. 卡片要能容纳"多个义项 × 多个汉字"：改动 `.card-sense-line` / `.hanzi-chip` 的 `flex-wrap` 或字号时，请拿 `sái`（3 义项、4 个汉字）当测试样本。

### 6.5 给内容页写正文

内容页（`orthography/` `grammar/` `resource/` `about/`）的正文**不在 `app.js` 里，也不在生成的 HTML 里**，而在：

```
content/zh/orthography.html
content/en/orthography.html
content/fr/orthography.html
```

规则：

1. 文件只写**片段**（不要 `<html>`、`<head>`、`<body>`），会被塞进 `.page-body` 里。
2. 写普通 HTML 即可：`<h2>` `<p>` `<ul>` `<table>` 都能用；不要写 `<script>`。
3. 文件不存在或为空 → 页面显示"内容筹备中"占位卡，不会报错。所以可以先只写中文，英文法文暂时留空。
4. 改完**必须跑一次构建**，否则生成页不会更新：

   ```powershell
   python build_site.py --site-url https://你的域名
   ```

5. 只写了中文时，英文/法文页仍然是占位卡——这是有意的，避免把中文正文混进外文页。

关于页的统计句（条目/义项/声母/韵母/分类）由脚本根据 `data.json` 现算并插入，正文里**不要**再手写数字。

### 6.6 新增导航栏链接 / 新增独立页（**5 处联动，最容易漏**）

独立页的机制是：**slug 决定一切**。假设要加一个「资料库」页，slug 取 `resources`：

1. **`app.js` 的 `I18N`**（zh / en / fr 三块都要加，漏了会显示 key 原文）：

   ```js
   navResources: '资料库',        // 导航文字
   resourcesTitle: '资料库',      // 页面大标题 + <title>
   resourcesLead: '……',           // 页面导语，同时用作 meta description
   ```

2. **`index.html`** 的 `.header-nav` 里加一项（**链接指向真实文件**，不是 `#/`）：

   ```html
   <a class="header-link" href="resources/" data-nav="resources">
     <span data-i18n="navResources">资料库</span>
   </a>
   ```

   `data-nav` 的值必须与 slug 一致，构建时靠它给该页写 `is-active`。

3. **`build_site.py`** 顶部的 `SITE_PAGES` 加进 slug：

   ```python
   SITE_PAGES = ['orthography', 'grammar', 'resource', 'about', 'resources']
   ```

   这一步同时决定：生成哪些目录、sitemap 收录哪些 URL、`prefix_links()` 能识别哪种链接。

4. **`content/<语言>/resources.html`**（可选）写正文，见 6.5；不写就是占位卡。

5. 跑一遍构建：

   ```powershell
   python build_site.py --site-url https://你的域名
   ```

检查：`/resources/`、`/en/resources/`、`/fr/resources/` 三个地址都能打开，导航高亮正确，语言按钮能在三语之间互跳，sitemap 里出现这三条。

> 不需要改的：`handleRoute()`（独立页不经过 hash 路由）、`setActiveNav()`、CSS。
>
> **如果是外部链接**（不是站内页面），不要走这套流程：直接在导航里写 `<a href="https://example.com" target="_blank" rel="noopener noreferrer">`，**不要写 `data-nav`**（否则会误高亮），三语文案仍要补。

### 6.7 新增 / 修改界面文案

> **先记住：不要改 `index.html` 里的正文文字。**
> 带 `data-i18n` 的文字会在页面启动时被 `applyStaticI18n()` 用 `I18N` 覆盖；`en/`、`fr/` 也会在构建时按 `I18N` 重新生成。HTML 里的文字只是无 JS 时的兜底和构建模板，改了看不到效果。
>
> 这样设计是为了**文案只有一份**（三语都在 `I18N` 里），避免中文、英文、法文各改一遍时漏掉某个页面。

1. 在 `I18N` 的**三个语言块**都加 / 改同一个 key（中文、英文、法文，缺一个就会回退中文）。
2. 如果这是**新元素**，HTML 里用 `<span data-i18n="新key">默认中文</span>`；占位符 / title / aria 分别用 `data-i18n-placeholder` / `data-i18n-title` / `data-i18n-aria`。
3. 带变量的文案写成 `'共 {n} 条结果'`，调用 `t('resultsCount', { n: fmt(count) })`。
4. 不要直接把中文写进 JS 模板；除了纯数据（如 `'普通话'`）以外都应走 `t()`。
5. 改完跑一次 `python build_site.py`，让 `en/`、`fr/` 和 HTML 里的静态副本同步；然后强刷浏览器。

### 6.8 新增卡片或详情页字段

例如以后加音频 `audio`：

1. `data.json` 加字段 → 重建 `data.js`。
2. 卡片：`renderEntryCard()` / `renderCardSense()` 加输出（记得 `esc()`）。
3. 详情：`renderSenseBlock()` 或 `renderDetail()` 的对应区块加输出。
4. 样式：在 `styles.css` 对应区块加规则。
5. 文案：需要标题/提示的，在 `I18N` 三语补齐。
6. 验证：拿多义项词（`sái`）、空汉字词（`hanzi: ["*"]`）、无译文词各看一遍。

### 6.9 本地验证方法

**基础**：双击 `index.html`，看首页是否出现 2,534 张卡片、统计数字是否正常、控制台无报错。

**自动化检查（无头 Edge，无需 node）**：

```powershell
& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless --disable-gpu `
  --virtual-time-budget=5000 --dump-dom "file:///C:/Users/26434/Desktop/tie_gur_pou/index.html" `
  2>$null | Out-File -Encoding utf8 "$env:TEMP\dom.html"
```

然后检查标记数量：

```powershell
@('entry-card','card-senses','sense-hanzi') | ForEach-Object {
  "{0}: {1}" -f $_, (Select-String -Path "$env:TEMP\dom.html" -Pattern $_ -AllMatches |
    ForEach-Object { $_.Matches.Count } | Measure-Object -Sum).Sum
}
```

详情页把 URL 换成 `index.html#/entry/s%C3%A1i`（`sái` 是多义项样本）。
语言落地页把 URL 换成 `en/index.html`、`fr/index.html`，确认卡片数与 `<html lang>` 正确。

**排查表**：

| 症状 | 可能原因 |
| --- | --- |
| 页面空白、卡片 0 张 | `data.js` 不存在或 JSON 拼错（先看控制台） |
| 改了 `data.json` 页面没变 | 忘记重新生成 `data.js` |
| 新语言按钮是灰的 | `I18N` 缺少该语言块 |
| 新文案显示中文 | `I18N` 对应语言块漏了 key（会静默回退） |
| 卡片出现"*"汉字 | 某个展示路径没走 `cleanHanzi()` |
| 详情页某语言译文缺失 | `translations[].lang` 与 `LANGUAGES[].contentLang` 不一致 |
| 中文乱码 | 文件没存成 UTF-8 |

---

## 7. 设计决策记录（为什么这么做）

1. **数据写成 `data.js` 而非 `fetch('data.json')`**：为了 `file://` 双击可开、无 CORS、无异步时序问题。代价是数据更新要重建一次。
2. **一个 HTML + hash 路由**：单文件便于分发与备份；hash 路由不需要服务器 rewrite，`file://` 也支持。代价是不利于 SEO，所以另外用 `build_site.py` 生成 `/en/`、`/fr/` 静态入口（见第 10 节）。
3. **条目卡片展示全部义项**：用户在早期反馈"只显示第一个义项的汉字是误导"。规则定为「每个义项一行，显示它自己的全部汉字」，共享的条目仅靠 `word` 标题表达。
4. **删除"全部义项"页签**：与"全部条目"信息重复（卡片已内联全部义项），且拆散后丢失条目上下文。义项总数仍在顶部统计与"X 义项"徽章可见。
5. **`I18N` 缺失回退中文而不是报错**：让加语言可以分步进行，不会因为少一句文案而白屏；代价是"漏翻"不会报错，所以 6.3 提供了逐页检查清单。
6. **译文回退链显式配置**（`fallback`）而非猜测：法语用户优先看法语，没有则英语，再没有普通话，并在详情页明确提示。
7. **筛选下拉用数据真实值填充**（`fillFilters()`），而不是写死选项：数据变化后选项自动更新，避免"选了词性却永远 0 结果"。
8. **统计在启动时算一次**：数据是静态的，没必要每次渲染重算；未来接检索后统计仍代表全库，语义正好。
9. **启动时仍用 `I18N` 覆盖静态文字**（`applyStaticI18n()`）：早期是"单页原地切换语言"的必需机制；拆成 `/en/`、`/fr/` 独立页面后它已属冗余，但保留它可以保证文案只有 `I18N` 一份、HTML 与运行时不会漂移。副作用是"直接改 HTML 文字不生效"（见 2.1 与 6.7）。要改成 HTML 为准，得同时删掉这一步并让构建脚本不再写文案，三语会变成三份各自维护。
10. **词性与分类只属于义项，不属于条目**：一个条目可有多个义项，各义项的词性、分类可以不同，因此不在词头旁显示聚合标签，也不在卡片脚注显示聚合分类；卡片与详情页都按"每个义项一行/一块"展示它自己的词性和分类。
11. **其他读音与口音跟着词头走**：`pronunciations`（其他读音）和 `accents`（其他口音）都是"这个拼写的另一种读法"，和词头关系最紧，所以卡片里固定显示在词头下方（读音一行、口音一排小 chip），详情页读音以大字放在词条名右侧、口音 chip 紧随其后；侧栏不再重复，原"词条信息"栏随之删除。
12. **导航页面是真实静态文件，不是 hash 路由**：`#/about` 这类地址不会被搜索引擎当作独立页面收录，所以「拼写规则 / 语法 / 资源 / 关于」改为 `/about/`、`/en/about/` 这样的真实目录页，由 `build_site.py` 生成；页面不加载 `data.js` / `app.js`，语言切换写成静态 `<a>`，正文存放于 `content/`。条目详情因为依赖 `data.js` 且数量太大，仍保留 hash 路由。
13. **默认排序是"随机乱序"，不是录入顺序**：`data.json` 里的先后顺序是录入时间，直接展示既无检索意义、又暴露编辑过程。页面加载时用 Fisher–Yates 打乱一次并把名次存进 `SHUFFLE_RANK`，所以每次打开 / 刷新顺序都不同，但同一次浏览内筛选、检索、切视图不会跳动；另一选项是拼音 A–Z。声韵调排序暂缓：只有首音节有结构化的 `shengmu` / `yunmu` / `tone`，全词排序需要切分音节并推断声调，且约 1–2% 条目的标记本身不一致。
14. **根目录默认语言是潮汕话（`te`），普通话挪到 `/zh/`**：`LANGUAGES` 里 `path` 为 `''` 的那一项就是根目录语言，`build_site.py` 的 `DEFAULT_LANG` 必须与它一致；`<html lang>` 与 `hreflang` 写 `nan`（闽南语 ISO 639-3 代码——`te` 在 BCP 47 里其实是泰卢固语）。`I18N.te` 目前是 `zh` 的逐条抄录，文字待逐条改成潮语，key 不要增删。

---

## 8. 已知限制

- 检索为**子串匹配**，未做拼音去调号折叠（输入 `tsiah` 找不到 `tsiâh`）；数据量再大时需要倒排索引。
- 筛选下拉与关键词是"与"关系；"重置"只清筛选，不清关键词。
- 列表默认只显示 60 条，需要看全部要点底部的"显示全部"；这是有意为之，不是缺数据。
- 语言切换现在是"跳到对应语言的页面"（`/` ↔ `/en/` ↔ `/fr/`），并保留当前 hash；选择同时写入 `localStorage`，回主站会自动转到记住的语种。代价：删掉某个语言目录前要先清 `path`，否则会跳到 404。
- 已有三份语言入口页（`/`、`/en/`、`/fr/`）与 `hreflang`、`sitemap.xml`、`robots.txt`；但条目页仍是 hash，长尾词仍搜不到（见第 10 节）。
- 内容页（拼写规则 / 语法 / 资源 / 关于）只有占位卡，正文待写。
- `word` 是唯一主键，同形不同音的多音字若需要拆分，需先约定数据规则（如加 `id` 字段），目前不支持。
- 有构建脚本 `build_site.py`，但没有测试与 lint；改动后靠手动或 6.9 的命令验证。
- Google Fonts 依赖网络；离线时回退到系统字体（`Noto Serif SC` → `Songti SC` → `SimSun`），排版不会崩。

---

## 9. 下次继续时从这里开始

1. 先读第 5 节速查表定位要改的文件。
2. 大改动前列一份"联动清单"（数据 → 逻辑 → 样式 → 三语文案 → 验证）。
3. 改完按 6.9 跑一次无头检查，确认卡片数、统计数、详情页都正常。
4. 更新本文件第 4 节的「已完成 / 未完成」状态和顶部日期。

---

## 10. 搜索引擎收录（SEO）现状与改造方案

### 10.1 结论

**已实施方案 B（语言落地页），但条目级长尾搜索仍然搜不到。** 现在可以被收录的是四个入口：

| URL | 语言 | 说明 |
| --- | --- | --- |
| `/` | 潮汕话 | 主站（默认语言） |
| `/zh/` | 普通话 | 由 `build_site.py` 生成 |
| `/en/` | 英文 | 由 `build_site.py` 生成 |
| `/fr/` | 法语 | 由 `build_site.py` 生成 |

它们有独立 `<html lang>`、标题、描述、canonical、互相指向的 `hreflang`，并且首屏文案与统计数字是**写死在 HTML 里的**（爬虫不执行 JS 也能读到）。所以英语用户搜 "Teochew dictionary"、法语用户搜 "dictionnaire teochew" 有机会命中。

**并且它们是真正在用的**：页头的语言按钮现在直接跳到这几份页面（并保留当前 hash），不再是"原地换文字"。URL 就是语言，`localStorage` 只用来在回到主站时把你带回记住的语言页。

仍然存在的两个障碍：

1. **条目页全部是 hash**（`#/entry/sái`）。`#` 之后是片段，不会被当作独立页面，所以"某个词是什么意思 / 怎么读"这类长尾搜索没有可命中的 URL。
2. **条目卡片仍由 JS 渲染**。落地页只静态化了首屏文案，2,534 张卡片不在 HTML 里；不执行 JS 的爬虫看到的是一个没有词条内容的页面。

### 10.2 剩余方案（C：条目静态页）

用 Python 从 `data.json` 预生成条目页，**每条目一个真实 HTML**（`/entry/<word>.html`），页内直接写出潮语释义、汉字、三语译文与例句，配自己的 `<title>` / description / canonical；同时生成包含全部条目 URL 的 `sitemap.xml`。

建议变体：**每条目只生成一个页面**（页内含三种语言译文），而不是每种语言各生成一份——避免 7,600 个高度重复的页面被搜索引擎降权。语言只影响界面高亮与首屏语言，不影响页面身份。

代价与注意：

- 页面量 = 2534 + 3，构建时间与文件数增加，但仍可直接部署到 GitHub Pages / Cloudflare Pages / 对象存储，不需要服务器 rewrite。
- 条目页需要自己的模板（或复用现有详情页样式），意味着详情页的渲染逻辑存在"JS 版 + 生成版"两份，改动时要同时改。可以考虑把生成版直接复用 `.detail` 样式，减少分叉。
- 条目页之间的内链（词组）会显著提升收录效率，值得一并生成。

### 10.3 上线操作

1. 部署前运行：`python build_site.py --site-url https://你的域名`（把 hreflang/canonical/sitemap 里的占位域名换掉）。
2. 把整个目录（含 `en/`、`fr/`、`sitemap.xml`、`robots.txt`）上传到静态托管。
3. 在 Google Search Console、Bing Webmaster 提交 `sitemap.xml`；中文站另在百度站长平台提交。
4. 用 "网址检查" 工具分别检查 `/`、`/en/`、`/fr/`，确认抓取到的 HTML 里有该语言的文字。

### 10.4 做 SEO 时必须注意

- `hreflang`、`canonical` 必须是**绝对 URL**（带域名和协议），不能用相对路径——所以必须传 `--site-url`。
- 每份语言页面要有各自的 `<html lang>`、`<title>`、`<meta name="description">`，且描述里出现该语言的常用搜索词。
- 不要手改 `en/`、`fr/`、`sitemap.xml`、`robots.txt`；它们由脚本覆盖。
- 站点上线后观察 Search Console 的"已编入索引"数量；如果长期为 1，说明条目页（方案 C）还没做。
- 不要用"给爬虫看一套、给用户看另一套"的隐藏文本，会被判作弊；生成页的静态内容必须与用户看到的完全一致。

