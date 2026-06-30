import { getBookCover } from './BookDecoration';
import { APP_TYPE } from '../../styles/theme';

/** 阅读页文章头：UI 无衬线；正文在 ParagraphBlock 内用 serif */
export default function ReaderArticleHeader({ book, chapter, theme }) {
  if (!chapter) return null;

  const cover = book ? getBookCover(book) : null;
  const authorInitial = (book?.author || chapter.title || '?').charAt(0);

  return (
    <header className="reader-masthead mb-6">
      {book?.title && <p className={`${APP_TYPE.label} mb-4`}>{book.title}</p>}

      <h1 className={`${APP_TYPE.display} mb-4 font-sans`} style={{ color: theme.text }}>
        {chapter.title}
      </h1>

      {book?.description && (
        <p className={`${APP_TYPE.body} mb-4 font-sans`} style={{ color: theme.soft }}>
          {book.description.length > 120 ? `${book.description.slice(0, 120)}…` : book.description}
        </p>
      )}

      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="min-w-0">
          <p className={APP_TYPE.label}>{book?.author || '佚名'}</p>
          <p className={`${APP_TYPE.caption} mt-1`}>第 {chapter.idx ?? 1} 卷</p>
        </div>
        <div
          className="w-10 h-10 rounded-full shrink-0 overflow-hidden flex items-center justify-center text-sm font-semibold border border-gray-200 bg-stone-100 text-gray-500"
        >
          {cover ? (
            <img src={cover} alt="" className="w-full h-full object-cover" />
          ) : (
            authorInitial
          )}
        </div>
      </div>
    </header>
  );
}

export { ReaderArticleHeader };
