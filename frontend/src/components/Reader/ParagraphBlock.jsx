import { MessageCircle } from 'lucide-react';
import { highlightCharacterNames } from '../../utils/highlightNames.jsx';

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
  characterNames = [],
}) {
  const hasNotes = noteCount > 0;
  const interactive = isCompanionMode && !measureOnly;
  const content = highlightCharacterNames(para, characterNames, `${index}-`, theme);

  return (
    <div data-para-idx={index} className={measureOnly ? '' : 'relative mb-[1.35em] group'}>
      <p
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        className={`reader-body-text text-left ${
          interactive ? 'cursor-pointer rounded-sm -mx-1 px-1' : 'cursor-default'
        } ${isSelected ? 'reader-para-selected' : interactive ? 'hover:bg-black/[0.03]' : ''}`}
        style={{
          fontSize: `${fontSize}px`,
          lineHeight,
          fontFamily,
          color: theme.text,
          backgroundColor: isSelected ? theme.glow : undefined,
          boxShadow: interactive && hasNotes && !isSelected ? `inset 3px 0 0 ${theme.accent}` : undefined,
        }}
        onClick={() => interactive && onSelect?.(index)}
        onKeyDown={(e) => {
          if (interactive && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            onSelect?.(index);
          }
        }}
      >
        {content}
        {interactive && hasNotes && (
          <span
            className="inline-flex items-center gap-1 align-middle ml-2 px-1.5 py-0.5 rounded text-[11px] font-sans"
            style={{ backgroundColor: theme.bgRaised, color: theme.soft }}
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
          className="mt-1 text-[11px] font-sans opacity-0 group-hover:opacity-50 hover:!opacity-80 transition-opacity"
          style={{ color: theme.soft }}
        >
          写段评
        </button>
      )}
    </div>
  );
}
