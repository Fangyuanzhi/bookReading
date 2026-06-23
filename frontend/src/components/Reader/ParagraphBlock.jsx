import { MessageCircle } from 'lucide-react';

export default function ParagraphBlock({
  para,
  index,
  theme,
  fontSize,
  lineHeight,
  fontFamily,
  noteCount = 0,
  isSelected,
  isCompanionMode,
  onSelect,
  measureOnly = false,
}) {
  const hasNotes = noteCount > 0;
  const interactive = isCompanionMode && !measureOnly;

  return (
    <div data-para-idx={index} className={measureOnly ? '' : 'relative mb-2.5 group'}>
      <p
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        className={`text-justify indent-[2em] rounded-lg px-3 py-2 transition-all duration-200 ${
          interactive ? 'cursor-pointer' : 'cursor-default'
        } ${isSelected ? 'ring-2' : interactive ? 'hover:brightness-[0.98]' : ''}`}
        style={{
          fontSize: `${fontSize}px`,
          lineHeight,
          fontFamily,
          boxShadow:
            interactive && hasNotes && !isSelected
              ? `inset 4px 0 0 ${theme.accent}`
              : isSelected
                ? `0 0 0 2px ${theme.accent}`
                : undefined,
          backgroundColor: isSelected ? theme.glow : undefined,
        }}
        onClick={() => interactive && onSelect?.(index)}
        onKeyDown={(e) => {
          if (interactive && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onSelect?.(index);
          }
        }}
      >
        {para}
        {interactive && hasNotes && (
          <span
            className="inline-flex items-center gap-1 align-middle ml-2 px-2 py-0.5 rounded-full text-xs font-sans"
            style={{ backgroundColor: theme.glow, color: theme.accent }}
          >
            <MessageCircle size={11} />
            {noteCount}
          </span>
        )}
      </p>

      {interactive && !hasNotes && (
        <button
          type="button"
          onClick={() => onSelect?.(index)}
          className="mt-0.5 ml-8 text-xs font-sans opacity-0 group-hover:opacity-50 hover:!opacity-80 transition-opacity"
          style={{ color: theme.soft }}
        >
          写段评
        </button>
      )}
    </div>
  );
}
