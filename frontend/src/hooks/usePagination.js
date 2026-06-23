import { useCallback, useLayoutEffect, useState } from 'react';

/**
 * 将段落按可视高度分页（参考 foliate-js paginator 思路，基于 DOM 测量）
 */
export function usePagination({ paragraphs, containerHeight, typographyKey }) {
  const [measureRef, setMeasureRef] = useState(null);
  const [pages, setPages] = useState([{ start: 0, end: 0 }]);
  const [currentPage, setCurrentPage] = useState(0);

  useLayoutEffect(() => {
    if (!measureRef || !containerHeight || paragraphs.length === 0) {
      setPages([{ start: 0, end: Math.max(0, paragraphs.length - 1) }]);
      setCurrentPage(0);
      return;
    }

    const els = measureRef.querySelectorAll('[data-para-idx]');
    if (els.length === 0) return;

    const ranges = [];
    let start = 0;
    let used = 0;
    const paraGap = 10;

    els.forEach((el, idx) => {
      const h = el.getBoundingClientRect().height + paraGap;
      if (used + h > containerHeight && idx > start) {
        ranges.push({ start, end: idx - 1 });
        start = idx;
        used = h;
      } else {
        used += h;
      }
    });

    if (paragraphs.length > 0) {
      ranges.push({ start, end: paragraphs.length - 1 });
    }
    if (ranges.length === 0) {
      ranges.push({ start: 0, end: 0 });
    }

    setPages(ranges);
    setCurrentPage((p) => Math.min(p, ranges.length - 1));
  }, [measureRef, paragraphs, containerHeight, typographyKey]);

  const totalPages = pages.length;
  const page = pages[currentPage] || pages[0] || { start: 0, end: 0 };

  const nextPage = useCallback(() => {
    setCurrentPage((p) => Math.min(p + 1, totalPages - 1));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setCurrentPage((p) => Math.max(p - 1, 0));
  }, []);

  const goToPage = useCallback(
    (index) => {
      setCurrentPage(Math.max(0, Math.min(index, totalPages - 1)));
    },
    [totalPages],
  );

  return {
    pages,
    page,
    currentPage,
    totalPages,
    nextPage,
    prevPage,
    goToPage,
    setMeasureRef,
  };
}
