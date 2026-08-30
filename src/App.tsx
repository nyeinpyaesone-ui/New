import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  DEFAULT_SETTINGS,
  MODE_META,
  type History,
  type Mode,
  type RuntimeState,
  type Settings,
  type Task,
  type Toast,
} from "./lib/types";
import { computeStreak, formatClock, todayKey } from "./lib/dates";
import { playBreakEnd, playChime, playClick } from "./lib/sound";
import { eraseKeys, useLocalStorage } from "./hooks/useLocalStorage";
import {
  parseBackup,
  sanitizeHistory,
  sanitizeRuntime,
  sanitizeSettings,
  sanitizeTasks,
  serializeBackup,
} from "./lib/data";
import { resetFavicon, setFavicon } from "./lib/favicon";
import ModeTabs from "./components/ModeTabs";
import TimerDial from "./components/TimerDial";
import StatsPanel from "./components/StatsPanel";
import TaskPanel from "./components/TaskPanel";
import SettingsModal from "./components/SettingsModal";
import Toasts from "./components/Toasts";
import {
  IconGear,
  IconPause,
  IconPlay,
  IconReset,
  IconSkip,
  IconTomato,
  IconVolume,
  IconVolumeOff,
} from "./components/icons";

const KEYS = [
  "simmer.settings.v1",
  "simmer.tasks.v1",
  "simmer.history.v1",
  "simmer.active.v1",
  "simmer.runtime.v1",
];

const makeId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export default function App() {
  const [settings, setSettings] = useLocalStorage<Settings>(
    "simmer.settings.v1",
    DEFAULT_SETTINGS,
    sanitizeSettings,
  );
  const [tasks, setTasks] = useLocalStorage<Task[]>("simmer.tasks.v1", [], sanitizeTasks);
  const [history, setHistory] = useLocalStorage<History>("simmer.history.v1", {}, sanitizeHistory);
  const [activeId, setActiveId] = useLocalStorage<string | null>("simmer.active.v1", null);
  const [runtime, setRuntime] = useLocalStorage<RuntimeState>(
    "simmer.runtime.v1",
    {
      mode: "focus",
      secondsLeft: DEFAULT_SETTINGS.focusMin * 60,
      cyclePos: 0,
    },
    (raw) => sanitizeRuntime(raw, settings),
  );
  const [isRunning, setIsRunning] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const { mode, secondsLeft, cyclePos } = runtime;
  const dur = (m: Mode) => settings[MODE_META[m].durKey] * 60;
  const total = dur(mode);

  /* ---------------- toasts ---------------- */
  const toastId = useRef(0);
  const addToast = (msg: string, kind: Toast["kind"]) => {
    const id = ++toastId.current;
    setToasts((t) => [...t.slice(-2), { id, msg, kind }]);
    window.setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  };

  /* ---------------- session completion ---------------- */
  const finishSession = (crediting: boolean) => {
    if (mode === "focus") {
      let nextCycle = cyclePos;
      if (crediting) {
        nextCycle = cyclePos + 1;
        const k = todayKey();
        setHistory((h) => {
          const d = h[k] ?? { pomos: 0, minutes: 0, tasksDone: 0 };
          return { ...h, [k]: { ...d, pomos: d.pomos + 1, minutes: d.minutes + settings.focusMin } };
        });
        setTasks((ts) =>
          ts.map((t) => (t.id === activeId && !t.done ? { ...t, donePomos: t.donePomos + 1 } : t)),
        );
        if (settings.sound) playChime();
      } else if (settings.sound) {
        playClick();
      }
      const next: Mode = crediting && nextCycle % settings.longEvery === 0 ? "long" : "short";
      setRuntime({ mode: next, secondsLeft: dur(next), cyclePos: nextCycle });
      setIsRunning(crediting && settings.autoBreak);
      addToast(
        crediting
          ? `Tomato logged — take a ${next === "long" ? "long" : "short"} break`
          : "Skipped ahead to a break — nothing logged",
        next,
      );
    } else {
      if (settings.sound) playBreakEnd();
      setRuntime({ mode: "focus", secondsLeft: dur("focus"), cyclePos });
      setIsRunning(settings.autoFocus);
      addToast("Break over — back to the stove", "focus");
    }
  };
  const finishRef = useRef(finishSession);
  finishRef.current = finishSession;

  /* ---------------- ticking engine (timestamp based — tab safe) ---------------- */
  useEffect(() => {
    if (!isRunning) return;
    const endAt = Date.now() + secondsLeft * 1000;
    let fired = false;
    const id = window.setInterval(() => {
      const remain = Math.round((endAt - Date.now()) / 1000);
      if (remain <= 0) {
        if (fired) return;
        fired = true;
        window.clearInterval(id);
        setIsRunning(false);
        setRuntime((r) => ({ ...r, secondsLeft: 0 }));
        finishRef.current(true);
      } else {
        setRuntime((r) => (r.secondsLeft === remain ? r : { ...r, secondsLeft: remain }));
      }
    }, 250);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, mode]);

  /* ---------------- controls ---------------- */
  const toggle = () => {
    if (settings.sound) playClick();
    if (isRunning) {
      setIsRunning(false);
    } else {
      if (secondsLeft <= 0) setRuntime((r) => ({ ...r, secondsLeft: dur(r.mode) }));
      setIsRunning(true);
    }
  };

  const reset = () => {
    setIsRunning(false);
    setRuntime((r) => ({ ...r, secondsLeft: dur(r.mode) }));
  };

  const skip = () => finishSession(false);

  const switchMode = (m: Mode) => {
    if (m === mode) return;
    setIsRunning(false);
    setRuntime((r) => ({ ...r, mode: m, secondsLeft: dur(m) }));
  };

  /* durations edited while idle → re-seat the dial */
  useEffect(() => {
    if (!isRunning) setRuntime((r) => ({ ...r, secondsLeft: dur(r.mode) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  /* ---------------- document title + live favicon ---------------- */
  const engaged = isRunning || secondsLeft < total;
  useEffect(() => {
    document.title = engaged
      ? `${formatClock(secondsLeft)} · ${MODE_META[mode].label} — Simmer`
      : "Simmer — Pomodoro Focus Desk";
    if (engaged) {
      setFavicon(mode, total > 0 ? secondsLeft / total : 1, Math.max(1, Math.ceil(secondsLeft / 60)));
    } else {
      resetFavicon();
    }
  }, [secondsLeft, mode, isRunning, total, engaged]);

  /* ---------------- keyboard shortcuts ---------------- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (settingsOpen) return;
      const el = e.target as HTMLElement | null;
      if (
        el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.tagName === "SELECT" ||
          el.isContentEditable)
      )
        return;
      if (e.code === "Space") {
        e.preventDefault();
        toggle();
      } else if (e.key === "r" || e.key === "R") reset();
      else if (e.key === "s" || e.key === "S") skip();
      else if (e.key === "1") switchMode("focus");
      else if (e.key === "2") switchMode("short");
      else if (e.key === "3") switchMode("long");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  /* ---------------- daily goal celebration ---------------- */
  const todayPomos = history[todayKey()]?.pomos ?? 0;
  const prevPomosRef = useRef(todayPomos);
  useEffect(() => {
    if (
      todayPomos > 0 &&
      todayPomos >= settings.dailyGoal &&
      prevPomosRef.current < settings.dailyGoal
    ) {
      addToast(`Daily goal of ${settings.dailyGoal} tomatoes reached — splendid`, "focus");
    }
    prevPomosRef.current = todayPomos;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayPomos, settings.dailyGoal]);

  /* ---------------- task operations ---------------- */
  const addTask = (title: string, est: number) => {
    const t: Task = { id: makeId(), title, est, donePomos: 0, done: false, createdAt: Date.now() };
    setTasks((ts) => [...ts, t]);
    setActiveId((cur) => cur ?? t.id);
  };

  const toggleDone = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    const markingDone = !task.done;
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: markingDone } : t)));
    if (markingDone) {
      const k = todayKey();
      setHistory((h) => {
        const d = h[k] ?? { pomos: 0, minutes: 0, tasksDone: 0 };
        return { ...h, [k]: { ...d, tasksDone: d.tasksDone + 1 } };
      });
    }
  };

  const deleteTask = (id: string) => {
    setTasks((ts) => ts.filter((t) => t.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const clearDone = () => setTasks((ts) => ts.filter((t) => !t.done));

  /* ---------------- settings & data ---------------- */
  const patchSettings = (p: Partial<Settings>) => setSettings((s) => ({ ...s, ...p }));

  const eraseAll = () => {
    eraseKeys(KEYS);
    setSettings(DEFAULT_SETTINGS);
    setTasks([]);
    setHistory({});
    setActiveId(null);
    setRuntime({ mode: "focus", secondsLeft: DEFAULT_SETTINGS.focusMin * 60, cyclePos: 0 });
    setIsRunning(false);
    addToast("All data erased — a fresh start", "info");
  };

  /* ---------------- backup export / import ---------------- */
  const exportBackup = () => {
    try {
      const blob = new Blob([serializeBackup({ settings, tasks, history, activeId })], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `simmer-backup-${todayKey()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 800);
      addToast("Backup downloaded — keep it somewhere safe", "info");
    } catch {
      addToast("Export failed — your browser blocked the download", "info");
    }
  };

  const importBackup = (text: string) => {
    try {
      const data = parseBackup(text);
      setIsRunning(false);
      if (data.settings) setSettings(data.settings);
      if (data.tasks) setTasks(data.tasks);
      if (data.history) setHistory(data.history);
      if (data.activeId !== undefined) {
        const stillValid =
          data.activeId === null ||
          (data.tasks ?? tasks).some((t) => t.id === data.activeId && !t.done);
        setActiveId(stillValid ? data.activeId : null);
      }
      const focusMin = data.settings?.focusMin ?? settings.focusMin;
      setRuntime({ mode: "focus", secondsLeft: focusMin * 60, cyclePos: 0 });
      addToast("Backup restored — welcome back", "info");
    } catch (err) {
      addToast(`Import failed — ${err instanceof Error ? err.message : "unreadable file"}`, "info");
    }
  };

  const activeTask = tasks.find((t) => t.id === activeId && !t.done) ?? null;
  const streak = computeStreak(history);
  const started = secondsLeft < total;

  /* ================= render ================= */
  return (
    <div
      className="relative min-h-screen overflow-x-clip font-body text-ink"
      style={{ "--accent": MODE_META[mode].color } as CSSProperties}
    >
      {/* ambient layered background */}
      <div className="pointer-events-none fixed inset-0" aria-hidden="true">
        <div className="absolute inset-0 bg-pine-950" />
        <div
          className="anim-drift absolute -top-72 left-1/2 h-[46rem] w-[46rem] -translate-x-1/2 rounded-full blur-[130px] transition-colors duration-1000"
          style={{ background: "var(--accent)", opacity: isRunning ? 0.2 : 0.13 }}
        />
        <div className="absolute -bottom-44 -left-44 h-[26rem] w-[26rem] rounded-full bg-mint opacity-[0.05] blur-[120px]" />
        <div className="absolute -right-36 top-1/3 h-80 w-80 rounded-full bg-sky opacity-[0.06] blur-[110px]" />
        <div className="bg-dots absolute inset-0" />
        <div className="bg-grain absolute inset-0" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 pb-8 pt-6 sm:px-8">
        {/* header */}
        <header className="anim-rise flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="flex h-11 w-11 items-center justify-center rounded-2xl border border-pine-600 bg-pine-800 text-ember shadow-[0_8px_24px_-10px_rgba(255,107,74,0.5)]"
              style={{ "--leaf": "#4fd6a4" } as CSSProperties}
            >
              <IconTomato size={26} />
            </span>
            <div>
              <p className="font-display text-2xl font-extrabold leading-none tracking-tight text-ink">
                Simmer
              </p>
              <p className="mt-1 font-mono text-[10px] font-medium uppercase tracking-[0.28em] text-ink-faint">
                pomodoro focus desk
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => patchSettings({ sound: !settings.sound })}
              aria-label={settings.sound ? "Mute completion sounds" : "Unmute completion sounds"}
              title={settings.sound ? "Sounds on" : "Sounds off"}
              className={`rounded-xl border p-2.5 transition-all duration-200 active:scale-90 ${
                settings.sound
                  ? "border-pine-600 bg-pine-800 text-ink-dim hover:border-pine-500 hover:text-ink"
                  : "border-pine-700 bg-transparent text-ink-faint hover:text-ink-dim"
              }`}
            >
              {settings.sound ? <IconVolume size={18} /> : <IconVolumeOff size={18} />}
            </button>
            <button
              onClick={() => setSettingsOpen(true)}
              aria-label="Open settings"
              title="Settings"
              className="rounded-xl border border-pine-600 bg-pine-800 p-2.5 text-ink-dim transition-all duration-300 hover:rotate-45 hover:border-pine-500 hover:text-ink active:scale-90"
            >
              <IconGear size={18} />
            </button>
          </div>
        </header>

        {/* main */}
        <main className="mt-7 grid flex-1 items-start gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
          {/* timer side */}
          <section
            className="panel anim-rise relative overflow-hidden px-5 py-7 sm:px-8"
            style={{ animationDelay: "0.05s" }}
            aria-label="Pomodoro timer"
          >
            <ModeTabs mode={mode} onChange={switchMode} />

            <div className="mt-7">
              <TimerDial
                mode={mode}
                secondsLeft={secondsLeft}
                total={total}
                isRunning={isRunning}
                cyclePos={cyclePos}
                longEvery={settings.longEvery}
              />
            </div>

            {/* controls */}
            <div className="mt-8 flex items-center justify-center gap-3.5">
              <button
                onClick={reset}
                aria-label="Reset timer"
                title="Reset (R)"
                className="rounded-full border border-pine-600 bg-pine-800/70 p-3.5 text-ink-dim transition-all duration-200 hover:border-pine-500 hover:text-ink active:scale-90"
              >
                <IconReset size={20} />
              </button>

              <button
                onClick={toggle}
                className="font-display flex items-center gap-2.5 rounded-full px-10 py-3.5 text-lg font-bold tracking-tight text-pine-950 transition-all duration-200 hover:brightness-110 active:scale-95"
                style={{
                  background: "var(--accent)",
                  boxShadow: "0 14px 36px -12px color-mix(in srgb, var(--accent) 65%, transparent)",
                }}
              >
                {isRunning ? <IconPause size={20} /> : <IconPlay size={20} />}
                {isRunning ? "Pause" : started ? "Resume" : "Start"}
              </button>

              <button
                onClick={skip}
                aria-label="Skip to next session"
                title="Skip (S)"
                className="rounded-full border border-pine-600 bg-pine-800/70 p-3.5 text-ink-dim transition-all duration-200 hover:border-pine-500 hover:text-ink active:scale-90"
              >
                <IconSkip size={20} />
              </button>
            </div>

            {/* now-focusing chip */}
            <div className="mt-6 flex justify-center px-4">
              {activeTask ? (
                <button
                  onClick={() => setActiveId(null)}
                  title="Click to unset"
                  className="chip max-w-full border-ember/35 text-ink-dim transition-all duration-200 hover:border-ember/60 hover:text-ink"
                >
                  <IconTomato size={13} className="shrink-0 text-ember" />
                  <span className="truncate text-xs">
                    now focusing — <strong className="font-semibold text-ink">{activeTask.title}</strong>
                  </span>
                </button>
              ) : (
                <p className="text-center text-xs italic text-ink-faint">
                  pick a task from the queue to track tomatoes against it
                </p>
              )}
            </div>
          </section>

          {/* stats + tasks side */}
          <div className="flex min-h-0 flex-col gap-6">
            <StatsPanel history={history} settings={settings} streak={streak} />
            <TaskPanel
              tasks={tasks}
              activeId={activeId}
              onAdd={addTask}
              onSelect={(id) => setActiveId((cur) => (cur === id ? null : id))}
              onToggleDone={toggleDone}
              onDelete={deleteTask}
              onClearDone={clearDone}
            />
          </div>
        </main>

        {/* footer */}
        <footer
          className="anim-rise mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-pine-700/70 pt-5 text-xs text-ink-faint"
          style={{ animationDelay: "0.26s" }}
        >
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="flex items-center gap-1.5">
              <kbd className="key">Space</kbd> start / pause
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="key">R</kbd> reset
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="key">S</kbd> skip
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="key">1–3</kbd> modes
            </span>
          </div>
          <p className="font-mono text-[11px] uppercase tracking-wider">
            data stays in this browser · no account, no cloud
          </p>
        </footer>
      </div>

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onPatch={patchSettings}
        onEraseAll={eraseAll}
        onExport={exportBackup}
        onImport={importBackup}
      />
      <Toasts toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </div>
  );
}
