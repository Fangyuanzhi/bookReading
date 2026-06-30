import { useCallback, useRef, useState } from 'react';
import LoreAtlasFrame from './LoreAtlasFrame';
import LoreNode from './LoreNode';
import LorePreviewCard from './LorePreviewCard';
import { isLoreUnlocked } from '../../utils/lore';

const DOUBLE_MS = 500;
const CHAR_BG = '/lore/republic-character-atlas.png';

function relationUnlocked(rel, maxChapterIdx) {
  return isLoreUnlocked(rel.unlockChapter, maxChapterIdx);
}

function curvePath(x1, y1, x2, y2) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2 - 8;
  return `M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`;
}

export default function LoreCharacterPanel({ characters, maxChapterIdx, onOpenDetail }) {
  const [preview, setPreview] = useState(null);
  const lastClickRef = useRef({ id: null, time: 0 });

  const handleNodeClick = useCallback(
    (char, e) => {
      const now = Date.now();
      const unlocked = isLoreUnlocked(char.unlockChapter, maxChapterIdx);
      const last = lastClickRef.current;

      if (last.id === char.id && now - last.time < DOUBLE_MS && unlocked) {
        onOpenDetail('character', char.id);
        setPreview(null);
        lastClickRef.current = { id: null, time: 0 };
        return;
      }

      lastClickRef.current = { id: char.id, time: now };
      const rect = e.currentTarget.closest('[data-lore-graph]')?.getBoundingClientRect();
      const nodeRect = e.currentTarget.getBoundingClientRect();
      let x = char.x;
      let y = char.y;
      if (rect && nodeRect) {
        x = ((nodeRect.left + nodeRect.width / 2 - rect.left) / rect.width) * 100;
        y = ((nodeRect.top + nodeRect.height / 2 - rect.top) / rect.height) * 100;
      }
      setPreview({ entity: char, entityType: 'character', unlocked, x, y });
    },
    [maxChapterIdx, onOpenDetail],
  );

  const edges = [];
  characters.forEach((char) => {
    if (!char.relations) return;
    char.relations.forEach((rel) => {
      const target = characters.find((c) => c.id === rel.target);
      if (!target) return;
      if (char.id > target.id) return;
      const visible =
        isLoreUnlocked(char.unlockChapter, maxChapterIdx) &&
        isLoreUnlocked(target.unlockChapter, maxChapterIdx) &&
        relationUnlocked(rel, maxChapterIdx);
      edges.push({ from: char, to: target, rel, visible });
    });
  });

  return (
    <div className="relative" data-lore-graph>
      <LoreAtlasFrame
        backgroundUrl={CHAR_BG}
        subtitle="Personae · Dialogue Network"
        title="人物关系图谱"
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-[1]" viewBox="0 0 100 100" preserveAspectRatio="none">
          {edges.map(({ from, to, visible }) => (
            <path
              key={`${from.id}-${to.id}`}
              d={curvePath(from.x, from.y, to.x, to.y)}
              fill="none"
              stroke={visible ? 'rgba(251, 191, 36, 0.45)' : 'rgba(120, 113, 108, 0.2)'}
              strokeWidth={visible ? 0.35 : 0.2}
              strokeDasharray={visible ? undefined : '1 1'}
            />
          ))}
        </svg>

        {characters.map((char) => {
          const unlocked = isLoreUnlocked(char.unlockChapter, maxChapterIdx);
          const active = preview?.entity?.id === char.id;
          return (
            <LoreNode
              key={char.id}
              label={char.name}
              unlocked={unlocked}
              active={active}
              kind="character"
              title={unlocked ? char.name : `第 ${char.unlockChapter} 卷解锁`}
              style={{ left: `${char.x}%`, top: `${char.y}%` }}
              onClick={(e) => handleNodeClick(char, e)}
            />
          );
        })}

        <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5 z-10 pointer-events-none">
          {edges
            .filter((e) => e.visible)
            .slice(0, 5)
            .map(({ from, to, rel }) => (
              <span
                key={`tag-${from.id}-${to.id}`}
                className="text-[10px] bg-black/50 text-amber-100/90 px-2.5 py-1 rounded-full border border-amber-200/15 backdrop-blur-sm"
              >
                {from.name} · {rel.label} · {to.name}
              </span>
            ))}
        </div>

        {preview && (
          <LorePreviewCard
            entity={preview.entity}
            entityType={preview.entityType}
            unlocked={preview.unlocked}
            position={{ x: preview.x, y: preview.y }}
            onOpenDetail={() => onOpenDetail(preview.entityType, preview.entity.id)}
            onClose={() => setPreview(null)}
          />
        )}
      </LoreAtlasFrame>
    </div>
  );
}
