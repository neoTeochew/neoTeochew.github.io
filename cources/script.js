// 折叠功能实现
document.addEventListener('DOMContentLoaded', function() {
    const collapsibleHeaders = document.querySelectorAll('.collapsible-header');
    
    collapsibleHeaders.forEach(header => {
        header.addEventListener('click', function() {
            const content = this.nextElementSibling;
            const icon = this.querySelector('.collapse-icon');
            
            // 检查当前是否折叠
            const isCollapsed = content.style.maxHeight === '0px' || getComputedStyle(content).maxHeight === '0px';
            
            if (isCollapsed) {
                // 展开
                content.style.maxHeight = content.scrollHeight + 'px';
                icon.style.transform = 'rotate(0deg)';
            } else {
                // 折叠
                content.style.maxHeight = '0px';
                icon.style.transform = 'rotate(-90deg)';
            }
        });
    });
});
