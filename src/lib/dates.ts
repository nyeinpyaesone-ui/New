import type { History } from "./types";

export function dayKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

export const todayKey = () => dayKey(new Date());

export function lastNDays(n: number): { key: string; label: string; isToday: boolean }[] {
  const out: { key: string; label: string; isToday: boolean }[] = [];
  const today = todayKey();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = dayKey(d);
    out.push({
      key,
      label: d.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 2),
      isToday: key === today,
    });
  }
  return out;
}

export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function prettyToday(): string {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

/** consecutive days with at least one logged pomodoro, counting back from today (or yesterday if today is still empty) */
export function computeStreak(history: History): number {
  let streak = 0;
  const d = new Date();
  if (!((history[dayKey(d)]?.pomos ?? 0) > 0)) d.setDate(d.getDate() - 1);
  while ((history[dayKey(d)]?.pomos ?? 0) > 0) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
