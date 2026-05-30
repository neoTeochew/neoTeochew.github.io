const langNames = {
    'teochew': '潮汕话',
    'putonghua': '普通话',
    'English': 'English',
    'francais': 'français',
    'phasaThai': 'ภาษาไทย',
    'bahasaMelayu': 'Bahasa Melayu',
    'bahasaIndonesia': 'Bahasa Indonesia',
    'tiengViet': 'Tiếng Việt',
    'pheasaKhmer': 'ភាសាខ្មែរ',
    'phasaLao': 'ພາສາລາວ'
};

let dictionaryData = [];
let currentLang = 'teochew';
let allSpeech = [];
let allTags = [];
let allShengmu = [];
let allYunmu = [];
let allTones = [];

function getCurrentLangFromPath() {
    const path = window.location.pathname;
    const parts = path.split('/');
    for (let i = parts.length - 2; i >= 0; i--) {
        if (langNames[parts[i]]) {
            return parts[i];
        }
    }
    return 'teochew';
}

async function loadData() {
    try {
        const response = await fetch('../data.json');//这是网页方获取统计和结果数据
        dictionaryData = await response.json();
        extractFilterOptions();
        populateFilterOptions();
        document.getElementById('totalCount').textContent = dictionaryData.length;
        showInitialState();
    } catch (error) {
        console.error('加载数据失败:', error);
    }
}

function extractFilterOptions() {
    const speeches = new Set();
    const tags = new Set();
    const shengmus = new Set();
    const yunmus = new Set();
    const tones = new Set();

    dictionaryData.forEach(item => {
        if (item.speech) speeches.add(item.speech);
        if (item.label) {
            item.label.forEach(t => tags.add(t));
        }
        if (item.shengmu) shengmus.add(item.shengmu);
        if (item.yunmu) yunmus.add(item.yunmu);
        if (item.tone) tones.add(item.tone);
    });

    allSpeech = Array.from(speeches).sort();
    allTags = Array.from(tags).sort();
    allShengmu = Array.from(shengmus).sort();
    allYunmu = Array.from(yunmus).sort();
    allTones = Array.from(tones).sort();
}

function populateFilterOptions() {
    const speechSelect = document.getElementById('speechFilter');
    allSpeech.forEach(speech => {
        const option = document.createElement('option');
        option.value = speech;
        option.textContent = speech;
        speechSelect.appendChild(option);
    });

    const tagSelect = document.getElementById('tagFilter');
    allTags.forEach(tag => {
        const option = document.createElement('option');
        option.value = tag;
        option.textContent = tag;
        tagSelect.appendChild(option);
    });

    const shengmuSelect = document.getElementById('shengmuFilter');
    allShengmu.forEach(sm => {
        const option = document.createElement('option');
        option.value = sm;
        option.textContent = sm;
        shengmuSelect.appendChild(option);
    });

    const yunmuSelect = document.getElementById('yunmuFilter');
    allYunmu.forEach(ym => {
        const option = document.createElement('option');
        option.value = ym;
        option.textContent = ym;
        yunmuSelect.appendChild(option);
    });

    const toneSelect = document.getElementById('toneFilter');
    allTones.forEach(t => {
        const option = document.createElement('option');
        option.value = t;
        option.textContent = t;
        toneSelect.appendChild(option);
    });
}

function setLanguage(lang) {
    const currentPath = window.location.pathname;
    const parts = currentPath.split('/');
    const fileName = parts.pop();
    const basePath = parts.slice(0, -1).join('/');
    window.location.href = basePath + '/' + lang + '/' + fileName;
}

function search() {
    const keyword = document.querySelector('.search-input').value.trim().toLowerCase();

    const searchItem = document.getElementById('searchItem').checked;
    const searchHanzi = document.getElementById('searchHanzi').checked;
    const searchDefinition = document.getElementById('searchDefinition').checked;
    const searchExample = document.getElementById('searchExample').checked;

    const speechFilter = document.getElementById('speechFilter').value;
    const tagFilter = document.getElementById('tagFilter').value;
    const shengmuFilter = document.getElementById('shengmuFilter').value;
    const yunmuFilter = document.getElementById('yunmuFilter').value;
    const toneFilter = document.getElementById('toneFilter').value;

    let results = dictionaryData.filter(item => {
        if (shengmuFilter && item.shengmu !== shengmuFilter) return false;
        if (yunmuFilter && item.yunmu !== yunmuFilter) return false;
        if (toneFilter && item.tone !== toneFilter) return false;

        if (speechFilter && item.speech !== speechFilter) return false;

        if (tagFilter) {
            if (!item.label || !item.label.includes(tagFilter)) return false;
        }

        if (!keyword) return true;

        if (searchItem && item.item.toLowerCase().includes(keyword)) return true;

        if (searchHanzi && item.hanzi && item.hanzi.some(h => h.toLowerCase().includes(keyword))) return true;

        if (searchDefinition) {
            const defs = item.definitions;
            if (defs) {
                if ((defs[currentLang] && defs[currentLang].toLowerCase().includes(keyword)) ||
                    (defs.romazi && defs.romazi.toLowerCase().includes(keyword)) ||
                    (defs.teochew && defs.teochew.toLowerCase().includes(keyword))) {
                    return true;
                }
            }
        }

        if (searchExample && item.examples && item.examples.length > 0) {
            for (const ex of item.examples) {
                if ((ex[currentLang] && ex[currentLang].toLowerCase().includes(keyword)) ||
                    (ex.romazi && ex.romazi.toLowerCase().includes(keyword)) ||
                    (ex.teochew && ex.teochew.toLowerCase().includes(keyword))) {
                    return true;
                }
            }
        }

        return false;
    });

    showResults(results);
}

function showResults(results) {
    const resultsContainer = document.getElementById('searchResults');

    if (results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="no-results">
                <p>没有找到匹配的结果</p>
                <p>请尝试使用其他关键词或调整筛选条件</p>
            </div>
        `;
        return;
    }

    const header = `
        <div class="results-header">
            <div class="results-count">找到 <span>${results.length}</span> 个结果</div>
        </div>
    `;

    const itemsHtml = results.map(item => {
        const labelsHtml = item.label && item.label.length > 0
            ? item.label.map(tag => `<span class="tag">${tag}</span>`).join('')
            : '<span class="tag" style="background: #e0e0e0; color: #9e9e9e;">暂无</span>';

        let definition = '';
        if (item.definitions) {
            definition = item.definitions[currentLang] || ' ';
        }

        return `
            <div class="result-item" onclick="showDetail('${item.id}')">
                <span class="item-word">${item.item}</span>
                <span class="item-pronunciation">${item.pronunciation || '暂无'}</span>
                <span class="item-hanzi">${(item.hanzi || []).join(' / ') || '暂无'}</span>
                <span class="item-speech">${item.speech || '暂无'}</span>
                <div class="item-labels">${labelsHtml}</div>
                <div class="item-definition"><strong>${langNames[currentLang] || currentLang}:</strong> ${definition}</div>
            </div>
        `;
    }).join('');

    resultsContainer.innerHTML = header + itemsHtml;
}

function showInitialState() {
    const resultsContainer = document.getElementById('searchResults');
    resultsContainer.innerHTML = `
        <div class="no-results">
            <p>请输入关键词进行搜索</p>
            <p>或点击"全部"查看所有条目</p>
        </div>
    `;
}

function showDetail(itemId) {
    const url = 'result.html?id=' + itemId;
    window.open(url, '_blank');
}

function showAll() {
    document.querySelector('.search-input').value = '';
    document.getElementById('searchItem').checked = true;
    document.getElementById('searchHanzi').checked = true;
    document.getElementById('searchDefinition').checked = false;
    document.getElementById('searchExample').checked = false;
    document.getElementById('speechFilter').value = '';
    document.getElementById('tagFilter').value = '';
    document.getElementById('shengmuFilter').value = '';
    document.getElementById('yunmuFilter').value = '';
    document.getElementById('toneFilter').value = '';
    search();
}

function showRandom() {
    const randomIndex = Math.floor(Math.random() * dictionaryData.length);
    const randomItem = dictionaryData[randomIndex];
    showDetail(randomItem.id);
}

document.addEventListener('DOMContentLoaded', async () => {
    currentLang = getCurrentLangFromPath();
    
    document.querySelectorAll('.lang-switch a').forEach(a => {
        a.classList.toggle('active', a.dataset.lang === currentLang);
    });

    await loadData();

    document.getElementById('searchBtn').addEventListener('click', search);
    document.getElementById('randomBtn').addEventListener('click', showRandom);
    document.getElementById('allBtn').addEventListener('click', showAll);

    document.querySelector('.search-input').addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            search();
        }
    });

    document.querySelectorAll('.lang-switch a').forEach(a => {
        a.addEventListener('click', (e) => {
            e.preventDefault();
            setLanguage(a.dataset.lang);
        });
    });

    document.querySelectorAll('.filter-select, .phonetic-filters select').forEach(select => {
        select.addEventListener('change', search);
    });
});

const resultLangNames = {
    putonghua: '普通话',
    putonghua_tr: '普通话(繁)',
    teochew: '潮汕话',
    teochew_tr: '潮汕话(繁)',
    romazi: '罗马字',
    English: 'English',
    francais: 'français',
    phasaThai: 'ภาษาไทย',
    bahasaMelayu: 'Bahasa Melayu',
    bahasaIndonesia: 'Bahasa Indonesia',
    tiengViet: 'Tiếng Việt',
    pheasaKhmer: 'ភាសាខ្មែរ',
    phasaLao: 'ພາສາລາວ'
};

let resultDictionaryData = [];

async function loadResultData() {
    try {
        const response = await fetch('../data.json');//这是网页方获取详细数据
        resultDictionaryData = await response.json();
    } catch (error) {
        console.error('加载数据失败:', error);
    }
}

async function loadItemDetail() {
    await loadResultData();
    
    const urlParams = new URLSearchParams(window.location.search);
    const itemId = urlParams.get('id');
    
    if (!itemId) {
        window.location.href = 'index.html';
        return;
    }

    const item = resultDictionaryData.find(i => i.id === itemId);
    
    if (!item) {
        alert('未找到对应的词条');
        window.location.href = 'index.html';
        return;
    }

    renderItemDetail(item);
}

function renderItemDetail(item) {
    const container = document.getElementById('resultContainer');

    const tagsHtml = item.label && item.label.length > 0 ? 
        item.label.map(tag => `<span class="tag">${tag}</span>`).join('') : 
        '<span style="color: #9e9e9e;"></span>';

    const translations = [
        { key: 'putonghua', value: item.definitions?.putonghua },
        { key: 'English', value: item.definitions?.English },
        { key: 'francais', value: item.definitions?.francais },
        { key: 'phasaThai', value: item.definitions?.phasaThai },
        { key: 'tiengViet', value: item.definitions?.tiengViet },
        { key: 'bahasaMelayu', value: item.definitions?.bahasaMelayu },
        { key: 'bahasaIndonesia', value: item.definitions?.bahasaIndonesia },
        { key: 'pheasaKhmer', value: item.definitions?.pheasaKhmer },
        { key: 'phasaLao', value: item.definitions?.phasaLao }
    ];

    const translationRows = [];
    for (let i = 0; i < translations.length; i += 2) {
        const row = `
            <tr>
                <td>${renderTranslationItem(translations[i])}</td>
                <td>${translations[i + 1] ? renderTranslationItem(translations[i + 1]) : ''}</td>
            </tr>
        `;
        translationRows.push(row);
    }

    const examples = item.examples?.filter(e => e.putonghua || e.English || e.teochew) || [];
    const examplesHtml = examples.length > 0 ? examples.map((ex, index) => `
        <div class="example-item">
            <span class="number">${index + 1}</span>
            <span class="chinese">${ex.teochew || ''}</span>
            ${ex.English ? `<span class="english">${ex.English}</span>` : ''}
        </div>
    `).join('') : '<p style="text-align: center; color: #9e9e9e; padding: 20px;">暂无例句</p>';

    const relatedPhrases = (item.phrases?.map(phraseId => 
        resultDictionaryData.find(d => d.id === phraseId)
    ).filter(Boolean)) || [];
    
    const phrasesHtml = relatedPhrases.length > 0 ? relatedPhrases.map(phrase => `
        <a href="result.html?id=${phrase.id}" class="phrase-item">
            <span class="phrase-dialect">${phrase.item}</span>
            <span class="phrase-hanzi">${phrase.hanzi?.[0] || ''}</span>
            <span class="phrase-meaning">${phrase.definitions?.teochew || phrase.definitions?.putonghua || ''}</span>
        </a>
    `).join('') : '<p style="text-align: center; color: #9e9e9e; padding: 20px;">暂无关联词组</p>';

    container.innerHTML = `
        <div class="top-section">
            <div class="content-left">
                <div class="word-title">
                    ${item.item} <span class="phonetic">[${item.pronunciation || ''}]</span>
                </div>

                <table class="data-table">
                    <tr>
                        <td class="label">汉字</td>
                        <td class="value">${(item.hanzi || []).join('、')}</td>
                    </tr>
                    <tr>
                        <td class="label">词性</td>
                        <td class="value">${item.speech || ''}</td>
                    </tr>
                    <tr>
                        <td class="label">标签</td>
                        <td class="value">
                            <div class="tags">${tagsHtml}</div>
                        </td>
                    </tr>
                    <tr>
                        <td class="label">定义</td>
                        <td class="value">${item.definitions?.teochew || ''}</td>
                    </tr>
                    <tr>
                        <td class="label">TYĀ-NGǏ</td>
                        <td class="value">${item.definitions?.romazi || ''}</td>
                    </tr>
                </table>
            </div>

            ${item.img ? `
            <div class="image-box">
                <img src="${item.img}" alt="${item.item}" class="main-image">
                <div class="image-caption">${item.item}</div>
            </div>
            ` : ''}
        </div>

        <div class="section-title">翻译</div>
        <table class="translation-table">
            ${translationRows.join('')}
        </table>

        <div class="related-phrases">
            <div class="section-title">词组</div>
            ${phrasesHtml}
        </div>

        <div class="examples">
            <div class="section-title">例句</div>
            ${examplesHtml}
        </div>

        ${item.note ? `
        <div class="notes">
            <div class="title">备注:</div>
            <div class="content">${item.note}</div>
        </div>
        ` : ''}
    `;
}

function renderTranslationItem(translation) {
    return `
        <div class="translation-item">
            <span class="lang-name">${resultLangNames[translation.key] || translation.key}</span>
            <span class="lang-value">${translation.value || ''}</span>
        </div>
    `;
}

document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('resultContainer')) {
        loadItemDetail();
    }
});