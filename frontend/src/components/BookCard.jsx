import { Link } from 'react-router-dom';
import { BookOpen, Users } from 'lucide-react';
import { APP_THEME, APP_CLASSES } from '../styles/theme';

function resolveCover(book) {
  if (!book.cover_url) return null;
  if (book.cover_url.startsWith('http') || book.cover_url.startsWith('/')) return book.cover_url;
  return `/covers/${book.cover_url}`;
}

export default function BookCard({ book }) {
  const cover = resolveCover(book);
  return (
    <Link
      to={`/book/${book.id}`}
      className={`${APP_CLASSES.card} block overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl group`}
      style={{ backgroundColor: APP_THEME.bgPanel, borderColor: APP_THEME.line }}
    >
      <div
        className="aspect-[3/4] flex items-center justify-center relative overflow-hidden book-spine-shadow"
        style={{ backgroundColor: APP_THEME.bgRaised }}
      >
        {cover ? (
          <img src={cover} alt={book.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="flex flex-col items-center gap-2 opacity-40">
            <BookOpen size={40} style={{ color: APP_THEME.faint }} />
            <span className="text-xs font-serif px-3 text-center line-clamp-2">{book.title}</span>
          </div>
        )}
        {/* physical book spine highlight */}
        <div
          className="absolute left-0 top-0 bottom-0 w-2 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, rgba(255,255,255,0.18), rgba(255,255,255,0.02) 60%, transparent)',
          }}
        />
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4"
          style={{ background: 'linear-gradient(transparent 40%, rgba(36,28,26,0.9))' }}
        >
          <span className="text-xs flex items-center gap-1.5 font-medium" style={{ color: APP_THEME.accent }}>
            <Users size={12} /> 一起读
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-serif font-semibold truncate group-hover:text-[#E0A24E] transition-colors">{book.title}</h3>
        <p className="text-sm mt-1 opacity-60">{book.author || '佚名'}</p>
        {book.description && (
          <p className="text-xs mt-2 line-clamp-2 opacity-45 leading-relaxed">{book.description}</p>
        )}
      </div>
    </Link>
  );
}
