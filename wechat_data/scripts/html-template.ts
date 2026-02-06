/**
 * HTML Template Generator for WeChat Daily Analysis Report
 * Based on the approved reference design: wechat_report_poster.html
 */

export interface ReportData {
    date: string;
    stats: string;
    summary: string;
    topics: string;
    highlights: string;
    quotes: string;
    actionTitle: string;
    actionSteps: string;
}

export function generateTemplate(data: ReportData): string {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>复利日知录 · 每日精选海报</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=Noto+Sans+SC:wght@400;500;700;900&display=swap">
    <script src="https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js"></script>
    <style>
        :root {
            --wechat-green: #07C160;
            --deep-green: #06ae56;
            --soft-bg: #f8fafc;
            --text-main: #1e293b;
        }

        body {
            font-family: 'Inter', 'Noto Sans SC', sans-serif;
            background-color: #f1f5f9;
            margin: 0;
            padding: 40px 0;
            display: flex;
            justify-content: center;
        }

        /* Fixed width for perfect PNG export */
        #poster-container {
            width: 640px;
            background: white;
            box-shadow: 0 40px 100px rgba(0, 0, 0, 0.1);
            position: relative;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        .header-gradient {
            background: linear-gradient(135deg, #07C160 0%, #059669 100%);
            padding: 60px 40px 40px;
            color: white;
            position: relative;
        }

        .header-pattern {
            position: absolute;
            top: 0;
            right: 0;
            width: 200px;
            height: 200px;
            background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
            border-radius: 50%;
            transform: translate(50%, -50%);
        }

        .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 1px;
            background: #e2e8f0;
            margin: 0 40px;
            border-radius: 16px;
            overflow: hidden;
            transform: translateY(-50%);
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
        }

        .stat-card {
            background: white;
            padding: 20px 10px;
            text-align: center;
        }

        .stat-value {
            font-size: 24px;
            font-weight: 900;
            color: var(--wechat-green);
            line-height: 1;
        }

        .stat-label {
            font-size: 11px;
            font-weight: 700;
            color: #94a3b8;
            margin-top: 6px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .content-section {
            padding: 0 40px 40px;
        }

        .section-title {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 18px;
            font-weight: 900;
            color: var(--text-main);
            margin-bottom: 20px;
            margin-top: 10px;
        }

        .section-title::before {
            content: '';
            width: 4px;
            height: 20px;
            background: var(--wechat-green);
            border-radius: 2px;
        }

        .quote-card {
            background: #f8fafc;
            border-radius: 20px;
            padding: 24px;
            border-left: 4px solid var(--wechat-green);
            margin-bottom: 16px;
            position: relative;
        }

        .quote-text {
            font-size: 16px;
            font-weight: 600;
            color: #334155;
            line-height: 1.6;
            margin-bottom: 12px;
        }

        .quote-author {
            font-size: 13px;
            color: #64748b;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .bento-box {
            background: #f1f5f9;
            border-radius: 24px;
            padding: 20px;
            margin-bottom: 30px;
        }

        .highlight-item {
            background: white;
            border-radius: 12px;
            padding: 12px 16px;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
        }

        .action-banner {
            background: #0f172a;
            color: white;
            padding: 30px 40px;
            margin-top: auto;
        }

        .footer-logo {
            border-top: 1px solid rgba(255, 255, 255, 0.1);
            padding-top: 20px;
            margin-top: 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            opacity: 0.6;
            font-size: 11px;
        }
    </style>
</head>

<body>

    <div id="poster-container">
        <!-- Header -->
        <div class="header-gradient">
            <div class="header-pattern"></div>
            <div class="flex items-center gap-2 mb-4 opacity-80 font-bold text-sm">
                <span class="bg-white/20 px-3 py-1 rounded-full">EFFICIENCY</span>
                <span>${data.date}</span>
            </div>
            <h1 class="text-4xl font-black mb-2 leading-tight">复利日知录</h1>
            <p class="text-white/80 font-medium text-lg">Daily Insight Digest</p>
        </div>

        <!-- Stats Grid -->
        <div class="stats-grid">${data.stats}</div>

        <!-- Content Area -->
        <div class="content-section">

            <!-- Summary -->
            <div class="mb-8">
                <h2 class="section-title">社群动态总结</h2>
                <div class="bg-slate-50 p-5 rounded-3xl border border-slate-100">
                    <p class="text-slate-600 leading-relaxed text-sm">${data.summary}</p>
                </div>
            </div>

            <!-- Topic Map -->
            <div class="mb-8">
                <h2 class="section-title">今日话题地图</h2>
                <div class="grid grid-cols-2 gap-3">${data.topics}</div>
            </div>

            <!-- Highlights -->
            <div class="mb-8">
                <h2 class="section-title">知识扩展亮点</h2>
                <div class="space-y-2">${data.highlights}</div>
            </div>

            <!-- Golden Quotes (3 Slots Supported) -->
            <div>
                <h2 class="section-title">群内金句精选</h2>
                ${data.quotes}
            </div>
        </div>

        <!-- Action Section -->
        <div class="action-banner">
            <h2 class="text-xs font-black text-white/50 uppercase tracking-widest mb-4">💡 建议行动计划</h2>
            <div class="text-xl font-black mb-4 leading-tight">
                ${data.actionTitle}
            </div>
            ${data.actionSteps}

            <div class="footer-logo">
                <div>© 2026 复利日知录 · NOA INSIGHTS</div>
                <div class="font-black uppercase tracking-tighter">Powered by UI-UX Pro Max</div>
            </div>
        </div>
    </div>
</body>

</html>`;
}
