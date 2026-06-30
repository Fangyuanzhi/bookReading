import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Map, Users } from 'lucide-react';
import api from '../api/config';
import { useAuthStore } from '../store/auth';
import LoreMapPanel from '../components/Lore/LoreMapPanel';
import LoreCharacterPanel from '../components/Lore/LoreCharacterPanel';
import {
  computeMaxChapterIdx,
  countLoreProgress,
  getBookLore,
  hasBookLore,
} from '../utils/lore';

export default function BookWorld() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [book, setBook] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [progress, setProgress] = useState(null);
  const [tab, setTab] = useState('map');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const reqs = [api.books.detail(id), api.books.chapters(id)];
        if (user) {
          reqs.push(api.reading.getBookProgress(id).catch(() => ({ data: null })));
        }
        const results = await Promise.all(reqs);
        if (cancelled) return;
        const bookData = results[0].data;
        if (!hasBookLore(bookData)) {
          setError('此书暂未开放世界图谱');
          return;
        }
        setBook(bookData);
        setChapters(results[1].data?.chapters || results[1].data || []);
        if (user && results[2]) setProgress(results[2].data);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, user]);

  const lore = getBookLore(book);
  const maxChapterIdx = computeMaxChapterIdx(chapters, progress);
  const stats = countLoreProgress(lore, maxChapterIdx);
  const pct = stats.total ? Math.round((stats.unlocked / stats.total) * 100) : 0;

  const openDetail = useCallback(
    (entityType, entityId) => {
      navigate(`/book/${id}/world/${entityType}/${entityId}`);
    },
    [id, navigate],
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex justify-center items-center bg-stone-950">
        <div className="w-8 h-8 rounded-full border-2 border-amber-900 border-t-amber-400 animate-spin" />
      </div>
    );
  }

  if (error || !book || !lore) {
    return (
      <div className="max-w-lg mx-auto text-center py-24">
        <p className="text-red-400">{error || '无法加载世界图谱'}</p>
        <Link to={`/book/${id}`} className="text-amber-400 mt-4 inline-block">
          返回书籍
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 -mx-4 sm:-mx-6 px-4 sm:px-6 py-6 pb-16">
      <div className="max-w-2xl mx-auto flex flex-col gap-6">
        <header className="flex items-center gap-3">
          <Link
            to={`/book/${id}`}
            className="p-2 rounded-lg border border-amber-200/15 text-stone-400 hover:text-amber-100 hover:border-amber-200/30 bg-black/20"
            aria-label="返回"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-[0.3em] text-amber-200/50">World Codex</p>
            <h1 className="font-serif text-xl text-amber-50 truncate">{book.title}</h1>
          </div>
        </header>

        {/* 探索进度 */}
        <div className="rounded-2xl border border-amber-200/10 bg-black/30 backdrop-blur-sm p-4">
          <div className="flex items-end justify-between gap-4 mb-3">
            <div>
              <p className="text-sm text-stone-400">
                世界探索度
                <span className="ml-2 font-serif text-2xl text-amber-100">{pct}%</span>
              </p>
              <p className="text-xs text-stone-500 mt-1">
                {stats.unlocked}/{stats.total} 已显现 · 已读至第 {maxChapterIdx} 卷
              </p>
            </div>
          </div>
          <div className="h-1.5 bg-stone-800 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-700 via-amber-400 to-amber-200 transition-all duration-700"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Tab */}
        <div className="flex gap-2 p-1 rounded-xl bg-black/40 border border-amber-200/10">
          <button
            type="button"
            onClick={() => setTab('map')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === 'map'
                ? 'bg-amber-100/10 text-amber-100 shadow-inner ring-1 ring-amber-200/20'
                : 'text-stone-500 hover:text-stone-300'
            }`}
          >
            <Map size={16} />
            大地图
          </button>
          <button
            type="button"
            onClick={() => setTab('characters')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              tab === 'characters'
                ? 'bg-amber-100/10 text-amber-100 shadow-inner ring-1 ring-amber-200/20'
                : 'text-stone-500 hover:text-stone-300'
            }`}
          >
            <Users size={16} />
            人物关系
          </button>
        </div>

        {tab === 'map' ? (
          <LoreMapPanel
            regions={lore.map.regions}
            maxChapterIdx={maxChapterIdx}
            onOpenDetail={openDetail}
          />
        ) : (
          <LoreCharacterPanel
            characters={lore.characters}
            maxChapterIdx={maxChapterIdx}
            onOpenDetail={openDetail}
          />
        )}

        <p className="text-center text-[11px] text-stone-600 tracking-wide">
          单击标记阅读简介 · 连点两次进入详页
        </p>
      </div>
    </div>
  );
}
