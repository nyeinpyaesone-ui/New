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
  dailyGoal: number;
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
  dailyGoal: 8,
};

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
