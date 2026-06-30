import { useEffect, useState } from 'react';

/** 阅读区右侧滚动进度条 */
export default function ReaderScrollProgress({ viewportRef, theme, showChrome }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = viewportRef?.current;
    if (!el) return undefined;

    const update = () => {
      const max = el.scrollHeight - el.clientHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0);
    };

    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  }, [viewportRef]);

  if (!showChrome) return null;

  return (
    <div
      className="fixed right-2 sm:right-3 top-[20%] bottom-[20%] w-1 z-20 pointer-events-none reader-chrome"
      aria-hidden
    >
      <div
        className="absolute inset-0 rounded-full opacity-20"
        style={{ backgroundColor: theme.line }}
      />
      <div
        className="absolute top-0 left-0 right-0 rounded-full transition-[height] duration-150"
        style={{
          height: `${progress * 100}%`,
          backgroundColor: theme.accent,
          boxShadow: `0 0 8px ${theme.glow}`,
        }}
      />
      <span
        className="absolute -right-8 text-[10px] font-sans tabular-nums opacity-60 whitespace-nowrap"
        style={{ color: theme.soft, top: `calc(${progress * 100}% - 6px)` }}
      >
        {Math.round(progress * 100)}%
      </span>
    </div>
  );
}
