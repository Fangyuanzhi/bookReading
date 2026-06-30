/** 继续阅读：仅展示仍在上架且章节有效的条目 */
export function filterRecentReadingItems(items) {
  return (items || []).filter(
    (item) =>
      item?.book?.status === 'published' &&
      item?.chapter?.id &&
      item?.book_id,
  );
}
