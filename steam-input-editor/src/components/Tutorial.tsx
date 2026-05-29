import { useEffect, useState } from 'react';

interface Step {
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    title: 'Welcome to Padsmith',
    body: 'A craft tool for Steam Input controller schemas. Open a .vdf file or pick a template — then edit visually, save back to disk.',
  },
  {
    title: 'The Deck canvas',
    body: 'The Editor route shows a Steam Deck silhouette with every input source labelled. Click any region (trackpads, sticks, ABXY, dpad, triggers, gyro) to inspect or edit the group bound to it.',
  },
  {
    title: 'Touch + radial menus, visually',
    body: 'Click a touch-menu group on the canvas, then click any slot in the grid to bind it. Drag a bound slot onto another to swap. The radial menu lets you change slot count live.',
  },
  {
    title: 'Undo, redo, diff',
    body: 'Every edit lands in a patch-based undo stack. Cmd/Ctrl+Z to undo, Shift+Z to redo, Cmd+Shift+D to see the diff against your original file — proof of exactly what your export will change.',
  },
  {
    title: 'Command palette',
    body: 'Press Cmd/Ctrl+K anywhere to jump to a group, action set, change an input style, or export. Fuzzy search across everything.',
  },
  {
    title: 'When you save',
    body: "Padsmith exports your edited .vdf as a download. Drop it into your Steam controller_config directory (the Home tab shows the exact path for your OS). Close Steam before saving so it doesn't clobber.",
  },
];

const STORAGE_KEY = 'padsmith.tutorialSeen';

/**
 * First-run tutorial overlay.
 *
 * Auto-shown once on the first visit; dismissable; "Don't show again" toggle
 * persists via localStorage. The header has a "?" button that re-opens it.
 *
 * No external dep — built on the same modal pattern as BindingPicker /
 * DiffDrawer. The step counter and Next/Back navigation are keyboard-
 * accessible.
 */
export function useTutorial() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  // Open automatically on first run (no storage flag).
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const seen = window.localStorage.getItem(STORAGE_KEY);
    if (!seen) setOpen(true);
  }, []);

  const close = () => {
    if (dontShowAgain && typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, '1');
    }
    setOpen(false);
    setStep(0);
  };

  const openOnDemand = () => {
    setStep(0);
    setOpen(true);
  };

  return { open, step, setStep, dontShowAgain, setDontShowAgain, close, openOnDemand };
}

interface TutorialProps {
  open: boolean;
  step: number;
  setStep: (n: number) => void;
  dontShowAgain: boolean;
  setDontShowAgain: (v: boolean) => void;
  close: () => void;
}

export default function Tutorial({
  open,
  step,
  setStep,
  dontShowAgain,
  setDontShowAgain,
  close,
}: TutorialProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        close();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setStep(Math.min(STEPS.length - 1, step + 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setStep(Math.max(0, step - 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, step, setStep, close]);

  if (!open) return null;
  const current = STEPS[step];
  if (!current) return null;
  const isLast = step === STEPS.length - 1;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-title"
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4"
      onClick={close}
    >
      <div
        className="w-full max-w-md rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-panel)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
          <h2 id="tutorial-title" className="text-sm font-medium">
            {current.title}
          </h2>
          <span className="text-xs text-[var(--color-text-dim)] font-mono">
            {step + 1} / {STEPS.length}
          </span>
        </header>

        <div className="p-5 text-sm leading-relaxed">{current.body}</div>

        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border)]">
          <label className="flex items-center gap-2 text-xs text-[var(--color-text-dim)]">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="accent-[var(--color-accent)]"
            />
            Don&apos;t show again
          </label>
          <div className="flex gap-1">
            <button
              onClick={() => setStep(Math.max(0, step - 1))}
              disabled={step === 0}
              className="px-3 py-1 text-sm text-[var(--color-text-dim)] hover:text-[var(--color-text)] disabled:opacity-30"
            >
              Back
            </button>
            {isLast ? (
              <button
                onClick={close}
                className="px-3 py-1 rounded bg-[var(--color-accent)] text-black text-sm font-medium"
              >
                Done
              </button>
            ) : (
              <button
                onClick={() => setStep(Math.min(STEPS.length - 1, step + 1))}
                className="px-3 py-1 rounded bg-[var(--color-accent)] text-black text-sm font-medium"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
