import puppeteer from 'puppeteer';
import * as path from 'path';

async function generatePNG() {
    const htmlPath = path.resolve('d:/Antigravity/Jackypotato/metaphysical-ip-analysis.html');
    const pngPath = path.resolve('d:/Antigravity/Jackypotato/metaphysical-ip-analysis.png');

    console.log(`📸 Generating high-res PNG from ${htmlPath}...`);

    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
        const page = await browser.newPage();
        // 3x device scale for Retina quality
        await page.setViewport({ width: 1200, height: 1000, deviceScaleFactor: 3 });
        await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0' });

        await page.screenshot({ path: pngPath, fullPage: true });
        console.log(`✅ PNG generated: ${pngPath}`);
    } finally {
        await browser.close();
    }
}

generatePNG().catch(console.error);
