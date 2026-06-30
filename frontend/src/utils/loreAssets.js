/** 世界图谱视觉资源（按 bookKey） */
export const LORE_ASSETS = {
  republic: {
    mapBg: '/lore/republic-world-map.png',
    characterBg: '/lore/republic-character-atlas.png',
  },
};

export function getLoreAssets(book) {
  const key = book?.title?.includes('理想国') ? 'republic' : null;
  return key ? LORE_ASSETS[key] : null;
}
