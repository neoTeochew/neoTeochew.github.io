// i18n library for multi-language support
const i18n = {
    currentLang: 'zh',
    translations: {},
    
    // Load translations from JSON files
    async loadTranslations(lang) {
        try {
            const response = await fetch(`i18n/${lang}.json`);
            if (!response.ok) {
                throw new Error(`Failed to load translations for ${lang}`);
            }
            this.translations[lang] = await response.json();
            return this.translations[lang];
        } catch (error) {
            console.error('Error loading translations:', error);
            return {};
        }
    },
    
    // Set the current language
    async setLanguage(lang) {
        this.currentLang = lang;
        if (!this.translations[lang]) {
            await this.loadTranslations(lang);
        }
        this.updateContent();
    },
    
    // Get translated text
    t(key, defaultValue = '') {
        const lang = this.currentLang;
        if (this.translations[lang] && this.translations[lang][key]) {
            return this.translations[lang][key];
        }
        return defaultValue;
    },
    
    // Update all translatable elements
    updateContent() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            const text = this.t(key, element.textContent);
            if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                element.placeholder = text;
            } else {
                element.textContent = text;
            }
        });
    }
};

// Initialize i18n
document.addEventListener('DOMContentLoaded', async function() {
    // Detect language from URL or use default
    const lang = new URLSearchParams(window.location.search).get('lang') || 'zh';
    await i18n.setLanguage(lang);
    
    // Set active language link
    document.querySelectorAll('.lang-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `?lang=${lang}`) {
            link.classList.add('active');
        }
    });
    
    // Add click event listeners to language links
    document.querySelectorAll('.lang-link').forEach(link => {
        link.addEventListener('click', async function(e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            let lang = 'zh';
            
            if (href.startsWith('?lang=')) {
                lang = href.substring(6);
            } else if (href.includes('-')) {
                // Handle existing language files like index-en.html
                const parts = href.split('-');
                if (parts.length > 1) {
                    lang = parts[1].replace('.html', '');
                }
            }
            
            // Update URL without page reload
            const url = new URL(window.location.href);
            url.search = `?lang=${lang}`;
            window.history.pushState({}, '', url);
            
            await i18n.setLanguage(lang);
            
            // Update active class
            document.querySelectorAll('.lang-link').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // 重新生成筛选选项以适应新语言
            if (window.generateFilterOptions) {
                window.generateFilterOptions();
            }
        });
    });
});

// Export i18n for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = i18n;
} else {
    window.i18n = i18n;
}