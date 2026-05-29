import { useEffect, useMemo, useState } from 'react';
import { useConfigStore } from '../lib/state/configStore';
import { serializeVdf } from '../lib/vdf';
import { diffSummary, lineDiff } from '../lib/state/lineDiff';

interface Props {
  onClose: () => void;
}

/**
 * Side-by-side diff: original loaded text vs current serialized AST.
 *
 * The "original" snapshot is captured on file open and stashed in the
 * store's `originalText` field. If a user opens a config, edits, and
 * opens the drawer, they see exactly what would land in their exported
 * `.vdf` — the trust promise made visible.
 *
 * Rendering: line-level diff via LCS; same lines paired across both
 * columns; added/removed lines tinted accent/error. Synchronised
 * scrolling is approximate (just one scroll container wrapping a
 * 2-column grid, which keeps rows aligned by construction).
 */
export default function DiffDrawer({ onClose }: Props) {
  const config = useConfigStore((s) => s.config);
  const originalText = useConfigStore((s) => s.originalText);

  const currentText = useMemo(() => (config ? serializeVdf(config.raw) : ''), [config]);
  const segments = useMemo(
    () => (originalText !== null ? lineDiff(originalText, currentText) : []),
    [originalText, currentText]
  );
  const summary = useMemo(() => diffSummary(segments), [segments]);

  const [filter, setFilter] = useState<'all' | 'changes'>('changes');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!config || originalText === null) {
    return (
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-6"
        onClick={onClose}
      >
        <div
          className="rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-panel)] p-6 text-sm text-[var(--color-text-dim)] max-w-md text-center"
          onClick={(e) => e.stopPropagation()}
        >
          No original file to diff against. Open a `.vdf` to enable the diff drawer.
        </div>
      </div>
    );
  }

  const visible = filter === 'all' ? segments : segments.filter((s) => s.kind !== 'same');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Diff drawer"
      className="fixed inset-0 z-50 flex items-stretch justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl flex flex-col rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-panel)]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center gap-4 px-4 py-3 border-b border-[var(--color-border)]">
          <h2 className="text-sm font-medium">Diff: original vs current</h2>
          <div className="text-xs text-[var(--color-text-dim)] flex items-center gap-3">
            <span className="text-[var(--color-success)]">+{summary.added}</span>
            <span className="text-[var(--color-error)]">−{summary.removed}</span>
            <span>{summary.same} unchanged</span>
          </div>
          <div className="flex-1" />
          <div className="flex gap-1">
            <button
              onClick={() => setFilter('changes')}
              className={`px-2 py-1 rounded text-xs ${
                filter === 'changes'
                  ? 'bg-[var(--color-accent)] text-black'
                  : 'bg-[var(--color-panel-2)] text-[var(--color-text-dim)]'
              }`}
            >
              Changes only
            </button>
            <button
              onClick={() => setFilter('all')}
              className={`px-2 py-1 rounded text-xs ${
                filter === 'all'
                  ? 'bg-[var(--color-accent)] text-black'
                  : 'bg-[var(--color-panel-2)] text-[var(--color-text-dim)]'
              }`}
            >
              All lines
            </button>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--color-text-dim)] hover:text-[var(--color-text)] px-2"
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-auto font-mono text-xs">
          {visible.length === 0 ? (
            <div className="p-6 text-center text-[var(--color-text-dim)]">
              {filter === 'changes'
                ? 'No changes yet — the export will be byte-identical to the original.'
                : 'Empty config.'}
            </div>
          ) : (
            <div className="grid grid-cols-2 divide-x divide-[var(--color-border)]">
              <Side
                segments={visible}
                side="left"
                emptyKinds={new Set<DiffKind>(['added'])}
                bgFor={(k) =>
                  k === 'removed'
                    ? 'bg-[color-mix(in_oklab,var(--color-error)_18%,transparent)]'
                    : ''
                }
              />
              <Side
                segments={visible}
                side="right"
                emptyKinds={new Set<DiffKind>(['removed'])}
                bgFor={(k) =>
                  k === 'added'
                    ? 'bg-[color-mix(in_oklab,var(--color-success)_18%,transparent)]'
                    : ''
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type DiffKind = 'same' | 'added' | 'removed';

interface SideProps {
  segments: ReturnType<typeof lineDiff>;
  side: 'left' | 'right';
  emptyKinds: Set<DiffKind>;
  bgFor: (kind: DiffKind) => string;
}

function Side({ segments, emptyKinds, bgFor }: SideProps) {
  return (
    <div>
      {segments.map((seg, i) => {
        const blank = emptyKinds.has(seg.kind);
        const lineNo = blank
          ? ''
          : seg.kind === 'added'
            ? seg.rightLine
            : seg.kind === 'removed'
              ? seg.leftLine
              : seg.leftLine;
        return (
          <div
            key={i}
            className={`grid grid-cols-[48px_1fr] gap-2 px-2 py-0.5 whitespace-pre ${bgFor(seg.kind)}`}
          >
            <span className="text-right text-[var(--color-text-muted)] select-none">
              {lineNo ?? ''}
            </span>
            <span>{blank ? '' : seg.text}</span>
          </div>
        );
      })}
    </div>
  );
}
