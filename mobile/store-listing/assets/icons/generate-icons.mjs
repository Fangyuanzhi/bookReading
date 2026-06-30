#!/usr/bin/env node
/**
 * 从 icon-master.png 生成 iOS / Android 各尺寸图标
 * 用法: node generate-icons.mjs [input.png]
 */
import { existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let sharp;
try {
  sharp = (await import('sharp')).default;
} catch {
  console.error('请先安装 sharp: npm install sharp --no-save');
  process.exit(1);
}

const candidates = [
  process.argv[2],
  join(__dirname, 'icon-master.png'),
  join(__dirname, 'icon-master.svg'),
].filter(Boolean);

const input = candidates.find((p) => existsSync(p));
if (!input) {
  console.error('找不到图标源文件。请放置 icon-master.png 或 icon-master.svg');
  console.error('用法: node generate-icons.mjs [/path/to/icon.png|svg]');
  process.exit(1);
}
console.log(`源图: ${input}`);

const iosDir = join(__dirname, 'ios');
const androidDir = join(__dirname, 'android');
mkdirSync(iosDir, { recursive: true });
mkdirSync(androidDir, { recursive: true });

const iosSizes = [
  { name: 'AppStore-1024', size: 1024 },
  { name: 'iPhone-180', size: 180 },
  { name: 'iPhone-120', size: 120 },
  { name: 'iPhone-87', size: 87 },
  { name: 'iPhone-80', size: 80 },
  { name: 'iPhone-60', size: 60 },
  { name: 'iPhone-58', size: 58 },
  { name: 'iPhone-40', size: 40 },
  { name: 'iPhone-29', size: 29 },
  { name: 'iPhone-20', size: 20 },
  { name: 'iPad-167', size: 167 },
  { name: 'iPad-152', size: 152 },
  { name: 'iPad-76', size: 76 },
];

const androidSizes = [
  { name: 'ic_launcher-512', size: 512 },
  { name: 'ic_foreground-432', size: 432 },
  { name: 'ic_launcher-192', size: 192 },
  { name: 'ic_launcher-144', size: 144 },
  { name: 'ic_launcher-96', size: 96 },
  { name: 'ic_launcher-72', size: 72 },
  { name: 'ic_launcher-48', size: 48 },
];

async function generate() {
  const img = sharp(input).ensureAlpha();

  for (const { name, size } of iosSizes) {
    const out = join(iosDir, `${name}.png`);
    await img.clone().resize(size, size).png().toFile(out);
    console.log('✓', out);
  }

  for (const { name, size } of androidSizes) {
    const out = join(androidDir, `${name}.png`);
    await img.clone().resize(size, size).png().toFile(out);
    console.log('✓', out);
  }

  console.log('\n完成。iOS 上传 AppStore-1024.png；Android 上传 ic_launcher-512.png');
}

generate().catch((err) => {
  console.error(err);
  process.exit(1);
});
