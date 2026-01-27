// 生物分类页面交互功能

// 分类展开/折叠功能 - 使用事件委托
function initTaxonomyToggle() {
    // 为所有分类内容初始状态展开
    document.querySelectorAll('.taxonomy-content').forEach(content => {
        content.classList.remove('collapsed');
    });
    
    document.querySelectorAll('.taxonomy-toggle').forEach(toggle => {
        toggle.classList.remove('collapsed');
    });
    
    // 使用事件委托处理点击事件
    document.querySelector('.content').addEventListener('click', (e) => {
        if (e.target.classList.contains('taxonomy-toggle')) {
            e.stopPropagation(); // 阻止事件冒泡
            
            // 获取下一个兄弟元素，应该是.taxonomy-content
            let content = e.target.nextElementSibling;
            while (content && !content.classList.contains('taxonomy-content')) {
                content = content.nextElementSibling;
            }
            
            if (content) {
                // 切换状态
                content.classList.toggle('collapsed');
                e.target.classList.toggle('collapsed');
            }
        }
    });
}

// 生物分类树交互（展开/折叠）- 使用事件委托
function initTaxonomyTree() {
    // 为分类树添加事件委托
    const taxonomyTree = document.querySelector('.taxonomy-tree');
    if (taxonomyTree) {
        // 初始状态展开所有子元素
        taxonomyTree.querySelectorAll('ul').forEach(ul => {
            ul.style.display = 'block';
        });
        
        // 使用事件委托处理点击事件
        taxonomyTree.addEventListener('click', (e) => {
            if (e.target.tagName === 'LI') {
                e.stopPropagation(); // 阻止事件冒泡
                
                // 检查是否有子元素
                const hasChildren = e.target.querySelector('ul');
                if (hasChildren) {
                    // 切换子元素的显示/隐藏
                    hasChildren.style.display = hasChildren.style.display === 'none' ? 'block' : 'none';
                }
            }
        });
    }
}

// 为元素添加淡入动画
function addFadeInAnimation(elements, delay = 100) {
    elements.forEach((element, index) => {
        // 初始状态
        element.style.opacity = '0';
        element.style.transform = 'translateY(20px)';
        element.style.transition = 'all 0.5s ease';
        
        // 延迟动画
        setTimeout(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        }, delay + index * 100);
    });
}

// 页面加载时的动画效果和初始化
window.addEventListener('load', () => {
    // 初始化分类展开/折叠功能
    initTaxonomyToggle();
    
    // 初始化分类树交互
    initTaxonomyTree();
    
    // 为分类卡片添加淡入效果
    const categories = document.querySelectorAll('.taxonomy-category');
    addFadeInAnimation(categories, 100);
    
    // 为分类树添加淡入效果
    const tree = document.querySelector('.taxonomy-tree');
    if (tree) {
        addFadeInAnimation([tree], 100 + categories.length * 100);
    }
});
