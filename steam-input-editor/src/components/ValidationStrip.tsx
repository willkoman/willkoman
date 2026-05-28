import { useMemo, useState } from 'react';
import { useConfigStore } from '../lib/state/configStore';
import { validate } from '../lib/schema';
import type { ValidationFinding, ValidationSeverity } from '../lib/schema';

const ICON: Record<ValidationSeverity, string> = {
  error: '✕',
  warn: '!',
  info: 'i',
};

const SEVERITY_CLASS: Record<ValidationSeverity, string> = {
  error: 'text-[var(--color-error)]',
  warn: 'text-[var(--color-warn)]',
  info: 'text-[var(--color-info)]',
};

/**
 * Inline validation panel for the editor. Reads findings from `validate()`
 * (pure function over the typed config) and groups them by severity.
 *
 * Clicking a finding's `target` selects the relevant group in the inspector
 * (when the target is a group id), so it doubles as a "jump to issue" UI.
 */
export default function ValidationStrip() {
  const config = useConfigStore((s) => s.config);
  const selectGroup = useConfigStore((s) => s.selectGroup);
  const [collapsed, setCollapsed] = useState(false);

  const findings = useMemo(() => (config ? validate(config) : []), [config]);

  if (!config) return null;

  const counts = findings.reduce((acc, f) => ({ ...acc, [f.severity]: acc[f.severity] + 1 }), {
    error: 0,
    warn: 0,
    info: 0,
  } as Record<ValidationSeverity, number>);

  const total = findings.length;

  if (total === 0) {
    return (
      <div className="text-xs px-3 py-2 rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)] flex items-center gap-2">
        <span className="text-[var(--color-success)]">✓</span>
        <span className="text-[var(--color-text-dim)]">No validation findings.</span>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-panel-2)]">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center gap-3 px-3 py-2 text-xs"
        aria-expanded={!collapsed}
      >
        <span className="text-[var(--color-text-dim)]">{collapsed ? '▸' : '▾'}</span>
        <span className="font-medium">Validation</span>
        {counts.error > 0 && (
          <span className={SEVERITY_CLASS.error}>
            {ICON.error} {counts.error}
          </span>
        )}
        {counts.warn > 0 && (
          <span className={SEVERITY_CLASS.warn}>
            {ICON.warn} {counts.warn}
          </span>
        )}
        {counts.info > 0 && (
          <span className={SEVERITY_CLASS.info}>
            {ICON.info} {counts.info}
          </span>
        )}
        <span className="text-[var(--color-text-dim)] ml-auto">
          {total} finding{total !== 1 ? 's' : ''}
        </span>
      </button>
      {!collapsed && (
        <ul className="border-t border-[var(--color-border)] divide-y divide-[var(--color-border)]">
          {findings.map((f, idx) => (
            <li key={`${f.code}-${idx}`}>
              <button
                onClick={() => {
                  if (f.target?.kind === 'group' && typeof f.target.id === 'number') {
                    selectGroup(f.target.id);
                  }
                }}
                className="w-full text-left px-3 py-2 text-xs hover:bg-[var(--color-panel-3)] flex items-start gap-2"
              >
                <span className={`${SEVERITY_CLASS[f.severity]} font-mono shrink-0`}>
                  {ICON[f.severity]}
                </span>
                <span className="flex-1">
                  <span className="block">{f.message}</span>
                  <span className="text-[var(--color-text-muted)] font-mono">{f.code}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function findingsSummary(findings: ValidationFinding[]): string {
  const e = findings.filter((f) => f.severity === 'error').length;
  const w = findings.filter((f) => f.severity === 'warn').length;
  const i = findings.filter((f) => f.severity === 'info').length;
  return `${e} error · ${w} warn · ${i} info`;
}
