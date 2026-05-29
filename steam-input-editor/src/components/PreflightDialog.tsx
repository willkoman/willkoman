import { useEffect, useMemo } from 'react';
import { useConfigStore } from '../lib/state/configStore';
import { validate } from '../lib/schema';
import type { ValidationFinding, ValidationSeverity } from '../lib/schema';
import { saveVdfFile } from '../lib/fs/fileSystem';
import { track } from '../lib/state/telemetry';

interface Props {
  onClose: () => void;
}

const ICON: Record<ValidationSeverity, string> = {
  error: '✕',
  warn: '!',
  info: 'i',
};

const SEVERITY_LABEL: Record<ValidationSeverity, string> = {
  error: 'Errors',
  warn: 'Warnings',
  info: 'Notes',
};

const SEVERITY_CLASS: Record<ValidationSeverity, string> = {
  error: 'text-[var(--color-error)]',
  warn: 'text-[var(--color-warn)]',
  info: 'text-[var(--color-info)]',
};

/**
 * Pre-flight export dialog.
 *
 * Shown before a save / export. Groups findings by severity, summarises
 * what'll land in the file, and gates the actual download behind a clear
 * "Export anyway" or "Export" depending on whether errors are present.
 *
 * Padsmith never refuses to save. Errors get a sterner button label and
 * a yellow border, but the user is always in control.
 */
export default function PreflightDialog({ onClose }: Props) {
  const config = useConfigStore((s) => s.config);
  const fileName = useConfigStore((s) => s.fileName);
  const exportText = useConfigStore((s) => s.exportText);
  const selectGroup = useConfigStore((s) => s.selectGroup);

  const findings = useMemo(() => (config ? validate(config) : []), [config]);
  const grouped = useMemo(() => {
    const out: Record<ValidationSeverity, ValidationFinding[]> = { error: [], warn: [], info: [] };
    for (const f of findings) out[f.severity].push(f);
    return out;
  }, [findings]);

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

  if (!config) return null;

  const hasErrors = grouped.error.length > 0;

  const doExport = async () => {
    await saveVdfFile(fileName ?? 'controller_neptune.vdf', exportText());
    track('export');
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="preflight-title"
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-lg flex flex-col rounded-lg border bg-[var(--color-panel)] ${
          hasErrors ? 'border-[var(--color-error)]' : 'border-[var(--color-border-strong)]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-4 py-3 border-b border-[var(--color-border)]">
          <h2 id="preflight-title" className="text-sm font-medium">
            Pre-flight check — {fileName ?? 'controller_neptune.vdf'}
          </h2>
          <p className="text-xs text-[var(--color-text-dim)] mt-1">
            {findings.length === 0
              ? 'No validation findings. Ready to export.'
              : `${findings.length} finding${findings.length !== 1 ? 's' : ''} — review below before saving.`}
          </p>
        </header>

        <div className="flex-1 overflow-y-auto max-h-[60vh] divide-y divide-[var(--color-border)]">
          {(['error', 'warn', 'info'] as ValidationSeverity[]).map((sev) => {
            const items = grouped[sev];
            if (items.length === 0) return null;
            return (
              <section key={sev} className="px-4 py-3">
                <div className={`text-xs uppercase tracking-wider mb-2 ${SEVERITY_CLASS[sev]}`}>
                  {SEVERITY_LABEL[sev]} ({items.length})
                </div>
                <ul className="space-y-1">
                  {items.map((f, i) => (
                    <li key={`${f.code}-${i}`}>
                      <button
                        onClick={() => {
                          if (f.target?.kind === 'group' && typeof f.target.id === 'number') {
                            selectGroup(f.target.id);
                            onClose();
                          }
                        }}
                        className="w-full text-left text-xs px-2 py-1 rounded hover:bg-[var(--color-panel-2)] flex items-start gap-2"
                      >
                        <span className={`${SEVERITY_CLASS[sev]} font-mono shrink-0`}>
                          {ICON[sev]}
                        </span>
                        <span className="flex-1">
                          <span className="block">{f.message}</span>
                          <span className="text-[var(--color-text-muted)] font-mono">{f.code}</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>

        <footer className="px-4 py-3 border-t border-[var(--color-border)] flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-3 py-2 text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
          >
            Cancel
          </button>
          <button
            onClick={doExport}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              hasErrors
                ? 'bg-[var(--color-warn)] text-black hover:opacity-90'
                : 'bg-[var(--color-accent)] text-black hover:bg-[var(--color-accent-hover)]'
            }`}
          >
            {hasErrors ? 'Export anyway' : 'Export'}
          </button>
        </footer>
      </div>
    </div>
  );
}
