import { generateTemplate, ReportData } from './html-template';
import * as fs from 'fs';
import * as path from 'path';
import puppeteer from 'puppeteer';

async function generateCaseStudy() {
    const reportData: ReportData = {
        date: "2026-02-04",
        stats: `
            <div class="stat-card">
                <div class="stat-value">3</div>
                <div class="stat-label">对标账号</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">4</div>
                <div class="stat-label">分析维度</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">3</div>
                <div class="stat-label">建议阶段</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">TOP</div>
                <div class="stat-label">深度建议</div>
            </div>
        `,
        summary: "针对海外‘玄学’IP的案例分析，旨在将传统深奥知识翻译为现代社交媒体语境下的爆款内容，并实现高阶商业化变现。",
        topics: `
            <div class="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                <div class="text-xs font-bold text-emerald-600 mb-1">@dear.modern</div>
                <div class="text-sm font-black text-slate-800">风水+设计拯救者</div>
                <div class="text-[10px] text-slate-500 mt-2">走量模式 · 幽默吐槽 · 极致接地气</div>
            </div>
            <div class="bg-blue-50 p-4 rounded-2xl border border-blue-100">
                <div class="text-xs font-bold text-blue-600 mb-1">@fengshuibyamanda</div>
                <div class="text-sm font-black text-slate-800">西式生活化导师</div>
                <div class="text-[10px] text-slate-500 mt-2">高客单价 · 治愈系 · 简化概念</div>
            </div>
            <div class="bg-purple-50 p-4 rounded-2xl border border-purple-100">
                <div class="text-xs font-bold text-purple-600 mb-1">@chaninicholas</div>
                <div class="text-sm font-black text-slate-800">占星疗愈权威</div>
                <div class="text-[10px] text-slate-500 mt-2">App订阅 · 文学深度 · 艺术化审美</div>
            </div>
            <div class="bg-orange-50 p-4 rounded-2xl border border-orange-100">
                <div class="text-xs font-bold text-orange-600 mb-1">邵老师定制建议</div>
                <div class="text-sm font-black text-slate-800">深挖浅出 · 降维打击</div>
                <div class="text-[10px] text-slate-500 mt-2">从容自若 · 智者人设 · 体系化变现</div>
            </div>
        `,
        highlights: `
            <div class="highlight-item">
                <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
                <div class="text-xs text-slate-600"><strong>生意模式对照：</strong>从低客单价走量到高客单价咨询，再到App订阅制的全光谱变现。</div>
            </div>
            <div class="highlight-item">
                <div class="w-2 h-2 rounded-full bg-blue-500"></div>
                <div class="text-xs text-slate-600"><strong>市场定位核心：</strong>传统智慧必须与现代痛点（如WFH、租房、心理疗愈）精准勾连。</div>
            </div>
            <div class="highlight-item">
                <div class="w-2 h-2 rounded-full bg-purple-500"></div>
                <div class="text-xs text-slate-600"><strong>内容呈现精髓：</strong>可视化（家具移动）、审美化（治愈色调）、文学化（社会共鸣）。</div>
            </div>
        `,
        quotes: `
            <div class="quote-card">
                <div class="quote-text">分析案例：@dear.modern, @fengshuibyamanda, @chaninicholas</div>
                <div class="quote-author">多元化的玄学出海变现路径</div>
            </div>
            <div class="quote-card" style="border-left-color: #3b82f6;">
                <div class="quote-text">核心策略：用最现代的形式，讲最正宗的知识，树立“宗师”级的权威感。</div>
                <div class="quote-author">针对邵老师的降维打击策略</div>
            </div>
        `,
        actionTitle: "邵老师「深度变现」行动建议",
        actionSteps: `
            <div class="space-y-3 mt-4">
                <div class="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                    <div class="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center font-bold text-white shrink-0">1</div>
                    <div>
                        <div class="font-bold text-emerald-400">第一阶段：稳固高地</div>
                        <div class="text-sm text-white/70 mt-1">坚持高客单价咨询 + 私域沉淀，建立潜在客户Email List。</div>
                    </div>
                </div>
                <div class="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                    <div class="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center font-bold text-white shrink-0">2</div>
                    <div>
                        <div class="font-bold text-blue-400">第二阶段：体系输出</div>
                        <div class="text-sm text-white/70 mt-1">开发独家“东方智慧应用于现代生活”线上课程/认证。</div>
                    </div>
                </div>
                <div class="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
                    <div class="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center font-bold text-white shrink-0">3</div>
                    <div>
                        <div class="font-bold text-purple-400">第三阶段：品牌文化</div>
                        <div class="text-sm text-white/70 mt-1">开发具有真实文化底蕴的周边产品（如定制罗盘、节气手账）。</div>
                    </div>
                </div>
                <div class="mt-4 p-4 border-l-4 border-emerald-500 bg-emerald-500/10 rounded-r-xl">
                    <div class="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">选题秘籍</div>
                    <div class="text-sm text-white/90">正本清源（辨伪）+ 古法今用（场景）+ 世家故事（信任）</div>
                </div>
            </div>
        `
    };

    const html = generateTemplate(reportData);
    const outputDir = path.join('reports', 'metaphysical-case-study');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const htmlPath = path.join(outputDir, 'report.html');
    fs.writeFileSync(htmlPath, html);
    console.log(`✅ HTML report generated: ${htmlPath}`);

    // Generate PNG
    console.log(`📸 Generating high-res PNG...`);
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        await page.setViewport({ width: 640, height: 1000, deviceScaleFactor: 3 });
        await page.goto(`file://${path.resolve(htmlPath)}`, { waitUntil: 'networkidle0' });

        const pngPath = path.join(outputDir, 'report.png');
        await page.screenshot({ path: pngPath, fullPage: true });
        console.log(`✅ PNG report generated: ${pngPath}`);
    } finally {
        await browser.close();
    }
}

generateCaseStudy().catch(console.error);
