/**
 * Minimal IndexedDB helper for Padsmith's local library.
 *
 * One DB (`padsmith`), one object store (`recent`). Each entry holds the
 * raw `.vdf` text plus metadata (filename, opened-at, optional game-id
 * heuristic). Tiny wrapper around the native IDB API — no idb-keyval
 * dep — because we only need three operations: put, getAll, delete.
 *
 * Quota: configs are typically 5–40 KB; we cap at 100 entries and prune
 * the oldest on overflow.
 */

export interface RecentEntry {
  /** Stable id; we use a content hash of (filename + opened-at + size). */
  id: string;
  filename: string;
  text: string;
  openedAt: number;
  /** Heuristic game id parsed from the filename or `controller_neptune_<appid>` pattern. */
  gameHint?: string;
}

const DB_NAME = 'padsmith';
const DB_VERSION = 1;
const STORE = 'recent';
const MAX_ENTRIES = 100;

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable in this environment'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IDB open failed'));
  });
}

function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => Promise<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const store = t.objectStore(STORE);
        fn(store).then(resolve, reject);
        t.onerror = () => reject(t.error);
      })
  );
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function putRecent(entry: RecentEntry): Promise<void> {
  await tx('readwrite', async (store) => {
    await reqToPromise(store.put(entry));
  });
  // Prune oldest if over cap.
  const all = await listRecent();
  if (all.length > MAX_ENTRIES) {
    const toDelete = all.slice(MAX_ENTRIES).map((e) => e.id);
    await tx('readwrite', async (store) => {
      for (const id of toDelete) {
        await reqToPromise(store.delete(id));
      }
    });
  }
}

export async function listRecent(): Promise<RecentEntry[]> {
  return tx('readonly', async (store) => {
    const all = await reqToPromise(store.getAll() as IDBRequest<RecentEntry[]>);
    return all.sort((a, b) => b.openedAt - a.openedAt);
  });
}

export async function deleteRecent(id: string): Promise<void> {
  await tx('readwrite', async (store) => {
    await reqToPromise(store.delete(id));
  });
}

export async function clearRecent(): Promise<void> {
  await tx('readwrite', async (store) => {
    await reqToPromise(store.clear());
  });
}

/** Derive a stable id without needing a hash function. Good enough for dedup. */
export function makeRecentId(filename: string, size: number, openedAt: number): string {
  return `${filename}::${size}::${openedAt}`;
}

/**
 * Heuristic: extract a game id from common controller-config filenames.
 *   - `controller_neptune_<appid>.vdf` → "<appid>"
 *   - `<appid>.vdf`                     → "<appid>"
 *   - falls through to filename otherwise
 */
export function gameHintFromFilename(filename: string): string | undefined {
  const stripped = filename.replace(/\.vdf$/i, '');
  const match = stripped.match(/^controller_(?:neptune|xbox(?:360|one)|ps[45]|switch_pro)_(\d+)$/i);
  if (match) return match[1];
  if (/^\d+$/.test(stripped)) return stripped;
  return undefined;
}
