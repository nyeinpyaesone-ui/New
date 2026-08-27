import type { History, Settings } from "../lib/types";
import { lastNDays, prettyToday, todayKey } from "../lib/dates";
import { IconCheck, IconClock, IconFlame, IconTomato } from "./icons";

interface Props {
  history: History;
  settings: Settings;
  streak: number;
}

export default function StatsPanel({ history, settings, streak }: Props) {
  const today = history[todayKey()] ?? { pomos: 0, minutes: 0, tasksDone: 0 };
  const week = lastNDays(7).map((d) => ({ ...d, pomos: history[d.key]?.pomos ?? 0 }));
  const maxVal = Math.max(settings.dailyGoal, ...week.map((d) => d.pomos), 1);
  const goalPct = Math.min(100, Math.round((today.pomos / settings.dailyGoal) * 100));
  const weekTotal = week.reduce((s, d) => s + d.pomos, 0);

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
            {today.pomos}
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
    </section>
  );
}
