import { ChevronLeft, ChevronRight } from 'lucide-react';

/** 滚动模式章末/章间导航 */
export default function ReaderChapterNav({
  theme,
  chapterIndex,
  totalChapters,
  prevChapter,
  nextChapter,
  onPrevChapter,
  onNextChapter,
}) {
  if (totalChapters <= 0) return null;

  return (
    <nav
      className="border-t mt-8 pt-6 pb-2"
      style={{ borderColor: theme.line }}
      aria-label="章节导航"
    >
      <p className="text-center text-xs font-sans mb-4 tabular-nums" style={{ color: theme.soft }}>
        第 {chapterIndex + 1} / {totalChapters} 章
      </p>
      <div className="flex items-stretch gap-3">
        <button
          type="button"
          disabled={!prevChapter}
          onClick={onPrevChapter}
          className="flex-1 flex items-center justify-center gap-1 py-3 px-3 rounded-lg border text-sm font-sans transition-opacity disabled:opacity-30"
          style={{ borderColor: theme.line, color: theme.text, backgroundColor: theme.bgRaised }}
        >
          <ChevronLeft size={18} />
          上一章
        </button>
        <button
          type="button"
          disabled={!nextChapter}
          onClick={onNextChapter}
          className="flex-1 flex items-center justify-center gap-1 py-3 px-3 rounded-lg border text-sm font-sans transition-opacity disabled:opacity-30"
          style={{
            borderColor: nextChapter ? theme.accent : theme.line,
            color: nextChapter ? theme.accent : theme.text,
            backgroundColor: nextChapter ? theme.glow : theme.bgRaised,
          }}
        >
          下一章
          <ChevronRight size={18} />
        </button>
      </div>
    </nav>
  );
}
