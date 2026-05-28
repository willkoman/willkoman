/**
 * Validation rules for SteamInputConfig.
 *
 * Output is warnings, never errors — Padsmith never refuses to save. Steam
 * itself is famously lenient about half-malformed configs, and our rule list
 * is incomplete because the format is partly undocumented. A "valid"
 * config can still trip a warning; an invalid one might pass our checks.
 * Treat findings as suggestions surfaced in the UI, not gospel.
 *
 * Severity tiers:
 *   - error   : config will almost certainly misbehave in Steam (duplicate
 *               group ids; preset refs a missing group; corrupted slot
 *               count). User should fix before saving.
 *   - warn    : documented anti-pattern (always-on radial on gyro; >8
 *               radial slots on button source; unverified touch-menu
 *               layout). Save proceeds but Steam may surprise the user.
 *   - info    : style / cleanup nit (action set with no preset; unknown
 *               binding verb that round-trips but isn't in our catalog).
 */

import type { SteamInputConfig } from './types';
import { isDocumentedTouchMenuCount, isVerifiedTouchMenuLayout } from './menuLayouts';
import { isKnownVerb, parseBinding } from './bindings';
import { RADIAL_MENU_BUTTON_SOURCE_MAX } from './types';

export type ValidationSeverity = 'error' | 'warn' | 'info';

export interface ValidationFinding {
  severity: ValidationSeverity;
  /** Short identifier — UI can show an icon per code. */
  code: string;
  /** Human-readable message. */
  message: string;
  /** Optional pointer to the offending object for "jump to" UX. */
  target?: { kind: 'group' | 'preset' | 'actionSet' | 'meta'; id?: number | string };
}

/** Build the full finding list for a config. Ordered: errors → warns → infos. */
export function validate(config: SteamInputConfig): ValidationFinding[] {
  const findings: ValidationFinding[] = [];
  pushDuplicateGroupIds(config, findings);
  pushMissingGroupRefs(config, findings);
  pushTouchMenuChecks(config, findings);
  pushRadialMenuChecks(config, findings);
  pushOrphanActionSets(config, findings);
  pushUnknownVerbs(config, findings);
  return sortBySeverity(findings);
}

function pushDuplicateGroupIds(cfg: SteamInputConfig, out: ValidationFinding[]): void {
  const seen = new Map<number, number>();
  for (const g of cfg.groups) {
    seen.set(g.id, (seen.get(g.id) ?? 0) + 1);
  }
  for (const [id, count] of seen) {
    if (count > 1) {
      out.push({
        severity: 'error',
        code: 'duplicate-group-id',
        message: `Group id ${id} appears ${count} times. Steam will only see one.`,
        target: { kind: 'group', id },
      });
    }
  }
}

function pushMissingGroupRefs(cfg: SteamInputConfig, out: ValidationFinding[]): void {
  const groupIds = new Set(cfg.groups.map((g) => g.id));
  for (const preset of cfg.presets) {
    for (const refIdStr of Object.keys(preset.groupSourceBindings)) {
      const refId = Number.parseInt(refIdStr, 10);
      if (Number.isNaN(refId)) continue;
      if (!groupIds.has(refId)) {
        out.push({
          severity: 'error',
          code: 'preset-missing-group-ref',
          message: `Preset "${preset.name}" references group #${refId} which does not exist.`,
          target: { kind: 'preset', id: preset.name },
        });
      }
    }
  }
}

function pushTouchMenuChecks(cfg: SteamInputConfig, out: ValidationFinding[]): void {
  for (const g of cfg.groups) {
    if (g.mode !== 'touch_menu' && g.mode !== 'hotbar_menu') continue;
    const countStr = g.settings.touch_menu_button_count;
    if (countStr === undefined) {
      out.push({
        severity: 'warn',
        code: 'touch-menu-missing-count',
        message: `Group #${g.id} (${g.mode}) is missing touch_menu_button_count.`,
        target: { kind: 'group', id: g.id },
      });
      continue;
    }
    const count = Number.parseInt(countStr, 10);
    if (g.mode === 'touch_menu' && !isDocumentedTouchMenuCount(count)) {
      out.push({
        severity: 'error',
        code: 'touch-menu-bad-count',
        message: `Group #${g.id}: touch_menu_button_count=${count}; documented set is 2, 4, 7, 9, 12, 13, 16.`,
        target: { kind: 'group', id: g.id },
      });
    } else if (g.mode === 'touch_menu' && !isVerifiedTouchMenuLayout(count)) {
      out.push({
        severity: 'warn',
        code: 'touch-menu-unverified-layout',
        message: `Group #${g.id}: ${count}-slot layout positions are not yet visually verified.`,
        target: { kind: 'group', id: g.id },
      });
    }
  }
}

function pushRadialMenuChecks(cfg: SteamInputConfig, out: ValidationFinding[]): void {
  // For radial menus we need to look at the preset wiring to know if it's
  // attached to a button source. Map group -> first observed input source.
  const groupSources = new Map<number, string>();
  for (const preset of cfg.presets) {
    for (const [groupIdStr, sourceState] of Object.entries(preset.groupSourceBindings)) {
      const groupId = Number.parseInt(groupIdStr, 10);
      if (Number.isNaN(groupId)) continue;
      if (!groupSources.has(groupId)) {
        groupSources.set(groupId, sourceState.split(' ')[0] ?? '');
      }
    }
  }

  const buttonSources = new Set([
    'button_diamond',
    'dpad',
    'switch',
    'left_trigger',
    'right_trigger',
  ]);

  for (const g of cfg.groups) {
    if (g.mode !== 'radial_menu') continue;
    const countStr = g.settings.touch_menu_button_count;
    const count = countStr !== undefined ? Number.parseInt(countStr, 10) : 0;
    const source = groupSources.get(g.id) ?? '';

    if (count > 20) {
      out.push({
        severity: 'error',
        code: 'radial-menu-too-many-slots',
        message: `Group #${g.id}: radial menu has ${count} slots; max is 20.`,
        target: { kind: 'group', id: g.id },
      });
    }
    if (buttonSources.has(source) && count > RADIAL_MENU_BUTTON_SOURCE_MAX) {
      out.push({
        severity: 'warn',
        code: 'radial-menu-button-source-too-many',
        message:
          `Group #${g.id}: ${count} slots on a button source (${source}); ` +
          `non-cardinal slots are unreliable beyond ${RADIAL_MENU_BUTTON_SOURCE_MAX}.`,
        target: { kind: 'group', id: g.id },
      });
    }
    const fireType = g.settings.touchmenu_button_fire_type;
    if (source === 'gyro' && fireType === '3') {
      out.push({
        severity: 'warn',
        code: 'radial-menu-always-on-gyro',
        message: `Group #${g.id}: "Always" activation on a gyro source is documented as unusable.`,
        target: { kind: 'group', id: g.id },
      });
    }
  }
}

function pushOrphanActionSets(cfg: SteamInputConfig, out: ValidationFinding[]): void {
  const referenced = new Set(cfg.presets.map((p) => p.name));
  for (const set of cfg.actionSets) {
    if (!referenced.has(set.name)) {
      out.push({
        severity: 'info',
        code: 'action-set-no-preset',
        message: `Action set "${set.name}" has no preset wired to it; it will never activate.`,
        target: { kind: 'actionSet', id: set.name },
      });
    }
  }
}

function pushUnknownVerbs(cfg: SteamInputConfig, out: ValidationFinding[]): void {
  // Sample up to N unknown verbs to avoid spamming the panel for big configs.
  const seen = new Set<string>();
  const MAX_UNKNOWN_REPORTS = 5;
  for (const g of cfg.groups) {
    for (const [slot, raw] of Object.entries(g.bindings)) {
      const parsed = parseBinding(raw);
      if (!parsed || isKnownVerb(parsed.verb)) continue;
      if (seen.has(parsed.verb)) continue;
      seen.add(parsed.verb);
      if (seen.size > MAX_UNKNOWN_REPORTS) return;
      out.push({
        severity: 'info',
        code: 'unknown-binding-verb',
        message: `Group #${g.id} slot "${slot}" uses verb "${parsed.verb}" not in our catalog; round-trips fine but unverified.`,
        target: { kind: 'group', id: g.id },
      });
    }
  }
}

function sortBySeverity(findings: ValidationFinding[]): ValidationFinding[] {
  const rank: Record<ValidationSeverity, number> = { error: 0, warn: 1, info: 2 };
  return [...findings].sort((a, b) => rank[a.severity] - rank[b.severity]);
}
