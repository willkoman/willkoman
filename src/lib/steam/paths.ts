/**
 * Well-known Steam installation paths, for display to the user when they need
 * to drop an exported .vdf into the right place.
 *
 * These are purely informational; we never actually write to them from the
 * web app (sandbox can't see them).
 */

export interface SteamLocation {
  os: 'linux' | 'macos' | 'windows';
  /** Human-readable path with placeholders. */
  template: string;
  /** What it contains. */
  purpose: string;
}

export const STEAM_PATHS: SteamLocation[] = [
  {
    os: 'linux',
    template: '~/.local/share/Steam/userdata/<steamid32>/241100/remote/controller_config/<appid>/',
    purpose: 'Per-user, per-game custom configs. Synced to Steam Cloud.',
  },
  {
    os: 'linux',
    template: '~/.local/share/Steam/steamapps/common/Steam Controller Configs/<steamid32>/config/<appid>/controller_neptune.vdf',
    purpose: 'Newer per-user, per-Deck path for the same data.',
  },
  {
    os: 'linux',
    template: '~/.local/share/Steam/controller_base/',
    purpose: 'Default templates shipped by Steam.',
  },
  {
    os: 'linux',
    template: '~/.local/share/Steam/controller_base/templates/',
    purpose: 'User-created global templates.',
  },
  {
    os: 'macos',
    template: '~/Library/Application Support/Steam/userdata/<steamid32>/241100/remote/controller_config/<appid>/',
    purpose: 'Per-user, per-game custom configs.',
  },
  {
    os: 'windows',
    template: 'C:\\Program Files (x86)\\Steam\\userdata\\<steamid32>\\241100\\remote\\controller_config\\<appid>\\',
    purpose: 'Per-user, per-game custom configs.',
  },
];

/** Heuristic detection from navigator.userAgent. Returns 'linux' on a Steam Deck. */
export function detectOs(): 'linux' | 'macos' | 'windows' | 'unknown' {
  if (typeof navigator === 'undefined') return 'unknown';
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('linux')) return 'linux';
  if (ua.includes('mac os')) return 'macos';
  if (ua.includes('windows')) return 'windows';
  return 'unknown';
}
