/** 图谱节点：金色书卷风格标记 */
export default function LoreNode({
  label,
  unlocked,
  active,
  kind = 'location',
  onClick,
  style,
  title,
}) {
  const isConcept = kind === 'concept';
  const isCharacter = kind === 'character';

  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      style={style}
      className={`absolute -translate-x-1/2 -translate-y-1/2 group flex flex-col items-center gap-1.5 transition-all duration-300 focus:outline-none ${
        active ? 'scale-110 z-20' : 'z-10 hover:scale-105'
      }`}
    >
      {/* 光晕 */}
      {unlocked && (
        <span
          className={`absolute w-14 h-14 rounded-full blur-md opacity-60 ${
            isCharacter ? 'bg-amber-400/50' : isConcept ? 'bg-violet-400/40' : 'bg-sky-400/40'
          } ${active ? 'animate-pulse' : ''}`}
        />
      )}

      <span
        className={`relative flex items-center justify-center w-11 h-11 rounded-full border-2 shadow-lg backdrop-blur-sm transition-colors ${
          unlocked
            ? isCharacter
              ? 'bg-gradient-to-br from-amber-100/95 to-amber-200/90 border-amber-300/80 text-amber-900 shadow-amber-900/20'
              : isConcept
                ? 'bg-gradient-to-br from-violet-100/95 to-indigo-200/90 border-violet-300/70 text-violet-900 shadow-violet-900/20'
                : 'bg-gradient-to-br from-sky-50/95 to-blue-100/90 border-sky-300/70 text-sky-900 shadow-sky-900/20'
            : 'bg-stone-800/70 border-stone-600/50 text-stone-500 shadow-black/30'
        }`}
      >
        {unlocked ? (
          <span className="text-xs font-serif font-bold tracking-tight">
            {label.slice(0, 1)}
          </span>
        ) : (
          <span className="text-[10px] opacity-70">?</span>
        )}
      </span>

      {/* 指针 */}
      {unlocked && (
        <span className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-amber-200/80 -mt-2 opacity-80" />
      )}

      <span
        className={`relative text-[11px] font-medium px-2 py-0.5 rounded-sm max-w-[88px] truncate text-center tracking-wide ${
          unlocked
            ? 'bg-black/55 text-amber-50 border border-amber-200/20 shadow-lg backdrop-blur-md'
            : 'bg-black/40 text-stone-500 border border-stone-600/30'
        }`}
      >
        {unlocked ? label : '未探明'}
      </span>
    </button>
  );
}
