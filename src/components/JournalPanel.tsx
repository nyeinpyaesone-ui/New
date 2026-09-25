import type { JournalEvent, JournalType } from "../lib/types";
import { dayKey } from "../lib/dates";
import { IconCheck, IconCoffee, IconFlame, IconTomato } from "./icons";

interface Props {
  journal: JournalEvent[];
  onClear: () => void;
}

const STYLE: Record<JournalType, { color: string }> = {
  focus: { color: "#ff6b4a" },
  short: { color: "#4fd6a4" },
  long: { color: "#7da5ff" },
  task: { color: "#4fd6a4" },
  goal: { color: "#ffb35c" },
};

function EventIcon({ type }: { type: JournalType }) {
  const color = STYLE[type].color;
  if (type === "focus") return <IconTomato size={13} className="text-ember" />;
  if (type === "goal") return <IconFlame size={13} style={{ color }} />;
  if (type === "task") return <IconCheck size={13} strokeWidth={2.4} style={{ color }} />;
  return <IconCoffee size={13} style={{ color }} />;
}

function dayLabel(key: string): string {
  const now = new Date();
  if (key === dayKey(now)) return "Today";
  const y = new Date();
  y.setDate(y.getDate() - 1);
  if (key === dayKey(y)) return "Yesterday";
  const [yy, mm, dd] = key.split("-").map(Number);
  return new Date(yy, mm - 1, dd).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function JournalPanel({ journal, onClear }: Props) {
  return (
    <section
      className="panel anim-rise p-5 sm:p-6"
      style={{ animationDelay: "0.22s" }}
      aria-label="Session journal"
    >
      <header className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-ink">Journal</h2>
          <p className="mt-0.5 text-[13px] text-ink-faint">
            {journal.length === 0
              ? "the day’s record, as it happens"
              : `${journal.length} entr${journal.length === 1 ? "y" : "ies"} · newest first`}
          </p>
        </div>
        {journal.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs font-semibold text-ink-faint underline decoration-pine-500 underline-offset-4 transition-colors hover:text-ember"
          >
            clear
          </button>
        )}
      </header>

      {journal.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-pine-600 px-5 py-7 text-center text-xs italic text-ink-faint">
          Finished sessions and tasks write themselves in here — your day, minute by minute.
        </p>
      ) : (
        <ol className="scroll-slim mt-4 max-h-[300px] space-y-0.5 overflow-y-auto pr-1">
          {journal.map((e, i) => {
            const showDay = i === 0 || dayKey(new Date(e.at)) !== dayKey(new Date(journal[i - 1].at));
            return (
              <li key={e.id}>
                {showDay && (
                  <p className="mt-3 mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-ink-faint first:mt-0">
                    {dayLabel(dayKey(new Date(e.at)))}
                  </p>
                )}
                <div className="anim-pop flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors duration-200 hover:bg-pine-800/60">
                  <span
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
                    style={{
                      background: `color-mix(in srgb, ${STYLE[e.type].color} 14%, transparent)`,
                    }}
                  >
                    <EventIcon type={e.type} />
                  </span>
                  <p className="min-w-0 flex-1 truncate text-[13px] font-medium text-ink-dim">
                    {e.text}
                  </p>
                  <span className="tabular shrink-0 font-mono text-[10px] text-ink-faint">
                    {new Date(e.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
