/**
 * codingPlanCards.js
 * 渲染 AI 编程平台推荐卡片（全暖色调 & 响应式版）
 *
 * 用法一：自动挂载到现有容器
 * renderCodingPlanCards('#token-plan-links');
 *
 * 用法二：追加到 body
 * renderCodingPlanCards();
 *
 * 用法三：自定义卡片数据
 * renderCodingPlanCards('#my-container', { cards: [...] });
 */

(function (global) {

  /* ─────────────────────────────────────────────
   * 默认卡片数据（全暖色系方案）
   * ───────────────────────────────────────────── */
  const DEFAULT_CARDS = [
    {
      href: 'https://www.volcengine.com/activity/codingplan?utm_campaign=hw&utm_content=hw&utm_medium=devrel_tool_web&utm_source=OWO&utm_term=runoob',
      icon: 'fa fa-rocket',
      title: '字节方舟 Coding Plan',
      desc: '支持 Doubao、GLM、DeepSeek、Kimi、MiniMax 等主流大模型，官方直供稳定可靠。',
      price: '¥9.9',
      unit: '/ 月',
      themeColor: '#ea580c',       // 暖橙色（加深提高对比度）
      themeBg: '#ffedd5',          // 温暖的浅橙色图标背景
      hoverBorder: '#f97316',      // 悬浮时边框
      hoverShadow: 'rgba(234,88,12,0.15)', // 暖橙色透明阴影
       guideUrl: 'https://www.runoob.com/claude-code/volcengine-coding-plan.html',
    },
    {
      href: 'https://maas.xfyun.cn/tokenPlan?ch=maas_lm_l2E',
      icon: 'fa fa-star',
      title: '讯飞星辰 Coding Plan',
      desc: '含免费模型调用额度，DeepSeek、GLM、Kimi、MiniMax，一站式体验与部署平台。',
      price: '¥3.9',
      unit: '/ 月',
      themeColor: '#d97706',       // 琥珀金（加深提高对比度）
      themeBg: '#fef3c7',          // 温暖的浅黄色图标背景
      hoverBorder: '#f59e0b',      // 悬浮时边框
      hoverShadow: 'rgba(217,119,6,0.15)', // 琥珀色透明阴影
      guideUrl: 'https://www.xfyun.cn/doc/spark/TokenPlan.html?ch=maas_lm_l2E',
    },
  ];

  /* ─────────────────────────────────────────────
   * 单张卡片 HTML
   * ───────────────────────────────────────────── */
  function buildCard(card) {
    const {
      href, icon, title, desc,
      price, unit,
      themeColor, themeBg,
      hoverBorder, hoverShadow,
      guideUrl,
    } = card;

    return `
<a href="${href}" target="_blank" rel="noopener noreferrer"
   data-hover-border="${hoverBorder}"
   data-hover-shadow="${hoverShadow}"
   style="
     text-decoration:none;
     display:flex;
     flex-direction:column;
     background:#fffcf8; /* 全局背景：修改为温暖的柔米色/奶白色 */
     border:1px solid #e7e0d6; /* 边框：改为暖灰色 */
     border-radius:14px;
     padding:20px 18px 16px;
     gap:14px;
     transition:border-color .2s, box-shadow .2s;
     cursor:pointer;
   "
>
  <div style="display:flex;align-items:center;gap:10px;">
    <div style="
        width:36px;height:36px;border-radius:8px;
        background:${themeBg};
        display:flex;align-items:center;justify-content:center;
        flex-shrink:0;
    ">
      <i class="${icon}" style="font-size:16px;color:${themeColor};"></i>
    </div>
    <span style="font-size:15px;font-weight:700;color:#292524;line-height:1.3;"> ${title}
    </span>
  </div>

  <p style="
    margin:0;
    font-size:13px;
    color:#57534e;
    line-height:1.6;
  ">
    ${desc}

    ${
      card.guideUrl
        ? `
        <span
          onclick="
            event.preventDefault();
            event.stopPropagation();
            window.open('${card.guideUrl}','_blank');
          "
          style="
            display:inline-flex;
            align-items:center;
            gap:4px;
            margin-top:8px;

            color:${themeColor};
            font-size:12px;
            font-weight:600;

            cursor:pointer;
            user-select:none;
          "
          onmouseover="
            this.style.textDecoration='underline';
            this.style.opacity='.8'
          "
          onmouseout="
            this.style.textDecoration='none';
            this.style.opacity='1'
          "
        >
          <i class="fa fa-book"></i>
          配置指南
        </span>
        `
        : ''
    }
  </p>

  <div style="
      display:flex;align-items:center;justify-content:space-between;
      border-top:1px solid #f5efe6; /* 分割线：改为暖色调 */
      padding-top:12px;margin-top:auto;
  ">
    <div style="display:flex;align-items:baseline;gap:4px;">
      <span style="font-size:22px;font-weight:700;color:${themeColor};">${price}</span>
      <span style="font-size:12px;color:#78716c;">${unit}</span> </div>
    <span style="
        display:inline-flex;align-items:center;gap:6px;
        font-size:13px;font-weight:600;color:#fff;
        background:${themeColor};
        padding:6px 14px;border-radius:20px;
        letter-spacing:0.02em;
        box-shadow:0 2px 8px ${hoverShadow};
        transition:opacity .2s;
      "
      onmouseover="this.style.opacity='.85'"
      onmouseout="this.style.opacity='1'"
    >
      <i class="fa fa-bolt" style="font-size:12px;"></i>立即开通
    </span>
  </div>
</a>`.trim();
  }

  /* ─────────────────────────────────────────────
   * 主函数
   * ───────────────────────────────────────────── */
  function renderCodingPlanCards(selector, options) {
    var opts = options || {};
    var cards = opts.cards || DEFAULT_CARDS;

    /* 1. 找到或创建容器 */
    var container;
    if (selector) {
      container = (typeof selector === 'string')
        ? document.querySelector(selector)
        : selector;
      if (!container) {
        console.warn('[tokenPlanCards] 未找到容器：' + selector);
        return;
      }
    } else {
      container = document.createElement('div');
      container.id = 'token-plan-links';
      document.body.appendChild(container);
    }

    /* 2. 构建网格包裹层（响应式布局） */
    var wrapper = document.createElement('div');
    wrapper.style.cssText = [
      'display:grid',
      // 响应式核心：最小 280px 宽度，空间不够自动折行
      'grid-template-columns:repeat(auto-fit, minmax(280px, 1fr))',
      'gap:16px',
      'margin:20px 0',
    ].join(';');

    wrapper.innerHTML = cards.map(buildCard).join('');
    container.innerHTML = '';
    container.appendChild(wrapper);

    /* 3. 绑定 hover 事件（纯 JS，兼顾暖色系默认边框）*/
    wrapper.querySelectorAll('a[data-hover-border]').forEach(function (el) {
      var defaultBorder = '1px solid #e7e0d6'; // 同步修改为暖色默认边框
      var defaultShadow = 'none';
      var hoverBorder = '1px solid ' + el.getAttribute('data-hover-border');
      var hoverShadow = '0 4px 16px ' + el.getAttribute('data-hover-shadow');

      el.addEventListener('mouseenter', function () {
        el.style.borderColor = el.getAttribute('data-hover-border');
        el.style.boxShadow   = hoverShadow;
      });
      el.addEventListener('mouseleave', function () {
        el.style.border     = defaultBorder;
        el.style.boxShadow  = defaultShadow;
      });
    });
  }

  /* ─────────────────────────────────────────────
   * 暴露到全局 / CommonJS / ESM
   * ───────────────────────────────────────────── */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = renderCodingPlanCards;
  } else if (typeof define === 'function' && define.amd) {
    define([], function () { return renderCodingPlanCards; });
  } else {
    global.renderCodingPlanCards = renderCodingPlanCards;
  }

})(typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : this);