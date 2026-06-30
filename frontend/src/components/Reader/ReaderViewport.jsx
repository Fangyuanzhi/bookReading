import { useEffect, useMemo, useRef, useState } from 'react';
import { groupNotesByParagraph } from '../../utils/paragraph';
import { getFontFamily, useReaderStore } from '../../store/reader';
import { getChapterIllustration, getChapterIllustrationCredit } from './BookDecoration';
import { getBookCharacterNames } from '../../utils/highlightNames.jsx';
import ReaderArticleHeader from './ReaderArticleHeader';
import ParagraphBlock from './ParagraphBlock';
import ReaderScrollProgress from './ReaderScrollProgress';
import { ARTICLE_MAX } from '../../styles/theme';

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
  chapterIdx,
  chapter,
  showMasthead = true,
  onVisibleParagraph,
  showChrome = true,
}) {
  const { fontSize, lineHeight, fontFamily, readingMode } = useReaderStore();
  const fontFamilyValue = getFontFamily(fontFamily);
  const characterNames = useMemo(() => getBookCharacterNames(book), [book]);
  const grouped = useMemo(() => groupNotesByParagraph(notes, paragraphs), [notes, paragraphs]);

  const viewportRef = useRef(null);
  const [pageAnim, setPageAnim] = useState('');
  const touchStartX = useRef(null);

  const illustration = getChapterIllustration(book, chapterIndex, chapterIdx);
  const illustrationCredit = getChapterIllustrationCredit(book, chapterIdx ?? chapterIndex + 1);
  const { page, currentPage, totalPages, nextPage, prevPage, setMeasureRef } = pagination;

  const illustrationBlock = illustration ? (
    <figure className="mb-8 -mx-1">
      <img
        src={illustration}
        alt={illustrationCredit?.title || '章节插图'}
        className="w-full max-h-[280px] sm:max-h-[360px] object-cover rounded-sm"
      />
      {illustrationCredit && (
        <figcaption className="mt-2 text-[11px] font-sans leading-relaxed" style={{ color: theme.soft }}>
          {illustrationCredit.title}
          {illustrationCredit.artist ? ` · ${illustrationCredit.artist}` : ''}
          {illustrationCredit.year ? ` (${illustrationCredit.year})` : ''}
        </figcaption>
      )}
    </figure>
  ) : null;

  const masthead =
    showMasthead && chapter && (readingMode === 'scroll' || currentPage === 0) ? (
      <ReaderArticleHeader book={book} chapter={chapter} theme={theme} />
    ) : null;

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return undefined;
    onViewportRef?.(el);
    const ro = new ResizeObserver(() => onViewportRef?.(el));
    ro.observe(el);
    return () => ro.disconnect();
  }, [onViewportRef, readingMode]);

  useEffect(() => {
    if (readingMode !== 'scroll' || !onVisibleParagraph) return undefined;
    const root = viewportRef.current;
    if (!root) return undefined;

    const report = () => {
      const paras = root.querySelectorAll('[data-para-idx]');
      for (const el of paras) {
        const rect = el.getBoundingClientRect();
        if (rect.top >= 64 && rect.top < window.innerHeight * 0.45) {
          onVisibleParagraph(Number(el.dataset.paraIdx));
          return;
        }
      }
    };

    report();
    root.addEventListener('scroll', report, { passive: true });
    return () => root.removeEventListener('scroll', report);
  }, [readingMode, onVisibleParagraph, paragraphs.length]);

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
    characterNames,
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
      <>
        <ReaderScrollProgress viewportRef={viewportRef} theme={theme} showChrome={showChrome} />
        <div ref={viewportRef} className="flex-1 min-h-0 overflow-y-auto reader-scroll">
          <article className={`${ARTICLE_MAX} mx-auto px-5 sm:px-6 pt-4 pb-24`}>
          {masthead}
          {illustrationBlock}
          {(masthead || illustrationBlock) && (
            <hr className="reader-rule mb-8" style={{ borderColor: theme.line }} />
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
      </>
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
        <div className={`${ARTICLE_MAX} mx-auto px-5 sm:px-6`}>
          {paragraphs.map((para, index) => (
            <ParagraphBlock key={index} {...blockProps} para={para} index={index} measureOnly />
          ))}
        </div>
      </div>

      <div
        ref={viewportRef}
        className={`flex-1 min-h-0 relative select-none ${pageAnim}`}
        onClick={handlePageClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        role="presentation"
      >
        <article className={`h-full ${ARTICLE_MAX} mx-auto px-5 sm:px-6 py-4 overflow-hidden`}>
          {masthead}
          {illustrationBlock && currentPage === 0 ? illustrationBlock : null}
          {currentPage === 0 && (masthead || illustrationBlock) && (
            <hr className="reader-rule mb-4" style={{ borderColor: theme.line }} />
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
