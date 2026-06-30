import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import LoadErrorPanel from '../components/LoadErrorPanel';
import { isNotFoundError } from '../utils/apiError';
import { useReaderStore, getTheme, getFontFamily } from '../store/reader';
import { useChapter } from '../hooks/useChapter';
import { usePagination } from '../hooks/usePagination';
import { useReadingProgressSaver } from '../hooks/useReadingProgress';
import { useAmbientSound } from '../hooks/useAmbientSound';
import { groupNotesByParagraph, parseProgressCfi, parseProgressPage } from '../utils/paragraph';
import ProtectedRoute from '../components/ProtectedRoute';
import ReaderViewport from '../components/Reader/ReaderViewport';
import ReaderSettings, { ReaderHeader, ReaderFooter, ReaderActionBar } from '../components/Reader/ReaderSettings';
import NotePanel from '../components/Reader/NotePanel';
import ReviewSection from '../components/Reader/ReviewSection';
import PresenceBar from '../components/Reader/PresenceBar';
import PaymentModal from '../components/PaymentModal';
import api from '../api/config';
import ReaderChapterNav from '../components/Reader/ReaderChapterNav';
import { APP_NAME, ARTICLE_MAX } from '../styles/theme';
import { formatPrice } from '../utils/price';

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
    errorStatus,
    paymentRequired,
    reload,
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
    ambientSound,
    ambientVolume,
    showChrome,
    showSettings,
    toggleChrome,
    setShowSettings,
    toggleSettings,
  } = useReaderStore();

  useAmbientSound(ambientSound, ambientVolume);

  const theme = getTheme(themeKey);
  const [selectedParagraph, setSelectedParagraph] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [book, setBook] = useState(null);
  const [containerHeight, setContainerHeight] = useState(0);
  const [showReviews, setShowReviews] = useState(false);
  const [visibleParagraph, setVisibleParagraph] = useState(0);
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const restoredRef = useRef(false);

  const typographyKey = `${fontSize}-${lineHeight}-${fontFamily}-${readingMode}-${paragraphs.length}`;
  const pagination = usePagination({ paragraphs, containerHeight, typographyKey });
  const groupedNotes = groupNotesByParagraph(notes, paragraphs);

  const progressParagraph =
    readingMode === 'page' ? pagination.page?.start ?? 0 : visibleParagraph;

  useReadingProgressSaver(
    chapter?.book_id,
    chapterId,
    progressParagraph,
    readingMode === 'page' ? pagination.currentPage : null,
  );

  const chapterIndex = useMemo(
    () => Math.max(0, chapters.findIndex((c) => c.id === chapterId)),
    [chapters, chapterId],
  );
  const prevChapter = chapterIndex > 0 ? chapters[chapterIndex - 1] : null;
  const nextChapter = chapterIndex >= 0 && chapterIndex < chapters.length - 1 ? chapters[chapterIndex + 1] : null;

  useEffect(() => {
    if (!chapter?.book_id) return;
    setBook(null);
    Promise.all([
      api.books.detail(chapter.book_id),
      api.books.chapters(chapter.book_id),
    ])
      .then(([bookRes, chaptersRes]) => {
        setBook(bookRes.data);
        const list = chaptersRes.data?.chapters || chaptersRes.data || [];
        setChapters(Array.isArray(list) ? list : []);
      })
      .catch(() => {});
  }, [chapter?.book_id]);

  useEffect(() => {
    restoredRef.current = false;
    setVisibleParagraph(0);
    setRestoreTarget(null);
  }, [chapterId]);

  useEffect(() => {
    if (!chapter?.book_id || loading) return;

    let cancelled = false;
    api.reading
      .getBookProgress(chapter.book_id)
      .then((res) => {
        if (cancelled) return;
        const progress = res.data;
        if (!progress?.chapter_id || progress.chapter_id !== chapterId || !progress.cfi) return;

        const para = parseProgressCfi(progress.cfi);
        const page = parseProgressPage(progress.cfi);
        setVisibleParagraph(para);
        setRestoreTarget({ para, page });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [chapter?.book_id, chapterId, loading]);

  useEffect(() => {
    if (!restoreTarget || restoredRef.current) return;

    const { para, page } = restoreTarget;

    if (readingMode === 'page') {
      if (!containerHeight || pagination.totalPages <= 0) return;
      const targetPage =
        page != null
          ? page
          : pagination.pages.findIndex((p) => para >= p.start && para <= p.end);
      if (targetPage >= 0) pagination.goToPage(targetPage);
      restoredRef.current = true;
      setRestoreTarget(null);
      return;
    }

    requestAnimationFrame(() => {
      const el = document.querySelector(`[data-para-idx="${para}"]`);
      el?.scrollIntoView({ block: 'start' });
      restoredRef.current = true;
      setRestoreTarget(null);
    });
  }, [
    restoreTarget,
    readingMode,
    containerHeight,
    pagination.totalPages,
    pagination.pages,
    pagination.goToPage,
  ]);

  const handleViewportRef = useCallback((el) => {
    if (el) setContainerHeight(el.clientHeight);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (showSettings) return;
      if (readingMode === 'scroll') {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          if (nextChapter) navigate(`/read/${nextChapter.id}`);
        }
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          if (prevChapter) navigate(`/read/${prevChapter.id}`);
        }
        if (e.key === 'Escape') setShowSettings(false);
        return;
      }
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

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: chapter?.title, url });
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      /* user cancelled */
    }
  }, [chapter?.title]);

  if (loading) {
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center gap-4" style={{ backgroundColor: theme.bg, color: theme.text }}>
        <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: theme.accent, borderTopColor: 'transparent' }} />
        <p className="text-sm opacity-60 font-serif">正在打开这一章…</p>
      </div>
    );
  }

  if (paymentRequired) {
    const accessType = paymentRequired.access_type || 'vip';
    const bookId = paymentRequired.book_id;
    return (
      <div className="h-[100dvh] flex flex-col items-center justify-center gap-4 px-6" style={{ backgroundColor: theme.bg, color: theme.text }}>
        <p className="font-serif text-lg">此内容需要解锁</p>
        <p className="text-sm opacity-60 text-center">
          {accessType === 'vip' ? '开通 VIP 即可畅读' : `购买后可永久阅读 · ${formatPrice(paymentRequired.price)}`}
        </p>
        <button
          type="button"
          onClick={() => setShowPayment(true)}
          className="px-6 py-3 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          {accessType === 'vip' ? '开通 VIP' : '立即购买'}
        </button>
        {bookId && (
          <Link to={`/book/${bookId}`} className="text-sm underline opacity-80">返回书籍详情</Link>
        )}
        {showPayment && (
          <PaymentModal
            type={accessType === 'vip' ? 'vip' : 'book'}
            amount={accessType === 'vip' ? 1990 : paymentRequired.price}
            subject={accessType === 'vip' ? `${APP_NAME} VIP 月卡` : '购买本书'}
            description={accessType === 'vip' ? '畅读全部 VIP 专区作品' : '单本永久阅读权限'}
            bookId={accessType === 'paid' ? bookId : undefined}
            onClose={() => setShowPayment(false)}
            onSuccess={reload}
          />
        )}
      </div>
    );
  }

  if (error || !chapter) {
    if (errorStatus === 404 || isNotFoundError(error)) {
      return <Navigate to="/" replace state={{ notice: '章节不存在或已下架' }} />;
    }

    return (
      <div
        className="h-[100dvh] flex flex-col"
        style={{ backgroundColor: theme.bg, color: theme.text, fontFamily: getFontFamily(fontFamily) }}
      >
        <LoadErrorPanel
          message={error || '章节不存在'}
          onRetry={() => reload().catch(() => {})}
        />
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
        showChrome={showChrome}
        onBack={() => navigate(`/book/${chapter.book_id}`)}
        onOpenSettings={toggleSettings}
        onShare={handleShare}
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
        book={book || chapter?.book}
        chapter={chapter}
        chapterIndex={chapterIndex}
        chapterIdx={chapter?.idx}
        showChrome={showChrome}
        onVisibleParagraph={setVisibleParagraph}
        scrollFooter={
          readingMode === 'scroll' ? (
            <div className={`${ARTICLE_MAX} mx-auto px-5 sm:px-6`}>
              {isCompanionMode && (
                <ReviewSection
                  theme={theme}
                  reviews={reviews}
                  onSubmit={createReview}
                  onLike={likeReview}
                  isCompanionMode={isCompanionMode}
                />
              )}
              <ReaderChapterNav
                theme={theme}
                chapterIndex={chapterIndex}
                totalChapters={chapters.length}
                prevChapter={prevChapter}
                nextChapter={nextChapter}
                onPrevChapter={() => prevChapter && navigate(`/read/${prevChapter.id}`)}
                onNextChapter={() => nextChapter && navigate(`/read/${nextChapter.id}`)}
              />
            </div>
          ) : null
        }
      />

      <ReaderFooter
        theme={theme}
        showChrome={showChrome}
        readingMode={readingMode}
        currentPage={pagination.currentPage}
        totalPages={pagination.totalPages}
        chapterIndex={chapterIndex}
        totalChapters={chapters.length}
        canPrevChapter={!!prevChapter}
        canNextChapter={!!nextChapter}
        onPrevPage={pagination.prevPage}
        onNextPage={pagination.nextPage}
        onPrevChapter={() => prevChapter && navigate(`/read/${prevChapter.id}`)}
        onNextChapter={() => nextChapter && navigate(`/read/${nextChapter.id}`)}
      />

      {readingMode === 'scroll' && (
        <ReaderActionBar
          theme={theme}
          showChrome={showChrome}
          noteCount={notes.length}
          reviewCount={reviews.length}
          onOpenReviews={() => setShowReviews(true)}
          onOpenSettings={toggleSettings}
        />
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
