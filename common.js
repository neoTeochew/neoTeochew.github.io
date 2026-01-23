// 返回顶部按钮功能实现
const backToTopButton = document.getElementById('backToTop');

// 监听页面滚动事件
window.addEventListener('scroll', () => {
    // 当页面滚动超过300px时显示按钮
    if (window.pageYOffset > 300) {
        backToTopButton.classList.add('visible');
    } else {
        backToTopButton.classList.remove('visible');
    }
});

// 点击按钮时平滑滚动到顶部
backToTopButton.addEventListener('click', (e) => {
    e.preventDefault();
    
    // 使用浏览器原生的平滑滚动功能
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// 目录链接点击平滑滚动
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

// 响应式导航菜单交互
const navToggle = document.querySelector('.nav-toggle');
const navList = document.querySelector('.nav-list');
const dropdownToggles = document.querySelectorAll('.dropdown-toggle');

// 点击导航按钮展开/收起导航菜单
if (navToggle) {
    navToggle.addEventListener('click', (e) => {
        e.preventDefault();
        navList.classList.toggle('active');
    });
}

// 点击下拉菜单切换按钮展开/收起子菜单
dropdownToggles.forEach(toggle => {
    toggle.addEventListener('click', (e) => {
        e.preventDefault();
        const dropdown = toggle.closest('.dropdown');
        dropdown.classList.toggle('active');
    });
});
