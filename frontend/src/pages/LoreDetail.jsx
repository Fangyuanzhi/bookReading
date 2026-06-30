import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, MapPin, User } from 'lucide-react';
import api from '../api/config';
import { useAuthStore } from '../store/auth';
import {
  computeMaxChapterIdx,
  getBookLore,
  getChapterLink,
  getLoreEntity,
  isLoreUnlocked,
} from '../utils/lore';

export default function LoreDetail() {
  const { id, entityType, entityId } = useParams();
  const { user } = useAuthStore();
  const [book, setBook] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const reqs = [api.books.detail(id), api.books.chapters(id)];
        if (user) {
          reqs.push(api.reading.getBookProgress(id).catch(() => ({ data: null })));
        }
        const results = await Promise.all(reqs);
        if (cancelled) return;
        setBook(results[0].data);
        setChapters(results[1].data?.chapters || results[1].data || []);
        if (user && results[2]) setProgress(results[2].data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, user]);

  const lore = getBookLore(book);
  const entity = getLoreEntity(lore, entityType, entityId);
  const maxChapterIdx = computeMaxChapterIdx(chapters, progress);
  const unlocked = entity ? isLoreUnlocked(entity.unlockChapter, maxChapterIdx) : false;
  const detail = entity?.detail;
  const isLocation = entityType === 'location';

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-blue-600 animate-spin" />
      </div>
    );
  }

  if (!book || !lore || !entity) {
    return (
      <div className="max-w-lg mx-auto text-center py-24 text-gray-600">
        未找到该条目
        <Link to={`/book/${id}/world`} className="block text-blue-600 mt-4">
          返回世界图谱
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950 -mx-4 sm:-mx-6 px-4 sm:px-6 py-6 pb-16">
      <div className="max-w-2xl mx-auto flex flex-col gap-5">
        <header className="flex items-center gap-3">
          <Link
            to={`/book/${id}/world`}
            className="p-2 rounded-lg border border-amber-200/15 text-stone-400 hover:text-amber-100 bg-black/20"
            aria-label="返回图谱"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-[0.25em] text-amber-200/50">
              {isLocation ? 'Topographia' : 'Persona'}
            </p>
            <h1 className="font-serif text-xl text-amber-50">{entity.name}</h1>
            {entity.role && !isLocation && (
              <p className="text-xs text-stone-500 mt-0.5">{entity.role}</p>
            )}
          </div>
          <span
            className={`shrink-0 p-2.5 rounded-xl ring-1 ${
              isLocation
                ? 'bg-sky-950/50 text-sky-300 ring-sky-400/20'
                : 'bg-amber-950/50 text-amber-300 ring-amber-400/20'
            }`}
          >
            {isLocation ? <MapPin size={20} /> : <User size={20} />}
          </span>
        </header>

      {!unlocked ? (
        <div className="rounded-2xl border border-amber-200/10 bg-black/30 p-8 text-center">
          <p className="text-stone-400">阅读至第 {entity.unlockChapter} 卷后解锁详情</p>
          {chapters[0] && (
            <Link
              to={`/read/${chapters[Math.min(entity.unlockChapter - 1, chapters.length - 1)]?.id || chapters[0].id}`}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-600/90 text-amber-50 text-sm"
            >
              <BookOpen size={16} />
              前往阅读
            </Link>
          )}
        </div>
      ) : (
        <>
          <LoreSection title="阶段介绍">{entity.stageIntro}</LoreSection>
          {detail?.summary && <LoreSection title="概述">{detail.summary}</LoreSection>}
          {detail?.life && <LoreSection title="人物背景">{detail.life}</LoreSection>}
          {detail?.features?.length > 0 && (
            <LoreSection title="地域 / 概念特色">
              <ul className="flex flex-col gap-2.5">
                {detail.features.map((f) => (
                  <li key={f} className="text-sm text-stone-300 pl-3 border-l-2 border-amber-500/40 leading-relaxed">
                    {f}
                  </li>
                ))}
              </ul>
            </LoreSection>
          )}

          {entity.relations?.length > 0 && (
            <LoreSection title="人物关系">
              <ul className="flex flex-col gap-2">
                {entity.relations
                  .filter((r) => isLoreUnlocked(r.unlockChapter, maxChapterIdx))
                  .map((rel) => {
                    const targetChar = lore.characters.find((c) => c.id === rel.target);
                    const targetLoc = lore.map?.regions?.find((r) => r.id === rel.target);
                    const targetName = targetChar?.name || targetLoc?.name || rel.target;
                    const targetType = targetChar ? 'character' : 'location';
                    const targetUnlocked = targetChar
                      ? isLoreUnlocked(targetChar.unlockChapter, maxChapterIdx)
                      : targetLoc
                        ? isLoreUnlocked(targetLoc.unlockChapter, maxChapterIdx)
                        : false;
                    return (
                      <li key={rel.target + rel.label}>
                        {targetUnlocked ? (
                          <Link
                            to={`/book/${id}/world/${targetType}/${rel.target}`}
                            className="text-sm text-amber-400/90 hover:text-amber-300 hover:underline"
                          >
                            {rel.label} · {targetName}
                          </Link>
                        ) : (
                          <span className="text-sm text-stone-600">
                            {rel.label} · ???（尚未解锁）
                          </span>
                        )}
                      </li>
                    );
                  })}
              </ul>
            </LoreSection>
          )}

          {detail?.appearances?.length > 0 && (
            <LoreSection title="出现章节">
              <ul className="flex flex-col gap-0 divide-y divide-stone-800">
                {detail.appearances.map((app) => {
                  const href = getChapterLink(chapters, app.chapter);
                  return (
                    <li
                      key={`${app.chapter}-${app.note}`}
                      className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 py-3 first:pt-0 last:pb-0"
                    >
                      {href && app.chapter <= maxChapterIdx ? (
                        <Link
                          to={href}
                          className="text-sm font-medium text-amber-400 hover:underline shrink-0"
                        >
                          {app.title}
                        </Link>
                      ) : (
                        <span className="text-sm font-medium text-stone-500 shrink-0">
                          {app.title}
                          {app.chapter > maxChapterIdx && ' · 未读'}
                        </span>
                      )}
                      <span className="text-xs text-stone-500 sm:flex-1">{app.note}</span>
                    </li>
                  );
                })}
              </ul>
            </LoreSection>
          )}
        </>
      )}
      </div>
    </div>
  );
}

function LoreSection({ title, children }) {
  const isText = typeof children === 'string';
  return (
    <section className="rounded-2xl border border-amber-200/10 bg-black/25 backdrop-blur-sm p-5">
      <h2 className="text-[10px] uppercase tracking-[0.2em] text-amber-200/50 mb-3">{title}</h2>
      {isText ? (
        <p className="text-sm text-stone-300 leading-relaxed font-serif">{children}</p>
      ) : (
        children
      )}
    </section>
  );
}
