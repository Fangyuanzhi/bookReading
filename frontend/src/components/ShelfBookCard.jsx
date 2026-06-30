import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight, X } from 'lucide-react';
import { getBookCover } from './Reader/BookDecoration';
import { APP_TYPE } from '../styles/theme';

export default function ShelfBookCard({ item, onRemove }) {
  const book = item.book;
  const progress = item.progress;
  const chapter = progress?.chapter;

  if (!book) return null;

  const cover = getBookCover(book);
  const readTarget = chapter?.id;

  return (
    <div className="flex gap-4 p-4 sm:p-6 group hover:bg-stone-50 transition-colors">
      <Link to={`/book/${book.id}`} className="w-[72px] h-[96px] shrink-0 rounded-lg overflow-hidden bg-stone-100 border border-gray-200">
        {cover ? (
          <img src={cover} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <BookOpen size={24} />
          </div>
        )}
      </Link>

      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
        <p className={APP_TYPE.label}>{book.author || '佚名'}</p>
        <Link
          to={`/book/${book.id}`}
          className={`${APP_TYPE.title} text-gray-900 group-hover:text-blue-600 transition-colors truncate`}
        >
          {book.title}
        </Link>
        {chapter ? (
          <Link to={`/read/${chapter.id}`} className={`${APP_TYPE.caption} truncate hover:text-blue-600`}>
            读到：{chapter.title}
          </Link>
        ) : (
          <p className={`${APP_TYPE.caption}`}>尚未开始阅读</p>
        )}
      </div>

      <div className="flex flex-col items-end justify-center gap-2 shrink-0">
        {readTarget ? (
          <Link
            to={`/read/${readTarget}`}
            className="text-sm text-blue-600 hover:text-blue-700 whitespace-nowrap"
          >
            继续
          </Link>
        ) : (
          <Link to={`/book/${book.id}`} className="text-sm text-blue-600 hover:text-blue-700 whitespace-nowrap">
            开始
          </Link>
        )}
        {onRemove && (
          <button
            type="button"
            onClick={() => onRemove(book.id)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="移出书架"
            aria-label="移出书架"
          >
            <X size={16} />
          </button>
        )}
        <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-500 hidden sm:block" strokeWidth={1.5} />
      </div>
    </div>
  );
}
