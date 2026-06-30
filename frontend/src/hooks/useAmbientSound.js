import { useEffect, useRef } from 'react';
import { createAmbientPlayer } from '../audio/ambientSounds';

/** 在阅读器内播放环境音；离开页面或切换音源时自动停止。 */
export function useAmbientSound(soundKey, volume) {
  const playerRef = useRef(null);
  const soundRef = useRef(soundKey);
  const volumeRef = useRef(volume);

  useEffect(() => {
    soundRef.current = soundKey;
    volumeRef.current = volume;
  }, [soundKey, volume]);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion && soundKey !== 'off') return undefined;

    if (soundKey === 'off') {
      playerRef.current?.stop();
      playerRef.current = null;
      return undefined;
    }

    const player = createAmbientPlayer(soundKey, volumeRef.current);
    playerRef.current = player;
    player.start();

    return () => {
      player.stop();
      if (playerRef.current === player) playerRef.current = null;
    };
  }, [soundKey]);

  useEffect(() => {
    if (soundRef.current === 'off' || !playerRef.current) return;
    playerRef.current.setVolume(volume);
  }, [volume]);
}
