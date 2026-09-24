/* 语言切换器 - 右上角浮动按钮，支持 EN / ES / JA 三语 */
(function() {
    if (window.__langSwitcherLoaded) return;
    window.__langSwitcherLoaded = true;

    var LANGS = {
        'en': { label: 'English', short: 'EN' },
        'es': { label: 'Español', short: 'ES' },
        'ja': { label: '日本語', short: 'JA' }
    };

    // 检测当前语言版本
    var path = window.location.pathname;
    var currentLang = 'en';
    ['ja', 'es', 'en'].forEach(function(l) {
        if (path.indexOf('/' + l + '/') >= 0 || path.endsWith('/' + l) || path.endsWith('/' + l + '/')) {
            currentLang = l;
        }
    });

    // 构建目标 URL: 替换路径中的语言前缀
    function buildTarget(lang) {
        var targetPath = path.replace('/' + currentLang + '/', '/' + lang + '/');
        if (targetPath === path) {
            var base = window.location.pathname.replace(/\/+$/, '');
            targetPath = '/' + lang + '/';
        }
        targetPath += window.location.search + window.location.hash;
        return targetPath;
    }

    // 创建按钮容器
    var container = document.createElement('div');
    container.style.cssText = 'position:fixed;top:12px;right:12px;z-index:99999;display:flex;gap:4px;align-items:center;';

    Object.keys(LANGS).forEach(function(lang) {
        var isCurrent = lang === currentLang;
        var btn = document.createElement('a');
        if (!isCurrent) {
            btn.href = buildTarget(lang);
        }
        btn.textContent = LANGS[lang].short;
        btn.title = LANGS[lang].label;
        btn.style.cssText = 'display:inline-block;padding:8px 14px;border-radius:20px;text-decoration:none;font-size:13px;font-weight:700;transition:background 0.2s;cursor:pointer;' + (isCurrent
            ? 'background:rgba(255,255,255,0.9);color:#5c9e6e;box-shadow:0 2px 10px rgba(0,0,0,0.1);'
            : 'background:#5c9e6e;color:#fff;box-shadow:0 2px 10px rgba(0,0,0,0.2);');
        if (!isCurrent) {
            btn.onmouseover = function() { this.style.background = '#4a8a5c'; };
            btn.onmouseout = function() { this.style.background = '#5c9e6e'; };
            btn.onclick = function() {
                try { localStorage.setItem('preferred_lang', lang); } catch(e) {}
            };
        }
        container.appendChild(btn);
    });

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
