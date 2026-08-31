import { useEffect, useRef, useState } from "react";
import { PRESETS, type Settings } from "../lib/types";
import { playChime, playClick } from "../lib/sound";
import { IconClose, IconMinus, IconPlus } from "./icons";

interface Props {
  open: boolean;
  onClose: () => void;
  settings: Settings;
  onPatch: (patch: Partial<Settings>) => void;
  onEraseAll: () => void;
  onExport: () => void;
  onImport: (text: string) => void;
}

function Stepper({
  label,
  hint,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  hint: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-semibold text-ink">{label}</p>
        <p className="text-xs text-ink-faint">{hint}</p>
      </div>
      <div className="flex items-center gap-1.5">
        <button
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="rounded-lg border border-pine-600 bg-pine-800 p-1.5 text-ink-dim transition-all hover:border-pine-500 hover:text-ink active:scale-90 disabled:opacity-35"
        >
          <IconMinus size={14} />
        </button>
        <span className="tabular w-16 text-center font-mono text-sm font-semibold text-ink">
          {value}
          <span className="ml-1 text-[10px] font-normal text-ink-faint">{unit}</span>
        </span>
        <button
          aria-label={`Increase ${label}`}
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="rounded-lg border border-pine-600 bg-pine-800 p-1.5 text-ink-dim transition-all hover:border-pine-500 hover:text-ink active:scale-90 disabled:opacity-35"
        >
          <IconPlus size={14} />
        </button>
      </div>
    </div>
  );
}

function Switch({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-semibold text-ink">{label}</p>
        <p className="text-xs text-ink-faint">{hint}</p>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className="relative h-6 w-11 shrink-0 rounded-full transition-colors duration-300"
        style={{ background: checked ? "#ff6b4a" : "#25392c" }}
      >
        <span
          className="absolute top-0.5 h-5 w-5 rounded-full bg-ink shadow transition-all duration-300"
          style={{ left: checked ? "calc(100% - 22px)" : "2px" }}
        />
      </button>
    </div>
  );
}

export default function SettingsModal({
  open,
  onClose,
  settings,
  onPatch,
  onEraseAll,
  onExport,
  onImport,
}: Props) {
  const [confirming, setConfirming] = useState(false);
  const confirmTimer = useRef<number | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setConfirming(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => () => {
    if (confirmTimer.current) window.clearTimeout(confirmTimer.current);
  }, []);

  if (!open) return null;

  const handleErase = () => {
    if (!confirming) {
      setConfirming(true);
      confirmTimer.current = window.setTimeout(() => setConfirming(false), 3000);
      return;
    }
    if (confirmTimer.current) window.clearTimeout(confirmTimer.current);
    setConfirming(false);
    onEraseAll();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-pine-950/75 p-4 backdrop-blur-[3px] sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Timer settings"
    >
      <div
        className="anim-pop max-h-[88vh] w-full max-w-md overflow-y-auto scroll-slim rounded-[24px] border border-pine-600 bg-pine-800 p-6 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">Settings</h2>
            <p className="mt-0.5 text-xs text-ink-faint">Tuned to how you simmer — saved instantly.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close settings"
            className="rounded-xl border border-pine-600 p-2 text-ink-dim transition-all hover:border-pine-500 hover:text-ink active:scale-90"
          >
            <IconClose size={16} />
          </button>
        </header>

        <h3 className="mt-6 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-ember">
          Durations
        </h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {PRESETS.map((p) => {
            const isApplied =
              settings.focusMin === p.focusMin &&
              settings.shortMin === p.shortMin &&
              settings.longMin === p.longMin;
            return (
              <button
                key={p.name}
                onClick={() => {
                  onPatch({ focusMin: p.focusMin, shortMin: p.shortMin, longMin: p.longMin });
                  playClick();
                }}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all duration-200 active:scale-95 ${
                  isApplied
                    ? "border-ember/55 bg-ember/12 text-ember"
                    : "border-pine-600 bg-pine-900/70 text-ink-dim hover:border-pine-500 hover:text-ink"
                }`}
                title={`${p.focusMin} min focus · ${p.shortMin} short · ${p.longMin} long`}
              >
                {p.name}
                <span className="tabular ml-1.5 font-mono text-[10px] font-normal opacity-70">
                  {p.focusMin}·{p.shortMin}·{p.longMin}
                </span>
              </button>
            );
          })}
        </div>
        <div className="mt-2 divide-y divide-pine-700">
          <Stepper
            label="Focus"
            hint="One deep-work tomato"
            value={settings.focusMin}
            min={1}
            max={90}
            unit="min"
            onChange={(v) => onPatch({ focusMin: v })}
          />
          <Stepper
            label="Short break"
            hint="Between most sessions"
            value={settings.shortMin}
            min={1}
            max={30}
            unit="min"
            onChange={(v) => onPatch({ shortMin: v })}
          />
          <Stepper
            label="Long break"
            hint="After a full round"
            value={settings.longMin}
            min={1}
            max={60}
            unit="min"
            onChange={(v) => onPatch({ longMin: v })}
          />
          <Stepper
            label="Long break every"
            hint="Focus sessions per round"
            value={settings.longEvery}
            min={2}
            max={8}
            unit="sess"
            onChange={(v) => onPatch({ longEvery: v })}
          />
        </div>

        <h3 className="mt-6 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-mint">
          Flow & feel
        </h3>
        <div className="mt-1 divide-y divide-pine-700">
          <Switch
            label="Auto-start breaks"
            hint="Roll straight from focus into rest"
            checked={settings.autoBreak}
            onChange={(v) => onPatch({ autoBreak: v })}
          />
          <Switch
            label="Auto-start focus"
            hint="Begin the next session after a break"
            checked={settings.autoFocus}
            onChange={(v) => onPatch({ autoFocus: v })}
          />
          <Switch
            label="Completion sounds"
            hint="Chimes when sessions change over"
            checked={settings.sound}
            onChange={(v) => onPatch({ sound: v })}
          />
          <div className="flex items-center justify-between gap-4 py-3">
            <div>
              <p className="text-sm font-semibold text-ink">Chime volume</p>
              <p className="text-xs text-ink-faint">Loudness of every ring and click</p>
            </div>
            <div className="flex items-center gap-2.5">
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={Math.round(settings.volume * 100)}
                aria-label="Chime volume"
                disabled={!settings.sound}
                onChange={(e) => onPatch({ volume: Number(e.target.value) / 100 })}
                onPointerUp={() => settings.sound && playClick()}
                className="simmer-range w-28"
              />
              <span className="tabular w-9 text-right font-mono text-xs font-semibold text-ink-dim">
                {Math.round(settings.volume * 100)}%
              </span>
              <button
                onClick={() => playChime()}
                disabled={!settings.sound}
                className="rounded-lg border border-pine-600 bg-pine-800 px-2.5 py-1.5 text-[11px] font-bold text-ink-dim transition-all hover:border-pine-500 hover:text-ink active:scale-95 disabled:opacity-35"
              >
                Test
              </button>
            </div>
          </div>
          <Stepper
            label="Daily goal"
            hint="Tomatoes you’re aiming for today"
            value={settings.dailyGoal}
            min={1}
            max={20}
            unit="toms"
            onChange={(v) => onPatch({ dailyGoal: v })}
          />
        </div>

        <h3 className="mt-6 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-sky">
          Your data
        </h3>
        <div className="mt-3 rounded-2xl border border-pine-600 bg-pine-900/60 p-4">
          <p className="text-xs text-ink-dim">
            Tasks, history and settings as a JSON backup — move them to another browser or keep a
            snapshot before experimenting.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <button
              onClick={onExport}
              className="rounded-xl border border-pine-500 bg-pine-800 px-4 py-2.5 text-sm font-bold text-ink transition-all duration-200 hover:border-sky/50 hover:text-sky active:scale-[0.98]"
            >
              Export backup
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="rounded-xl border border-pine-500 bg-pine-800 px-4 py-2.5 text-sm font-bold text-ink transition-all duration-200 hover:border-sky/50 hover:text-sky active:scale-[0.98]"
            >
              Import backup
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            aria-label="Choose a Simmer backup file to import"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void file.text().then(onImport);
              e.target.value = "";
            }}
          />
        </div>

        <h3 className="mt-6 font-mono text-[11px] font-semibold uppercase tracking-[0.22em] text-ink-faint">
          Danger zone
        </h3>
        <div className="mt-3 rounded-2xl border border-ember/25 bg-ember/[0.05] p-4">
          <p className="text-xs text-ink-dim">
            Wipes tasks, history and settings from this browser. There is no undo.
          </p>
          <button
            onClick={handleErase}
            className={`mt-3 w-full rounded-xl border px-4 py-2.5 text-sm font-bold transition-all duration-200 active:scale-[0.98] ${
              confirming
                ? "border-ember bg-ember text-pine-950"
                : "border-ember/40 text-ember hover:bg-ember/10"
            }`}
          >
            {confirming ? "Click again to erase everything" : "Erase all data"}
          </button>
        </div>
      </div>
    </div>
  );
}
