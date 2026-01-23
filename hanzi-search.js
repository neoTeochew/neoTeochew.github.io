// 搜索功能实现
let hanziData = [];

// 加载数据
async function loadData() {
    try {
        const response = await fetch('hanzi.json');
        hanziData = await response.json();
        
        // 更新汉字数量
        document.getElementById('vocab-count').textContent = hanziData.length;
    } catch (error) {
        console.error('加载数据失败:', error);
        document.getElementById('vocab-count').textContent = '加载失败';
    }
}

// 搜索函数
function searchHanzi() {
    const searchInput = document.getElementById('search-input').value.trim().toLowerCase();
    const searchHanzi = document.getElementById('search-hanzi').checked;
    const searchPronunciation = document.getElementById('search-pronunciation').checked;
    const searchRadical = document.getElementById('search-radical').checked;
    const searchDefinition = document.getElementById('search-definition').checked;
    
    const resultsContainer = document.getElementById('search-results');
    resultsContainer.innerHTML = '';
    
    if (!searchInput) {
        return;
    }
    
    const results = hanziData.filter(item => {
        let match = false;
        
        // 搜索汉字
        if (searchHanzi) {
            if (item.hanzi.some(h => h.toLowerCase().includes(searchInput))) {
                match = true;
            }
        }
        
        // 搜索读音
        if (searchPronunciation) {
            const pronunciationValues = [
                ...item.pronunciation.wendu,
                ...item.pronunciation.baidu,
                ...item.pronunciation.mistaken,
                ...item.pronunciation.xundu
            ];
            // 添加guangyun，如果它存在且不为空
            if (item.pronunciation.guangyun) {
                pronunciationValues.push(item.pronunciation.guangyun);
            }
            // 过滤掉空值，然后检查是否有匹配
            if (pronunciationValues.filter(p => p).some(p => p.toLowerCase().includes(searchInput))) {
                match = true;
            }
        }
        
        // 搜索部首
        if (searchRadical && item.radical.toLowerCase().includes(searchInput)) {
            match = true;
        }
        
        // 搜索定义
        if (searchDefinition && item.definition.toLowerCase().includes(searchInput)) {
            match = true;
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
        
        // 构建主要发音HTML - 一行一个
        let mainPronunciationHtml = '';
        if (item.pronunciation.wendu.length > 0 && item.pronunciation.wendu[0]) {
            mainPronunciationHtml += `<div class="main-pronunciation-item">文读: ${item.pronunciation.wendu.join(', ')}</div>`;
        }
        if (item.pronunciation.xundu.length > 0 && item.pronunciation.xundu[0]) {
            mainPronunciationHtml += `<div class="main-pronunciation-item">训读: ${item.pronunciation.xundu.join(', ')}</div>`;
        }
        if (item.pronunciation.baidu.length > 0 && item.pronunciation.baidu[0]) {
            mainPronunciationHtml += `<div class="main-pronunciation-item">白读: ${item.pronunciation.baidu.join(', ')}</div>`;
        }
        if (item.pronunciation.mistaken.length > 0 && item.pronunciation.mistaken[0]) {
            mainPronunciationHtml += `<div class="main-pronunciation-item">讹音: ${item.pronunciation.mistaken.join(', ')}</div>`;
        }
        if (item.pronunciation.guangyun) {
            mainPronunciationHtml += `<div class="main-pronunciation-item">广韵: ${item.pronunciation.guangyun}</div>`;
        }
        
        // 构建次要发音HTML - 卡片式布局
        let secondaryPronunciationHtml = '';
        if (item.putonghua) {
            const parts = [];
            if (item.putonghua.pinyin) parts.push(`<div>拼音: ${item.putonghua.pinyin}</div>`);
            if (item.putonghua.bopomofo) parts.push(`<div>注音: ${item.putonghua.bopomofo}</div>`);
            if (item.putonghua.gwoyeuromatzyh) parts.push(`<div>国语罗马字: ${item.putonghua.gwoyeuromatzyh}</div>`);
            if (item.putonghua.general) parts.push(`<div>通字方案: ${item.putonghua.general}</div>`);
            
            if (parts.length > 0) {
                secondaryPronunciationHtml = `<div class="secondary-pronunciation">${parts.join('')}</div>`;
            }
        }
        
        // 构建定义和翻译HTML
        let definitionsHtml = '';
        if (item.definition || item.romazi || 
            item.translations.putonghua || item.translations.English || 
            item.translations.francais || item.translations.thai || 
            item.translations.tiengviet || item.translations.melayu || 
            item.translations.indonesia) {
            
            definitionsHtml = '<div class="definitions-section">';
            
            // 显示定义
            if (item.definition) {
                definitionsHtml += `<div class="definition-item"><span class="definition-label">定义:</span> <span class="definition-text">${item.definition}</span></div>`;
            }
            
            // 显示罗马字
            if (item.romazi) {
                definitionsHtml += `<div class="definition-item"><span class="definition-label"></span> <span class="definition-text">${item.romazi}</span></div>`;
            }
            
            // 显示各语言翻译
            if (item.translations.putonghua) {
                definitionsHtml += `<div class="definition-item"><span class="definition-label">普通话:</span> <span class="definition-text">${item.translations.putonghua}</span></div>`;
            }
            if (item.translations.English) {
                definitionsHtml += `<div class="definition-item"><span class="definition-label">English:</span> <span class="definition-text">${item.translations.English}</span></div>`;
            }
            if (item.translations.francais) {
                definitionsHtml += `<div class="definition-item"><span class="definition-label">français:</span> <span class="definition-text">${item.translations.francais}</span></div>`;
            }
            if (item.translations.thai) {
                definitionsHtml += `<div class="definition-item"><span class="definition-label">ไทย:</span> <span class="definition-text">${item.translations.thai}</span></div>`;
            }
            if (item.translations.tiengviet) {
                definitionsHtml += `<div class="definition-item"><span class="definition-label">Tiếng Việt:</span> <span class="definition-text">${item.translations.tiengviet}</span></div>`;
            }
            if (item.translations.melayu) {
                definitionsHtml += `<div class="definition-item"><span class="definition-label">Bahasa Melayu:</span> <span class="definition-text">${item.translations.melayu}</span></div>`;
            }
            if (item.translations.indonesia) {
                definitionsHtml += `<div class="definition-item"><span class="definition-label">Bahasa Indonesia:</span> <span class="definition-text">${item.translations.indonesia}</span></div>`;
            }
            
            definitionsHtml += '</div>';
        }
        
        // 处理例句，参考index.html的处理方式
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
        
        // 构建完整的结果HTML
        resultItem.innerHTML = `
            <div class="result-header">
                <div class="result-word">${item.hanzi.join('/')}</div>
            </div>
            
            ${item.radical ? `<div class="result-meta"><span class="result-radical">${item.radical}</span></div>` : ''}
            
            ${mainPronunciationHtml ? `<div class="main-pronunciation-section">${mainPronunciationHtml}</div>` : ''}
            
            ${secondaryPronunciationHtml}
            
            ${definitionsHtml}
            
            ${examplesHtml}
        `;
        
        resultsContainer.appendChild(resultItem);
    });
}

// 绑定搜索按钮点击事件
const searchBtn = document.getElementById('search-btn');
if (searchBtn) {
    searchBtn.addEventListener('click', searchHanzi);
}

// 绑定搜索输入框回车事件
const searchInput = document.getElementById('search-input');
if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchHanzi();
        }
    });
}

// 页面加载时加载数据
loadData();
