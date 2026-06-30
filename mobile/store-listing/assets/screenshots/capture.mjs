#!/usr/bin/env node
/**
 * 从本地 dev 前端抓取 App Store / 应用宝截图
 *
 * 前置：frontend npm run dev (3000) + backend API (8080)
 * 用法：
 *   npm install playwright sharp --no-save
 *   npx playwright install chromium
 *   node capture.mjs
 */
import { mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.PEIDU_URL || 'http://localhost:3000';
const OUT_IOS = join(__dirname, 'ios');
const OUT_ANDROID = join(__dirname, 'android');

/** @type {{ path: string; name: string; wait?: number }[]} */
const SCENES = [
  { path: '/', name: '01-home', wait: 1500 },
  { path: '/discover', name: '02-discover', wait: 1500 },
  { path: '/shelf', name: '03-shelf', wait: 1500 },
  { path: '/groups', name: '04-groups', wait: 1500 },
  { path: '/profile', name: '05-profile', wait: 1500 },
];

const VIEWPORTS = {
  ios: { width: 430, height: 932, deviceScaleFactor: 3 }, // iPhone 15 Pro logical → 1290×2796
  android: { width: 360, height: 800, deviceScaleFactor: 3 }, // 1080×2400
};

let playwright;
let sharp;
try {
  playwright = await import('playwright');
  sharp = (await import('sharp')).default;
} catch {
  console.error('请先安装: npm install playwright sharp --no-save && npx playwright install chromium');
  process.exit(1);
}

mkdirSync(OUT_IOS, { recursive: true });
mkdirSync(OUT_ANDROID, { recursive: true });

async function captureViewport(browser, platform, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: viewport.deviceScaleFactor,
    locale: 'zh-CN',
  });
  const page = await context.newPage();

  for (const scene of SCENES) {
    const url = `${BASE}${scene.path}`;
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      if (scene.wait) await page.waitForTimeout(scene.wait);
      const buf = await page.screenshot({ fullPage: false, type: 'png' });
      const outDir = platform === 'ios' ? OUT_IOS : OUT_ANDROID;
      const raw = join(outDir, `${scene.name}.png`);
      await sharp(buf).png().toFile(raw);
      console.log(`✓ [${platform}] ${scene.name} → ${raw}`);
    } catch (err) {
      console.warn(`⚠ [${platform}] ${scene.path}: ${err.message}`);
    }
  }

  await context.close();
}

async function main() {
  console.log(`抓取 ${BASE} …`);
  const browser = await playwright.chromium.launch();

  await captureViewport(browser, 'ios', VIEWPORTS.ios);
  await captureViewport(browser, 'android', VIEWPORTS.android);

  await browser.close();
  console.log('\n完成。');
  console.log('iOS 目录可直接上传（1290×2796）');
  console.log('Android 如需 1080×1920，可用 sharp 裁剪或调整 VIEWPORTS');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
