import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useIsDeckLayout } from '../lib/state/viewport';

interface Props {
  children: ReactNode;
}

type SheetSnap = 'collapsed' | 'half' | 'full';

/**
 * Surface that hosts the inspector pane.
 *
 * Desktop (>1280px): fixed right-rail panel, scrollable, no chrome.
 * Deck (≤1280px):    bottom sheet that snaps between collapsed (40px), half
 *                    (50vh), and full (90vh). Drag the handle or tap it to
 *                    advance to the next snap.
 *
 * The sheet's chrome (handle, snap controls) only render in Deck mode.
 * `<InspectorSurface>` is a wrapper, not a container of state — the actual
 * inspector content lives in `<GroupInspector>` and is passed as children.
 */
export default function InspectorSurface({ children }: Props) {
  const isDeck = useIsDeckLayout();
  const [snap, setSnap] = useState<SheetSnap>('half');
  const startY = useRef<number | null>(null);
  const startSnap = useRef<SheetSnap>('half');

  // Esc collapses the sheet on Deck.
  useEffect(() => {
    if (!isDeck) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && snap !== 'collapsed') {
        e.preventDefault();
        setSnap('collapsed');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isDeck, snap]);

  if (!isDeck) {
    return (
      <aside className="overflow-y-auto p-3 bg-[var(--color-panel)] border-l border-[var(--color-border)]">
        {children}
      </aside>
    );
  }

  const heightFor = (s: SheetSnap): string => {
    switch (s) {
      case 'collapsed':
        return '44px';
      case 'half':
        return '50vh';
      case 'full':
        return '90vh';
    }
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    startY.current = e.clientY;
    startSnap.current = snap;
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (startY.current === null) return;
    const dy = startY.current - e.clientY; // up = positive
    if (Math.abs(dy) < 30) return;
    if (dy > 0) {
      setSnap(startSnap.current === 'collapsed' ? 'half' : 'full');
    } else {
      setSnap(startSnap.current === 'full' ? 'half' : 'collapsed');
    }
    startY.current = null;
  };
  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    startY.current = null;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const advance = () => {
    setSnap((s) => (s === 'collapsed' ? 'half' : s === 'half' ? 'full' : 'collapsed'));
  };

  return (
    <aside
      className="fixed bottom-0 left-0 right-0 z-30 bg-[var(--color-panel)] border-t border-[var(--color-border-strong)] shadow-[0_-8px_24px_rgba(0,0,0,0.35)] flex flex-col"
      style={{ height: heightFor(snap), transition: 'height 180ms ease' }}
      aria-label="Inspector"
    >
      <div
        role="button"
        aria-label={`Inspector sheet (currently ${snap}). Drag or tap to change.`}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={advance}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            advance();
          }
        }}
        className="h-11 flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
      >
        <span className="block w-12 h-1.5 rounded-full bg-[var(--color-border-strong)]" />
      </div>
      {snap !== 'collapsed' && <div className="flex-1 overflow-y-auto p-3 pb-8">{children}</div>}
    </aside>
  );
}
