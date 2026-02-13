        // 简单的交互功能
        document.addEventListener('DOMContentLoaded', function() {
            // 菜单按钮点击事件
            const menuToggle = document.getElementById('menuToggle');
            const menuToggleRight = document.getElementById('menuToggleRight');
            const sidebarLeft = document.querySelector('.sidebar-left');
            const sidebarRight = document.querySelector('.sidebar-right');
            
            if (menuToggle) {
                menuToggle.addEventListener('click', function() {
                    sidebarLeft.classList.toggle('active');
                    // 点击左侧菜单时，关闭右侧菜单
                    if (sidebarRight.classList.contains('active')) {
                        sidebarRight.classList.remove('active');
                    }
                });
            }
            
            if (menuToggleRight) {
                menuToggleRight.addEventListener('click', function() {
                    sidebarRight.classList.toggle('active');
                    // 点击右侧菜单时，关闭左侧菜单
                    if (sidebarLeft.classList.contains('active')) {
                        sidebarLeft.classList.remove('active');
                    }
                });
            }
            
            // 点击内容区域关闭菜单
            const mainContent = document.querySelector('.main-content');
            if (mainContent) {
                mainContent.addEventListener('click', function() {
                    if (sidebarLeft.classList.contains('active')) {
                        sidebarLeft.classList.remove('active');
                    }
                    if (sidebarRight.classList.contains('active')) {
                        sidebarRight.classList.remove('active');
                    }
                });
            }
            // 导航项点击效果
            const navItems = document.querySelectorAll('.nav-item');
            navItems.forEach(item => {
                item.addEventListener('click', function() {
                    // 移除所有导航项的active类
                    navItems.forEach(i => i.classList.remove('active'));
                    // 为当前点击的导航项添加active类
                    this.classList.add('active');
                    
                    // 获取目标部分的ID
                    const targetId = this.getAttribute('data-target');
                    if (targetId) {
                        const targetElement = document.getElementById(targetId);
                        if (targetElement) {
                            // 滚动到目标部分
                            targetElement.scrollIntoView({
                                behavior: 'smooth',
                                block: 'start'
                            });
                            
                            // 在移动设备上，点击导航项后关闭侧边栏
                            if (window.innerWidth <= 992) {
                                const sidebarLeft = document.querySelector('.sidebar-left');
                                sidebarLeft.classList.remove('active');
                            }
                        }
                    }
                });
            });
        });