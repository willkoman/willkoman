import { useState } from 'react';
import { isOptedIn, setOptedIn } from '../lib/state/telemetry';

interface Props {
  onClose: () => void;
}

/**
 * In-app settings panel.
 *
 * Currently only the telemetry opt-in toggle lives here. Future settings
 * (default save path hint, theme alternatives, keyboard remap) would
 * land here.
 */
export default function SettingsDialog({ onClose }: Props) {
  const [optIn, setOptIn] = useState(isOptedIn());

  const onToggleTelemetry = (v: boolean) => {
    setOptIn(v);
    setOptedIn(v);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md flex flex-col rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-panel)]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
          <h2 id="settings-title" className="text-sm font-medium">
            Settings
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--color-text-dim)] hover:text-[var(--color-text)] px-2"
            aria-label="Close"
          >
            ✕
          </button>
        </header>

        <div className="p-4 space-y-5">
          <section>
            <div className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] mb-2">
              Telemetry
            </div>
            <label className="flex items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={optIn}
                onChange={(e) => onToggleTelemetry(e.target.checked)}
                className="mt-1 accent-[var(--color-accent)]"
              />
              <span>
                <div>Send anonymous usage events</div>
                <div className="text-xs text-[var(--color-text-dim)] mt-1">
                  Counts how often files and templates are opened, and how often export runs. No
                  file contents, no IDs, no cookies. Off by default.
                </div>
              </span>
            </label>
          </section>

          <section>
            <div className="text-xs uppercase tracking-wider text-[var(--color-text-dim)] mb-2">
              Keyboard
            </div>
            <ul className="text-xs space-y-1 text-[var(--color-text-dim)]">
              <li>
                <span className="font-mono">Ctrl+Z / Cmd+Z</span> · Undo
              </li>
              <li>
                <span className="font-mono">Ctrl+Shift+Z / Ctrl+Y</span> · Redo
              </li>
              <li>
                <span className="font-mono">Ctrl+K / Cmd+K</span> · Command palette
              </li>
              <li>
                <span className="font-mono">Ctrl+Shift+D</span> · Diff drawer
              </li>
              <li>
                <span className="font-mono">Esc</span> · Close any dialog
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
