import { MessageCircle } from 'lucide-react';
import { groupNotesByParagraph } from '../../utils/paragraph';

export default function ParagraphList({
  paragraphs,
  notes,
  theme,
  fontSize,
  selectedIndex,
  onSelectParagraph,
  isCompanionMode,
}) {
  const grouped = groupNotesByParagraph(notes, paragraphs);

  return (
    <article
      className="max-w-2xl mx-auto px-6 py-4 leading-relaxed font-serif"
      style={{ fontSize: `${fontSize}px`, lineHeight: 2.05 }}
    >
      {paragraphs.map((para, index) => {
        const paraNotes = grouped[index] || [];
        const hasNotes = paraNotes.length > 0;
        const isSelected = selectedIndex === index;

        return (
          <div key={index} className="relative mb-1 group">
            <p
              role={isCompanionMode ? 'button' : undefined}
              tabIndex={isCompanionMode ? 0 : undefined}
              className={`text-justify indent-8 rounded-lg px-2.5 py-1.5 transition-colors ${
                isCompanionMode ? 'cursor-pointer' : 'cursor-default'
              } ${isSelected ? 'ring-1' : isCompanionMode ? 'hover:bg-black/5 dark:hover:bg-white/5' : ''}`}
              style={{
                boxShadow:
                  isCompanionMode && hasNotes && !isSelected
                    ? `inset 3px 0 0 ${theme.accent}`
                    : isSelected
                      ? `0 0 0 1px ${theme.accent}`
                      : undefined,
                backgroundColor: isSelected ? theme.glow : undefined,
              }}
              onClick={() => isCompanionMode && onSelectParagraph(index)}
              onKeyDown={(e) => {
                if (isCompanionMode && (e.key === 'Enter' || e.key === ' ')) {
                  e.preventDefault();
                  onSelectParagraph(index);
                }
              }}
            >
              {para}
              {isCompanionMode && hasNotes && (
                <span
                  className="inline-flex items-center gap-1 align-middle ml-2 px-2 py-0.5 rounded-full text-xs font-sans"
                  style={{ backgroundColor: theme.glow, color: theme.accent }}
                >
                  <MessageCircle size={11} />
                  {paraNotes.length}
                </span>
              )}
            </p>

            {isCompanionMode && !hasNotes && (
              <button
                type="button"
                onClick={() => onSelectParagraph(index)}
                className="mt-1 ml-8 text-xs font-sans opacity-0 group-hover:opacity-50 hover:!opacity-80 transition-opacity"
                style={{ color: theme.soft }}
              >
                写段评
              </button>
            )}
          </div>
        );
      })}

      {paragraphs.length === 0 && <p className="text-center opacity-50 font-sans">本章暂无内容</p>}
    </article>
  );
}
