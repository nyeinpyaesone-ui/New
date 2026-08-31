/** System notifications for when a session completes while the tab is hidden. */

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function requestNotifyPermission(): Promise<boolean> {
  if (!notificationsSupported()) return false;
  try {
    const result = await Notification.requestPermission();
    return result === "granted";
  } catch {
    return false;
  }
}

/** Only fires when the tab is in the background and permission was granted. */
export function maybeNotify(title: string, body: string): void {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  if (typeof document !== "undefined" && document.visibilityState === "visible") return;
  try {
    new Notification(title, { body, silent: false });
  } catch {
    /* some contexts (e.g. service-worker-only) throw — ignore */
  }
}
