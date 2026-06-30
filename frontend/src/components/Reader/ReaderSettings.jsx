import {
  ArrowLeft,
  Bookmark,
  ChevronLeft,
  ChevronRight,
  Columns2,
  Heart,
  MessageCircle,
  Minus,
  MoreHorizontal,
  Plus,
  ScrollText,
  Settings2,
  Share2,
  Users,
  User,
  Volume2,
  X,
  CloudRain,
  Flame,
  Coffee,
} from 'lucide-react';
import {
  FONT_FAMILIES,
  READING_MODES,
  READING_THEMES,
  useReaderStore,
} from '../../store/reader';
import { AMBIENT_SOUNDS } from '../../audio/ambientSounds';

export default function ReaderSettings({ theme, onClose }) {
  const {
    theme: themeKey,
    fontSize,
    lineHeight,
    fontFamily,
    readingMode,
    isCompanionMode,
    ambientSound,
    ambientVolume,
    setTheme,
    setAmbientSound,
    setAmbientVolume,
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

          {/* 环境音 */}
          <section>
            <h3 className="text-sm font-medium mb-3 opacity-80 flex items-center gap-2">
              <Volume2 size={16} />
              环境音
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(AMBIENT_SOUNDS).map(([key, sound]) => {
                const active = ambientSound === key;
                const Icon =
                  key === 'rain' ? CloudRain : key === 'fireplace' ? Flame : key === 'cafe' ? Coffee : Volume2;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setAmbientSound(key)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all"
                    style={{
                      borderColor: active ? theme.accent : theme.line,
                      backgroundColor: active ? theme.glow : theme.bgRaised,
                    }}
                  >
                    <Icon size={22} style={{ color: active ? theme.accent : theme.soft }} />
                    <span className="font-medium text-sm">{sound.name}</span>
                    <span className="text-xs opacity-60 text-center">{sound.desc}</span>
                  </button>
                );
              })}
            </div>
            {ambientSound !== 'off' && (
              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm opacity-80">音量</span>
                  <span className="text-sm font-medium">{Math.round(ambientVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.05"
                  value={ambientVolume}
                  onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
                  className="reader-range w-full"
                  style={{ accentColor: theme.accent }}
                />
              </div>
            )}
          </section>

          {/* 结伴模式 */}
          <section>
            <h3 className="text-sm font-medium mb-3 opacity-80">阅读模式</h3>
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
  showChrome,
  onBack,
  onOpenSettings,
  onShare,
}) {
  if (!showChrome) return null;

  return (
    <header
      className="shrink-0 px-3 sm:px-4 h-12 flex items-center justify-between border-b reader-chrome safe-top"
      style={{ backgroundColor: theme.bg, borderColor: theme.line, color: theme.text }}
    >
      <button
        type="button"
        onClick={onBack}
        className="p-2 -ml-1 rounded-full opacity-80 hover:opacity-100 hover:bg-black/[0.04]"
        aria-label="返回"
      >
        <ArrowLeft size={22} strokeWidth={1.75} />
      </button>

      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={onShare}
          className="p-2 rounded-full opacity-70 hover:opacity-100 hover:bg-black/[0.04]"
          aria-label="分享"
        >
          <Share2 size={20} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          onClick={onOpenSettings}
          className="p-2 rounded-full opacity-70 hover:opacity-100 hover:bg-black/[0.04]"
          aria-label="阅读设置"
        >
          <MoreHorizontal size={22} strokeWidth={1.75} />
        </button>
      </div>
    </header>
  );
}

export function ReaderActionBar({
  theme,
  showChrome,
  noteCount = 0,
  reviewCount = 0,
  onOpenReviews,
  onOpenSettings,
}) {
  if (!showChrome) return null;

  const items = [
    { icon: Heart, label: '段评', count: noteCount, onClick: null },
    { icon: MessageCircle, label: '章评', count: reviewCount, onClick: onOpenReviews },
    { icon: Settings2, label: '设置', count: null, onClick: onOpenSettings },
    { icon: Bookmark, label: '书签', count: null, onClick: onOpenSettings },
  ];

  return (
    <footer
      className="shrink-0 border-t reader-chrome safe-bottom reader-action-bar"
      style={{ backgroundColor: theme.bg, borderColor: theme.line, color: theme.text }}
    >
      <div className="max-w-[680px] mx-auto px-6 h-14 flex items-center justify-between">
        {items.map(({ icon: Icon, label, count, onClick }) => (
          <button
            key={label}
            type="button"
            onClick={onClick || undefined}
            disabled={!onClick}
            className={`flex flex-col items-center gap-0.5 min-w-[56px] ${onClick ? 'opacity-80 hover:opacity-100' : 'opacity-50 cursor-default'}`}
            aria-label={label}
          >
            <Icon size={22} strokeWidth={1.5} />
            {count != null && count > 0 && (
              <span className="text-[10px] font-sans tabular-nums" style={{ color: theme.soft }}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>
    </footer>
  );
}

export function ReaderFooter({
  theme,
  showChrome,
  readingMode,
  currentPage,
  totalPages,
  chapterIndex = 0,
  totalChapters = 0,
  canPrevChapter,
  canNextChapter,
  onPrevPage,
  onNextPage,
  onPrevChapter,
  onNextChapter,
}) {
  if (!showChrome) return null;

  if (readingMode === 'scroll') {
    return (
      <footer
        className="shrink-0 px-4 py-2 border-t reader-chrome safe-bottom"
        style={{ backgroundColor: theme.bg, borderColor: theme.line, color: theme.soft }}
      >
        <div className="max-w-[680px] mx-auto flex items-center justify-between gap-4 text-xs font-sans">
          <button
            type="button"
            disabled={!canPrevChapter}
            onClick={onPrevChapter}
            className="flex items-center gap-1 opacity-80 hover:opacity-100 disabled:opacity-30 px-2 py-1"
          >
            <ChevronLeft size={16} />
            上一章
          </button>

          <span className="tabular-nums">
            第 {chapterIndex + 1} / {totalChapters} 章
          </span>

          <button
            type="button"
            disabled={!canNextChapter}
            onClick={onNextChapter}
            className="flex items-center gap-1 opacity-80 hover:opacity-100 disabled:opacity-30 px-2 py-1"
            style={{ color: canNextChapter ? theme.accent : undefined }}
          >
            下一章
            <ChevronRight size={16} />
          </button>
        </div>
      </footer>
    );
  }

  if (readingMode !== 'page') return null;

  return (
    <footer
      className="shrink-0 px-4 py-2 border-t reader-chrome safe-bottom"
      style={{ backgroundColor: theme.bg, borderColor: theme.line, color: theme.soft }}
    >
      <div className="max-w-[680px] mx-auto flex items-center justify-between gap-4 text-xs font-sans">
        <button
          type="button"
          disabled={!canPrevChapter && currentPage === 0}
          onClick={currentPage === 0 ? onPrevChapter : onPrevPage}
          className="flex items-center gap-1 opacity-80 hover:opacity-100 disabled:opacity-30 px-2 py-1"
        >
          <ChevronLeft size={16} />
          {currentPage === 0 ? '上一章' : '上一页'}
        </button>

        <span className="tabular-nums">
          {currentPage + 1} / {totalPages}
        </span>

        <button
          type="button"
          disabled={!canNextChapter && currentPage >= totalPages - 1}
          onClick={currentPage >= totalPages - 1 ? onNextChapter : onNextPage}
          className="flex items-center gap-1 opacity-80 hover:opacity-100 disabled:opacity-30 px-2 py-1"
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
