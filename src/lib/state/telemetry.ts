/**
 * Privacy-respecting telemetry.
 *
 * Cookieless event counts via a Plausible-compatible /api/event endpoint.
 * No PII, no file content, no SteamID64s. We send:
 *   - app load (page view, automatic)
 *   - "open file"     — just the event name
 *   - "open template" — with the template id (never the file contents)
 *   - "export"        — just the event name
 *
 * Opt-in by default — we send nothing until the user explicitly toggles it
 * on. The setting persists in localStorage.
 *
 * Domain is configured via VITE_PLAUSIBLE_DOMAIN at build time. If unset,
 * no telemetry endpoint is configured and all calls are no-ops.
 */

const KEY = 'padsmith.telemetryOptIn';
const DOMAIN =
  (typeof import.meta.env !== 'undefined' && import.meta.env.VITE_PLAUSIBLE_DOMAIN) || '';
const ENDPOINT = DOMAIN ? `https://${DOMAIN}/api/event` : '';

export function isOptedIn(): boolean {
  if (typeof window === 'undefined') return false;
  return window.localStorage.getItem(KEY) === '1';
}

export function setOptedIn(value: boolean): void {
  if (typeof window === 'undefined') return;
  if (value) window.localStorage.setItem(KEY, '1');
  else window.localStorage.removeItem(KEY);
}

export type TelemetryEvent = 'open file' | 'open template' | 'export';

export interface EventProps {
  /** Template id when relevant; never file contents. */
  template?: string;
}

/** Fire an event if the user has opted in. Best-effort; failures swallowed. */
export function track(event: TelemetryEvent, props?: EventProps): void {
  if (!isOptedIn() || !ENDPOINT) return;
  try {
    void fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
      body: JSON.stringify({
        name: event,
        url: window.location.href.split('?')[0],
        domain: DOMAIN,
        props,
      }),
    }).catch(() => {
      /* swallow — telemetry must never affect UX */
    });
  } catch {
    /* swallow */
  }
}
