import { MODE_META, type Mode } from "../lib/types";
import { formatClock } from "../lib/dates";

interface Props {
  mode: Mode;
  secondsLeft: number;
  total: number;
  isRunning: boolean;
  cyclePos: number;
  longEvery: number;
}

const R = 126;
const C = 2 * Math.PI * R;

const TICKS = Array.from({ length: 60 }, (_, i) => i);

export default function TimerDial({ mode, secondsLeft, total, isRunning, cyclePos, longEvery }: Props) {
  const frac = total > 0 ? Math.max(0, Math.min(1, secondsLeft / total)) : 0;
  const meta = MODE_META[mode];
  const inCycle = cyclePos % longEvery;
  const status = isRunning ? "running" : secondsLeft < total ? "paused" : "ready";

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        {/* breathing halo while the timer runs */}
        <div
          className={`absolute inset-6 rounded-full blur-3xl transition-colors duration-700 ${
            isRunning ? "anim-breathe" : ""
          }`}
          style={{ background: meta.color, opacity: isRunning ? 0.3 : 0.14 }}
        />

        <svg viewBox="0 0 340 340" className="relative block w-[min(78vw,340px)]">
          {/* slow orbit ring — only turns while running */}
          <circle
            cx="170"
            cy="170"
            r="163"
            fill="none"
            stroke={meta.color}
            strokeOpacity="0.3"
            strokeWidth="1.5"
            strokeDasharray="2 11"
            strokeLinecap="round"
            style={{
              transformOrigin: "center",
              animation: isRunning ? "spinSlow 80s linear infinite" : "none",
              transition: "stroke 0.6s",
            }}
          />

          {/* kitchen-timer ticks */}
          {TICKS.map((i) => {
            const major = i % 5 === 0;
            return (
              <line
                key={i}
                x1="170"
                y1="20"
                x2="170"
                y2={major ? 32 : 27}
                stroke={major ? "#4a6252" : "#2c4233"}
                strokeWidth={major ? 2.5 : 1.5}
                strokeLinecap="round"
                transform={`rotate(${i * 6} 170 170)`}
              />
            );
          })}

          {/* track */}
          <circle cx="170" cy="170" r={R} fill="none" stroke="#223629" strokeWidth="10" />

          {/* remaining-time arc */}
          <circle
            cx="170"
            cy="170"
            r={R}
            fill="none"
            stroke={meta.color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - frac)}
            transform="rotate(-90 170 170)"
            style={{
              transition: "stroke-dashoffset 0.3s linear, stroke 0.6s",
              filter: `drop-shadow(0 0 10px color-mix(in srgb, ${meta.color} 55%, transparent))`,
            }}
          />
        </svg>

        {/* center readout */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5">
          <span
            className="font-mono text-[11px] font-semibold uppercase tracking-[0.3em] transition-colors duration-500"
            style={{ color: meta.color }}
          >
            {meta.label}
          </span>
          <span className="tabular font-mono text-[clamp(56px,11vw,78px)] font-semibold leading-none text-ink">
            {formatClock(secondsLeft)}
          </span>
          <span className="mt-1 flex items-center gap-2 text-xs font-medium text-ink-faint">
            <span
              className={`h-1.5 w-1.5 rounded-full ${isRunning ? "anim-pulse-dot" : ""}`}
              style={{ background: isRunning ? meta.color : "#4a6252" }}
            />
            {status} · {meta.blurb}
          </span>
        </div>
      </div>

      {/* long-break cycle dots */}
      <div className="mt-5 flex items-center gap-3">
        <div className="flex items-center gap-2">
          {Array.from({ length: longEvery }, (_, i) => (
            <span
              key={i}
              className="h-2.5 w-2.5 rounded-full transition-all duration-500"
              style={{
                background:
                  i < inCycle
                    ? MODE_META.focus.color
                    : i === inCycle && mode === "focus"
                      ? "color-mix(in srgb, #ff6b4a 40%, transparent)"
                      : "#2c4233",
                boxShadow: i < inCycle ? "0 0 8px rgba(255,107,74,0.5)" : "none",
                transform: i === inCycle && mode === "focus" ? "scale(1.25)" : "scale(1)",
              }}
            />
          ))}
        </div>
        <span className="font-mono text-[11px] uppercase tracking-wider text-ink-faint">
          {inCycle}/{longEvery} · long break at {longEvery}
        </span>
      </div>
    </div>
  );
}
