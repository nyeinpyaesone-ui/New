import {
  AMBIENTS,
  DEFAULT_SETTINGS,
  MODE_ORDER,
  type Ambient,
  type History,
  type JournalEvent,
  type JournalType,
  type Mode,
  type RuntimeState,
  type Settings,
  type Task,
} from "./types";

/* ---------------- tiny validation helpers ---------------- */

const isObj = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const num = (v: unknown, fallback: number) =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;

const int = (v: number) => Math.round(v);
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/* ---------------- hydration sanitizers ----------------
 * Anything coming out of localStorage (or an imported backup) passes through
 * these, so a hand-edited or corrupted payload can never crash the app.
 */

export function sanitizeSettings(raw: unknown): Settings {
  const d = DEFAULT_SETTINGS;
  if (!isObj(raw)) return { ...d };
  return {
    focusMin: clamp(int(num(raw.focusMin, d.focusMin)), 1, 90),
    shortMin: clamp(int(num(raw.shortMin, d.shortMin)), 1, 30),
    longMin: clamp(int(num(raw.longMin, d.longMin)), 1, 60),
    longEvery: clamp(int(num(raw.longEvery, d.longEvery)), 2, 8),
    autoBreak: typeof raw.autoBreak === "boolean" ? raw.autoBreak : d.autoBreak,
    autoFocus: typeof raw.autoFocus === "boolean" ? raw.autoFocus : d.autoFocus,
    sound: typeof raw.sound === "boolean" ? raw.sound : d.sound,
    volume: clamp(num(raw.volume, d.volume), 0, 1),
    ambient: AMBIENTS.some((a) => a.id === raw.ambient) ? (raw.ambient as Ambient) : d.ambient,
    notify: typeof raw.notify === "boolean" ? raw.notify : d.notify,
    dailyGoal: clamp(int(num(raw.dailyGoal, d.dailyGoal)), 1, 20),
  };
}

const JOURNAL_TYPES: JournalType[] = ["focus", "short", "long", "task", "goal"];

export function sanitizeJournal(raw: unknown): JournalEvent[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(isObj)
    .map((e) => ({
      id: typeof e.id === "string" ? e.id : "",
      at: num(e.at, 0),
      type: JOURNAL_TYPES.includes(e.type as JournalType) ? (e.type as JournalType) : "focus",
      text: typeof e.text === "string" ? e.text.slice(0, 140) : "",
    }))
    .filter((e) => e.id !== "" && e.at > 0 && e.text !== "")
    .sort((a, b) => b.at - a.at)
    .slice(0, 60);
}

export function sanitizeTasks(raw: unknown): Task[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(isObj)
    .map((t) => ({
      id: typeof t.id === "string" ? t.id : "",
      title: typeof t.title === "string" ? t.title.slice(0, 90) : "",
      est: clamp(int(num(t.est, 1)), 1, 10),
      donePomos: Math.max(0, int(num(t.donePomos, 0))),
      done: t.done === true,
      createdAt: num(t.createdAt, Date.now()),
    }))
    .filter((t) => t.id !== "" && t.title.trim() !== "");
}

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

export function sanitizeHistory(raw: unknown): History {
  if (!isObj(raw)) return {};
  const out: History = {};
  for (const [k, v] of Object.entries(raw)) {
    if (!DAY_KEY.test(k) || !isObj(v)) continue;
    out[k] = {
      pomos: Math.max(0, int(num(v.pomos, 0))),
      minutes: Math.max(0, int(num(v.minutes, 0))),
      tasksDone: Math.max(0, int(num(v.tasksDone, 0))),
    };
  }
  return out;
}

export function sanitizeRuntime(raw: unknown, settings: Settings): RuntimeState {
  const dur = (m: Mode) =>
    settings[m === "focus" ? "focusMin" : m === "short" ? "shortMin" : "longMin"] * 60;
  const fallback: RuntimeState = { mode: "focus", secondsLeft: dur("focus"), cyclePos: 0 };
  if (!isObj(raw)) return fallback;
  const mode: Mode = MODE_ORDER.includes(raw.mode as Mode) ? (raw.mode as Mode) : "focus";
  return {
    mode,
    secondsLeft: clamp(int(num(raw.secondsLeft, dur(mode))), 0, dur(mode)),
    cyclePos: Math.max(0, int(num(raw.cyclePos, 0))),
  };
}

/* ---------------- backup export / import ---------------- */

export interface BackupData {
  settings?: Settings;
  tasks?: Task[];
  history?: History;
  journal?: JournalEvent[];
  activeId?: string | null;
}

export function serializeBackup(data: BackupData): string {
  return JSON.stringify(
    { app: "simmer", version: 1, exportedAt: new Date().toISOString(), data: { journal: [], ...data } },
    null,
    2,
  );
}

/** Throws an Error with a human-readable message when the file is not usable. */
export function parseBackup(text: string): BackupData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("that file is not valid JSON");
  }
  if (!isObj(parsed) || parsed.app !== "simmer" || !isObj(parsed.data)) {
    throw new Error("that is not a Simmer backup file");
  }
  const d = parsed.data;
  const out: BackupData = {};
  if (d.settings !== undefined) out.settings = sanitizeSettings(d.settings);
  if (d.tasks !== undefined) out.tasks = sanitizeTasks(d.tasks);
  if (d.history !== undefined) out.history = sanitizeHistory(d.history);
  if (d.journal !== undefined) out.journal = sanitizeJournal(d.journal);
  if (typeof d.activeId === "string" || d.activeId === null) out.activeId = d.activeId;
  if (out.settings === undefined && out.tasks === undefined && out.history === undefined) {
    throw new Error("the backup contains no recognisable data");
  }
  return out;
}
