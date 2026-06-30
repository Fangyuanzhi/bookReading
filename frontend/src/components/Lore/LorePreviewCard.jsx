import { useEffect, useRef } from 'react';
import { ChevronRight, Lock, Sparkles } from 'lucide-react';

/**
 * 第一次点击：阶段介绍浮层
 * 再次点击同一项（或点「查看详情」）：跳转详情页
 */
export default function LorePreviewCard({
  entity,
  entityType,
  unlocked,
  onOpenDetail,
  onClose,
  position,
}) {
  const cardRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target)) {
        onClose?.();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (!entity) return null;

  const style = position
    ? {
        left: `${Math.min(Math.max(position.x, 6), 58)}%`,
        top: `${Math.min(Math.max(position.y + 2, 18), 62)}%`,
      }
    : undefined;

  return (
    <div
      ref={cardRef}
      className="absolute z-30 w-[min(300px,calc(100%-1.5rem))]"
      style={style}
    >
      <div className="rounded-xl overflow-hidden shadow-2xl shadow-black/50 ring-1 ring-amber-200/25 backdrop-blur-xl bg-stone-900/92">
        <div className="h-1 bg-gradient-to-r from-transparent via-amber-400/80 to-transparent" />

        <div className="p-4">
          <div className="flex items-start gap-2">
            <Sparkles size={14} className="text-amber-400/80 shrink-0 mt-1" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-[0.2em] text-amber-200/60">
                {entityType === 'location' ? '地点' : '人物'}
                {!unlocked && (
                  <span className="ml-2 inline-flex items-center gap-0.5 text-stone-400 normal-case tracking-normal">
                    <Lock size={10} />
                    迷雾中
                  </span>
                )}
              </p>
              <h3 className="font-serif text-lg text-amber-50 mt-0.5 leading-snug">{entity.name}</h3>
              {entity.role && (
                <p className="text-xs text-stone-400 mt-0.5">{entity.role}</p>
              )}
            </div>
          </div>

          {unlocked ? (
            <>
              <p className="text-sm text-stone-300 mt-3 leading-relaxed font-serif">{entity.stageIntro}</p>
              <p className="text-[11px] text-stone-500 mt-3 italic">
                连点两次 · 或点击下方进入详页
              </p>
              <button
                type="button"
                onClick={onOpenDetail}
                className="mt-3 w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-amber-600/90 to-amber-700/90 text-amber-50 hover:from-amber-500 hover:to-amber-600 transition-colors border border-amber-400/20"
              >
                展开详情
                <ChevronRight size={16} />
              </button>
            </>
          ) : (
            <p className="text-sm text-stone-400 mt-3 leading-relaxed">
              继续阅读至<strong className="text-amber-200/90 font-normal">第 {entity.unlockChapter} 卷</strong>
              ，此处将从迷雾中显现。
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
