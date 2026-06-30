import republicLore from '../data/lore/republic-lore.json';

const LORE_BY_KEY = {
  republic: republicLore,
};

/** 按书籍匹配 lore 包 */
export function getBookLoreKey(book) {
  if (!book) return null;
  const title = (book.title || '').toLowerCase();
  const author = (book.author || '').toLowerCase();
  if (title.includes('理想国') || title.includes('republic') || author.includes('柏拉图')) {
    return 'republic';
  }
  return null;
}

export function getBookLore(book) {
  const key = getBookLoreKey(book);
  return key ? LORE_BY_KEY[key] : null;
}

export function hasBookLore(book) {
  return !!getBookLore(book);
}

/** 根据已读最大章节 idx 判断是否解锁 */
export function isLoreUnlocked(unlockChapter, maxChapterIdx) {
  return maxChapterIdx >= unlockChapter;
}

/**
 * 从章节列表 + 进度计算已解锁的最大章节 idx。
 * 无进度时默认 1（序章/第一卷可探索）。
 */
export function computeMaxChapterIdx(chapters, progress) {
  if (!chapters?.length) return 1;
  if (!progress?.chapter_id) return 1;
  const ch = chapters.find((c) => c.id === progress.chapter_id);
  if (!ch) return 1;
  const idx = ch.idx ?? chapters.indexOf(ch) + 1;
  return Math.max(1, idx);
}

export function getChapterLink(chapters, chapterNum) {
  const ch = chapters.find((c) => (c.idx ?? 0) === chapterNum) || chapters[chapterNum - 1];
  return ch ? `/read/${ch.id}` : null;
}

export function getLoreEntity(lore, entityType, entityId) {
  if (!lore) return null;
  if (entityType === 'location') {
    return lore.map?.regions?.find((r) => r.id === entityId) ?? null;
  }
  if (entityType === 'character') {
    return lore.characters?.find((c) => c.id === entityId) ?? null;
  }
  return null;
}

export function countLoreProgress(lore, maxChapterIdx) {
  if (!lore) return { locations: 0, characters: 0, total: 0, unlocked: 0 };
  const locs = lore.map?.regions ?? [];
  const chars = lore.characters ?? [];
  const total = locs.length + chars.length;
  const unlocked =
    locs.filter((l) => isLoreUnlocked(l.unlockChapter, maxChapterIdx)).length +
    chars.filter((c) => isLoreUnlocked(c.unlockChapter, maxChapterIdx)).length;
  return {
    locations: locs.length,
    characters: chars.length,
    total,
    unlocked,
  };
}
