import { Link } from 'react-router-dom';
import { BookOpen, ChevronRight } from 'lucide-react';
import { getBookCover } from './Reader/BookDecoration';
import { APP_TYPE } from '../styles/theme';

export default function ContinueReadingCard({ item }) {
  const book = item.book;
  const chapter = item.chapter;
  if (!book || !chapter) return null;

  const cover = getBookCover(book);

  return (
    <Link
      to={`/read/${chapter.id}`}
      className="flex gap-4 p-4 sm:p-6 group hover:bg-stone-50 transition-colors"
    >
      <div className="w-[72px] h-[96px] shrink-0 rounded-lg overflow-hidden bg-stone-100 border border-gray-200">
        {cover ? (
          <img src={cover} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <BookOpen size={24} />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
        <p className={APP_TYPE.label}>继续阅读</p>
        <h3 className={`${APP_TYPE.title} text-gray-900 group-hover:text-blue-600 transition-colors truncate`}>
          {book.title}
        </h3>
        <p className={`${APP_TYPE.caption} truncate`}>{chapter.title}</p>
      </div>
      <ChevronRight size={18} className="shrink-0 self-center text-gray-300 group-hover:text-gray-500" strokeWidth={1.5} />
    </Link>
  );
}
