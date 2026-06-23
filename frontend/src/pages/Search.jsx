import { useState } from 'react';
import api from '../api/config';
import BookCard from '../components/BookCard';
import { APP_THEME, APP_CLASSES } from '../styles/theme';
import { Search as SearchIcon } from 'lucide-react';

export default function Search() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      setIsLoading(true);
      setHasSearched(true);
      const res = await api.search({ q: query, type: 'book', page: 1, page_size: 20 });
      setResults(res.data?.books || []);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-serif font-semibold mb-2">搜索书籍</h1>
      <p className="text-sm opacity-60 mb-6">按书名或作者查找</p>

      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="输入关键词..."
            className={`${APP_CLASSES.input} flex-1`}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-3 rounded-xl font-medium flex items-center gap-2 disabled:opacity-50 shrink-0"
            style={{ backgroundColor: APP_THEME.accent, color: APP_THEME.bg }}
          >
            <SearchIcon size={18} />
            搜索
          </button>
        </div>
      </form>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: APP_THEME.accent }} />
        </div>
      ) : hasSearched ? (
        results.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {results.map((book) => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 opacity-50">未找到相关书籍</div>
        )
      ) : (
        <div className="text-center py-16 opacity-40">输入关键词开始搜索</div>
      )}
    </div>
  );
}
