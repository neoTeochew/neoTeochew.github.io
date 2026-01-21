// Back to top button functionality
const backToTopButton = document.getElementById('backToTop');

// Listen for scroll event
window.addEventListener('scroll', () => {
    // Show button when page scrolls more than 300px
    if (window.pageYOffset > 300) {
        backToTopButton.classList.add('visible');
    } else {
        backToTopButton.classList.remove('visible');
    }
});

// Smooth scroll to top when button is clicked
backToTopButton.addEventListener('click', (e) => {
    e.preventDefault();
    
    // Use browser's native smooth scrolling
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Table of contents smooth scrolling
document.querySelectorAll('.toc-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        const targetId = link.getAttribute('href');
        const targetElement = document.querySelector(targetId);
        
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 100,
                behavior: 'smooth'
            });
        }
    });
});

// Language switching functionality
const langLinks = document.querySelectorAll('.lang-link');

langLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove active class from all links
        langLinks.forEach(l => l.classList.remove('active'));
        
        // Add active class to current link
        link.classList.add('active');
        
        // Here you can add actual language switching logic
        const lang = link.textContent;
        console.log(`Switching to ${lang}`);
    });
});

// Search functionality implementation
let vocabularyData = [];

// Load data
async function loadData() {
    try {
        const response = await fetch('data.json');
        vocabularyData = await response.json();
        
        // Update vocabulary count
        document.getElementById('vocab-count').textContent = vocabularyData.length;
    } catch (error) {
        console.error('Failed to load data:', error);
        document.getElementById('vocab-count').textContent = 'Failed to load';
    }
}

// Search function
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
        
        // Search word
        if (searchWord && item.word.toLowerCase().includes(searchInput)) {
            match = true;
        }
        
        // Search hanzi
        if (searchHanzi && item.hanzi.some(h => h.toLowerCase().includes(searchInput))) {
            match = true;
        }
        
        // Search definition, romazi and translations
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
        
        // Search usage examples
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
    
    // Display search results
    displayResults(results);
}

// Display search results
function displayResults(results) {
    const resultsContainer = document.getElementById('search-results');
    
    if (results.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">No matching results found</div>';
        return;
    }
    
    results.forEach(item => {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        
        // Process examples
        let examplesHtml = '';
        if (item.example && item.example.length > 0) {
            examplesHtml = item.example.map(ex => {
                // Process example translations
                let exampleTranslationsHtml = '';
                const translations = ex.translations;
                if (translations.English) {
                    exampleTranslationsHtml += `<div class="translation-item"><span class="translation-label">English：</span><span class="translation-text">${translations.English}</span></div>`;
                }
                if (translations.putonghua) {
                    exampleTranslationsHtml += `<div class="translation-item"><span class="translation-label">Mandarin：</span><span class="translation-text">${translations.putonghua}</span></div>`;
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
                
                // Only show example if there are translations
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
        
        // Process notes
        let noteHtml = '';
        if (item.note) {
            noteHtml = `<div class="result-note">Note: ${item.note}</div>`;
        }
        
        // Process translations
        let translationsHtml = '';
        const translations = item.translations;
        if (translations.English) {
            translationsHtml += `<div class="translation-item"><span class="translation-label">English：</span><span class="translation-text">${translations.English}</span></div>`;
        }
        if (translations.putonghua) {
            translationsHtml += `<div class="translation-item"><span class="translation-label">Mandarin：</span><span class="translation-text">${translations.putonghua}</span></div>`;
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
        
        // Process categories
        let categoryHtml = '';
        const categories = item.category.filter(c => c); // Filter empty categories
        if (categories.length > 0) {
            categoryHtml = `<span class="result-category">${categories.join('、')}</span>`;
        }
        
        // Build result HTML, only show non-empty elements, and place hanzi on same line as word
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

// Bind search button click event
const searchBtn = document.getElementById('search-btn');
if (searchBtn) {
    searchBtn.addEventListener('click', searchVocabulary);
}

// Bind search input enter key event
const searchInput = document.getElementById('search-input');
if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchVocabulary();
        }
    });
}

// Responsive navigation menu interaction
const navToggle = document.querySelector('.nav-toggle');
const navList = document.querySelector('.nav-list');
const dropdownToggles = document.querySelectorAll('.dropdown-toggle');

// Click navigation button to expand/collapse menu
navToggle.addEventListener('click', (e) => {
    e.preventDefault();
    navList.classList.toggle('active');
});

// Click dropdown toggle to expand/collapse submenu
dropdownToggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
        e.preventDefault();
        const dropdown = toggle.closest('.dropdown');
        dropdown.classList.toggle('active');
    });
});

// Load data when page loads
loadData();
