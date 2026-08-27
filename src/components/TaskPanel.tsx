import { useState, type FormEvent } from "react";
import type { Task } from "../lib/types";
import { IconCheck, IconMinus, IconPlus, IconTrash, IconTomato } from "./icons";

interface Props {
  tasks: Task[];
  activeId: string | null;
  onAdd: (title: string, est: number) => void;
  onSelect: (id: string) => void;
  onToggleDone: (id: string) => void;
  onDelete: (id: string) => void;
  onClearDone: () => void;
}

export default function TaskPanel({
  tasks,
  activeId,
  onAdd,
  onSelect,
  onToggleDone,
  onDelete,
  onClearDone,
}: Props) {
  const [title, setTitle] = useState("");
  const [est, setEst] = useState(1);

  const open = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);
  const ordered = [...open, ...done];
  const openEst = open.reduce((s, t) => s + t.est, 0);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed, est);
    setTitle("");
    setEst(1);
  };

  return (
    <section className="panel anim-rise flex min-h-0 flex-col p-5 sm:p-6" style={{ animationDelay: "0.16s" }} aria-label="Task queue">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-ink">Focus queue</h2>
          <p className="mt-0.5 text-[13px] text-ink-faint">
            {open.length === 0
              ? "queue is clear"
              : `${open.length} open · ~${openEst} tomato${openEst === 1 ? "" : "es"} planned`}
          </p>
        </div>
        {done.length > 0 && (
          <button
            onClick={onClearDone}
            className="text-xs font-semibold text-ink-faint underline decoration-pine-500 underline-offset-4 transition-colors hover:text-ember"
          >
            clear done ({done.length})
          </button>
        )}
      </header>

      <form onSubmit={submit} className="mt-4 flex items-center gap-2">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What are you simmering on?"
          maxLength={90}
          className="min-w-0 flex-1 rounded-xl border border-pine-600 bg-pine-900/80 px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none transition-all duration-200 focus:border-ember/60 focus:ring-2 focus:ring-ember/20"
        />
        <div className="flex items-center gap-1 rounded-xl border border-pine-600 bg-pine-900/80 px-1.5 py-1.5">
          <button
            type="button"
            aria-label="Fewer estimated tomatoes"
            onClick={() => setEst((v) => Math.max(1, v - 1))}
            className="rounded-lg p-1 text-ink-faint transition-colors hover:bg-pine-700 hover:text-ink"
          >
            <IconMinus size={14} />
          </button>
          <span className="tabular flex w-8 items-center justify-center gap-0.5 font-mono text-xs font-semibold text-ink">
            {est}
            <IconTomato size={11} className="text-ember" />
          </span>
          <button
            type="button"
            aria-label="More estimated tomatoes"
            onClick={() => setEst((v) => Math.min(10, v + 1))}
            className="rounded-lg p-1 text-ink-faint transition-colors hover:bg-pine-700 hover:text-ink"
          >
            <IconPlus size={14} />
          </button>
        </div>
        <button
          type="submit"
          aria-label="Add task"
          disabled={!title.trim()}
          className="rounded-xl bg-pine-600 p-2.5 text-ink transition-all duration-200 hover:bg-pine-500 active:scale-95 disabled:opacity-40 disabled:hover:bg-pine-600"
        >
          <IconPlus size={18} />
        </button>
      </form>

      <ul className="scroll-slim mt-4 max-h-[380px] flex-1 space-y-2 overflow-y-auto pr-1">
        {ordered.length === 0 && (
          <li className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-pine-600 px-6 py-10 text-center">
            <svg viewBox="0 0 48 48" width="52" height="52" fill="none" aria-hidden="true">
              <path
                d="M24 14.5c-9.5 0-16 6-16 13.6 0 8 7.2 13.4 16 13.4s16-5.4 16-13.4c0-7.6-6.5-13.6-16-13.6z"
                stroke="#34503e"
                strokeWidth="2"
                strokeDasharray="4 5"
                strokeLinecap="round"
              />
              <path d="M24 14.5c-1.2-4 .2-7 4.5-9-.3 3.2-1.7 6.2-4.5 9z" stroke="#34503e" strokeWidth="2" strokeLinejoin="round" />
              <path d="M24 14.5c1.2-4-.2-7-4.5-9 .3 3.2 1.7 6.2 4.5 9z" stroke="#34503e" strokeWidth="2" strokeLinejoin="round" />
            </svg>
            <div>
              <p className="text-sm font-semibold text-ink-dim">Nothing on the stove</p>
              <p className="mt-1 text-xs text-ink-faint">
                Add a task, pick it as “now focusing”, and start the dial.
              </p>
            </div>
          </li>
        )}

        {ordered.map((t) => {
          const isActive = t.id === activeId;
          const filled = Math.min(t.donePomos, t.est);
          return (
            <li
              key={t.id}
              className={`group flex items-center gap-3 rounded-2xl border px-3.5 py-3 transition-all duration-200 ${
                isActive
                  ? "border-ember/45 bg-ember/[0.06]"
                  : "border-pine-600/70 bg-pine-800/40 hover:border-pine-500 hover:bg-pine-800/80"
              } ${t.done ? "opacity-55" : ""}`}
            >
              <button
                onClick={() => onSelect(t.id)}
                aria-label={isActive ? "Unset as now-focusing task" : "Set as now-focusing task"}
                title={isActive ? "Now focusing (click to unset)" : "Set as now focusing"}
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                  isActive ? "border-ember" : "border-pine-500 hover:border-ink-faint"
                }`}
              >
                <span
                  className="h-2 w-2 rounded-full bg-ember transition-transform duration-200"
                  style={{ transform: isActive ? "scale(1)" : "scale(0)" }}
                />
              </button>

              <div className="min-w-0 flex-1">
                <p
                  className={`truncate text-sm font-semibold transition-all duration-200 ${
                    t.done ? "text-ink-faint line-through" : "text-ink"
                  }`}
                >
                  {t.title}
                </p>
                <div className="mt-1 flex items-center gap-1.5">
                  <div className="flex items-center gap-[3px]">
                    {Array.from({ length: t.est }, (_, i) => (
                      <span
                        key={i}
                        className="h-[7px] w-[7px] rounded-full transition-colors duration-300"
                        style={{ background: i < filled ? "#ff6b4a" : "#2c4233" }}
                      />
                    ))}
                  </div>
                  <span className="tabular font-mono text-[10px] text-ink-faint">
                    {t.donePomos}/{t.est}
                    {t.donePomos > t.est ? ` +${t.donePomos - t.est}` : ""}
                  </span>
                  {isActive && !t.done && (
                    <span className="ml-1 rounded-full bg-ember/15 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-ember">
                      now
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={() => onToggleDone(t.id)}
                aria-label={t.done ? "Mark as not done" : "Mark as done"}
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-all duration-200 active:scale-90 ${
                  t.done
                    ? "border-mint/50 bg-mint/15 text-mint"
                    : "border-pine-500 text-transparent hover:border-mint/60 hover:text-mint/50"
                }`}
              >
                <IconCheck size={13} strokeWidth={2.6} />
              </button>
              <button
                onClick={() => onDelete(t.id)}
                aria-label="Delete task"
                className="shrink-0 rounded-lg p-1.5 text-ink-faint opacity-0 transition-all duration-200 hover:bg-ember/10 hover:text-ember focus:opacity-100 group-hover:opacity-100"
              >
                <IconTrash size={15} />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
