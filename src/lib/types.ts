export type Mode = "focus" | "short" | "long";

export interface Settings {
  focusMin: number;
  shortMin: number;
  longMin: number;
  /** a long break arrives after this many focus sessions */
  longEvery: number;
  autoBreak: boolean;
  autoFocus: boolean;
  sound: boolean;
  /** master volume for chimes, 0–1 */
  volume: number;
  ambient: Ambient;
  notify: boolean;
  dailyGoal: number;
}

export type Ambient = "off" | "rain" | "cafe" | "drone";

export const AMBIENTS: { id: Ambient; label: string }[] = [
  { id: "off", label: "Off" },
  { id: "rain", label: "Rain" },
  { id: "cafe", label: "Café" },
  { id: "drone", label: "Deep flow" },
];

export type JournalType = "focus" | "short" | "long" | "task" | "goal";

export interface JournalEvent {
  id: string;
  at: number;
  type: JournalType;
  text: string;
}

export interface Task {
  id: string;
  title: string;
  /** estimated pomodoros */
  est: number;
  /** completed pomodoros */
  donePomos: number;
  done: boolean;
  createdAt: number;
}

export interface DayLog {
  pomos: number;
  minutes: number;
  tasksDone: number;
}

export type History = Record<string, DayLog>;

export interface RuntimeState {
  mode: Mode;
  secondsLeft: number;
  /** focus sessions completed in the current long-break cycle */
  cyclePos: number;
}

export interface Toast {
  id: number;
  msg: string;
  kind: Mode | "info";
}

export const DEFAULT_SETTINGS: Settings = {
  focusMin: 25,
  shortMin: 5,
  longMin: 15,
  longEvery: 4,
  autoBreak: true,
  autoFocus: false,
  sound: true,
  volume: 0.8,
  ambient: "off",
  notify: false,
  dailyGoal: 8,
};

/** one-click duration recipes */
export const PRESETS: { name: string; focusMin: number; shortMin: number; longMin: number }[] = [
  { name: "Classic", focusMin: 25, shortMin: 5, longMin: 15 },
  { name: "Deep work", focusMin: 50, shortMin: 10, longMin: 20 },
  { name: "Sprint", focusMin: 15, shortMin: 3, longMin: 10 },
];

export const MODE_META: Record<
  Mode,
  { label: string; color: string; durKey: "focusMin" | "shortMin" | "longMin"; blurb: string }
> = {
  focus: {
    label: "Focus",
    color: "#ff6b4a",
    durKey: "focusMin",
    blurb: "one tomato at a time",
  },
  short: {
    label: "Short break",
    color: "#4fd6a4",
    durKey: "shortMin",
    blurb: "stretch, sip, breathe",
  },
  long: {
    label: "Long break",
    color: "#7da5ff",
    durKey: "longMin",
    blurb: "step away — you earned it",
  },
};

export const MODE_ORDER: Mode[] = ["focus", "short", "long"];
