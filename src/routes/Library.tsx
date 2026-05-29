import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useConfigStore } from '../lib/state/configStore';
import { deleteRecent, listRecent } from '../lib/state/idb';
import type { RecentEntry } from '../lib/state/idb';
import { TEMPLATES } from '../lib/state/templates';

/**
 * Library route.
 *
 * Two sections:
 *   1. Recent files — pulled from IndexedDB; clicking re-opens.
 *   2. Templates — built-in starter configs; clicking loads as a new
 *      working file (no filename yet, so export prompts a download).
 *
 * Phase 4 will add an "Import from SteamInputDB URL" widget here.
 */
export default function Library() {
  const navigate = useNavigate();
  const load = useConfigStore((s) => s.loadFromText);
  const [recents, setRecents] = useState<RecentEntry[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    listRecent()
      .then((list) => {
        if (!cancelled) setRecents(list);
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setError(err.message);
          setRecents([]);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const openRecent = (entry: RecentEntry) => {
    load(entry.text, entry.filename);
    navigate('/editor');
  };

  const removeRecent = async (entry: RecentEntry) => {
    await deleteRecent(entry.id);
    setRecents((cur) => cur?.filter((e) => e.id !== entry.id) ?? null);
  };

  const openTemplate = (id: string) => {
    const tpl = TEMPLATES.find((t) => t.id === id);
    if (!tpl) return;
    load(tpl.vdf, `${tpl.id}.vdf`);
    navigate('/editor');
  };

  return (
    <div className="h-full overflow-auto p-8">
      <div className="max-w-4xl mx-auto space-y-10">
        <section>
          <h1 className="text-2xl font-bold mb-2">Library</h1>
          <p className="text-[var(--color-text-dim)]">
            Recent files (stored locally in this browser, never uploaded) and a small set of starter
            templates.
          </p>
        </section>

        <section>
          <h2 className="text-sm uppercase tracking-wider text-[var(--color-text-dim)] mb-3">
            Recent files
          </h2>
          {error && (
            <div className="text-xs text-[var(--color-warn)] mb-3">
              IndexedDB unavailable: {error}
            </div>
          )}
          {recents === null ? (
            <div className="text-sm text-[var(--color-text-dim)]">Loading…</div>
          ) : recents.length === 0 ? (
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] p-6 text-sm text-[var(--color-text-dim)]">
              No recent files yet. Opening a `.vdf` from the Home tab will add it here.
            </div>
          ) : (
            <ul className="space-y-2">
              {recents.map((entry) => (
                <li
                  key={entry.id}
                  className="rounded-md border border-[var(--color-border)] bg-[var(--color-panel)] hover:border-[var(--color-accent-dim)] flex items-stretch"
                >
                  <button onClick={() => openRecent(entry)} className="flex-1 text-left px-4 py-3">
                    <div className="text-sm font-medium">{entry.filename}</div>
                    <div className="text-xs text-[var(--color-text-dim)]">
                      Opened {new Date(entry.openedAt).toLocaleString()}
                      {entry.gameHint && (
                        <>
                          <span className="mx-2">·</span>
                          AppID {entry.gameHint}
                        </>
                      )}
                    </div>
                  </button>
                  <button
                    onClick={() => removeRecent(entry)}
                    className="px-4 text-[var(--color-text-dim)] hover:text-[var(--color-error)]"
                    aria-label={`Remove ${entry.filename} from recent files`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="text-sm uppercase tracking-wider text-[var(--color-text-dim)] mb-3">
            Templates
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {TEMPLATES.map((tpl) => (
              <li key={tpl.id}>
                <button
                  onClick={() => openTemplate(tpl.id)}
                  className="w-full text-left p-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-panel)] hover:bg-[var(--color-panel-2)] transition-colors"
                >
                  <div className="font-semibold">{tpl.name}</div>
                  <div className="text-sm text-[var(--color-text-dim)] mt-1">{tpl.description}</div>
                  <div className="text-xs text-[var(--color-text-muted)] mt-2">
                    {tpl.tags.join(' · ')}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
