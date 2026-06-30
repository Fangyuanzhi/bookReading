import { useCallback, useRef, useState } from 'react';
import LoreAtlasFrame from './LoreAtlasFrame';
import LoreNode from './LoreNode';
import LorePreviewCard from './LorePreviewCard';
import { isLoreUnlocked } from '../../utils/lore';

const DOUBLE_MS = 500;
const MAP_BG = '/lore/republic-world-map.png';

export default function LoreMapPanel({ regions, maxChapterIdx, onOpenDetail }) {
  const [preview, setPreview] = useState(null);
  const lastClickRef = useRef({ id: null, time: 0 });

  const handleNodeClick = useCallback(
    (region, e) => {
      const now = Date.now();
      const unlocked = isLoreUnlocked(region.unlockChapter, maxChapterIdx);
      const last = lastClickRef.current;

      if (last.id === region.id && now - last.time < DOUBLE_MS && unlocked) {
        onOpenDetail('location', region.id);
        setPreview(null);
        lastClickRef.current = { id: null, time: 0 };
        return;
      }

      lastClickRef.current = { id: region.id, time: now };
      const rect = e.currentTarget.closest('[data-lore-map]')?.getBoundingClientRect();
      const nodeRect = e.currentTarget.getBoundingClientRect();
      let x = region.x;
      let y = region.y;
      if (rect && nodeRect) {
        x = ((nodeRect.left + nodeRect.width / 2 - rect.left) / rect.width) * 100;
        y = ((nodeRect.top + nodeRect.height / 2 - rect.top) / rect.height) * 100;
      }
      setPreview({ entity: region, entityType: 'location', unlocked, x, y });
    },
    [maxChapterIdx, onOpenDetail],
  );

  return (
    <div className="relative" data-lore-map>
      <LoreAtlasFrame
        backgroundUrl={MAP_BG}
        subtitle="Atlas · Hellenic World"
        title="希腊世界大地图"
      >
        {regions.map((region) => {
          const unlocked = isLoreUnlocked(region.unlockChapter, maxChapterIdx);
          const active = preview?.entity?.id === region.id;
          return (
            <LoreNode
              key={region.id}
              label={region.name}
              unlocked={unlocked}
              active={active}
              kind={region.kind === 'concept' ? 'concept' : 'location'}
              title={unlocked ? region.name : `第 ${region.unlockChapter} 卷解锁`}
              style={{ left: `${region.x}%`, top: `${region.y}%` }}
              onClick={(e) => handleNodeClick(region, e)}
            />
          );
        })}

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
