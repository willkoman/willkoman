import type { VdfBlock, VdfEntry } from '../vdf';
import { asBlock, findEntries, findEntry, getBlock, getString, isBlock } from '../vdf';
import type {
  ActionLayer,
  ActionSet,
  ConfigMeta,
  ControllerType,
  Group,
  InputStyle,
  Preset,
  SteamInputConfig,
} from './types';

/**
 * Build the typed view over a parsed VDF AST.
 *
 * Throws only on a clearly malformed file (no `controller_mappings` root).
 * Everything else is best-effort: unknown sections survive untouched on `raw`.
 */
export function configFromVdf(ast: VdfBlock): SteamInputConfig {
  const rootEntry = findEntry(ast, 'controller_mappings');
  if (!rootEntry || !isBlock(rootEntry.value)) {
    throw new Error('Not a controller_mappings VDF (missing root block)');
  }
  const root = rootEntry.value;

  const versionStr = getString(root, 'version') ?? '3';
  const version = (parseInt(versionStr, 10) === 2 ? 2 : 3) as 2 | 3;

  const meta = readMeta(root);
  const actionSets = readActionSets(root);
  const actionLayers = readActionLayers(root);
  const groups = readGroups(root);
  const presets = readPresets(root);
  const localization = readLocalization(root);

  return {
    version,
    meta,
    actionSets,
    actionLayers,
    groups,
    presets,
    localization,
    raw: ast,
  };
}

function readMeta(root: VdfBlock): ConfigMeta {
  const meta: ConfigMeta = {};
  const setStr = (
    k:
      | 'title'
      | 'description'
      | 'creator'
      | 'progenitor'
      | 'exportType'
      | 'controllerCaps'
      | 'timestamp',
    v: string | undefined
  ) => {
    if (v === undefined) return;
    meta[k] = v;
  };
  const setInt = (k: 'revision' | 'majorRevision' | 'minorRevision', v: string | undefined) => {
    if (v === undefined) return;
    const n = Number.parseInt(v, 10);
    if (!Number.isNaN(n)) meta[k] = n;
  };
  setStr('title', getString(root, 'title'));
  setStr('description', getString(root, 'description'));
  setStr('creator', getString(root, 'creator'));
  setStr('progenitor', getString(root, 'progenitor'));
  setStr('exportType', getString(root, 'export_type'));
  const ct = getString(root, 'controller_type');
  if (ct !== undefined) meta.controllerType = ct as ControllerType;
  // controller_caps is an opaque bitmask. Stored as string; never parsed,
  // never recomputed. Wrong caps silently hides the config in Steam's picker.
  setStr('controllerCaps', getString(root, 'controller_caps'));
  setInt('revision', getString(root, 'revision'));
  setInt('majorRevision', getString(root, 'major_revision'));
  setInt('minorRevision', getString(root, 'minor_revision'));
  setStr('timestamp', getString(root, 'Timestamp') ?? getString(root, 'timestamp'));
  return meta;
}

function readActionSets(root: VdfBlock): ActionSet[] {
  const actions = getBlock(root, 'actions');
  if (!actions) return [];
  const sets: ActionSet[] = [];
  for (const entry of actions.entries) {
    if (!isBlock(entry.value)) continue;
    const block = entry.value;
    sets.push({
      name: entry.key,
      ...(getString(block, 'title') !== undefined ? { title: getString(block, 'title')! } : {}),
      ...(getString(block, 'legacy_set') === '1' ? { legacy: true } : {}),
      ...(getString(block, 'set_layer') === '1' ? { isLayer: true } : {}),
    });
  }
  return sets;
}

function readActionLayers(root: VdfBlock): ActionLayer[] {
  const layers = getBlock(root, 'action_layers');
  if (!layers) return [];
  const out: ActionLayer[] = [];
  for (const entry of layers.entries) {
    if (!isBlock(entry.value)) continue;
    const block = entry.value;
    const parentSetName = getString(block, 'parent_set_name');
    const title = getString(block, 'title');
    out.push({
      name: entry.key,
      ...(title !== undefined ? { title } : {}),
      ...(parentSetName !== undefined ? { parentSetName } : {}),
      isLayer: true,
    });
  }
  return out;
}

function readGroups(root: VdfBlock): Group[] {
  const groupEntries = findEntries(root, 'group');
  const groups: Group[] = [];
  for (const entry of groupEntries) {
    if (!isBlock(entry.value)) continue;
    const block = entry.value;
    const idStr = getString(block, 'id');
    if (idStr === undefined) continue;
    const id = Number.parseInt(idStr, 10);
    if (Number.isNaN(id)) continue;
    const mode = (getString(block, 'mode') ?? '') as InputStyle;
    const bindings = readStringMap(getBlock(block, 'bindings'));
    const settings = readStringMap(getBlock(block, 'settings'));
    const group: Group = { id, mode, bindings, settings };
    // v3 nested activator tree: inputs.<slot>.activators.<Activator>.bindings.binding
    // Kept opaque for round-trip; typed editing is Phase 2.
    const inputs = getBlock(block, 'inputs');
    if (inputs) group.inputs = inputs;
    // NOTE: there is NO `gameactions` sub-block inside controller_mappings groups.
    // Game-action references are inline bindings like `game_action SetName ActionName`.
    // The `In Game Actions` file (game_actions_<appid>.vdf) is a separate format.
    groups.push(group);
  }
  return groups;
}

function readPresets(root: VdfBlock): Preset[] {
  const presetEntries = findEntries(root, 'preset');
  const presets: Preset[] = [];
  for (const entry of presetEntries) {
    if (!isBlock(entry.value)) continue;
    const block = entry.value;
    const idStr = getString(block, 'id');
    if (idStr === undefined) continue;
    const id = Number.parseInt(idStr, 10);
    if (Number.isNaN(id)) continue;
    const name = getString(block, 'name') ?? '';
    const gsb = readStringMap(getBlock(block, 'group_source_bindings'));
    // switch_bindings is sometimes { bindings { ... } } and sometimes flat — handle both.
    const sb = getBlock(block, 'switch_bindings');
    const switchBindings = sb ? readStringMap(getBlock(sb, 'bindings') ?? sb) : {};
    presets.push({ id, name, groupSourceBindings: gsb, switchBindings });
  }
  return presets;
}

function readLocalization(root: VdfBlock): Record<string, Record<string, string>> {
  const loc = getBlock(root, 'localization');
  if (!loc) return {};
  const out: Record<string, Record<string, string>> = {};
  for (const entry of loc.entries) {
    if (!isBlock(entry.value)) continue;
    out[entry.key] = readStringMap(entry.value);
  }
  return out;
}

function readStringMap(block: VdfBlock | undefined): Record<string, string> {
  if (!block) return {};
  const out: Record<string, string> = {};
  for (const entry of block.entries) {
    if (typeof entry.value === 'string') {
      out[entry.key] = entry.value;
    }
  }
  return out;
}

/**
 * Serialize a typed config back to a VDF AST.
 *
 * Per the architectural rule documented in `types.ts`, the AST in `config.raw`
 * is the single source of truth. Mutators (see `lib/schema/mutators.ts`) write
 * to the AST first and rebuild the typed projection. This function returns
 * `config.raw` as-is, guaranteeing serialized output reflects every accepted
 * mutation.
 *
 * Direct manipulation of `config.groups`, `config.actionSets`, etc. is a bug —
 * use a mutator or you will not see your changes in the exported `.vdf`.
 */
export function configToVdf(config: SteamInputConfig): VdfBlock {
  return config.raw;
}

/** Convenience: extract all `group` entries from the raw AST. */
export function rawGroupEntries(ast: VdfBlock): VdfEntry[] {
  const root = findEntry(ast, 'controller_mappings');
  if (!root || !isBlock(root.value)) return [];
  return findEntries(asBlock(root.value), 'group');
}
