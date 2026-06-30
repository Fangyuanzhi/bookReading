/** 图谱容器：插画底图 + 古典边框 + 暗角 */
export default function LoreAtlasFrame({ backgroundUrl, title, subtitle, children }) {
  return (
    <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-black/40 ring-1 ring-amber-200/20">
      {/* 底图 */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{ backgroundImage: `url(${backgroundUrl})` }}
      />
      {/* 可读性遮罩 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-black/40" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />

      {/* 装饰框 */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none text-amber-200/25"
        viewBox="0 0 400 300"
        preserveAspectRatio="none"
      >
        <rect x="8" y="8" width="384" height="284" fill="none" stroke="currentColor" strokeWidth="1" />
        <rect x="14" y="14" width="372" height="272" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.6" />
      </svg>

      {/* 标题栏 */}
      <div className="absolute top-0 inset-x-0 z-10 px-4 pt-4 pb-8 bg-gradient-to-b from-black/70 to-transparent">
        <p className="text-[10px] uppercase tracking-[0.25em] text-amber-200/70 font-medium">{subtitle}</p>
        <h3 className="text-sm font-serif text-amber-50/95 mt-0.5">{title}</h3>
      </div>

      {/* 内容区 */}
      <div className="relative aspect-[4/3] min-h-[280px]">{children}</div>

      {/* 暗角 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ boxShadow: 'inset 0 0 80px rgba(0,0,0,0.55)' }}
      />
    </div>
  );
}
