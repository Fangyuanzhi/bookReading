import {
  ChevronLeft,
  ChevronRight,
  Columns2,
  Minus,
  Plus,
  ScrollText,
  Settings2,
  Users,
  User,
  X,
} from 'lucide-react';
import {
  FONT_FAMILIES,
  READING_MODES,
  READING_THEMES,
  useReaderStore,
} from '../../store/reader';

export default function ReaderSettings({ theme, onClose }) {
  const {
    theme: themeKey,
    fontSize,
    lineHeight,
    fontFamily,
    readingMode,
    isCompanionMode,
    setTheme,
    increaseFontSize,
    decreaseFontSize,
    setLineHeight,
    setFontFamily,
    setReadingMode,
    toggleCompanionMode,
  } = useReaderStore();

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end"
      role="dialog"
      aria-label="阅读设置"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-label="关闭设置"
      />

      <aside
        className="relative w-full max-w-sm h-full overflow-y-auto shadow-2xl animate-slide-in-right"
        style={{ backgroundColor: theme.bgPanel, color: theme.text, borderLeft: `1px solid ${theme.line}` }}
      >
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-5 py-4 border-b backdrop-blur-md"
          style={{ borderColor: theme.line, backgroundColor: `${theme.bgPanel}ee` }}
        >
          <div className="flex items-center gap-2">
            <Settings2 size={18} style={{ color: theme.accent }} />
            <h2 className="font-serif font-semibold text-lg">阅读设置</h2>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-lg opacity-70 hover:opacity-100">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-8">
          {/* 阅读模式 */}
          <section>
            <h3 className="text-sm font-medium mb-3 opacity-80">阅读模式</h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(READING_MODES).map(([key, mode]) => {
                const active = readingMode === key;
                const Icon = key === 'page' ? Columns2 : ScrollText;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setReadingMode(key)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all"
                    style={{
                      borderColor: active ? theme.accent : theme.line,
                      backgroundColor: active ? theme.glow : theme.bgRaised,
                    }}
                  >
                    <Icon size={22} style={{ color: active ? theme.accent : theme.soft }} />
                    <span className="font-medium text-sm">{mode.name}</span>
                    <span className="text-xs opacity-60">{mode.desc}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 背景主题 */}
          <section>
            <h3 className="text-sm font-medium mb-3 opacity-80">背景主题</h3>
            <div className="grid grid-cols-4 gap-3">
              {Object.entries(READING_THEMES).map(([key, t]) => {
                const active = themeKey === key;
                return (
                  <button
                    key={key}
                    type="button"
                    title={t.desc}
                    onClick={() => setTheme(key)}
                    className="flex flex-col items-center gap-1.5 group"
                  >
                    <span
                      className="w-12 h-12 rounded-xl border-2 transition-transform group-hover:scale-105"
                      style={{
                        backgroundColor: t.swatch,
                        borderColor: active ? theme.accent : 'transparent',
                        boxShadow: active ? `0 0 0 2px ${theme.glow}` : undefined,
                      }}
                    />
                    <span className={`text-xs ${active ? 'font-semibold' : 'opacity-70'}`} style={{ color: active ? theme.accent : theme.text }}>
                      {t.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* 字体 */}
          <section>
            <h3 className="text-sm font-medium mb-3 opacity-80">字体与排版</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm opacity-80">字号</span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={decreaseFontSize}
                    className="w-9 h-9 rounded-lg flex items-center justify-center border"
                    style={{ borderColor: theme.line, backgroundColor: theme.bgRaised }}
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-8 text-center font-medium">{fontSize}</span>
                  <button
                    type="button"
                    onClick={increaseFontSize}
                    className="w-9 h-9 rounded-lg flex items-center justify-center border"
                    style={{ borderColor: theme.line, backgroundColor: theme.bgRaised }}
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm opacity-80">行距</span>
                  <span className="text-sm font-medium">{lineHeight.toFixed(1)}</span>
                </div>
                <input
                  type="range"
                  min="1.5"
                  max="2.6"
                  step="0.1"
                  value={lineHeight}
                  onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                  className="reader-range w-full"
                  style={{ accentColor: theme.accent }}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                {Object.entries(FONT_FAMILIES).map(([key, f]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setFontFamily(key)}
                    className="px-3 py-1.5 rounded-lg text-sm border transition-colors"
                    style={{
                      fontFamily: f.value,
                      borderColor: fontFamily === key ? theme.accent : theme.line,
                      backgroundColor: fontFamily === key ? theme.glow : 'transparent',
                    }}
                  >
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* 结伴模式 */}
          <section>
            <h3 className="text-sm font-medium mb-3 opacity-80">陪读模式</h3>
            <button
              type="button"
              onClick={toggleCompanionMode}
              className="w-full flex items-center justify-between p-4 rounded-xl border"
              style={{
                borderColor: isCompanionMode ? theme.accent : theme.line,
                backgroundColor: isCompanionMode ? theme.glow : theme.bgRaised,
              }}
            >
              <div className="flex items-center gap-3">
                {isCompanionMode ? <Users size={20} style={{ color: theme.accent }} /> : <User size={20} />}
                <div className="text-left">
                  <p className="font-medium">{isCompanionMode ? '结伴阅读' : '独自阅读'}</p>
                  <p className="text-xs opacity-60 mt-0.5">
                    {isCompanionMode ? '段评、在场、章评全开' : '专注正文，隐藏社交功能'}
                  </p>
                </div>
              </div>
              <span
                className="w-11 h-6 rounded-full relative transition-colors"
                style={{ backgroundColor: isCompanionMode ? theme.accent : theme.line }}
              >
                <span
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform"
                  style={{ left: isCompanionMode ? '22px' : '2px' }}
                />
              </span>
            </button>
          </section>

          <p className="text-xs opacity-50 leading-relaxed pb-4">
            设置会自动保存。翻页模式：点击左右区域或按方向键；点击中间显示/隐藏工具栏。
          </p>
        </div>
      </aside>
    </div>
  );
}

export function ReaderHeader({
  theme,
  title,
  showChrome,
  presenceCount,
  isCompanionMode,
  onBack,
  onOpenSettings,
}) {
  if (!showChrome) return null;

  return (
    <header
      className="shrink-0 px-4 py-3 flex items-center gap-3 border-b backdrop-blur-md reader-chrome"
      style={{ backgroundColor: `${theme.bg}ee`, borderColor: theme.line, color: theme.text }}
    >
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-sm opacity-80 hover:opacity-100 shrink-0 px-2 py-1 rounded-lg"
      >
        <ChevronLeft size={18} />
        <span className="hidden sm:inline">返回</span>
      </button>

      <h1 className="flex-1 font-serif font-medium truncate text-center text-sm sm:text-base">{title}</h1>

      <div className="flex items-center gap-1 shrink-0">
        {isCompanionMode && (
          <span className="hidden sm:inline text-xs opacity-60 mr-1">{presenceCount} 人在读</span>
        )}
        <button
          type="button"
          onClick={onOpenSettings}
          className="p-2 rounded-lg opacity-80 hover:opacity-100"
          title="阅读设置"
        >
          <Settings2 size={18} />
        </button>
      </div>
    </header>
  );
}

export function ReaderFooter({
  theme,
  showChrome,
  readingMode,
  currentPage,
  totalPages,
  canPrevChapter,
  canNextChapter,
  onPrevPage,
  onNextPage,
  onPrevChapter,
  onNextChapter,
}) {
  if (!showChrome || readingMode !== 'page') return null;

  return (
    <footer
      className="shrink-0 px-4 py-3 border-t backdrop-blur-md reader-chrome"
      style={{ backgroundColor: `${theme.bg}ee`, borderColor: theme.line, color: theme.text }}
    >
      <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
        <button
          type="button"
          disabled={!canPrevChapter && currentPage === 0}
          onClick={currentPage === 0 ? onPrevChapter : onPrevPage}
          className="flex items-center gap-1 text-sm opacity-80 hover:opacity-100 disabled:opacity-30 px-2 py-1"
        >
          <ChevronLeft size={16} />
          {currentPage === 0 ? '上一章' : '上一页'}
        </button>

        <div className="flex-1 text-center min-w-0">
          <p className="text-sm font-medium">
            {currentPage + 1} / {totalPages}
          </p>
          <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ backgroundColor: theme.line }}>
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${totalPages ? ((currentPage + 1) / totalPages) * 100 : 0}%`,
                backgroundColor: theme.accent,
              }}
            />
          </div>
        </div>

        <button
          type="button"
          disabled={!canNextChapter && currentPage >= totalPages - 1}
          onClick={currentPage >= totalPages - 1 ? onNextChapter : onNextPage}
          className="flex items-center gap-1 text-sm opacity-80 hover:opacity-100 disabled:opacity-30 px-2 py-1"
        >
          {currentPage >= totalPages - 1 ? '下一章' : '下一页'}
          <ChevronRight size={16} />
        </button>
      </div>
    </footer>
  );
}

/** @deprecated use ReaderHeader + ReaderFooter */
export function ReaderToolbar(props) {
  return (
    <>
      <ReaderHeader {...props} />
      <ReaderFooter {...props} />
    </>
  );
}
