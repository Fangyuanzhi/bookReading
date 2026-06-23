import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useReaderStore, getTheme, getFontFamily } from '../store/reader';
import { useChapter } from '../hooks/useChapter';
import { usePagination } from '../hooks/usePagination';
import { groupNotesByParagraph } from '../utils/paragraph';
import ProtectedRoute from '../components/ProtectedRoute';
import ReaderViewport from '../components/Reader/ReaderViewport';
import ReaderSettings, { ReaderHeader, ReaderFooter } from '../components/Reader/ReaderSettings';
import NotePanel from '../components/Reader/NotePanel';
import ReviewSection from '../components/Reader/ReviewSection';
import PresenceBar from '../components/Reader/PresenceBar';
import api from '../api/config';

function ReaderContent() {
  const { chapterId } = useParams();
  const navigate = useNavigate();
  const {
    chapter,
    paragraphs,
    notes,
    reviews,
    presence,
    loading,
    error,
    createNote,
    likeNote,
    createReview,
    likeReview,
  } = useChapter(chapterId);

  const {
    theme: themeKey,
    fontSize,
    lineHeight,
    fontFamily,
    readingMode,
    isCompanionMode,
    showChrome,
    showSettings,
    toggleChrome,
    setShowSettings,
    toggleSettings,
  } = useReaderStore();

  const theme = getTheme(themeKey);
  const [selectedParagraph, setSelectedParagraph] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [containerHeight, setContainerHeight] = useState(0);
  const [showReviews, setShowReviews] = useState(false);

  const typographyKey = `${fontSize}-${lineHeight}-${fontFamily}-${readingMode}-${paragraphs.length}`;
  const pagination = usePagination({ paragraphs, containerHeight, typographyKey });
  const groupedNotes = groupNotesByParagraph(notes, paragraphs);

  const chapterIndex = useMemo(
    () => Math.max(0, chapters.findIndex((c) => c.id === chapterId)),
    [chapters, chapterId],
  );
  const prevChapter = chapterIndex > 0 ? chapters[chapterIndex - 1] : null;
  const nextChapter = chapterIndex >= 0 && chapterIndex < chapters.length - 1 ? chapters[chapterIndex + 1] : null;

  useEffect(() => {
    if (!chapter?.book_id) return;
    api.books.chapters(chapter.book_id).then((res) => {
      const list = res.data?.chapters || res.data || [];
      setChapters(Array.isArray(list) ? list : []);
    }).catch(() => {});
  }, [chapter?.book_id]);

  const handleViewportRef = useCallback((el) => {
    if (el) setContainerHeight(el.clientHeight);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (showSettings) return;
      if (readingMode !== 'page') return;
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        if (pagination.currentPage < pagination.totalPages - 1) pagination.nextPage();
        else if (nextChapter) navigate(`/read/${nextChapter.id}`);
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (pagination.currentPage > 0) pagination.prevPage();
        else if (prevChapter) navigate(`/read/${prevChapter.id}`);
      }
      if (e.key === 'Escape') setShowSettings(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [showSettings, readingMode, pagination, nextChapter, prevChapter, navigate, setShowSettings]);

  if (loading) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center gap-4" style={{ backgroundColor: theme.bg, color: theme.text }}>
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: theme.accent, borderTopColor: 'transparent' }} />
        <p className="text-sm opacity-60 font-serif">正在打开这一章…</p>
      </div>
    );
  }

  if (error || !chapter) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center gap-4 px-6" style={{ backgroundColor: theme.bg, color: theme.text }}>
        <p className="text-red-400">加载失败：{error || '章节不存在'}</p>
        <Link to="/" className="text-sm underline opacity-80">返回首页</Link>
      </div>
    );
  }

  return (
    <div
      className="h-[100dvh] flex flex-col overflow-hidden transition-colors duration-300"
      style={{ backgroundColor: theme.bg, color: theme.text, fontFamily: getFontFamily(fontFamily) }}
    >
      <ReaderHeader
        theme={theme}
        title={chapter.title}
        showChrome={showChrome}
        presenceCount={presence.count}
        isCompanionMode={isCompanionMode}
        onBack={() => navigate(`/book/${chapter.book_id}`)}
        onOpenSettings={toggleSettings}
      />

      {isCompanionMode && showChrome && <PresenceBar theme={theme} count={presence.count} />}

      <ReaderViewport
        paragraphs={paragraphs}
        notes={notes}
        theme={theme}
        selectedIndex={selectedParagraph}
        onSelectParagraph={setSelectedParagraph}
        isCompanionMode={isCompanionMode}
        onTapCenter={toggleChrome}
        pagination={pagination}
        onViewportRef={handleViewportRef}
        book={chapter?.book}
        chapterIndex={chapterIndex}
        scrollFooter={
          readingMode === 'scroll' && isCompanionMode ? (
            <ReviewSection
              theme={theme}
              reviews={reviews}
              onSubmit={createReview}
              onLike={likeReview}
              isCompanionMode={isCompanionMode}
            />
          ) : null
        }
      />

      <ReaderFooter
        theme={theme}
        showChrome={showChrome}
        readingMode={readingMode}
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        canPrevChapter={!!prevChapter}
        canNextChapter={!!nextChapter}
        onPrevPage={pagination.prevPage}
        onNextPage={pagination.nextPage}
        onPrevChapter={() => prevChapter && navigate(`/read/${prevChapter.id}`)}
        onNextChapter={() => nextChapter && navigate(`/read/${nextChapter.id}`)}
      />

      {readingMode === 'scroll' && showChrome && (
        <div className="shrink-0 border-t px-4 py-2 text-center text-xs opacity-50" style={{ borderColor: theme.line }}>
          {isCompanionMode ? '点击段落可写段评 · 滚到底部看章评' : '点击中间区域可隐藏工具栏'}
        </div>
      )}

      {readingMode === 'page' && isCompanionMode && showChrome && (
        <button
          type="button"
          onClick={() => setShowReviews(true)}
          className="fixed bottom-24 right-4 z-30 px-4 py-2 rounded-full text-sm shadow-lg border backdrop-blur-md"
          style={{ backgroundColor: `${theme.bgPanel}ee`, borderColor: theme.line, color: theme.accent }}
        >
          章评 {reviews.length > 0 && `(${reviews.length})`}
        </button>
      )}

      {showReviews && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setShowReviews(false)} />
          <div
            className="relative max-h-[70vh] overflow-y-auto rounded-t-2xl border-t shadow-2xl animate-slide-up"
            style={{ backgroundColor: theme.bgPanel, borderColor: theme.line }}
          >
            <ReviewSection
              theme={theme}
              reviews={reviews}
              onSubmit={createReview}
              onLike={likeReview}
              isCompanionMode={isCompanionMode}
            />
          </div>
        </div>
      )}

      {!showChrome && (
        <button
          type="button"
          onClick={toggleChrome}
          className="fixed top-4 right-4 z-30 p-3 rounded-full shadow-lg border backdrop-blur-md opacity-80 hover:opacity-100"
          style={{ backgroundColor: `${theme.bgPanel}dd`, borderColor: theme.line, color: theme.text }}
          title="显示工具栏"
        >
          <span className="text-xs font-medium px-1">菜单</span>
        </button>
      )}

      {showSettings && <ReaderSettings theme={theme} onClose={() => setShowSettings(false)} />}

      {selectedParagraph !== null && paragraphs[selectedParagraph] && (
        <NotePanel
          theme={theme}
          paragraphIndex={selectedParagraph}
          paragraphText={paragraphs[selectedParagraph]}
          notes={groupedNotes[selectedParagraph] || []}
          onClose={() => setSelectedParagraph(null)}
          onSubmit={(body) => createNote(selectedParagraph, body)}
          onLike={likeNote}
          isCompanionMode={isCompanionMode}
        />
      )}
    </div>
  );
}

export default function Reader() {
  return (
    <ProtectedRoute>
      <ReaderContent />
    </ProtectedRoute>
  );
}
