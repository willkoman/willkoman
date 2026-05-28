import { useEffect, useState } from 'react';

/**
 * Viewport heuristics.
 *
 * The Steam Deck Desktop Mode runs at 1280×800 IPS. Anything ≤1280px wide
 * gets the Deck-first layout: bottom-sheet inspector instead of right rail,
 * larger touch targets, etc.
 *
 * `useIsDeckLayout` runs on the client only — initial SSR pass returns
 * `false` (desktop layout) to avoid hydration mismatches.
 */

export const DECK_LAYOUT_BREAKPOINT = 1280;

export function useIsDeckLayout(): boolean {
  const [isDeck, setIsDeck] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mql = window.matchMedia(`(max-width: ${DECK_LAYOUT_BREAKPOINT}px)`);
    const onChange = () => setIsDeck(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return isDeck;
}
