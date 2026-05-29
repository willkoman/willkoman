import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { isOptedIn, setOptedIn, track } from '../../src/lib/state/telemetry';

const localStorageMock = (() => {
  const store: Record<string, string> = {};
  return {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      for (const k of Object.keys(store)) delete store[k];
    },
  };
})();

beforeEach(() => {
  // Stub window for the node test environment.
  // @ts-expect-error — minimal mock for the node test environment
  global.window = { localStorage: localStorageMock, location: { href: 'http://localhost/' } };
  localStorageMock.clear();
  vi.restoreAllMocks();
});

afterEach(() => {
  // @ts-expect-error — clean up the stubbed global between tests
  delete global.window;
});

describe('telemetry opt-in', () => {
  it('is opted out by default', () => {
    expect(isOptedIn()).toBe(false);
  });

  it('toggles via setOptedIn and persists in localStorage', () => {
    setOptedIn(true);
    expect(isOptedIn()).toBe(true);
    expect(localStorageMock.getItem('padsmith.telemetryOptIn')).toBe('1');
    setOptedIn(false);
    expect(isOptedIn()).toBe(false);
    expect(localStorageMock.getItem('padsmith.telemetryOptIn')).toBeNull();
  });

  it('track() is a no-op when opted out (no network call attempted)', () => {
    const fetchSpy = vi.fn();
    (global as unknown as { fetch: typeof fetchSpy }).fetch = fetchSpy;
    track('open file');
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('track() does not throw even with no telemetry endpoint configured', () => {
    setOptedIn(true);
    // VITE_PLAUSIBLE_DOMAIN unset → ENDPOINT is empty → track short-circuits
    expect(() => track('export')).not.toThrow();
  });
});
