import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useConfigStore } from '../lib/state/configStore';

interface AppShellProps {
  children: ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const location = useLocation();
  const fileName = useConfigStore((s) => s.fileName);
  const dirty = useConfigStore((s) => s.dirty);

  const navItem = (to: string, label: string) => {
    const active = location.pathname === to;
    return (
      <Link
        to={to}
        className={`px-3 py-2 rounded-md text-sm transition-colors ${
          active
            ? 'bg-[var(--color-panel-2)] text-[var(--color-text)]'
            : 'text-[var(--color-text-dim)] hover:text-[var(--color-text)] hover:bg-[var(--color-panel)]'
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <div className="h-full flex flex-col bg-[var(--color-bg)]">
      <header className="flex items-center gap-4 px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-panel)]">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight">Steam Input Editor</span>
          <span className="text-xs text-[var(--color-text-dim)]">v0.0.1 · Phase 0</span>
        </div>
        <nav className="flex items-center gap-1 ml-4">
          {navItem('/', 'Home')}
          {navItem('/editor', 'Editor')}
          {navItem('/library', 'Library')}
        </nav>
        <div className="flex-1" />
        {fileName && (
          <div className="text-xs text-[var(--color-text-dim)]">
            {fileName}
            {dirty && <span className="ml-2 text-[var(--color-warn)]">● unsaved</span>}
          </div>
        )}
      </header>
      <main className="flex-1 overflow-hidden">{children}</main>
    </div>
  );
}
