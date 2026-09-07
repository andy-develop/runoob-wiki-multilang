/* 语言切换器 - 右上角浮动按钮 */
(function() {
    if (window.__langSwitcherLoaded) return;
    window.__langSwitcherLoaded = true;

    // 检测当前语言版本
    var path = window.location.pathname;
    var currentLang = path.indexOf('/es/') >= 0 || path.endsWith('/es') || path.endsWith('/es/') ? 'es' : 'en';
    var targetLang = currentLang === 'en' ? 'es' : 'en';
    var targetLabel = currentLang === 'en' ? 'Español' : 'English';

    // 构建目标URL: 替换路径中的语言前缀
    var targetPath = path.replace('/' + currentLang + '/', '/' + targetLang + '/');
    if (targetPath === path) {
        // 没有语言前缀，添加
        var base = window.location.pathname.replace(/\/+$/, '');
        targetPath = '/' + targetLang + '/';
    }
    // 保留 hash 和 search
    targetPath += window.location.search + window.location.hash;

    // 创建按钮容器
    var container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:12px;right:12px;z-index:99999;display:flex;gap:8px;';

    // 语言切换按钮
    var btn = document.createElement('a');
    btn.href = targetPath;
    btn.textContent = targetLabel;
    btn.style.cssText = 'display:inline-block;padding:8px 18px;background:#5c9e6e;color:#fff;border-radius:20px;text-decoration:none;font-size:13px;font-weight:600;box-shadow:0 2px 10px rgba(0,0,0,0.2);transition:background 0.2s;cursor:pointer;';
    btn.onmouseover = function() { this.style.background = '#4a8a5c'; };
    btn.onmouseout = function() { this.style.background = '#5c9e6e'; };
    btn.onclick = function() {
        try { localStorage.setItem('preferred_lang', targetLang); } catch(e) {}
    };
    container.appendChild(btn);

    // 当前语言标签
    var label = document.createElement('span');
    label.textContent = currentLang === 'en' ? 'EN' : 'ES';
    label.style.cssText = 'display:inline-block;padding:8px 12px;background:rgba(255,255,255,0.9);color:#5c9e6e;border-radius:20px;font-size:13px;font-weight:700;box-shadow:0 2px 10px rgba(0,0,0,0.1);';
    container.appendChild(label);

    // 等待 body 可用
    function inject() {
        if (document.body) {
            document.body.appendChild(container);
        } else {
            setTimeout(inject, 100);
        }
    }
    inject();
})();
