/* ============================================================
   潮州话词典 · 界面骨架
   - 已完成：数据渲染、词条详情、语言切换、网格/列表视图、排序、随机
   - 已预留：关键词检索、检索范围、筛选条件（表单与状态位已就位）
   ============================================================ */

(function () {
  'use strict';

  const WORDS = (window.DICTIONARY_DATA && window.DICTIONARY_DATA.words) || [];

  /* ------------------------------------------------------------
     语言注册表
     ------------------------------------------------------------
     新增一种界面语言：在 LANGUAGES 里加一项，并在 I18N 里补该语言文案即可。
     新增一种译文语言（数据里已有该 lang）：只需加 LANGUAGES 一项。
     字段说明：
       code          界面语言标识（同时也是路由/本地存储用的标识）
       label / short 语言切换按钮的完整名称与简写
       uiLocale      <html lang> 与数字格式化使用的 locale
       contentLang   data.json 中 translations[].lang 的取值
       contentLabel  展示译文时使用的语言名称
       fallback      该语言缺少译文时，依次回退的内容语言
       path          该语言的页面目录（'' / 'en/' / 'fr/'），切换语言时跳转到它
     ------------------------------------------------------------ */
  const LANGUAGES = [
    {
      code: 'te',
      label: '潮汕话',
      short: '潮',
      uiLocale: 'te-CN',
      contentLang: '潮汕话',
      contentLabel: '潮汕话',
      fallback: [],
      path: ''
    },
    {
      code: 'zh',
      label: '普通话',
      short: '普',
      uiLocale: 'zh-CN',
      contentLang: '普通话',
      contentLabel: '普通话',
      fallback: ['潮汕话'],
      path: 'zh/'
    },
    {
      code: 'en',
      label: 'English',
      short: 'EN',
      uiLocale: 'en',
      contentLang: 'English',
      contentLabel: 'English',
      fallback: ['普通话', '潮汕话'],
      path: 'en/'
    },
    {
      code: 'fr',
      label: 'Français',
      short: 'FR',
      uiLocale: 'fr',
      contentLang: 'français',
      contentLabel: 'Français',
      fallback: ['English', '普通话', '潮汕话'],
      path: 'fr/'
    }
  ];

  const CONTENT_LABELS = {};
  LANGUAGES.forEach(language => {
    CONTENT_LABELS[language.contentLang] = language.contentLabel;
  });

  function currentLanguage() {
    return LANGUAGES.find(item => item.code === state.lang) || LANGUAGES[0];
  }

  /* 当前这份 HTML 属于哪种语言（由构建脚本注入 DEFAULT_LANG；主站为 zh） */
  function pageLanguage() {
    const declared = LANGUAGES.find(item => item.code === window.DEFAULT_LANG && I18N[item.code]);
    return declared || LANGUAGES[0];
  }

  /* 站内相对地址：pagePath 形如 '' / 'zh/' / 'about/'；file:// 下补回 index.html */
  function pageHref(pagePath) {
    const href = (pageLanguage().path ? '../' : './') + pagePath;
    return window.location.protocol === 'file:' ? href + 'index.html' : href;
  }

  /* 切语言 = 跳到对应语言的页面，并保留当前 hash（如 #/entry/sái） */
  function languageHref(code) {
    const target = LANGUAGES.find(item => item.code === code);
    if (!target) return '';
    return pageHref(target.path) + (window.location.hash || '');
  }

  /* 当前语言首页的相对地址 */
  function homeHref() {
    return pageHref(pageLanguage().path);
  }

  /* 当前界面语言 → 内容语言的查找顺序（含回退链） */
  function translationChain() {
    const language = currentLanguage();
    return [language.contentLang, ...(language.fallback || [])].filter(Boolean);
  }

  const I18N = {
    te: {
      pageTitle: '潮语埠 · 潮语辞典',
      headerNote: '多种语言咯更新……',
      navAria: '内容导航',
      navDictionary: '辞典',
      navOrthography: '拼写规则',
      navGrammar: '语法',
      navResource: '资源',
      navAbout: '关于',
      backToDictionary: '转去',
      orthographyTitle: '拼写规则',
      orthographyLead: '潮语罗马字的拼写规则。按规则写字，才易睇易读。',
      grammarTitle: '语法',
      grammarLead: '整理潮语撮语法。',
      resourceTitle: '资料',
      resourceLead: '争取收集撮有用的资料，尽量共怹电子化，了大家人拢好用。',
      aboutTitle: '关于本网站',
      aboutLead: '本词典以拼写为条目单位，条目下可兼收多个义项与多种汉字写法，并为每个义项提供多语言译文与例句。',
      aboutStats: '当前收录 {entries} 条词目、{senses} 个义项，覆盖 {initials} 个声母、{finals} 个韵母与 {categories} 个分类。',
      pagePendingTitle: '内容筹备中',
      pagePending: '本页正文尚未撰写。篇幅短时可直接写成一页，篇幅长时可拆成多篇独立文章。',
      eyebrow: '潮语辞典',
      heroTitle: '收录潮语表达，平样拼写。',
      heroDesc: '无论潮语、潮汕话、潮州话，拢是咱家己的母语，传承、发展伊。',
      statEntries: '条目',
      statSenses: '义项',
      searchLabel: '检索关键词',
      searchPlaceholder: '拍字等揣…… Phah zī thěng chuē...',
      searchButton: '揣 CHUĒ',
      scopeLabel: '揣的范围',
      scopeWord: '词 sûr',
      scopeHanzi: '汉字 Hànzì',
      scopeMeaning: '意思 ì-sùr',
      scopeTranslations: '翻译 huan-êk',
      filterSpeech: '词性 sûr-sèe',
      filterCategory: '类别 luī-piât',
      filterInitial: '声 sya',
      filterFinal: '韵 ūn',
      filterTone: '调 tiāu',
      filterReset: '重新选',
      anyOption: '全部',
      noResults: '揣无佮“{q}”有关的词。Chuē bô kah « {q} » ǔ-kuan kâi sûr.',
      scopeRequired: '你还无选揣的范围。Lúr hwa bô suán chuē kâi huǎm-uî.',
      sortLabel: '顺序',
      sortShuffle: '四散排',
      sortAlpha: '字母顺序A–Z',
      viewAria: '视图切换',
      viewGrid: '网格视图',
      viewList: '列表视图',
      random: '随机抽个词',
      resultsCount: '共 {n} 条结果',
      endOfList: '{n} 条 · 已显示全部',
      showAll: '显示全部',
      cardSenses: '{n} 义项',
      cardSensesOne: '1 义项',
      cardOpen: '详情',
      noTranslation: '暂无译文',
      noData: '暂无可显示的词条。',
      detailBack: '返回检索',
      detailCrumb: '潮州话词典 / 词条',
      detailEyebrow: '词条',
      detailSenses: '义项',
      countSenses: '义项',
      countPhrases: '词组',
      detailMeaning: '潮语释义',
      detailMeaningHanzi: '汉字释义',
      detailTranslations: '译文',
      detailExamples: '例句',
      missingTranslation: '暂无{lang}译文，以下为其他语言。',
      infoAltPron: '其他口音',
      zeroInitial: '零声母',
      detailPhrases: '词组',
      detailTips: '备注',
      noPhrases: '暂无词组',
      noTips: '暂无备注',
      noSenses: '暂无义项',
      emptyEntry: '未找到该词条。'
    },
    zh: {
      pageTitle: '潮语埠 · 潮语辞典',
      headerNote: '多种语言正在更新',
      navAria: '内容导航',
      navDictionary: '辞典',
      navOrthography: '正字法',
      navGrammar: '语法',
      navResource: '资源',
      navAbout: '关于',
      backToDictionary: '返回',
      orthographyTitle: '正字法',
      orthographyLead: '潮语罗马字的正字法，标注清楚特殊变调以方便阅读理解。',
      grammarTitle: '语法',
      grammarLead: '整理潮汕话的语法。',
      resourceTitle: '资料',
      resourceLead: '收集各种有用的资料，尽量将其电子化，然后予大众共享。',
      aboutTitle: '关于本网站',
      aboutLead: '本词典以拼写为条目单位，条目下可兼收多个义项与多种汉字写法，并为每个义项提供多语言译文与例句。',
      aboutStats: '当前收录 {entries} 条词目、{senses} 个义项，覆盖 {initials} 个声母、{finals} 个韵母与 {categories} 个分类。',
      pagePendingTitle: '内容筹备中',
      pagePending: '本页正文尚未撰写。篇幅短时可直接写成一页，篇幅长时可拆成多篇独立文章。',
      eyebrow: '潮语辞典',
      heroTitle: '收录潮语表达，统一拼写。',
      heroDesc: '收着 {entries} 条词目、{senses} 个义项。按词语、汉字、释义与多语言译文检索，也可依声母、韵母、声调、词性和分类逐层筛选。',
      statEntries: '条目',
      statSenses: '义项',
      searchLabel: '检索关键词',
      searchPlaceholder: '输入关键词……',
      searchButton: '检索',
      scopeLabel: '检索范围',
      scopeWord: '词',
      scopeHanzi: '汉字',
      scopeMeaning: '含义',
      scopeTranslations: '翻译',
      filterSpeech: '词性',
      filterCategory: '类别',
      filterInitial: '声母',
      filterFinal: '韵母',
      filterTone: '声调',
      filterReset: '重置',
      anyOption: '全部',
      noResults: '未找到与“{q}”相关的表达。',
      scopeRequired: '请先选择检索范围。',
      sortLabel: '排序',
      sortShuffle: '乱序排列',
      sortAlpha: '字母顺序A–Z',
      viewAria: '视图切换',
      viewGrid: '网格视图',
      viewList: '列表视图',
      random: '随机条目',
      resultsCount: '共 {n} 条结果',
      endOfList: '{n} 条 · 已显示全部',
      showAll: '显示全部',
      cardSenses: '{n} 义项',
      cardSensesOne: '1 义项',
      cardOpen: '详情',
      noTranslation: '暂无译文',
      noData: '暂无可显示的词条。',
      detailBack: '返回检索',
      detailCrumb: '潮州话词典 / 词条',
      detailEyebrow: '词条',
      detailSenses: '义项',
      countSenses: '义项',
      countPhrases: '词组',
      detailMeaning: '潮语释义',
      detailMeaningHanzi: '汉字释义',
      detailTranslations: '译文',
      detailExamples: '例句',
      missingTranslation: '暂无{lang}译文，以下为其他语言。',
      infoAltPron: '其他口音',
      zeroInitial: '零声母',
      detailPhrases: '词组',
      detailTips: '备注',
      noPhrases: '暂无词组',
      noTips: '暂无备注',
      noSenses: '暂无义项',
      emptyEntry: '未找到该词条。'
    },
    en: {
      pageTitle: 'Neo-Teochew Dictionary',
      headerNote: 'Multiple languages are being updated...',
      navAria: 'Content navigation',
      navDictionary: 'Dictionary',
      navOrthography: 'Orthography',
      navGrammar: 'Grammar',
      navResource: 'Resource',
      navAbout: 'About',
      backToDictionary: 'Back to dictionary',
      orthographyTitle: 'Orthography',
      orthographyLead: 'How Teochew pengim writes initials, finals, tones, and connected syllables.',
      grammarTitle: 'Grammar',
      grammarLead: 'Notes on Teochew word formation and sentence structure.',
      resourceTitle: 'Resources',
      resourceLead: 'External materials, tools, and communities for learning and looking up Teochew.',
      aboutTitle: 'About this dictionary',
      aboutLead: 'Each entry is a spelling. An entry may collect several senses and several character spellings, with multilingual translations and examples for every sense.',
      aboutStats: 'Currently {entries} entries and {senses} senses, covering {initials} initials, {finals} finals, and {categories} categories.',
      pagePendingTitle: 'Content in preparation',
      pagePending: 'This page has not been written yet. Short material can stay on one page; longer material can be split into separate articles.',
      eyebrow: 'NEO-TEOCHEW DICTIONARY',
      heroTitle: 'Look up a word. Reach its sound and its sense.',
      heroDesc: '{entries} entries and {senses} senses. Search by word, character, definition, or translation — then narrow by initial, final, tone, part of speech, and category.',
      statEntries: 'Entries',
      statSenses: 'Senses',
      searchLabel: 'Search keyword',
      searchPlaceholder: 'Word, character, definition, or translation…',
      searchButton: 'Search',
      scopeLabel: 'Search in',
      scopeWord: 'Word spelling',
      scopeHanzi: 'Characters',
      scopeMeaning: 'Definition',
      scopeTranslations: 'Translations',
      filterSpeech: 'Part of speech',
      filterCategory: 'Category',
      filterInitial: 'Initial',
      filterFinal: 'Final',
      filterTone: 'Tone',
      filterReset: 'Reset',
      anyOption: 'All',
      noResults: 'No entries match “{q}”.',
      scopeRequired: 'Select at least one search scope.',
      sortLabel: 'Sort',
      sortShuffle: 'Shuffled',
      sortAlpha: 'Pengim A–Z',
      viewAria: 'View switch',
      viewGrid: 'Grid view',
      viewList: 'List view',
      random: 'Random entry',
      resultsCount: '{n} results',
      endOfList: '{n} · all shown',
      showAll: 'Show all',
      cardSenses: '{n} senses',
      cardSensesOne: '1 sense',
      cardOpen: 'Open',
      noTranslation: 'No translation',
      noData: 'No entries to display.',
      detailBack: 'Back to search',
      detailCrumb: 'Teochew Dictionary / Entry',
      detailEyebrow: 'ENTRY',
      detailSenses: 'Senses',
      countSenses: 'Senses',
      countPhrases: 'Phrases',
      detailMeaning: 'Teochew definition',
      detailMeaningHanzi: 'Character definition',
      detailTranslations: 'Translations',
      detailExamples: 'Examples',
      missingTranslation: 'No {lang} translation — other languages shown below.',
      infoAltPron: 'Other accents',
      zeroInitial: 'No initial',
      detailPhrases: 'Phrases',
      detailTips: 'Note',
      noPhrases: 'No phrases',
      noTips: 'No note',
      noSenses: 'No senses',
      emptyEntry: 'Entry not found.'
    },
    fr: {
      pageTitle: 'Le Dictionnaire Néo-Teochew',
      headerNote: 'Plusieurs langues sont en cours d’actualisation...',
      navAria: 'Navigation du contenu',
      navDictionary: 'Dictionnaire',
      navOrthography: 'Orthographie',
      navGrammar: 'Grammaire',
      navResource: 'Ressources',
      navAbout: 'À propos',
      backToDictionary: 'Retour au dictionnaire',
      orthographyTitle: 'Orthographie',
      orthographyLead: 'Comment le pengim teochew note les initiales, les finales, les tons et les syllabes liées.',
      grammarTitle: 'Grammaire',
      grammarLead: 'Notes sur la formation des mots et la structure des phrases en teochew.',
      resourceTitle: 'Ressources',
      resourceLead: 'Documents, outils et communautés externes pour apprendre et consulter le teochew.',
      aboutTitle: 'À propos de ce dictionnaire',
      aboutLead: 'Chaque entrée correspond à une graphie. Une entrée peut réunir plusieurs acceptions et plusieurs graphies en caractères, avec des traductions multilingues et des exemples pour chaque acception.',
      aboutStats: 'Actuellement {entries} entrées et {senses} acceptions, couvrant {initials} initiales, {finals} finales et {categories} catégories.',
      pagePendingTitle: 'Contenu en préparation',
      pagePending: 'Cette page n’est pas encore rédigée. Un contenu court peut tenir sur une seule page ; un contenu long peut être divisé en plusieurs articles.',
      eyebrow: 'LE DICTIONNAIRE TEOCHEW',
      heroTitle: 'Cherchez un mot, retrouvez son son et son sens.',
      heroDesc: '{entries} entrées et {senses} acceptions. Recherche par mot, caractère, définition ou traduction, avec filtres par initiale, finale, ton, nature grammaticale et catégorie.',
      statEntries: 'Entrées',
      statSenses: 'Acceptions',
      searchLabel: 'Mot-clé',
      searchPlaceholder: 'Mot, caractère, définition ou traduction…',
      searchButton: 'Rechercher',
      scopeLabel: 'Champ de recherche',
      scopeWord: 'Graphie du mot',
      scopeHanzi: 'Caractères',
      scopeMeaning: 'Définition',
      scopeTranslations: 'Traductions',
      filterSpeech: 'Nature',
      filterCategory: 'Catégorie',
      filterInitial: 'Initiale',
      filterFinal: 'Finale',
      filterTone: 'Ton',
      filterReset: 'Réinitialiser',
      anyOption: 'Toutes',
      noResults: 'Aucune entrée ne correspond à « {q} ».',
      scopeRequired: 'Sélectionnez au moins une zone de recherche.',
      sortLabel: 'Trier',
      sortShuffle: 'Ordre aléatoire',
      sortAlpha: 'Pengim A–Z',
      viewAria: 'Affichage',
      viewGrid: 'Vue en grille',
      viewList: 'Vue en liste',
      random: 'Entrée au hasard',
      resultsCount: '{n} résultats',
      endOfList: '{n} · tout est affiché',
      showAll: 'Tout afficher',
      cardSenses: '{n} acceptions',
      cardSensesOne: '1 acception',
      cardOpen: 'Voir',
      noTranslation: 'Pas de traduction',
      noData: 'Aucune entrée à afficher.',
      detailBack: 'Retour à la recherche',
      detailCrumb: 'Dictionnaire de teochew / Entrée',
      detailEyebrow: 'ENTRÉE',
      detailSenses: 'Acceptions',
      countSenses: 'Acceptions',
      countPhrases: 'Locutions',
      detailMeaning: 'Définition en teochew',
      detailMeaningHanzi: 'Définition en caractères',
      detailTranslations: 'Traductions',
      detailExamples: 'Exemples',
      missingTranslation: 'Pas de traduction en {lang} — autres langues ci-dessous.',
      infoAltPron: 'Autres accents',
      zeroInitial: 'Sans initiale',
      detailPhrases: 'Locutions',
      detailTips: 'Note',
      noPhrases: 'Aucune locution',
      noTips: 'Aucune note',
      noSenses: 'Aucune acception',
      emptyEntry: 'Entrée introuvable.'
    }
  };

  /* ---------------- 运行状态 ---------------- */

  const state = {
    lang: 'zh',
    view: 'grid',
    sort: 'shuffle',
    query: '',
    scopes: { word: true, hanzi: true, meaning: true, translations: true },
    filters: { speech: '', category: '', initial: '', final: '', tone: '' }
  };

  /* 语言记忆：刷新后沿用上次选择（file:// 或隐私模式下可能不可用，静默忽略） */
  const LANG_STORAGE_KEY = 'teochew.lang';

  function readStoredLang() {
    try {
      const value = window.localStorage.getItem(LANG_STORAGE_KEY);
      const usable = LANGUAGES.some(language => language.code === value && I18N[language.code]);
      return usable ? value : '';
    } catch (error) {
      return '';
    }
  }

  function storeLang(code) {
    try {
      window.localStorage.setItem(LANG_STORAGE_KEY, code);
    } catch (error) {
      // 存储不可用时不影响当前会话的语言切换
    }
  }

  let currentEntry = null;
  let resultList = [];
  let renderedCount = 0;
  const RESULT_BATCH = 60;
  let lastHomeScroll = 0;
  let toastTimer = null;

  const stats = buildStats();

  const collator = new Intl.Collator('en', { sensitivity: 'base', numeric: true });

  /* ---------------- DOM ---------------- */

  const homeEl = document.getElementById('view-home');
  const detailEl = document.getElementById('view-detail');
  const resultsEl = document.getElementById('results');
  const resultsCountEl = document.getElementById('results-count');
  const resultsEndEl = document.getElementById('results-end');
  const activeFiltersEl = document.getElementById('active-filters');
  const searchFormEl = document.getElementById('search-form');
  const searchInputEl = document.getElementById('q');
  const sortEl = document.getElementById('sort');
  const toastEl = document.getElementById('toast');
  const langSwitchEl = document.querySelector('.lang-switch');
  const headerLinks = Array.from(document.querySelectorAll('.header-link'));
  const viewButtons = Array.from(document.querySelectorAll('.view-btn'));

  /* ---------------- 文本工具 ---------------- */

  const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, ch => HTML_ESCAPES[ch]);
  }

  function t(key, vars) {
    const table = I18N[state.lang] || I18N.zh;
    let text = table[key] != null ? table[key] : (I18N.zh[key] != null ? I18N.zh[key] : key);
    if (vars) {
      Object.keys(vars).forEach(name => {
        text = text.split(`{${name}}`).join(String(vars[name]));
      });
    }
    return text;
  }

  function fmt(number) {
    return new Intl.NumberFormat(currentLanguage().uiLocale).format(number);
  }

  function unique(list) {
    return Array.from(new Set(list.filter(Boolean)));
  }

  function pad2(number) {
    return String(number + 1).padStart(2, '0');
  }

  function displayLang(lang) {
    return CONTENT_LABELS[lang] || lang;
  }

  function senseCountLabel(count) {
    if (count === 1) return t('cardSensesOne');
    return t('cardSenses', { n: fmt(count) });
  }

  /* ---------------- 数据统计 ---------------- */

  function buildStats() {
    const definitions = WORDS.flatMap(entry => entry.definitions || []);
    const speechCounts = new Map();
    const categoryCounts = new Map();

    definitions.forEach(def => {
      (def.speech || []).forEach(value => {
        speechCounts.set(value, (speechCounts.get(value) || 0) + 1);
      });
      (def.categories || []).forEach(value => {
        categoryCounts.set(value, (categoryCounts.get(value) || 0) + 1);
      });
    });

    const translationLangs = new Set();
    definitions.forEach(def => {
      (def.translations || []).forEach(item => {
        if (item && item.lang && LANGUAGES.some(language => language.contentLang === item.lang)) {
          translationLangs.add(item.lang);
        }
      });
    });

    return {
      entries: WORDS.length,
      senses: definitions.length,
      initials: new Set(WORDS.map(entry => entry.shengmu).filter(Boolean)).size,
      finals: new Set(WORDS.map(entry => entry.yunmu).filter(Boolean)).size,
      categories: categoryCounts.size,
      languages: translationLangs.size,
      speechCounts,
      categoryCounts
    };
  }

  /* ---------------- 语言与静态文案 ---------------- */

  function applyStaticI18n() {
    document.documentElement.lang = currentLanguage().uiLocale;
    document.title = t('pageTitle');

    document.querySelectorAll('[data-i18n]').forEach(el => {
      el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      el.setAttribute('placeholder', t(el.dataset.i18nPlaceholder));
    });
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      el.title = t(el.dataset.i18nTitle);
    });
    document.querySelectorAll('[data-i18n-aria]').forEach(el => {
      el.setAttribute('aria-label', t(el.dataset.i18nAria));
    });
  }

  /* 语言按钮由注册表生成：新增语言只需改 LANGUAGES + I18N */
  function renderLanguageSwitch() {
    if (!langSwitchEl) return;
    langSwitchEl.innerHTML = LANGUAGES.map(language => {
      const active = language.code === state.lang;
      const hasUi = I18N[language.code] != null;
      return `<button type="button" class="lang-btn${active ? ' is-active' : ''}"
        data-lang="${esc(language.code)}"
        aria-pressed="${active ? 'true' : 'false'}"
        title="${esc(language.label)}"${hasUi ? '' : ' disabled'}>
        <span class="lang-full">${esc(language.label)}</span>
        <span class="lang-short">${esc(language.short || language.code.toUpperCase())}</span>
      </button>`;
    }).join('');
  }

  function updateLangButtons() {
    if (!langSwitchEl) return;
    Array.from(langSwitchEl.querySelectorAll('.lang-btn')).forEach(btn => {
      const active = btn.dataset.lang === state.lang;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function updateStatsText() {
    document.getElementById('stat-entries').textContent = fmt(stats.entries);
    document.getElementById('stat-senses').textContent = fmt(stats.senses);
    document.getElementById('hero-desc').textContent = t('heroDesc', {
      entries: fmt(stats.entries),
      senses: fmt(stats.senses)
    });
  }

  /* ---------------- 筛选器占位 ---------------- */

  function sortByCount(map) {
    return Array.from(map.entries())
      .sort((a, b) => (b[1] - a[1]) || collator.compare(a[0], b[0]))
      .map(item => item[0]);
  }

  function fillSelect(select, options) {
    if (!select) return;
    const previous = select.value;
    select.innerHTML =
      `<option value="">${esc(t('anyOption'))}</option>` +
      options.map(option => `<option value="${esc(option.value)}">${esc(option.label)}</option>`).join('');
    if (options.some(option => option.value === previous)) select.value = previous;
  }

  function fillFilters() {
    fillSelect(
      document.getElementById('filter-speech'),
      sortByCount(stats.speechCounts).map(value => ({ value, label: value }))
    );
    fillSelect(
      document.getElementById('filter-category'),
      sortByCount(stats.categoryCounts).map(value => ({ value, label: value }))
    );
    fillSelect(
      document.getElementById('filter-initial'),
      unique(WORDS.map(entry => entry.shengmu))
        .sort((a, b) => collator.compare(a, b))
        .map(value => ({ value, label: value === '0' ? t('zeroInitial') : value }))
    );
    fillSelect(
      document.getElementById('filter-final'),
      unique(WORDS.map(entry => entry.yunmu))
        .sort((a, b) => collator.compare(a, b))
        .map(value => ({ value, label: value }))
    );
    fillSelect(
      document.getElementById('filter-tone'),
      unique(WORDS.map(entry => entry.tone))
        .sort((a, b) => Number(a) - Number(b))
        .map(value => ({ value, label: value }))
    );
  }

  /* ---------------- 排序 ---------------- */

  /* 随机乱序：页面加载时用 Fisher–Yates 打乱一次，生成固定的名次表。
     每次打开 / 刷新都会换一种顺序；同一次浏览内筛选、检索、切视图都不会重排。 */
  const SHUFFLE_RANK = (() => {
    const shuffled = WORDS.slice();
    for (let i = shuffled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      const swap = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = swap;
    }
    return new Map(shuffled.map((entry, index) => [entry, index]));
  })();

  function sortList(list) {
    if (state.sort === 'shuffle') {
      list.sort((a, b) => SHUFFLE_RANK.get(a) - SHUFFLE_RANK.get(b));
    } else if (state.sort === 'alpha') {
      list.sort((a, b) => collator.compare(a.word, b.word));
    }
    return list;
  }

  /* ---------------- 检索与筛选 ---------------- */

  const FILTER_SELECTS = {
    speech: 'filter-speech',
    category: 'filter-category',
    initial: 'filter-initial',
    final: 'filter-final',
    tone: 'filter-tone'
  };

  function readScopes() {
    const scopes = { word: false, hanzi: false, meaning: false, translations: false };
    if (!searchFormEl) return scopes;

    searchFormEl.querySelectorAll('[data-scope]').forEach(input => {
      scopes[input.dataset.scope] = input.checked;
    });
    return scopes;
  }

  function keywordFields(entry, scopes) {
    const defs = entry.definitions || [];
    const texts = [];

    if (scopes.word) {
      texts.push(entry.word, entry.pronunciations);
      (entry.accents || []).forEach(accent => {
        if (accent && accent.pengim) texts.push(accent.pengim);
      });
    }

    if (scopes.hanzi) {
      defs.forEach(def => cleanHanzi(def.hanzi).forEach(value => texts.push(value)));
    }

    if (scopes.meaning) {
      defs.forEach(def => texts.push(def.meaning, def.meaning_hanzi));
    }

    if (scopes.translations) {
      defs.forEach(def => {
        (def.translations || []).forEach(item => {
          if (item) texts.push(item.text);
        });
      });
    }

    return texts;
  }

  function matchesKeyword(entry, query, scopes) {
    if (!query) return true;

    const needle = query.toLowerCase();
    const fields = keywordFields(entry, scopes).filter(Boolean);

    return fields.some(text => String(text).toLowerCase().includes(needle));
  }

  function matchesFilters(entry) {
    const filters = state.filters;
    if (filters.initial && String(entry.shengmu) !== filters.initial) return false;
    if (filters.final && String(entry.yunmu) !== filters.final) return false;
    if (filters.tone && String(entry.tone) !== filters.tone) return false;

    const defs = entry.definitions || [];
    if (filters.speech && !defs.some(def => (def.speech || []).includes(filters.speech))) return false;
    if (filters.category && !entryCategories(entry).includes(filters.category)) return false;

    return true;
  }

  function resultEntries() {
    const query = state.query.trim();
    const list = WORDS.filter(entry =>
      matchesFilters(entry) && matchesKeyword(entry, query, state.scopes));
    return sortList(list);
  }

  /* ---------------- 关键词高亮与摘录 ---------------- */

  function searchNeedle() {
    return state.query.trim().toLowerCase();
  }

  function matchesNeedle(text, needle) {
    return !!needle && String(text == null ? '' : text).toLowerCase().includes(needle);
  }

  function matchRanges(text, needle) {
    const ranges = [];
    if (!needle) return ranges;
    const haystack = String(text).toLowerCase();
    let cursor = 0;
    while (cursor < haystack.length) {
      const at = haystack.indexOf(needle, cursor);
      if (at < 0) break;
      ranges.push([at, at + needle.length]);
      cursor = at + needle.length;
    }
    return ranges;
  }

  /* 先按命中位置切片，再逐段转义；命中片段包进 <mark> */
  function highlightHtml(text) {
    const raw = String(text == null ? '' : text);
    const ranges = matchRanges(raw, searchNeedle());
    if (!ranges.length) return esc(raw);

    let html = '';
    let cursor = 0;
    ranges.forEach(([start, end]) => {
      html += esc(raw.slice(cursor, start));
      html += `<mark>${esc(raw.slice(start, end))}</mark>`;
      cursor = end;
    });
    return html + esc(raw.slice(cursor));
  }

  /* 只保留命中词附近的一段，两端用省略号表示截断 */
  function excerptHtml(text, max) {
    const raw = String(text == null ? '' : text);
    const needle = searchNeedle();
    const limit = max || 40;
    if (!needle || raw.length <= limit) return highlightHtml(raw);

    const ranges = matchRanges(raw, needle);
    if (!ranges.length) return `${highlightHtml(raw.slice(0, limit))}…`;

    const [start, end] = ranges[0];
    let from = Math.max(0, start - Math.floor((limit - (end - start)) / 3));
    let to = Math.max(from + limit, end);
    if (to > raw.length) {
      to = raw.length;
      from = Math.max(0, to - limit);
    }

    const head = from > 0 ? '…' : '';
    const tail = to < raw.length ? '…' : '';
    return head + highlightHtml(raw.slice(from, to)) + tail;
  }

  function matchRowHtml(label, text, max) {
    return `<p class="card-match">
      <span class="card-match-label">${esc(label)}</span>
      <span class="card-match-text">${excerptHtml(text, max)}</span>
    </p>`;
  }

  function filterLabel(key) {
    if (key === 'initial' && state.filters.initial === '0') return t('zeroInitial');
    const labels = {
      speech: 'filterSpeech',
      category: 'filterCategory',
      initial: 'filterInitial',
      final: 'filterFinal',
      tone: 'filterTone'
    };
    return t(labels[key] || key);
  }

  function renderActiveFilters() {
    if (!activeFiltersEl) return;

    const chips = Object.keys(FILTER_SELECTS)
      .filter(key => state.filters[key])
      .map(key => {
        const value = key === 'initial' && state.filters.initial === '0'
          ? t('zeroInitial')
          : state.filters[key];
        return `<button type="button" class="filter-chip" data-filter="${key}">
          <span>${esc(filterLabel(key))} · ${esc(value)}</span>
          <span class="filter-chip-x" aria-hidden="true">×</span>
        </button>`;
      });

    activeFiltersEl.innerHTML = chips.join('');
    activeFiltersEl.hidden = !chips.length;
  }

  /* ---------------- 译文选取 ---------------- */

  function findTranslation(def, lang) {
    return (def.translations || []).find(item => item && item.lang === lang && item.text) || null;
  }

  function bestTranslation(def) {
    const chain = translationChain();
    for (let i = 0; i < chain.length; i += 1) {
      const found = findTranslation(def, chain[i]);
      if (found) return { text: found.text, lang: found.lang, fallback: i > 0 };
    }
    return null;
  }

  function previewForDefinition(def) {
    const translation = bestTranslation(def);
    if (translation) return translation;

    const fallbackText = def.meaning_hanzi || def.meaning;
    if (fallbackText) return { text: fallbackText, lang: '', fallback: false };

    return { text: t('noTranslation'), lang: '', fallback: false, empty: true };
  }

  function previewHtml(preview) {
    const hint = preview.fallback && preview.lang
      ? `<span class="lang-hint">${esc(displayLang(preview.lang))}</span>`
      : '';
    if (preview.empty) return hint + esc(preview.text);

    // 只高亮检索范围启用的字段：译文预览看 translations，释义回退看 meaning
    const scopeOn = preview.lang ? state.scopes.translations : state.scopes.meaning;
    const hit = scopeOn && matchesNeedle(preview.text, searchNeedle());
    const body = hit ? excerptHtml(preview.text, 60) : esc(preview.text);
    return hint + body;
  }

  function orderedTranslations(def) {
    const chain = translationChain();
    const rank = lang => {
      const index = chain.indexOf(lang);
      return index === -1 ? chain.length : index;
    };
    return (def.translations || []).slice().sort((a, b) => rank(a.lang) - rank(b.lang));
  }

  /* ---------------- 卡片渲染 ---------------- */

  function entryCategories(entry) {
    return unique([
      ...(entry.categories || []),
      ...(entry.definitions || []).flatMap(def => def.categories || [])
    ]);
  }

  function cleanHanzi(list) {
    return unique((list || []).filter(value => value && value !== '*'));
  }

  function renderEntryCard(entry) {
    const defs = entry.definitions || [];
    const needle = searchNeedle();

    // 其他读音与口音固定显示；词语检索命中时高亮
    const maybeHighlight = text =>
      (needle && state.scopes.word && matchesNeedle(text, needle)) ? highlightHtml(text) : esc(text);

    const pronRow = entry.pronunciations
      ? `<p class="card-pron">${maybeHighlight(entry.pronunciations)}</p>`
      : '';

    const accents = (entry.accents || []).filter(accent => accent && accent.pengim);
    const accentRow = accents.length
      ? `<div class="card-accents" aria-label="${esc(t('infoAltPron'))}">
          ${accents.map(accent => `<span class="accent-chip accent-chip-sm">
            ${maybeHighlight(accent.pengim)}${accent.dialect ? `<span class="accent-dialect">${esc(accent.dialect)}</span>` : ''}
          </span>`).join('')}
        </div>`
      : '';

    const senseRows = defs.length
      ? defs.map((def, index) => renderCardSense(def, index, defs.length > 1)).join('')
      : `<p class="card-sense-empty">${esc(t('noSenses'))}</p>`;

    return `<article class="entry-card" role="button" tabindex="0"
      data-word="${esc(entry.word)}" aria-label="${esc(entry.word)}">
      <div class="entry-card-head">
        <div>
          <h3 class="entry-word">${state.scopes.word ? highlightHtml(entry.word) : esc(entry.word)}</h3>
          ${pronRow}
          ${accentRow}
        </div>
        <div class="entry-card-badges">
          <span class="badge badge-sense">${esc(senseCountLabel(defs.length))}</span>
        </div>
      </div>
      <div class="card-senses">${senseRows}</div>
      <div class="entry-card-foot">
        <span class="open-link">${t('cardOpen')}
          <svg class="icon"><use href="#i-arrow-right"></use></svg>
        </span>
      </div>
    </article>`;
  }

  /* 一个义项一行：该义项自己的全部汉字 + 词性 + 当前语言的译文预览 */
  function renderCardSense(def, index, showNumber) {
    const hanzi = cleanHanzi(def.hanzi);
    const speech = def.speech || [];
    const teochewPage = currentLanguage().code === 'te';
    const preview = previewForDefinition(def);
    const previewTranslation = bestTranslation(def);
    const needle = searchNeedle();

    const lineParts = [
      hanzi.map(value => `<span class="hanzi-chip mini">${state.scopes.hanzi ? highlightHtml(value) : esc(value)}</span>`).join(''),
      speech.map(value => `<span class="badge badge-speech">${esc(value)}</span>`).join('')
    ].filter(Boolean);

    // 潮汕话版没有译文，固定显示 meaning / meaning_hanzi 两个字段
    const teochewRows = teochewPage
      ? [def.meaning, def.meaning_hanzi].filter(Boolean).map(text =>
        `<p class="card-sense-def">${needle && state.scopes.meaning && matchesNeedle(text, needle)
          ? excerptHtml(text, 60)
          : esc(text)}</p>`)
      : [];

    // 预览区已展示的内容不再重复追加；没展示但命中的字段才补进来
    const previewSource = preview.empty ? 'none'
      : previewTranslation ? 'translation'
        : (preview.text === def.meaning_hanzi ? 'meaning_hanzi' : 'meaning');

    const extraRows = [];
    if (needle && state.scopes.meaning && !teochewPage) {
      if (previewSource !== 'meaning' && matchesNeedle(def.meaning, needle)) {
        extraRows.push(matchRowHtml(t('detailMeaning'), def.meaning, 36));
      }
      if (previewSource !== 'meaning_hanzi' && matchesNeedle(def.meaning_hanzi, needle)) {
        extraRows.push(matchRowHtml(t('detailMeaningHanzi'), def.meaning_hanzi, 30));
      }
    }
    if (needle && state.scopes.translations) {
      (def.translations || []).forEach(item => {
        if (!item || !matchesNeedle(item.text, needle)) return;
        if (previewTranslation && previewTranslation.lang === item.lang && previewTranslation.text === item.text) return;
        extraRows.push(matchRowHtml(displayLang(item.lang), item.text, 64));
      });
    }

    return `<div class="card-sense">
      ${showNumber ? `<span class="card-sense-no">${pad2(index)}</span>` : ''}
      <div class="card-sense-main">
        ${lineParts.length ? `<div class="card-sense-line">${lineParts.join('')}</div>` : ''}
        ${teochewPage
          ? (teochewRows.length ? teochewRows.join('') : `<p class="card-sense-def is-empty">${esc(t('noTranslation'))}</p>`)
          : `<p class="card-sense-def${preview.empty ? ' is-empty' : ''}">${previewHtml(preview)}</p>`}
        ${extraRows.length ? `<div class="card-match-list card-match-sense">${extraRows.join('')}</div>` : ''}
      </div>
    </div>`;
  }

  /* ---------------- 结果区 ---------------- */

  function renderResults() {
    resultList = resultEntries();
    renderedCount = 0;
    resultsEl.dataset.view = state.view;
    resultsEl.innerHTML = '';
    resultsCountEl.textContent = t('resultsCount', { n: fmt(resultList.length) });
    renderActiveFilters();

    if (!resultList.length) {
      const message = state.query.trim()
        ? t('noResults', { q: state.query.trim() })
        : t('noData');
      resultsEl.innerHTML = `<p class="empty-note">${esc(message)}</p>`;
      resultsEndEl.innerHTML = '';
      return;
    }

    // 默认只显示一屏，其余等用户点"显示全部"
    appendResultBatch(RESULT_BATCH);
    updateResultsFooter();
  }

  function appendResultBatch(count) {
    if (renderedCount >= resultList.length) return;

    const batch = resultList.slice(renderedCount, renderedCount + count);
    resultsEl.insertAdjacentHTML('beforeend', batch.map(renderEntryCard).join(''));
    renderedCount += batch.length;
  }

  function updateResultsFooter() {
    const remain = resultList.length - renderedCount;
    resultsEndEl.innerHTML = '';

    if (remain > 0) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'load-all-btn';
      button.textContent = t('showAll');
      resultsEndEl.appendChild(button);
      return;
    }

    resultsEndEl.textContent = t('endOfList', { n: fmt(resultList.length) });
  }

  /* "显示全部"：分帧追加，避免一次构建上千张卡片把界面卡住 */
  function showAllResults() {
    if (renderedCount >= resultList.length) return;

    resultsEndEl.innerHTML = '';

    const pump = () => {
      appendResultBatch(RESULT_BATCH);
      if (renderedCount < resultList.length) {
        requestAnimationFrame(pump);
      } else {
        updateResultsFooter();
      }
    };
    requestAnimationFrame(pump);
  }

  function updateViewButtons() {
    viewButtons.forEach(btn => {
      const active = btn.dataset.view === state.view;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  /* ---------------- 详情页 ---------------- */

  function renderSenseBlock(def, index) {
    const want = currentLanguage().contentLang;
    const hanzi = cleanHanzi(def.hanzi).join(' · ');
    const speech = def.speech || [];
    const categories = def.categories || [];
    const translations = orderedTranslations(def);
    const hasCurrentTranslation = translations.some(item => item.lang === want);

    const meaningRows = [];
    if (def.meaning) {
      meaningRows.push(`<div class="def-row">
        <div class="def-row-label">${esc(t('detailMeaning'))}</div>
        <p class="def-row-text">${esc(def.meaning)}</p>
      </div>`);
    }
    if (def.meaning_hanzi) {
      meaningRows.push(`<div class="def-row">
        <div class="def-row-label">${esc(t('detailMeaningHanzi'))}</div>
        <p class="def-row-text is-serif">${esc(def.meaning_hanzi)}</p>
      </div>`);
    }

    const missingNote = translations.length && !hasCurrentTranslation
      ? `<p class="missing-lang">${esc(t('missingTranslation', { lang: displayLang(want) }))}</p>`
      : '';

    const translationList = translations.length
      ? `<ul class="trans-list">
          ${translations.map(item => `<li class="trans-row${item.lang === want ? ' is-current' : ''}">
            <span class="trans-lang">${esc(displayLang(item.lang))}</span>
            <span class="trans-text">${esc(item.text)}</span>
          </li>`).join('')}
        </ul>`
      : `<p class="empty-note">${esc(t('noTranslation'))}</p>`;

    const examples = def.examples || [];
    const examplesHtml = examples.length
      ? `<div class="subhead">${esc(t('detailExamples'))}</div>
        <div class="examples">
          ${examples.map(example => renderExample(example)).join('')}
        </div>`
      : '';

    return `<article class="sense-block">
      <div class="sense-block-head">
        <span class="sense-no">${pad2(index)}</span>
        ${hanzi ? `<span class="sense-hanzi">${esc(hanzi)}</span>` : ''}
        <div class="sense-badges">
          ${speech.map(value => `<span class="badge badge-speech">${esc(value)}</span>`).join('')}
          ${categories.map(value => `<span class="tag">${esc(value)}</span>`).join('')}
        </div>
      </div>
      ${meaningRows.length ? `<div class="def-group">${meaningRows.join('')}</div>` : ''}
      <div class="subhead">${esc(t('detailTranslations'))}</div>
      ${missingNote}
      ${translationList}
      ${examplesHtml}
    </article>`;
  }

  function renderExample(example) {
    const chain = translationChain();
    const rank = lang => {
      const index = chain.indexOf(lang);
      return index === -1 ? chain.length : index;
    };
    const want = currentLanguage().contentLang;
    const translations = (example.translations || []).slice().sort((a, b) => rank(a.lang) - rank(b.lang));

    return `<div class="example">
      <p class="example-sentence">${esc(example.sentence)}</p>
      ${example.sentence_hanzi ? `<p class="example-hanzi">${esc(example.sentence_hanzi)}</p>` : ''}
      ${translations.length ? `<ul class="example-trans">
        ${translations.map(item => `<li class="${item.lang === want ? 'is-current' : ''}">
          <span class="lang">${esc(displayLang(item.lang))}</span>
          <span>${esc(item.text)}</span>
        </li>`).join('')}
      </ul>` : ''}
    </div>`;
  }

  function renderDetail(entry) {
    const defs = entry.definitions || [];
    const phrases = entry.phrases || [];
    const accents = (entry.accents || []).filter(accent => accent && accent.pengim);

    const phraseCard = `<section class="side-card">
      <h3>${esc(t('detailPhrases'))}</h3>
      ${phrases.length
        ? `<ul class="phrase-list">${phrases.map(phrase => `<li>${esc(phrase)}</li>`).join('')}</ul>`
        : `<p class="side-empty">${esc(t('noPhrases'))}</p>`}
    </section>`;

    const tipCard = `<section class="side-card">
      <h3>${esc(t('detailTips'))}</h3>
      ${entry.tips
        ? `<p class="tip-text">${esc(entry.tips)}</p>`
        : `<p class="side-empty">${esc(t('noTips'))}</p>`}
    </section>`;

    detailEl.innerHTML = `
      <div class="detail-topbar">
        <button type="button" class="back-link" data-action="back">
          <svg class="icon"><use href="#i-arrow-left"></use></svg>
          <span>${esc(t('detailBack'))}</span>
        </button>
        <span class="crumb">${esc(t('detailCrumb'))}</span>
      </div>

      <header class="entry-hero">
        <div>
          <div class="entry-eyebrow">${esc(t('detailEyebrow'))}</div>
          <div class="entry-title-row">
            <h1 class="entry-word-xl">${esc(entry.word)}</h1>
            ${entry.pronunciations ? `<span class="entry-pron">${esc(entry.pronunciations)}</span>` : ''}
            ${accents.length ? `<div class="entry-accents" aria-label="${esc(t('infoAltPron'))}">
              ${accents.map(accent => `<span class="accent-chip">
                ${esc(accent.pengim)}${accent.dialect ? `<span class="accent-dialect">${esc(accent.dialect)}</span>` : ''}
              </span>`).join('')}
            </div>` : ''}
          </div>
        </div>
        <div class="entry-counts">
          <div class="count-block">
            <span class="count-value">${fmt(defs.length)}</span>
            <span class="count-label">${esc(t('countSenses'))}</span>
          </div>
          ${phrases.length ? `<div class="count-block">
            <span class="count-value">${fmt(phrases.length)}</span>
            <span class="count-label">${esc(t('countPhrases'))}</span>
          </div>` : ''}
        </div>
      </header>

      <div class="detail-grid">
        <div>
          <div class="section-head">
            <h2>${esc(t('detailSenses'))}</h2>
            <span class="count">${fmt(defs.length)}</span>
          </div>
          ${defs.length
            ? defs.map((def, index) => renderSenseBlock(def, index)).join('')
            : `<p class="empty-note">${esc(t('noSenses'))}</p>`}
        </div>

        <aside class="sidebar">
          ${phraseCard}
          ${tipCard}
        </aside>
      </div>
    `;
  }

  /* ---------------- 页面切换与路由 ---------------- */

  function showDetail(entry) {
    currentEntry = entry;
    homeEl.hidden = true;
    detailEl.hidden = false;
    setActiveNav('home');
    renderDetail(entry);
    window.scrollTo(0, 0);
  }

  function showHome() {
    currentEntry = null;
    homeEl.hidden = false;
    detailEl.hidden = true;
    setActiveNav('home');
  }

  function setActiveNav(section) {
    headerLinks.forEach(link => {
      link.classList.toggle('is-active', link.dataset.nav === section);
    });
  }

  function openEntry(word) {
    lastHomeScroll = window.scrollY;
    window.location.hash = '#/entry/' + encodeURIComponent(word);
  }

  function openRandomEntry() {
    if (!WORDS.length) return;
    const entry = WORDS[Math.floor(Math.random() * WORDS.length)];
    openEntry(entry.word);
  }

  /* 去掉空路由 #/ 或 #，让地址栏回到干净的页面地址 */
  function stripEmptyHash() {
    if (!window.location.hash || !/^#\/?$/.test(window.location.hash)) return;
    try {
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    } catch (error) {
      window.location.hash = '';
    }
  }

  /* 返回首页：清掉 hash 路由，地址栏保持干净的页面地址 */
  function goHome() {
    if (window.location.hash) {
      try {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      } catch (error) {
        window.location.hash = '';
      }
    }
    handleRoute(false);
  }

  function handleRoute(initial) {
    const match = /^#\/entry\/(.+)$/.exec(window.location.hash);
    if (match) {
      let word = '';
      try {
        word = decodeURIComponent(match[1]);
      } catch (error) {
        word = match[1];
      }
      const entry = WORDS.find(item => item.word === word);
      if (entry) {
        showDetail(entry);
        return;
      }
      toast(t('emptyEntry'));
    }

    if (/^#\/articles\/?$/.test(window.location.hash)) {
      window.location.replace(homeHref());
      return;
    }
    if (/^#\/about\/?$/.test(window.location.hash)) {
      window.location.replace(pageHref(pageLanguage().path + 'about/'));
      return;
    }

    stripEmptyHash();

    const wasDetail = !detailEl.hidden;
    showHome();
    if (wasDetail && !initial) {
      window.scrollTo(0, lastHomeScroll);
    }
  }

  /* ---------------- Toast ---------------- */

  function toast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toastEl.classList.remove('is-visible');
    }, 2600);
  }

  /* ---------------- 事件绑定 ---------------- */

  function bindEvents() {
    // 语言切换（按钮由注册表动态生成，这里用事件委托）
    if (langSwitchEl) {
      langSwitchEl.addEventListener('click', event => {
        const btn = event.target.closest('.lang-btn');
        if (!btn || btn.disabled) return;
        const next = btn.dataset.lang;
        if (next === state.lang || !I18N[next]) return;
        storeLang(next);
        window.location.href = languageHref(next);
        return;
      });
    }

    // 网格 / 列表
    viewButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        state.view = btn.dataset.view;
        updateViewButtons();
        resultsEl.dataset.view = state.view;
      });
    });

    // 排序
    if (sortEl) {
      sortEl.addEventListener('change', () => {
        state.sort = sortEl.value;
        renderResults();
      });
    }

    // 显示全部
    resultsEndEl.addEventListener('click', event => {
      if (event.target.closest('.load-all-btn')) showAllResults();
    });

    // 结果卡片 → 详情
    resultsEl.addEventListener('click', event => {
      const card = event.target.closest('.entry-card');
      if (card && card.dataset.word) openEntry(card.dataset.word);
    });

    resultsEl.addEventListener('keydown', event => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      const card = event.target.closest('.entry-card');
      if (!card) return;
      event.preventDefault();
      openEntry(card.dataset.word);
    });

    // 详情页返回
    detailEl.addEventListener('click', event => {
      const back = event.target.closest('[data-action="back"]');
      if (back) {
        goHome();
      }
    });

    // 随机条目
    const randomBtn = document.getElementById('random-btn');
    if (randomBtn) randomBtn.addEventListener('click', openRandomEntry);

    // 检索
    if (searchFormEl) {
      searchFormEl.addEventListener('submit', event => {
        event.preventDefault();

        const query = searchInputEl ? searchInputEl.value.trim() : '';
        const scopes = readScopes();

        if (query && !Object.keys(scopes).some(key => scopes[key])) {
          toast(t('scopeRequired'));
          return;
        }

        state.scopes = scopes;
        state.query = query;
        renderResults();
      });
    }

    // 检索范围：已有关键词时立即按新范围重查
    if (searchFormEl) {
      searchFormEl.addEventListener('change', event => {
        const checkbox = event.target.closest('[data-scope]');
        if (!checkbox) return;
        state.scopes = readScopes();
        if (state.query.trim()) renderResults();
      });
    }

    // 筛选条件：选择即生效
    Object.keys(FILTER_SELECTS).forEach(key => {
      const select = document.getElementById(FILTER_SELECTS[key]);
      if (!select) return;
      select.addEventListener('change', () => {
        state.filters[key] = select.value;
        renderResults();
      });
    });

    // 点击已选条件移除
    if (activeFiltersEl) {
      activeFiltersEl.addEventListener('click', event => {
        const chip = event.target.closest('.filter-chip');
        if (!chip) return;
        const key = chip.dataset.filter;
        if (!key) return;
        state.filters[key] = '';
        const select = document.getElementById(FILTER_SELECTS[key]);
        if (select) select.value = '';
        renderResults();
      });
    }

    // 筛选重置
    const resetBtn = document.getElementById('reset-filters');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        Object.keys(FILTER_SELECTS).forEach(key => {
          state.filters[key] = '';
          const select = document.getElementById(FILTER_SELECTS[key]);
          if (select) select.value = '';
        });
        renderResults();
      });
    }

    window.addEventListener('hashchange', () => handleRoute(false));
  }

  /* ---------------- 初始化 ---------------- */

  function init() {
    // 语言以页面 URL 为准（en/、fr/ 为独立页面）
    const declared = window.DEFAULT_LANG;
    const declaredUsable = LANGUAGES.some(language => language.code === declared && I18N[language.code]);

    if (!declaredUsable) {
      // 主站：如果记住过其他语言，直接跳到对应语言页，保证 URL 与语言一致
      const stored = readStoredLang();
      if (stored && stored !== LANGUAGES[0].code) {
        window.location.replace(languageHref(stored));
        return;
      }
    }

    state.lang = declaredUsable ? declared : LANGUAGES[0].code;
    renderLanguageSwitch();
    updateLangButtons();
    applyStaticI18n();
    updateStatsText();
    fillFilters();
    updateViewButtons();
    renderResults();
    bindEvents();
    handleRoute(true);
  }

  init();
})();
