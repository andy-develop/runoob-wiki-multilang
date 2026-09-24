(function () {
    const config = {
        containerId: 'coding-plan-links',

        items: [
            {
                title: '字节跳动官方 Coding Plan',
                desc: '模型：Doubao、GLM、DeepSeek、Kimi、MiniMax 等',
                url: 'https://www.volcengine.com/activity/codingplan?utm_campaign=hw&utm_content=hw&utm_medium=devrel_tool_web&utm_source=OWO&utm_term=runoob',
                icon: 'fa-rocket',
                themeColor: '#ea580c',       // 暖橙色
                themeBg: '#ffedd5',          // 浅橙背景
                hoverBorder: '#f97316',
                hoverShadow: 'rgba(234,88,12,0.15)'
            },
            
            {
                title: '阿里云 Token Plan',
                desc: '模型 Qwen3.5-Plus、 MiniMax M2.5、GLM-5、Kimi-k2.5 等',
                url: 'https://www.aliyun.com/benefit/scene/tokenplan?source=5176.29345612&userCode=i5mn5r7m',
                icon: 'fa-certificate',
                themeColor: '#dc2626',       // 暖红色
                themeBg: '#fee2e2',          // 浅红背景
                hoverBorder: '#ef4444',
                hoverShadow: 'rgba(220,38,38,0.15)'
            }
        ]
    };

    const container = document.getElementById(config.containerId);

    if (!container) return;

    container.innerHTML = `
        <div style="
            margin: 20px 0;
            display: flex;
            flex-direction: column; /* 核心修改：强制垂直单列，一行只显示一个 */
            gap: 14px;              /* 卡片之间的纵向间距 */
        ">
            ${config.items.map(item => `
                <div 
                    onmouseover="this.style.borderColor='${item.hoverBorder}'; this.style.boxShadow='0 4px 20px ${item.hoverShadow}';"
                    onmouseout="this.style.borderColor='#e7e0d6'; this.style.boxShadow='none';"
                    style="
                        border: 1px solid #e7e0d6; /* 默认暖色调边框 */
                        border-radius: 14px;
                        background: #fffcf8;        /* 温暖的柔米色/奶白色背景 */
                        transition: border-color .25s, box-shadow .25s;
                        cursor: pointer;
                    "
                >
                    <a href="${item.url}"
                       target="_blank"
                       rel="noopener noreferrer"
                       style="
                           display: flex;
                           align-items: center;
                           gap: 14px;
                           padding: 16px 18px;
                           text-decoration: none;
                       ">
                        <div style="
                            width: 42px;
                            height: 42px;
                            border-radius: 10px;
                            background: ${item.themeBg};
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            flex-shrink: 0;
                        ">
                            <i class="fa ${item.icon}" style="
                                font-size: 20px;
                                color: ${item.themeColor};
                            "></i>
                        </div>

                        <div style="
                            display: flex;
                            flex-direction: column;
                            gap: 4px;
                        ">
                            <div style="
                                font-size: 15px;
                                font-weight: 700;
                                color: #292524; /* 暖调深色字 */
                                line-height: 1.3;
                            ">
                                ${item.title}
                            </div>

                            <div style="
                                font-size: 13px;
                                color: #57534e; /* 暖调中灰字 */
                                line-height: 1.4;
                            ">
                                ${item.desc}
                            </div>
                        </div>
                    </a>
                </div>
            `).join('')}
        </div>
    `;
})();