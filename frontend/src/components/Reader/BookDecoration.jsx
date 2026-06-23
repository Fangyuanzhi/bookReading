/**
 * 为特定书籍注入「实体书」视觉元素：封面、章节头图、插图。
 * 现在先支持《理想国》；后续可扩展为按 book_id / 标签匹配。
 */

const DECORATIONS = {
  // 理想国（柏拉图）默认插画映射：每卷一幅主题插画
  republic: {
    cover: '/covers/republic.svg',
    illustrations: {
      1: '/illustrations/b1_piraeus.svg',
      2: '/illustrations/b2_citybirth.svg',
      3: '/illustrations/b3_muses.svg',
      4: '/illustrations/b4_virtues.svg',
      5: '/illustrations/b5_guardians.svg',
      6: '/illustrations/b6_dividedline.svg',
      7: '/illustrations/b7_cave.svg',
      8: '/illustrations/b8_regimes.svg',
      9: '/illustrations/b9_tyrant.svg',
      10: '/illustrations/b10_mythofer.svg',
    },
  },
};

function matchKey(book) {
  if (!book) return null;
  const title = (book.title || '').toLowerCase();
  const author = (book.author || '').toLowerCase();
  if (title.includes('理想国') || title.includes('republic')) return 'republic';
  return null;
}

export function getBookCover(book) {
  if (!book) return null;
  if (book.cover_url) {
    if (book.cover_url.startsWith('http') || book.cover_url.startsWith('/')) return book.cover_url;
    return `/covers/${book.cover_url}`;
  }
  const key = matchKey(book);
  return key ? DECORATIONS[key].cover : null;
}

export function getChapterIllustration(book, chapterIndex) {
  const key = matchKey(book);
  if (!key) return null;
  return DECORATIONS[key].illustrations[chapterIndex + 1] || null;
}

export function hasBookDecoration(book) {
  return !!matchKey(book);
}
