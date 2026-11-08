import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

/** Scale the existing rig as a unit; never change clothing/head coordinates. */
export function LobbyAvatarStage({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(.7);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => setScale(Math.max(.3, Math.min(1.2, (element.clientHeight - 36) / 420)));
    measure();
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(measure);
      observer.observe(element);
      return () => observer.disconnect();
    }
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);
  return <div ref={ref} className="gh-locker-zone" style={{ '--lobby-avatar-scale': scale } as CSSProperties}>{children}</div>;
}
