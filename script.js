// 搜索功能实现
let vocabularyData = [];

// 加载数据
async function loadData() {
    try {
        const response = await fetch('data.json');
        vocabularyData = await response.json();
        
        // 统计词汇和词组数量
        const vocabCount = vocabularyData.length;
        let phraseCount = 0;
        
        // 遍历所有条目，查找label为"词组"的example
        for (const item of vocabularyData) {
            if (item.example) {
                for (const ex of item.example) {
                    if (ex.label === '词组') {
                        phraseCount++;
                    }
                }
            }
        }
        
        // 更新词汇和词组数量
        document.getElementById('vocab-count1').textContent = `${vocabCount}`;
        document.getElementById('vocab-count2').textContent = `${phraseCount}`;
    } catch (error) {
        console.error('加载数据失败:', error);
        document.getElementById('vocab-count1').textContent = '加载失败';
        document.getElementById('vocab-count2').textContent = '加载失败';
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
    
    const results = vocabularyData.filter(item => {
        let match = false;
        
        // 搜索词汇 (word)
        if (searchWord && item.word.toLowerCase().includes(searchInput)) {
            match = true;
        }
        
        // 搜索汉字 (hanzi)
        if (searchHanzi && item.hanzi.some(h => h.toLowerCase().includes(searchInput))) {
            match = true;
        }
        
        // 搜索定义 (definition、romazi 和 translations)
        if (searchDefinition) {
            if (item.definition.toLowerCase().includes(searchInput)) {
                match = true;
            }
            if (item.romazi.toLowerCase().includes(searchInput)) {
                match = true;
            }
            if (item.translations.putonghua.toLowerCase().includes(searchInput)) {
                match = true;
            }
            if (item.translations.English.toLowerCase().includes(searchInput)) {
                match = true;
            }
        }
        
        // 搜索用法 (example 里的 teochew、romazi 和 translations)
        if (searchUsage) {
            item.example.forEach(ex => {
                if (ex.teochew.toLowerCase().includes(searchInput)) {
                    match = true;
                }
                if (ex.romazi.toLowerCase().includes(searchInput)) {
                    match = true;
                }
                if (ex.translations.putonghua.toLowerCase().includes(searchInput)) {
                    match = true;
                }
                if (ex.translations.English.toLowerCase().includes(searchInput)) {
                    match = true;
                }
            });
        }
        
        return match;
    });
    
    // 显示搜索结果
    displayResults(results);
}

// 显示搜索结果
function displayResults(results) {
    const resultsContainer = document.getElementById('search-results');
    
    if (results.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">没有找到匹配的结果</div>';
        return;
    }
    
    results.forEach(item => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        
        // 处理例句
        let examplesHtml = '';
        if (item.example && item.example.length > 0) {
            examplesHtml = item.example.map(ex => {
                // 处理例句翻译
                let exampleTranslationsHtml = '';
                const translations = ex.translations;
                if (translations.putonghua) {
                    exampleTranslationsHtml += `<div class="translation-item"><span class="translation-label">普通话：</span><span class="translation-text">${translations.putonghua}</span></div>`;
                }
                if (translations.English) {
                    exampleTranslationsHtml += `<div class="translation-item"><span class="translation-label">English：</span><span class="translation-text">${translations.English}</span></div>`;
                }
                if (translations.francais) {
                    exampleTranslationsHtml += `<div class="translation-item"><span class="translation-label">français：</span><span class="translation-text">${translations.francais}</span></div>`;
                }
                if (translations.thai) {
                    exampleTranslationsHtml += `<div class="translation-item"><span class="translation-label">ไทย：</span><span class="translation-text">${translations.thai}</span></div>`;
                }
                if (translations.tiengviet) {
                    exampleTranslationsHtml += `<div class="translation-item"><span class="translation-label">Tiếng Việt：</span><span class="translation-text">${translations.tiengviet}</span></div>`;
                }
                if (translations.melayu) {
                    exampleTranslationsHtml += `<div class="translation-item"><span class="translation-label">Bahasa Melayu：</span><span class="translation-text">${translations.melayu}</span></div>`;
                }
                if (translations.indonesia) {
                    exampleTranslationsHtml += `<div class="translation-item"><span class="translation-label">Bahasa Indonesia：</span><span class="translation-text">${translations.indonesia}</span></div>`;
                }
                
                // 只有当有翻译时才显示例句
                if (exampleTranslationsHtml) {
                    return `
                        <div class="result-example">
                            ${ex.label ? `<div class="example-label">${ex.label}</div>` : ''}
                            ${ex.teochew ? `<div class="example-teochew">${ex.teochew}</div>` : ''}
                            ${ex.romazi ? `<div class="example-romazi">${ex.romazi}</div>` : ''}
                            <div class="example-translations">
                                ${exampleTranslationsHtml}
                            </div>
                        </div>
                    `;
                }
                return '';
            }).join('');
        }
        
        // 处理注释
        let noteHtml = '';
        if (item.note) {
            noteHtml = `<div class="result-note">注：${item.note}</div>`;
        }
        
        // 处理翻译
        let translationsHtml = '';
        const translations = item.translations;
        if (translations.putonghua) {
            translationsHtml += `<div class="translation-item"><span class="translation-label">普通话：</span><span class="translation-text">${translations.putonghua}</span></div>`;
        }
        if (translations.English) {
            translationsHtml += `<div class="translation-item"><span class="translation-label">English：</span><span class="translation-text">${translations.English}</span></div>`;
        }
        if (translations.francais) {
            translationsHtml += `<div class="translation-item"><span class="translation-label">français：</span><span class="translation-text">${translations.francais}</span></div>`;
        }
        if (translations.thai) {
            translationsHtml += `<div class="translation-item"><span class="translation-label">ไทย：</span><span class="translation-text">${translations.thai}</span></div>`;
        }
        if (translations.tiengviet) {
            translationsHtml += `<div class="translation-item"><span class="translation-label">Tiếng Việt：</span><span class="translation-text">${translations.tiengviet}</span></div>`;
        }
        if (translations.melayu) {
            translationsHtml += `<div class="translation-item"><span class="translation-label">Bahasa Melayu：</span><span class="translation-text">${translations.melayu}</span></div>`;
        }
        if (translations.indonesia) {
            translationsHtml += `<div class="translation-item"><span class="translation-label">Bahasa Indonesia：</span><span class="translation-text">${translations.indonesia}</span></div>`;
        }
        
        // 处理分类
        let categoryHtml = '';
        const categories = item.category.filter(c => c); // 过滤空分类
        if (categories.length > 0) {
            categoryHtml = `<span class="result-category">${categories.join('</span><span class="result-category">')}</span>`;
        }
        
        // 构建结果HTML，只显示非空元素，并将汉字放在word同一行
        resultItem.innerHTML = `
            <div class="result-header">
                <div class="result-word">${item.word}</div>
                ${item.hanzi.some(h => h) ? `<div class="result-hanzi">${item.hanzi.filter(h => h).join('、')}</div>` : ''}
                ${item.pronunciation ? `<div class="result-pronunciation">[${item.pronunciation}]</div>` : ''}
            </div>
            <div class="result-meta">
                ${item.speech ? `<span class="result-speech">${item.speech}</span>` : ''}
                ${categoryHtml}
            </div>
            ${item.definition ? `<div class="result-definition">${item.definition}</div>` : ''}
            ${item.romazi ? `<div class="result-romazi">${item.romazi}</div>` : ''}
            ${translationsHtml ? `<div class="result-translations">${translationsHtml}</div>` : ''}
            ${examplesHtml}
            ${noteHtml}
        `;
        
        resultsContainer.appendChild(resultItem);
    });
}

// 绑定搜索按钮点击事件
const searchBtn = document.getElementById('search-btn');
if (searchBtn) {
    searchBtn.addEventListener('click', searchVocabulary);
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

// 页面加载时加载数据
loadData();
