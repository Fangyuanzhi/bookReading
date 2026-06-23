import { useEffect, useMemo, useRef, useState } from 'react';
import { groupNotesByParagraph } from '../../utils/paragraph';
import { getFontFamily, useReaderStore } from '../../store/reader';
import { getChapterIllustration } from './BookDecoration';
import ParagraphBlock from './ParagraphBlock';

export default function ReaderViewport({
  paragraphs,
  notes,
  theme,
  selectedIndex,
  onSelectParagraph,
  isCompanionMode,
  onTapCenter,
  pagination,
  onViewportRef,
  scrollFooter,
  book,
  chapterIndex,
}) {
  const { fontSize, lineHeight, fontFamily, readingMode } = useReaderStore();
  const fontFamilyValue = getFontFamily(fontFamily);
  const grouped = useMemo(() => groupNotesByParagraph(notes, paragraphs), [notes, paragraphs]);

  const viewportRef = useRef(null);
  const [pageAnim, setPageAnim] = useState('');
  const touchStartX = useRef(null);

  const illustration = getChapterIllustration(book, chapterIndex);

  const { page, currentPage, totalPages, nextPage, prevPage, setMeasureRef } = pagination;

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return undefined;
    onViewportRef?.(el);
    const ro = new ResizeObserver(() => onViewportRef?.(el));
    ro.observe(el);
    return () => ro.disconnect();
  }, [onViewportRef, readingMode]);

  const triggerAnim = (dir) => {
    setPageAnim(dir === 'next' ? 'reader-page-next' : 'reader-page-prev');
    setTimeout(() => setPageAnim(''), 280);
  };

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      triggerAnim('next');
      nextPage();
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      triggerAnim('prev');
      prevPage();
    }
  };

  const handlePageClick = (e) => {
    if ((e.target).closest('button, a, [role="button"]')) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    if (ratio < 0.28) handlePrev();
    else if (ratio > 0.72) handleNext();
    else onTapCenter?.();
  };

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0]?.clientX;
  };

  const handleTouchEnd = (e) => {
    const start = touchStartX.current;
    const end = e.changedTouches[0]?.clientX;
    if (start == null || end == null) return;
    const delta = end - start;
    if (Math.abs(delta) < 50) return;
    if (delta < 0) handleNext();
    else handlePrev();
  };

  const blockProps = {
    theme,
    fontSize,
    lineHeight,
    fontFamily: fontFamilyValue,
    isCompanionMode,
    onSelect: onSelectParagraph,
  };

  const visibleParagraphs =
    readingMode === 'page'
      ? paragraphs.slice(page.start, page.end + 1).map((para, i) => ({
          para,
          index: page.start + i,
        }))
      : paragraphs.map((para, index) => ({ para, index }));

  if (readingMode === 'scroll') {
    return (
      <div ref={viewportRef} className="flex-1 min-h-0 overflow-y-auto reader-scroll paper-texture">
        <article className="max-w-2xl mx-auto px-5 sm:px-8 py-8">
          {illustration && (
            <figure className="mb-8 rounded-xl overflow-hidden border shadow-md" style={{ borderColor: theme.line }}>
              <img src={illustration} alt="章节插图" className="w-full h-auto" />
            </figure>
          )}
          {visibleParagraphs.map(({ para, index }) => (
            <ParagraphBlock
              key={index}
              {...blockProps}
              para={para}
              index={index}
              noteCount={(grouped[index] || []).length}
              isSelected={selectedIndex === index}
            />
          ))}
          {paragraphs.length === 0 && (
            <p className="text-center opacity-50 font-sans py-20">本章暂无内容</p>
          )}
        </article>
        {scrollFooter}
      </div>
    );
  }

  const measureWidth = viewportRef.current?.clientWidth || undefined;

  return (
    <>
      <div
        ref={setMeasureRef}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 opacity-0 -z-10"
        style={{ width: measureWidth || '100vw', visibility: 'hidden' }}
      >
        <div className="max-w-2xl mx-auto px-5 sm:px-8">
          {paragraphs.map((para, index) => (
            <ParagraphBlock key={index} {...blockProps} para={para} index={index} measureOnly />
          ))}
        </div>
      </div>

      <div
        ref={viewportRef}
        className={`flex-1 min-h-0 relative select-none ${pageAnim} paper-texture`}
        onClick={handlePageClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        role="presentation"
      >
        <article className="h-full max-w-2xl mx-auto px-5 sm:px-8 py-6 overflow-hidden">
          {illustration && currentPage === 0 && (
            <figure className="mb-6 rounded-xl overflow-hidden border shadow-md" style={{ borderColor: theme.line }}>
              <img src={illustration} alt="章节插图" className="w-full h-auto" />
            </figure>
          )}
          {visibleParagraphs.map(({ para, index }) => (
            <ParagraphBlock
              key={index}
              {...blockProps}
              para={para}
              index={index}
              noteCount={(grouped[index] || []).length}
              isSelected={selectedIndex === index}
            />
          ))}
          {paragraphs.length === 0 && (
            <p className="text-center opacity-50 font-sans py-20">本章暂无内容</p>
          )}
        </article>
      </div>
    </>
  );
}

export { ReaderViewport };
