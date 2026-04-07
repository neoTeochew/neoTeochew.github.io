// 搜索功能实现
let vocabularyData = [];

// 加载数据
async function loadData() {
    try {
        const response = await fetch('data.json');
        vocabularyData = await response.json();
        
        // 统计词汇数量
        const vocabCountValue = vocabularyData.length;
        
        // 更新词汇和词组数量
        const vocabCountElement = document.getElementById('vocab-count');
        if (vocabCountElement) {
            vocabCountElement.textContent = `${vocabCountValue}`;
            // 触发i18n更新
            if (window.i18n) {
                window.i18n.updateContent();
            }
        }
    } catch (error) {
        console.error('加载数据失败:', error);
        const vocabCountElement = document.getElementById('vocab-count');
        if (vocabCountElement) {
            vocabCountElement.textContent = '加载失败';
        }
    }
}

// 搜索函数
function searchVocabulary() {
    const searchInput = document.getElementById('search-input').value.trim().toLowerCase();
    const searchWord = document.getElementById('search-word').checked;
    const searchHanzi = document.getElementById('search-hanzi').checked;
    const searchDefinition = document.getElementById('search-definition').checked;
    const searchUsage = document.getElementById('search-usage').checked;
    
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '';
    
    if (!searchInput) {
        return;
    }
    
    // 获取当前语言
    const currentLang = window.i18n ? window.i18n.currentLang : 'zh';
    
    // 根据语言决定搜索的属性
    let searchProp = 'putonghua';
    if (currentLang === 'teo') {
        searchProp = 'teochew';
    } else if (currentLang === 'en') {
        searchProp = 'English';
    } else if (currentLang === 'zh-tr') {
        searchProp = 'putonghua-tr';
    } else if (currentLang === 'teo-tr') {
        searchProp = 'teochew-tr';
    } else if (currentLang === 'fr') {
        searchProp = 'francais';
    } else if (currentLang === 'th') {
        searchProp = 'phasaThai';
    } else if (currentLang === 'me') {
        searchProp = 'phasaThai';
    } else if (currentLang === 'id') {
        searchProp = 'bahasaIndonesia';
    } else if (currentLang === 'vi') {
        searchProp = 'tiengViet';
    } else if (currentLang === 'km') {
        searchProp = 'pheasaKhmer';
    } else if (currentLang === 'lo') {
        searchProp = 'phasaLao';
    }
    
    const results = vocabularyData.filter(item => {
        let match = false;
        
        // 搜索词汇 (item)
        if (searchWord && item.item.toLowerCase().includes(searchInput)) {
            match = true;
        }
        
        // 搜索汉字 (hanzi)
        if (searchHanzi && item.hanzi.some(h => h.toLowerCase().includes(searchInput))) {
            match = true;
        }
        
        // 搜索定义 (只搜索本语言即可)
        if (searchDefinition) {
            if (item.definitions[searchProp].toLowerCase().includes(searchInput)) {
                match = true;
            }
        }
        
        // 搜索用例 (既要有teochew，又要有本语言)
        if (searchUsage) {
            // 搜索 phrase
            if (item.phrase) {
                item.phrase.forEach(ph => {
                    if (currentLang === 'teo' || currentLang === 'teo-tr') {
                        // 只搜索当前语言
                        if (ph[searchProp]) {
                            if (ph[searchProp].toLowerCase().includes(searchInput)) {
                                match = true;
                            }
                        }
                    } else {
                        // 同时搜索当前语言和对应的潮汕话属性
                        if (ph[searchProp]) {
                            if (ph[searchProp].toLowerCase().includes(searchInput)) {
                                match = true;
                            }
                        }
                        if (ph[currentTeochewProp]) {
                            if (ph[currentTeochewProp].toLowerCase().includes(searchInput)) {
                                match = true;
                            }
                        }
                        if (ph.romazi) {
                            if (ph.romazi.toLowerCase().includes(searchInput)) {
                                match = true;
                            }
                        }
                    }
                });
            }
            // 搜索 examples
            if (item.examples) {
                item.examples.forEach(ex => {
                    if (currentLang === 'teo' || currentLang === 'teo-tr') {
                        // 只搜索当前语言
                        if (ex[searchProp]) {
                            if (ex[searchProp].toLowerCase().includes(searchInput)) {
                                match = true;
                            }
                        }
                    } else {
                        // 同时搜索当前语言和对应的潮汕话属性
                        if (ex[searchProp]) {
                            if (ex[searchProp].toLowerCase().includes(searchInput)) {
                                match = true;
                            }
                        }
                        if (ex[currentTeochewProp]) {
                            if (ex[currentTeochewProp].toLowerCase().includes(searchInput)) {
                                match = true;
                            }
                        }
                        if (ex.romazi) {
                            if (ex.romazi.toLowerCase().includes(searchInput)) {
                                match = true;
                            }
                        }
                    }
                });
            }
        }
        
        return match;
    });
    
    // 显示搜索结果
    displayResults(results);
}

// 显示所有条目
function showAllEntries() {
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '';
    
    if (vocabularyData.length > 0) {
        displayResults(vocabularyData);
    } else {
        resultsContainer.innerHTML = '<div class="no-results">数据加载中，请稍后再试</div>';
    }
}

// 按speech和label筛选
function filterEntries() {
    const speechValue = document.getElementById('filter-speech').value;
    const labelValue = document.getElementById('filter-label').value;
    
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '';
    
    const results = vocabularyData.filter(item => {
        let matchSpeech = true;
        let matchLabel = true;
        
        if (speechValue) {
            matchSpeech = item.speech === speechValue;
        }
        
        if (labelValue) {
            matchLabel = item.label.includes(labelValue);
        }
        
        return matchSpeech && matchLabel;
    });
    
    displayResults(results);
}

// 生成筛选选项
function generateFilterOptions() {
    // 收集所有唯一的speech和label
    const speeches = new Set();
    const labels = new Set();
    
    vocabularyData.forEach(item => {
        if (item.speech) speeches.add(item.speech);
        if (item.label) {
            item.label.forEach(label => {
                if (label) labels.add(label);
            });
        }
    });
    
    // 获取当前语言
    const currentLang = window.i18n ? window.i18n.currentLang : 'zh';
    
    // 填充speech选项
    const speechSelect = document.getElementById('filter-speech');
    if (speechSelect) {
        // 清空现有选项
        speechSelect.innerHTML = '<option value="" data-i18n="filter_speech">所有词性</option>';
        
        // 添加speech选项
        Array.from(speeches).sort().forEach(speech => {
            const option = document.createElement('option');
            option.value = speech;
            option.textContent = getTranslatedSpeechOrLabel(speech, currentLang);
            speechSelect.appendChild(option);
        });
    }
    
    // 填充label选项
    const labelSelect = document.getElementById('filter-label');
    if (labelSelect) {
        // 清空现有选项
        labelSelect.innerHTML = '<option value="" data-i18n="filter_label">所有标签</option>';
        
        // 添加label选项
        Array.from(labels).sort().forEach(label => {
            const option = document.createElement('option');
            option.value = label;
            option.textContent = getTranslatedSpeechOrLabel(label, currentLang);
            labelSelect.appendChild(option);
        });
    }
    
    // 触发i18n更新
    if (window.i18n) {
        window.i18n.updateContent();
    }
}

// 获取翻译后的speech或label
function getTranslatedSpeechOrLabel(value, lang) {
    // 定义翻译映射
    const translations = {
        // 词性翻译
        "指称": {
            "en": "Object",
            "teo": "物件",
            "zh-tr": "指稱"
        },
        "行为": {
            "en": "Action",
            "teo": "行为",
            "zh-tr": "行爲"
        },
        "描述": {
            "en": "Description",
            "teo": "描述",
            "zh-tr": "描述"
        },
        "状态": {
            "en": "Condition",
            "teo": "状态",
            "zh-tr": "狀態"
        },
        "量词": {
            "en": "Classifier",
            "teo": "量词",
            "zh-tr": "量詞"
        },
        "称呼": {
            "en": "Pronoun",
            "teo": "称呼",
            "zh-tr": "稱呼"
        },
        "连词": {
            "en": "Conjunction",
            "teo": "连词",
            "zh-tr": "連詞"
        },
        "介词": {
            "en": "Position",
            "teo": "介词",
            "zh-tr": "介詞"
        },
        "专名": {
            "en": "ProperName",
            "teo": "名字",
            "zh-tr": "專名"
        },
        "数字": {
            "en": "Numero",
            "teo": "数字",
            "zh-tr": "數字"
        },
        "拟声词": {
            "en": "Sound",
            "teo": "声音",
            "zh-tr": "擬聲詞"
        },
        "拟态词": {
            "en": "Texture",
            "teo": "质感",
            "zh-tr": "擬態詞"
        },
        "台词": {
            "en": "Message",
            "teo": "台词",
            "zh-tr": "臺詞"
        },
        "表达": {
            "en": "Expression",
            "teo": "表达",
            "zh-tr": "表達"
        },
        "语气词": {
            "en": "Model",
            "teo": "语气词",
            "zh-tr": "語氣詞"
        },
        "词头": {
            "en": "Prefix",
            "teo": "词头",
            "zh-tr": "詞頭"
        },
        "词中": {
            "en": "Infix",
            "teo": "词中",
            "zh-tr": "詞中"
        },
        "词尾": {
            "en": "Suffix",
            "teo": "词尾",
            "zh-tr": "詞尾"
        },
        "词组": {
            "en": "phrase",
            "teo": "词组",
            "zh-tr": "詞組"
        },
        // 标签翻译
        "动物": {
            "en": "Animals",
            "teo": "动物",
            "zh-tr": "動物"
        },
        "鱼": {
            "en": "Fish",
            "teo": "鱼",
            "zh-tr": "魚"
        },
        "外来语": {
            "en": "Loanwords",
            "teo": "外来语",
            "zh-tr": "外來語"
        }
    };
    
    // 检查是否有翻译
    if (translations[value] && translations[value][lang]) {
        return translations[value][lang];
    }
    
    // 默认返回原值
    return value;
}

// 显示搜索结果
function displayResults(results) {
    const resultsContainer = document.getElementById('search-results');
    
    if (results.length === 0) {
        const noResultsText = window.i18n ? window.i18n.t('no_results', '没有找到匹配的结果') : '没有找到匹配的结果';
        resultsContainer.innerHTML = `<div class="no-results">${noResultsText}</div>`;
        return;
    }
    
    // 获取当前语言
    const currentLang = window.i18n ? window.i18n.currentLang : 'zh';
    
    // 根据语言决定显示的属性
    let displayProp = 'putonghua';
    if (currentLang === 'en') {
        displayProp = 'English';
    } else if (currentLang === 'zh-tr') {
        displayProp = 'putonghua-tr';
    } else if (currentLang === 'teo-tr') {
        displayProp = 'teochew-tr';
    } else if (currentLang === 'fr') {
        displayProp = 'francais';
    } else if (currentLang === 'th') {
        displayProp = 'phasaThai';
    } else if (currentLang === 'me') {
        displayProp = 'phasaThai';
    } else if (currentLang === 'id') {
        displayProp = 'bahasaIndonesia';
    } else if (currentLang === 'vi') {
        displayProp = 'tiengViet';
    } else if (currentLang === 'km') {
        displayProp = 'pheasaKhmer';
    } else if (currentLang === 'lo') {
        displayProp = 'phasaLao';
    }
    
    results.forEach(item => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        
        // 处理phrase
        let phraseHtml = '';
        if (item.phrase && item.phrase.length > 0) {
            const nonEmptyPhrases = item.phrase.filter(ph => ph.romazi || ph[currentTeochewProp] || ph[displayProp]);
            if (nonEmptyPhrases.length > 0) {
                const phrasesContent = nonEmptyPhrases.map(ph => {
                    return `
                        <div class="result-phrase">
                            ${ph.romazi ? `<div class="phrase-romazi">${ph.romazi}</div>` : ''}
                            ${ph[currentTeochewProp] ? `<div class="phrase-teochew">${ph[currentTeochewProp]}</div>` : ''}
                            ${ph[displayProp] ? `<div class="phrase-${displayProp}">${ph[displayProp]}</div>` : ''}
                        </div>
                    `;
                }).join('');
                phraseHtml = `<div class="phrases-container">${phrasesContent}</div>`;
            }
        }
        
        // 处理examples
        let examplesHtml = '';
        if (item.examples && item.examples.length > 0) {
            const nonEmptyExamples = item.examples.filter(ex => ex.romazi || ex[currentTeochewProp] || ex[displayProp]);
            if (nonEmptyExamples.length > 0) {
                examplesHtml = nonEmptyExamples.map(ex => {
                    return `
                        <div class="result-example">
                            ${ex.romazi ? `<div class="example-romazi">${ex.romazi}</div>` : ''}
                            ${ex[currentTeochewProp] ? `<div class="example-teochew">${ex[currentTeochewProp]}</div>` : ''}
                            ${ex[displayProp] ? `<div class="example-${displayProp}">${ex[displayProp]}</div>` : ''}
                        </div>
                    `;
                }).join('');
            }
        }
        
        // 处理note
        let noteHtml = '';
        if (item.note && item.note[displayProp]) {
            noteHtml = `<div class="result-note">${item.note[displayProp]}</div>`;
        }
        
        // 处理label
        let labelHtml = '';
        const labels = item.label.filter(l => l); // 过滤空label
        if (labels.length > 0) {
            labelHtml = labels.map(label => `<span class="result-label">${getTranslatedSpeechOrLabel(label, currentLang)}</span>`).join(' ');
        }
        
        // 构建结果HTML，使用新的卡片式布局
        resultItem.innerHTML = `
            <div class="result-card">
                <div class="card-top">
                    <div class="card-top-left">
                        <div class="top-row1">
                            <span class="result-vocab">${item.item}</span>
                            ${item.pronunciation ? `<span class="result-pronunciation">${item.pronunciation}</span>` : ''}
                        </div>
                        <div class="top-row2">
                            ${item.hanzi.some(h => h) ? `<span class="result-hanzi">${item.hanzi.filter(h => h).join('、')}</span>` : ''}
                            ${item.speech ? `<span class="result-speech">${getTranslatedSpeechOrLabel(item.speech, currentLang)}</span>` : ''}
                        </div>
                        <div class="top-row3">
                            ${labelHtml}
                        </div>
                    </div>
                    <div class="card-top-right">
                        ${item.img ? `<img src="${item.img}" alt="${item.item}" class="result-image">` : ''}
                    </div>
                </div>
                <div class="card-bottom">
                    ${item.definitions[displayProp] ? `
                        <div class="bottom-top">
                            <div class="result-definition">${item.definitions[displayProp]}</div>
                        </div>
                    ` : ''}
                    ${phraseHtml ? `
                        <div class="bottom-middle-top">
                            ${phraseHtml}
                        </div>
                    ` : ''}
                    ${examplesHtml ? `
                        <div class="bottom-middle-bottom">
                            ${examplesHtml}
                        </div>
                    ` : ''}
                    ${noteHtml ? `
                        <div class="bottom-bottom">
                            ${noteHtml}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        resultsContainer.appendChild(resultItem);
    });
}

// 显示随机条目
function showRandomEntry() {
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '';
    
    if (vocabularyData.length > 0) {
        const randomIndex = Math.floor(Math.random() * vocabularyData.length);
        const randomEntry = vocabularyData[randomIndex];
        displayResults([randomEntry]);
    } else {
        resultsContainer.innerHTML = '<div class="no-results">数据加载中，请稍后再试</div>';
    }
}

// 存储当前使用的潮汕话属性 (teochew 或 teochew-tr)
let currentTeochewProp = 'teochew';

// 处理简体按钮点击
function handleSimplifiedClick() {
    const currentLang = window.i18n ? window.i18n.currentLang : 'zh';
    
    if (currentLang === 'zh' || currentLang === 'zh-tr') {
        // 切换到 zh 语言
        window.location.href = '?lang=zh';
    } else if (currentLang === 'teo' || currentLang === 'teo-tr') {
        // 切换到 teo 语言
        window.location.href = '?lang=teo';
    } else {
        // 其他语言下，切换到 teochew 属性
        currentTeochewProp = 'teochew';
        // 重新执行当前的搜索或显示操作
        const searchInput = document.getElementById('search-input').value.trim();
        if (searchInput) {
            searchVocabulary();
        } else {
            // 检查是否有筛选条件
            const speechValue = document.getElementById('filter-speech').value;
            const labelValue = document.getElementById('filter-label').value;
            if (speechValue || labelValue) {
                filterEntries();
            } else {
                // 显示所有
                showAllEntries();
            }
        }
    }
}

// 处理繁体按钮点击
function handleTraditionalClick() {
    const currentLang = window.i18n ? window.i18n.currentLang : 'zh';
    
    if (currentLang === 'zh' || currentLang === 'zh-tr') {
        // 切换到 zh-tr 语言
        window.location.href = '?lang=zh-tr';
    } else if (currentLang === 'teo' || currentLang === 'teo-tr') {
        // 切换到 teo-tr 语言
        window.location.href = '?lang=teo-tr';
    } else {
        // 其他语言下，切换到 teochew-tr 属性
        currentTeochewProp = 'teochew-tr';
        // 重新执行当前的搜索或显示操作
        const searchInput = document.getElementById('search-input').value.trim();
        if (searchInput) {
            searchVocabulary();
        } else {
            // 检查是否有筛选条件
            const speechValue = document.getElementById('filter-speech').value;
            const labelValue = document.getElementById('filter-label').value;
            if (speechValue || labelValue) {
                filterEntries();
            } else {
                // 显示所有
                showAllEntries();
            }
        }
    }
}

// 页面加载时加载数据和绑定事件
if (document.getElementById('vocab-count')) {
    // 暴露 generateFilterOptions 到全局作用域
    window.generateFilterOptions = generateFilterOptions;
    
    loadData().then(() => {
        // 数据加载完成后生成筛选选项
        generateFilterOptions();
    });
    
    // 绑定所有事件
    document.addEventListener('DOMContentLoaded', function() {
        // 绑定搜索按钮点击事件
        const searchBtn = document.getElementById('search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', searchVocabulary);
        }
        
        // 绑定随机按钮点击事件
        const randomBtn = document.getElementById('random-btn');
        if (randomBtn) {
            randomBtn.addEventListener('click', showRandomEntry);
        }
        
        // 绑定显示所有按钮点击事件
        const showAllBtn = document.getElementById('show-all-btn');
        if (showAllBtn) {
            showAllBtn.addEventListener('click', showAllEntries);
        }
        
        // 绑定筛选按钮点击事件
        const filterBtn = document.getElementById('filter-btn');
        if (filterBtn) {
            filterBtn.addEventListener('click', filterEntries);
        }
        
        // 绑定简体按钮点击事件
        const simplifiedBtn = document.getElementById('simplified-btn');
        if (simplifiedBtn) {
            simplifiedBtn.addEventListener('click', handleSimplifiedClick);
        }
        
        // 绑定繁体按钮点击事件
        const traditionalBtn = document.getElementById('traditional-btn');
        if (traditionalBtn) {
            traditionalBtn.addEventListener('click', handleTraditionalClick);
        }
        
        // 绑定搜索输入框回车事件
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    searchVocabulary();
                }
            });
        }
    });
}
