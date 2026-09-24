/**
 * AI Tools Cards Widget
 * 使用方式：在 HTML 中引入此脚本即可，无需任何额外配置。
 *
 *   <div data-ai-cards="ide"></div>   → 渲染 IDE 工具分组
 *   <div data-ai-cards="app"></div>   → 渲染 在线平台分组
 *   <div data-ai-cards="all"></div>   → 渲染全部分组
 *
 * 主题：warm (#fdf8f3 背景 · #3d2b1f 文字)
 * 依赖：Font Awesome 4.7（脚本自动按需注入）
 */

(function () {

  /* ==================== 数据配置 ==================== */
  var AI_CARDS_DATA = [
    {
      group: 'ide',
      title: 'AI 开发环境',
      titleIcon: 'fa-laptop',
      items: [
         {
          name: 'Qoder',
          desc: '阿里出品，AI 驱动在线代码开发工具',
          icon: 'fa-terminal',
          iconClass: 'aic-icon-dark',
          url: 'https://qoder.cn/referral?utm_source=paid&utm_medium=affiliate&utm_campaign=cainiaojiaocheng'
        },
        {
          name: '字节 Trae',
          desc: '字节跳动推出的新一代 AI 原生开发环境',
          icon: 'fa-code',
          iconClass: 'aic-icon-dark',
          url: 'https://www.trae.cn/sem/?utm_source=advertising&utm_medium=runoob_ug_cpa&utm_term=hw_trae_runoob'
        }
      ]
    },
    {
      group: 'app',
      title: '在线 AI 应用生成与开发平台',
      titleIcon: 'fa-rocket',
      items: [
        {
          name: '秒哒',
          desc: '一句话生成应用，0 代码快速实现需求并自动构建完整应用',
          icon: 'fa-magic',
          iconClass: 'aic-icon-purple',
          url: 'https://www.miaoda.cn/?invitecode=user-93thly701s00'
        },
        {
          name: 'MonkeyCode',
          desc: 'AI 应用开发平台，支持任务驱动开发，内置终端、文件管理与实时预览',
          icon: 'fa-cubes',
          iconClass: 'aic-icon-green',
          url: 'https://monkeycode-ai.com/?ic=019d94af-c5d0-7207-a923-89d7ccf67d91'
        }
      ]
    }
  ];

  /* ==================== 注入 Font Awesome 4.7（按需）==================== */
  function injectFA() {
    if (document.querySelector('link[href*="font-awesome"]')) return;
    var link = document.createElement('link');
    link.rel  = 'stylesheet';
    link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css';
    document.head.appendChild(link);
  }

  /* ==================== 注入样式（只执行一次）==================== */
  function injectStyle() {
    if (document.getElementById('__ai-cards-style__')) return;
    var s = document.createElement('style');
    s.id = '__ai-cards-style__';
    s.textContent = [
      /* --- 容器 --- */
      '.aic-wrap{padding:4px 0;}',
      '.aic-section{margin-bottom:18px;}',

      /* --- 分组标题 --- */
      '.aic-label{',
        'font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;',
        'margin:0 0 10px 2px;',
        'color:#a07860;',          /* warm 主题次要文字色 */
        'display:flex;align-items:center;gap:5px;',
      '}',

      /* --- 网格 --- */
      '.aic-grid{display:grid;gap:10px;grid-template-columns:1fr;}',
      '@media(min-width:600px){.aic-grid{grid-template-columns:repeat(2,1fr);}}',

      /* --- 卡片 --- */
      '.aic-card{',
        'display:flex;align-items:center;gap:14px;',
        'padding:14px 16px;',
        'border:1px solid #e8d9cc;',   /* warm 边框色 */
        'border-radius:12px;',
        'background:#fdf8f3;',         /* warm 背景色 */
        'text-decoration:none;',
        'color:#3d2b1f;',              /* warm 主文字色 */
        'box-sizing:border-box;',
        'position:relative;overflow:hidden;',
        'transition:border-color .2s,box-shadow .2s,transform .18s;',
      '}',
      '.aic-card:hover{',
        'border-color:#c49a7a;',
        'box-shadow:0 4px 16px rgba(100,60,20,.1);',
        'transform:translateY(-2px);',
      '}',
      '.aic-card:active{transform:translateY(0) scale(.99);}',

      /* --- 图标方块 --- */
      '.aic-icon{',
        'width:40px;height:40px;border-radius:10px;flex-shrink:0;',
        'display:flex;align-items:center;justify-content:center;',
      '}',
      '.aic-icon i{color:#fff !important;font-size:17px;}',
      '.aic-icon-dark  {background:linear-gradient(135deg,#1a1a2e,#3b3f6e);}',
      '.aic-icon-orange{background:linear-gradient(135deg,#ff6b35,#f7931e);}',
      '.aic-icon-purple{background:linear-gradient(135deg,#7c3aed,#a855f7);}',
      '.aic-icon-green {background:linear-gradient(135deg,#059669,#10b981);}',
      '.aic-icon-blue  {background:linear-gradient(135deg,#2563eb,#60a5fa);}',
      '.aic-icon-pink  {background:linear-gradient(135deg,#db2777,#f472b6);}',

      /* --- 文字 --- */
      '.aic-body{flex:1;min-width:0;}',
      '.aic-name{',
        'font-size:14px;font-weight:700;',
        'margin:0 0 3px;',
        'color:#3d2b1f;',              /* warm 主文字 */
        'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;',
      '}',
      '.aic-desc{',
        'font-size:12px;line-height:1.5;margin:0;',
        'color:#7a5540;',              /* warm 次要文字 */
        'overflow:hidden;',
        'display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;',
      '}',

      /* --- 箭头按钮 --- */
      '.aic-arrow{',
        'flex-shrink:0;width:26px;height:26px;border-radius:7px;',
        'border:1px solid #d4b89a;',   /* warm 边框 */
        'display:flex;align-items:center;justify-content:center;',
        'transition:background .2s,border-color .2s;',
      '}',
      '.aic-arrow i{font-size:12px;color:#a07860;transition:color .2s,transform .18s;}',
      '.aic-card:hover .aic-arrow{background:#c49a7a;border-color:#c49a7a;}',
      '.aic-card:hover .aic-arrow i{color:#fff;transform:translateX(2px);}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ==================== 工具：HTML 转义 ==================== */
  function esc(str) {
    return String(str)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  /* ==================== 渲染单张卡片 ==================== */
  function cardHTML(item) {
    return (
      '<a class="aic-card" href="' + esc(item.url) + '" target="_blank" rel="noopener">' +
        '<div class="aic-icon ' + esc(item.iconClass || 'aic-icon-blue') + '">' +
          '<i class="fa ' + esc(item.icon || 'fa-globe') + '" aria-hidden="true"></i>' +
        '</div>' +
        '<div class="aic-body">' +
          '<p class="aic-name">' + esc(item.name) + '</p>' +
          '<p class="aic-desc">' + esc(item.desc) + '</p>' +
        '</div>' +
        '<div class="aic-arrow">' +
          '<i class="fa fa-arrow-right" aria-hidden="true"></i>' +
        '</div>' +
      '</a>'
    );
  }

  /* ==================== 渲染单个分组 ==================== */
  function groupHTML(gd) {
    var html = '<div class="aic-section">';
    if (gd.title) {
      html += '<p class="aic-label">' +
        (gd.titleIcon ? '<i class="fa ' + esc(gd.titleIcon) + '" aria-hidden="true"></i>' : '') +
        esc(gd.title) +
      '</p>';
    }
    html += '<div class="aic-grid">';
    for (var i = 0; i < gd.items.length; i++) html += cardHTML(gd.items[i]);
    html += '</div></div>';
    return html;
  }

  /* ==================== 自动扫描并渲染 ==================== */
  function autoRender() {
    injectFA();
    injectStyle();

    var targets = document.querySelectorAll('[data-ai-cards]');
    for (var i = 0; i < targets.length; i++) {
      var el  = targets[i];
      var key = (el.getAttribute('data-ai-cards') || '').trim().toLowerCase();
      var html = '<div class="aic-wrap">';

      if (key === 'all') {
        for (var g = 0; g < AI_CARDS_DATA.length; g++) html += groupHTML(AI_CARDS_DATA[g]);
      } else {
        for (var g = 0; g < AI_CARDS_DATA.length; g++) {
          if (AI_CARDS_DATA[g].group === key) { html += groupHTML(AI_CARDS_DATA[g]); break; }
        }
      }

      html += '</div>';
      el.innerHTML = html;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoRender);
  } else {
    autoRender();
  }

})();