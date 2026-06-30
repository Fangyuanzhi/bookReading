/**
 * 为特定书籍注入「实体书」视觉元素：封面、章节头图、插图。
 * 按书名/作者匹配；credits 见 frontend/src/data/illustration-credits-*.json
 */

import republicCredits from '../../data/illustration-credits-republic.json';
import twelveCredits from '../../data/illustration-credits-twelve.json';
import fountainsCredits from '../../data/illustration-credits-fountains.json';
import singularityCredits from '../../data/illustration-credits-singularity.json';
import alteredCarbonCredits from '../../data/illustration-credits-altered-carbon.json';

function chapterMap(credits, subdir) {
  const prefix = subdir ? `/illustrations/${subdir}/` : '/illustrations/';
  return Object.fromEntries(
    Object.entries(credits.chapters || {}).map(([vol, meta]) => [
      Number(vol),
      `${prefix}${meta.file}`,
    ]),
  );
}

function buildDecoration(credits, subdir = '') {
  const coverFile = credits.cover?.file;
  return {
    cover: coverFile ? `/covers/${coverFile}` : null,
    illustrations: chapterMap(credits, subdir),
    credits,
  };
}

const DECORATIONS = {
  republic: buildDecoration(republicCredits),
  twelve: buildDecoration(twelveCredits, 'twelve'),
  fountains: buildDecoration(fountainsCredits, 'fountains'),
  singularity: buildDecoration(singularityCredits, 'singularity'),
  'altered-carbon': buildDecoration(alteredCarbonCredits, 'altered-carbon'),
};

const CREDITS_BY_KEY = {
  republic: republicCredits,
  twelve: twelveCredits,
  fountains: fountainsCredits,
  singularity: singularityCredits,
  'altered-carbon': alteredCarbonCredits,
};

function matchKey(book) {
  if (!book) return null;
  const title = (book.title || '').toLowerCase();
  const author = (book.author || '').toLowerCase();
  if (title.includes('理想国') || title.includes('republic')) return 'republic';
  if (
    title.includes('十二个对抗众神') ||
    title.includes('twelve against the gods') ||
    author.includes('博利托') ||
    author.includes('bolitho')
  ) {
    return 'twelve';
  }
  if (
    title.includes('天堂的喷泉') ||
    title.includes('fountains of paradise') ||
    author.includes('克拉克') ||
    author.includes('clarke')
  ) {
    return 'fountains';
  }
  if (
    title.includes('奇点天空') ||
    title.includes('singularity sky') ||
    author.includes('斯特罗斯') ||
    author.includes('stross')
  ) {
    return 'singularity';
  }
  if (
    title.includes('副本') ||
    title.includes('altered carbon') ||
    author.includes('摩根') ||
    author.includes('morgan')
  ) {
    return 'altered-carbon';
  }
  return null;
}

export function getBookCover(book) {
  if (!book) return null;
  if (book.cover_url) {
    if (book.cover_url.startsWith('http') || book.cover_url.startsWith('/')) return book.cover_url;
    return `/covers/${book.cover_url}`;
  }
  const key = matchKey(book);
  return key ? DECORATIONS[key]?.cover ?? null : null;
}

export function getChapterIllustration(book, chapterIndex, chapterIdx) {
  const key = matchKey(book);
  if (!key || !DECORATIONS[key]) return null;
  const volume = chapterIdx ?? chapterIndex + 1;
  return DECORATIONS[key].illustrations[volume] || null;
}

export function getChapterIllustrationCredit(book, chapterIdx) {
  if (!chapterIdx) return null;
  const key = matchKey(book);
  if (!key) return null;
  return CREDITS_BY_KEY[key]?.chapters?.[String(chapterIdx)] || null;
}

export function hasBookDecoration(book) {
  const key = matchKey(book);
  return !!(key && DECORATIONS[key]?.cover);
}
