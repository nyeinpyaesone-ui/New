import { useEffect, useRef, useState } from "react";
import type { History, Settings } from "../lib/types";
import { dayKey, lastNDays, prettyToday, todayKey } from "../lib/dates";
import { IconCheck, IconClock, IconFlame, IconTomato } from "./icons";

interface Props {
  history: History;
  settings: Settings;
  streak: number;
}

const heatColor = (n: number) =>
  n <= 0
    ? "#1a2a20"
    : n === 1
      ? "color-mix(in srgb, #ff6b4a 30%, #1a2a20)"
      : n <= 3
        ? "color-mix(in srgb, #ff6b4a 55%, #1a2a20)"
        : n <= 5
          ? "color-mix(in srgb, #ff6b4a 80%, #1a2a20)"
          : "#ff6b4a";

const WEEKS = 12;

/** eases the displayed number toward its target whenever it changes */
function useCountUp(target: number): number {
  const [display, setDisplay] = useState(target);
  const fromRef = useRef(target);
  useEffect(() => {
    const from = fromRef.current;
    fromRef.current = target;
    if (from === target) return;
    const t0 = performance.now();
    const dur = 520;
    let raf = 0;
    const step = (t: number) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (target - from) * eased));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return display;
}

export default function StatsPanel({ history, settings, streak }: Props) {
  const today = history[todayKey()] ?? { pomos: 0, minutes: 0, tasksDone: 0 };
  const week = lastNDays(7).map((d) => ({ ...d, pomos: history[d.key]?.pomos ?? 0 }));
  const maxVal = Math.max(settings.dailyGoal, ...week.map((d) => d.pomos), 1);
  const goalPct = Math.min(100, Math.round((today.pomos / settings.dailyGoal) * 100));
  const weekTotal = week.reduce((s, d) => s + d.pomos, 0);
  const shownPomos = useCountUp(today.pomos);

  /* all-time rollups */
  const entries = Object.entries(history).filter(([, d]) => d.pomos > 0);
  const allPomos = entries.reduce((s, [, d]) => s + d.pomos, 0);
  const allMinutes = entries.reduce((s, [, d]) => s + d.minutes, 0);
  const allHours = Math.floor(allMinutes / 60);
  const timeLabel = allHours > 0 ? `${allHours}h ${allMinutes % 60}m` : `${allMinutes}m`;
  const best = entries.sort((a, b) => b[1].pomos - a[1].pomos)[0];
  const bestLabel = best
    ? `${best[1].pomos} · ${new Date(`${best[0]}T12:00:00`).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      })}`
    : "—";

  /* 12-week field (columns = weeks, cells = days, ending today) */
  const heat: { key: string; label: string; count: number }[][] = [];
  const start = new Date();
  start.setDate(start.getDate() - (WEEKS * 7 - 1));
  for (let w = 0; w < WEEKS; w++) {
    const col: { key: string; label: string; count: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const dt = new Date(start);
      dt.setDate(start.getDate() + w * 7 + d);
      const key = dayKey(dt);
      col.push({
        key,
        label: dt.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        count: history[key]?.pomos ?? 0,
      });
    }
    heat.push(col);
  }
  const heatTotal = heat.flat().reduce((s, c) => s + c.count, 0);

  return (
    <section className="panel anim-rise p-5 sm:p-6" style={{ animationDelay: "0.08s" }} aria-label="Focus statistics">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-ink">Today’s focus</h2>
          <p className="mt-0.5 text-[13px] text-ink-faint">{prettyToday()}</p>
        </div>
        <span
          className="chip"
          title="Consecutive days with at least one focus session"
          style={{ color: streak > 0 ? "#ffb35c" : undefined, borderColor: streak > 0 ? "rgba(255,179,92,0.35)" : undefined }}
        >
          <IconFlame size={14} />
          {streak} day{streak === 1 ? "" : "s"}
        </span>
      </header>

      {/* headline stat + goal bar */}
      <div className="mt-5 flex items-end justify-between gap-4">
        <div className="flex items-end gap-2">
          <span className="font-display text-[56px] font-extrabold leading-none tracking-tight text-ink tabular">
            {shownPomos}
          </span>
          <span className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-ink-faint">
            <IconTomato size={16} className="text-ember" /> of {settings.dailyGoal} tomatoes
          </span>
        </div>
        <span className="tabular mb-1.5 font-mono text-xs text-ink-faint">{goalPct}%</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-pine-700">
        <div
          className="h-full rounded-full bg-ember transition-all duration-700 ease-out"
          style={{ width: `${goalPct}%`, boxShadow: "0 0 12px rgba(255,107,74,0.45)" }}
        />
      </div>

      {/* secondary stats */}
      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3 rounded-2xl border border-pine-600/70 bg-pine-800/60 px-4 py-3">
          <IconClock size={18} className="shrink-0 text-mint" />
          <div>
            <p className="tabular font-display text-lg font-bold leading-tight text-ink">{today.minutes}</p>
            <p className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">focus min</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-pine-600/70 bg-pine-800/60 px-4 py-3">
          <IconCheck size={18} className="shrink-0 text-sky" />
          <div>
            <p className="tabular font-display text-lg font-bold leading-tight text-ink">{today.tasksDone}</p>
            <p className="text-[11px] font-medium uppercase tracking-wider text-ink-faint">tasks done</p>
          </div>
        </div>
      </div>

      {/* week chart */}
      <div className="mt-6">
        <div className="flex items-baseline justify-between">
          <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-faint">
            Last 7 days
          </h3>
          <span className="text-xs text-ink-faint">
            <strong className="tabular font-semibold text-ink-dim">{weekTotal}</strong> total
          </span>
        </div>
        <div className="mt-3 flex h-24 items-end gap-2">
          {week.map((d, i) => {
            const h = Math.max(4, Math.round((d.pomos / maxVal) * 100));
            return (
              <div key={d.key} className="group flex flex-1 flex-col items-center gap-1.5" title={`${d.pomos} tomato${d.pomos === 1 ? "" : "es"}`}>
                <span className="tabular font-mono text-[10px] text-ink-faint opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  {d.pomos}
                </span>
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="anim-bar w-full rounded-t-md transition-colors duration-300"
                    style={{
                      height: `${h}%`,
                      animationDelay: `${0.15 + i * 0.05}s`,
                      background: d.isToday
                        ? "#ff6b4a"
                        : d.pomos > 0
                          ? "#34503e"
                          : "#223629",
                      boxShadow: d.isToday ? "0 0 14px rgba(255,107,74,0.4)" : "none",
                    }}
                  />
                </div>
                <span
                  className={`font-mono text-[10px] uppercase ${d.isToday ? "font-bold text-ember" : "text-ink-faint"}`}
                >
                  {d.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 12-week field */}
      <div className="mt-6">
        <div className="flex items-baseline justify-between">
          <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-faint">
            Last 12 weeks
          </h3>
          <span className="text-xs text-ink-faint">
            <strong className="tabular font-semibold text-ink-dim">{heatTotal}</strong> tomato
            {heatTotal === 1 ? "" : "es"}
          </span>
        </div>
        <div
          className="mt-3 flex items-start justify-between gap-[3px]"
          role="img"
          aria-label={`Heatmap of the last 12 weeks — ${heatTotal} tomatoes in total`}
        >
          {heat.map((col, wi) => (
            <div key={wi} className="flex flex-1 flex-col gap-[3px]">
              {col.map((cell) => (
                <div
                  key={cell.key}
                  title={`${cell.count} tomato${cell.count === 1 ? "" : "es"} · ${cell.label}`}
                  className="aspect-square w-full rounded-[3px] transition-transform duration-150 hover:scale-125"
                  style={{ background: heatColor(cell.count) }}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center justify-end gap-1.5 font-mono text-[10px] text-ink-faint">
          less
          {[0, 1, 3, 5, 7].map((n) => (
            <span key={n} className="h-2.5 w-2.5 rounded-[3px]" style={{ background: heatColor(n) }} />
          ))}
          more
        </div>
      </div>

      {/* all-time rollup */}
      <div className="mt-6 border-t border-pine-700/70 pt-4">
        <h3 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-faint">
          All-time
        </h3>
        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-2">
          <span className="flex items-baseline gap-1.5">
            <strong className="tabular font-display text-lg font-bold leading-none text-ink">
              {allPomos}
            </strong>
            <span className="text-[11px] font-medium text-ink-faint">tomatoes</span>
          </span>
          <span className="h-3.5 w-px bg-pine-600" aria-hidden="true" />
          <span className="flex items-baseline gap-1.5">
            <strong className="tabular font-display text-lg font-bold leading-none text-ink">
              {timeLabel}
            </strong>
            <span className="text-[11px] font-medium text-ink-faint">deep work</span>
          </span>
          <span className="h-3.5 w-px bg-pine-600" aria-hidden="true" />
          <span className="flex items-baseline gap-1.5">
            <strong className="tabular font-display text-lg font-bold leading-none text-honey">
              {bestLabel}
            </strong>
            <span className="text-[11px] font-medium text-ink-faint">best day</span>
          </span>
        </div>
      </div>
    </section>
  );
}
