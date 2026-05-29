import { create } from 'zustand';
import { parseVdf, serializeVdf } from '../vdf';
import { applyAstPatches, configFromVdf } from '../schema';
import type { MutationResult, SteamInputConfig } from '../schema';
import {
  canRedo as canRedoState,
  canUndo as canUndoState,
  emptyUndoState,
  recordEdit,
  redo as redoState,
  undo as undoState,
} from './undo';
import type { UndoState } from './undo';

interface ConfigState {
  /** Currently-open config, or null if none. */
  config: SteamInputConfig | null;
  /** Original on-disk text, captured at load. Drives the diff drawer.
   *  Null until a file is opened. */
  originalText: string | null;
  /** Source filename, if any. Used as the default for export. */
  fileName: string | null;
  /** Editor has unsaved changes since the last open or save. */
  dirty: boolean;
  /** Selected action set name (drives which preset is rendered). */
  selectedActionSet: string | null;
  /** Selected group id, if any (drives the inspector panel). */
  selectedGroupId: number | null;
  /** Patch-based undo/redo history. */
  history: UndoState;

  loadFromText: (text: string, fileName?: string) => void;
  exportText: () => string;
  selectActionSet: (name: string) => void;
  selectGroup: (id: number | null) => void;
  /** Apply a mutator result to the store. The mutator already produced the new config. */
  applyMutation: (result: MutationResult) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  reset: () => void;
}

export const useConfigStore = create<ConfigState>((set, get) => ({
  config: null,
  originalText: null,
  fileName: null,
  dirty: false,
  selectedActionSet: null,
  selectedGroupId: null,
  history: emptyUndoState(),

  loadFromText: (text, fileName) => {
    const ast = parseVdf(text);
    const config = configFromVdf(ast);
    const firstSet = config.actionSets[0]?.name ?? null;
    // Capture the canonical serialization of the loaded text as the diff
    // baseline. We use the parsed-then-serialized form (not the raw text)
    // so cosmetic whitespace from the user's editor doesn't show as diff
    // noise.
    const baseline = serializeVdf(ast);
    set({
      config,
      originalText: baseline,
      fileName: fileName ?? null,
      dirty: false,
      selectedActionSet: firstSet,
      selectedGroupId: null,
      history: emptyUndoState(),
    });
  },

  exportText: () => {
    const { config } = get();
    if (!config) return '';
    return serializeVdf(config.raw);
  },

  selectActionSet: (name) => set({ selectedActionSet: name }),
  selectGroup: (id) => set({ selectedGroupId: id }),

  applyMutation: (result) => {
    const { history } = get();
    set({
      config: result.config,
      dirty: true,
      history: recordEdit(history, result.label, result.patches, result.inversePatches),
    });
  },

  undo: () => {
    const { history, config } = get();
    if (!config) return;
    const { state: next, entry } = undoState(history);
    if (!entry) return;
    const nextConfig = applyAstPatches(config, entry.inversePatches);
    set({ history: next, config: nextConfig, dirty: next.past.length > 0 });
  },

  redo: () => {
    const { history, config } = get();
    if (!config) return;
    const { state: next, entry } = redoState(history);
    if (!entry) return;
    const nextConfig = applyAstPatches(config, entry.patches);
    set({ history: next, config: nextConfig, dirty: true });
  },

  canUndo: () => canUndoState(get().history),
  canRedo: () => canRedoState(get().history),

  reset: () =>
    set({
      config: null,
      originalText: null,
      fileName: null,
      dirty: false,
      selectedActionSet: null,
      selectedGroupId: null,
      history: emptyUndoState(),
    }),
}));
