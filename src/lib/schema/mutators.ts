/**
 * Mutator façade — the ONLY safe way to edit a SteamInputConfig.
 *
 * Architectural rule (forks-in-the-road.md #13): the AST in `config.raw` is
 * the single source of truth. Every mutator here:
 *
 *   1. Locates the relevant entry in the raw AST.
 *   2. Mutates it using immer's `produceWithPatches`, which records the
 *      forward and inverse patches needed for undo/redo.
 *   3. Rebuilds the typed projection via `configFromVdf` on the new AST.
 *   4. Returns the new SteamInputConfig together with the patch set.
 *
 * Direct manipulation of `config.groups[].bindings`, `config.actionSets`,
 * etc. is a bug — your changes will not appear in the exported `.vdf` file
 * because the serializer walks `raw`. There is no eslint rule for this yet;
 * code review is the gate.
 *
 * Why immer: patches are essentially free for our tree of plain `{key, value,
 * entries}` nodes, and an entire 200-edit undo stack of patches typically
 * comes in under 1 MB even for big configs — vs ~200 MB of full-clone
 * snapshots that 0.0.1 was on track to allocate.
 */

import { enablePatches, produceWithPatches, applyPatches } from 'immer';
import type { Patch } from 'immer';
import type { VdfBlock, VdfEntry } from '../vdf';
import { findEntries, findEntry, getBlock, getString, isBlock } from '../vdf';
import { configFromVdf } from './transform';
import type { ActivatorName, SteamInputConfig } from './types';

enablePatches();

export interface MutationResult {
  /** The updated config (typed projection rebuilt from the mutated AST). */
  config: SteamInputConfig;
  /** Forward patches applied to the AST. Use for redo. */
  patches: Patch[];
  /** Inverse patches. Use for undo. */
  inversePatches: Patch[];
  /** Short human label for the patch (shown in undo history). */
  label: string;
}

/** Apply a previously-recorded patch set (used by the undo store). */
export function applyAstPatches(config: SteamInputConfig, patches: Patch[]): SteamInputConfig {
  const newAst = applyPatches(config.raw, patches);
  return configFromVdf(newAst);
}

// ---------------------------------------------------------------------------
// Helpers — locate AST nodes by domain identifier
// ---------------------------------------------------------------------------

function getRoot(ast: VdfBlock): VdfBlock {
  const root = findEntry(ast, 'controller_mappings');
  if (!root || !isBlock(root.value)) {
    throw new Error('Not a controller_mappings VDF');
  }
  return root.value;
}

function findGroupBlock(ast: VdfBlock, groupId: number): VdfBlock | undefined {
  const root = getRoot(ast);
  for (const entry of findEntries(root, 'group')) {
    if (!isBlock(entry.value)) continue;
    if (getString(entry.value, 'id') === String(groupId)) {
      return entry.value;
    }
  }
  return undefined;
}

/** Find-or-create a block child by key; returns the block. */
function ensureBlock(parent: VdfBlock, key: string): VdfBlock {
  const existing = getBlock(parent, key);
  if (existing) return existing;
  const fresh: VdfBlock = { entries: [] };
  parent.entries.push({ key, value: fresh });
  return fresh;
}

/** Set a leaf string value under a parent block by key. Replaces if present, else appends. */
function setLeaf(parent: VdfBlock, key: string, value: string): void {
  const existing = parent.entries.find((e) => e.key === key);
  if (existing) {
    existing.value = value;
  } else {
    parent.entries.push({ key, value });
  }
}

/** Remove a leaf or block by key. No-op if absent. */
function removeChild(parent: VdfBlock, key: string): void {
  const idx = parent.entries.findIndex((e) => e.key === key);
  if (idx >= 0) parent.entries.splice(idx, 1);
}

/**
 * Wrap a mutation function in `produceWithPatches` and rebuild the typed
 * projection. All public mutators below use this.
 */
function mutate(
  config: SteamInputConfig,
  label: string,
  mutator: (draft: VdfBlock) => void
): MutationResult {
  const [nextAst, patches, inversePatches] = produceWithPatches(config.raw, mutator);
  const next = configFromVdf(nextAst as VdfBlock);
  return { config: next, patches, inversePatches, label };
}

// ---------------------------------------------------------------------------
// Public mutators
// ---------------------------------------------------------------------------

/**
 * Set or replace a binding on a v2-flat group (the `group.bindings.<slot>`
 * map). For v3 groups that use the `inputs.<slot>.activators` tree, use
 * `setActivatorBinding` instead.
 */
export function setBinding(
  config: SteamInputConfig,
  groupId: number,
  slot: string,
  bindingValue: string
): MutationResult {
  return mutate(config, `set ${slot} on group #${groupId}`, (draft) => {
    const group = findGroupBlock(draft, groupId);
    if (!group) throw new Error(`Group ${groupId} not found`);
    const bindings = ensureBlock(group, 'bindings');
    setLeaf(bindings, slot, bindingValue);
  });
}

export function removeBinding(
  config: SteamInputConfig,
  groupId: number,
  slot: string
): MutationResult {
  return mutate(config, `remove ${slot} on group #${groupId}`, (draft) => {
    const group = findGroupBlock(draft, groupId);
    if (!group) throw new Error(`Group ${groupId} not found`);
    const bindings = getBlock(group, 'bindings');
    if (!bindings) return;
    removeChild(bindings, slot);
  });
}

export function setGroupSetting(
  config: SteamInputConfig,
  groupId: number,
  key: string,
  value: string
): MutationResult {
  return mutate(config, `set ${key} on group #${groupId}`, (draft) => {
    const group = findGroupBlock(draft, groupId);
    if (!group) throw new Error(`Group ${groupId} not found`);
    const settings = ensureBlock(group, 'settings');
    setLeaf(settings, key, value);
  });
}

export function setGroupMode(
  config: SteamInputConfig,
  groupId: number,
  mode: string
): MutationResult {
  return mutate(config, `change group #${groupId} to ${mode}`, (draft) => {
    const group = findGroupBlock(draft, groupId);
    if (!group) throw new Error(`Group ${groupId} not found`);
    setLeaf(group, 'mode', mode);
  });
}

/**
 * Append a new `group` entry at the root. Returns the new group's id.
 * Caller is responsible for choosing a unique id (use `nextGroupId(config)`).
 */
export function addGroup(
  config: SteamInputConfig,
  mode: string
): MutationResult & { groupId: number } {
  const newId = nextGroupId(config);
  const result = mutate(config, `add ${mode} group #${newId}`, (draft) => {
    const root = getRoot(draft);
    root.entries.push({
      key: 'group',
      value: {
        entries: [
          { key: 'id', value: String(newId) },
          { key: 'mode', value: mode },
        ],
      },
    });
  });
  return { ...result, groupId: newId };
}

export function removeGroup(config: SteamInputConfig, groupId: number): MutationResult {
  return mutate(config, `remove group #${groupId}`, (draft) => {
    const root = getRoot(draft);
    const idx = root.entries.findIndex(
      (e) => e.key === 'group' && isBlock(e.value) && getString(e.value, 'id') === String(groupId)
    );
    if (idx >= 0) root.entries.splice(idx, 1);
  });
}

export function setMetaField(
  config: SteamInputConfig,
  field:
    | 'title'
    | 'description'
    | 'creator'
    | 'controller_type'
    | 'export_type'
    | 'progenitor'
    | 'Timestamp',
  value: string
): MutationResult {
  return mutate(config, `set ${field}`, (draft) => {
    const root = getRoot(draft);
    setLeaf(root, field, value);
  });
}

export function renameActionSet(
  config: SteamInputConfig,
  oldName: string,
  newName: string
): MutationResult {
  return mutate(config, `rename action set ${oldName} → ${newName}`, (draft) => {
    const root = getRoot(draft);
    const actions = getBlock(root, 'actions');
    if (actions) {
      const entry = actions.entries.find((e) => e.key === oldName);
      if (entry) entry.key = newName;
    }
    // Update presets that reference this set by name
    for (const preset of findEntries(root, 'preset')) {
      if (!isBlock(preset.value)) continue;
      const nameEntry = preset.value.entries.find((e) => e.key === 'name');
      if (nameEntry && nameEntry.value === oldName) nameEntry.value = newName;
    }
    // Update action_layers parent_set_name references
    const layers = getBlock(root, 'action_layers');
    if (layers) {
      for (const layer of layers.entries) {
        if (!isBlock(layer.value)) continue;
        const parent = layer.value.entries.find((e) => e.key === 'parent_set_name');
        if (parent && parent.value === oldName) parent.value = newName;
      }
    }
  });
}

export function addActionSet(
  config: SteamInputConfig,
  name: string,
  title?: string
): MutationResult {
  return mutate(config, `add action set ${name}`, (draft) => {
    const root = getRoot(draft);
    const actions = ensureBlock(root, 'actions');
    if (actions.entries.some((e) => e.key === name)) {
      throw new Error(`Action set ${name} already exists`);
    }
    const setBlock: VdfBlock = {
      entries: [
        { key: 'title', value: title ?? name },
        { key: 'legacy_set', value: '0' },
      ],
    };
    actions.entries.push({ key: name, value: setBlock });
  });
}

export function removeActionSet(config: SteamInputConfig, name: string): MutationResult {
  return mutate(config, `remove action set ${name}`, (draft) => {
    const root = getRoot(draft);
    const actions = getBlock(root, 'actions');
    if (actions) removeChild(actions, name);
    // Also remove presets bound to this set
    root.entries = root.entries.filter((e) => {
      if (e.key !== 'preset' || !isBlock(e.value)) return true;
      const n = e.value.entries.find((x) => x.key === 'name');
      return n?.value !== name;
    });
  });
}

export function setPresetGroupSourceBinding(
  config: SteamInputConfig,
  presetName: string,
  groupId: number,
  sourceState: string
): MutationResult {
  return mutate(config, `wire group #${groupId} → ${sourceState} in ${presetName}`, (draft) => {
    const root = getRoot(draft);
    for (const entry of findEntries(root, 'preset')) {
      if (!isBlock(entry.value)) continue;
      if (getString(entry.value, 'name') !== presetName) continue;
      const gsb = ensureBlock(entry.value, 'group_source_bindings');
      setLeaf(gsb, String(groupId), sourceState);
      return;
    }
    throw new Error(`Preset ${presetName} not found`);
  });
}

/**
 * V3 only: set a binding on a specific activator under a specific input slot.
 * Creates the inputs / activators / bindings sub-tree if it doesn't exist.
 *
 * Note: `binding` is a REPEATING key inside `bindings { }`. This setter
 * replaces ALL existing bindings on the activator with the single provided
 * one. Use `appendActivatorBinding` to add without replacing.
 */
export function setActivatorBinding(
  config: SteamInputConfig,
  groupId: number,
  inputSlot: string,
  activator: ActivatorName,
  bindingValue: string
): MutationResult {
  return mutate(config, `set ${activator} on ${inputSlot} of group #${groupId}`, (draft) => {
    const group = findGroupBlock(draft, groupId);
    if (!group) throw new Error(`Group ${groupId} not found`);
    const inputs = ensureBlock(group, 'inputs');
    const slot = ensureBlock(inputs, inputSlot);
    const activators = ensureBlock(slot, 'activators');
    const activ = ensureBlock(activators, activator);
    const bindings: VdfBlock = { entries: [{ key: 'binding', value: bindingValue }] };
    // Replace existing bindings block wholesale
    const existing = activ.entries.findIndex((e) => e.key === 'bindings');
    const newEntry: VdfEntry = { key: 'bindings', value: bindings };
    if (existing >= 0) activ.entries[existing] = newEntry;
    else activ.entries.push(newEntry);
  });
}

export function appendActivatorBinding(
  config: SteamInputConfig,
  groupId: number,
  inputSlot: string,
  activator: ActivatorName,
  bindingValue: string
): MutationResult {
  return mutate(config, `append ${activator} on ${inputSlot} of group #${groupId}`, (draft) => {
    const group = findGroupBlock(draft, groupId);
    if (!group) throw new Error(`Group ${groupId} not found`);
    const inputs = ensureBlock(group, 'inputs');
    const slot = ensureBlock(inputs, inputSlot);
    const activators = ensureBlock(slot, 'activators');
    const activ = ensureBlock(activators, activator);
    const bindings = ensureBlock(activ, 'bindings');
    bindings.entries.push({ key: 'binding', value: bindingValue });
  });
}

// ---------------------------------------------------------------------------
// Query helpers — used by mutators and by UI selectors
// ---------------------------------------------------------------------------

/** Returns the smallest non-negative integer not used as a `group.id`. */
export function nextGroupId(config: SteamInputConfig): number {
  const used = new Set(config.groups.map((g) => g.id));
  let i = 0;
  while (used.has(i)) i++;
  return i;
}

/** Returns the smallest non-negative integer not used as a `preset.id`. */
export function nextPresetId(config: SteamInputConfig): number {
  const used = new Set(config.presets.map((p) => p.id));
  let i = 0;
  while (used.has(i)) i++;
  return i;
}
