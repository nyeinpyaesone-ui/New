import { MODE_META, type Mode } from "./types";

const R = 22;
const C = 2 * Math.PI * R;

function svgFor(fracRemaining: number, color: string, label: string): string {
  const dash = (C * Math.max(0.001, Math.min(1, fracRemaining))).toFixed(1);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#0f1a15"/><circle cx="32" cy="32" r="${R}" fill="none" stroke="#223629" stroke-width="6"/><circle cx="32" cy="32" r="${R}" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${dash} ${C.toFixed(1)}" transform="rotate(-90 32 32)"/><text x="32" y="38" text-anchor="middle" font-family="ui-monospace,Menlo,monospace" font-size="17" font-weight="700" fill="#ede9dc">${label}</text></svg>`;
}

/**
 * Live favicon — the tab's icon becomes a tiny countdown dial showing the
 * remaining minutes in the current mode's colour. Degrades silently anywhere
 * data-URI icons are blocked.
 */
export function setFavicon(mode: Mode, fracRemaining: number, minutesLeft: number): void {
  if (typeof document === "undefined") return;
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    document.head.appendChild(link);
  }
  link.type = "image/svg+xml";
  link.href = `data:image/svg+xml,${encodeURIComponent(svgFor(fracRemaining, MODE_META[mode].color, String(minutesLeft)))}`;
}

/** Restore the packaged static icon (used while the timer is untouched). */
export function resetFavicon(): void {
  if (typeof document === "undefined") return;
  const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (link) link.href = "/favicon.svg";
}
