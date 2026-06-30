import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { getBookCover } from './Reader/BookDecoration';
import { APP_TYPE } from '../styles/theme';

export default function BookCard({ book }) {
  const cover = getBookCover(book);

  return (
    <Link
      to={`/book/${book.id}`}
      className="flex gap-4 p-4 sm:p-6 group hover:bg-stone-50 transition-colors"
    >
      <div className="w-[72px] h-[96px] sm:w-20 sm:h-[108px] shrink-0 rounded-lg overflow-hidden bg-stone-100 border border-gray-200">
        {cover ? (
          <img src={cover} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs px-1 text-center">
            {book.title.slice(0, 4)}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center gap-2">
        <p className={APP_TYPE.label}>{book.author || '佚名'}</p>
        <h3 className={`${APP_TYPE.title} text-gray-900 group-hover:text-blue-600 transition-colors`}>
          {book.title}
        </h3>
        {book.description && (
          <p className={`${APP_TYPE.caption} line-clamp-2`}>{book.description}</p>
        )}
      </div>

      <ChevronRight size={18} className="shrink-0 self-center text-gray-300 group-hover:text-gray-500" strokeWidth={1.5} />
    </Link>
  );
}
