import { MODE_META, MODE_ORDER, type Mode } from "../lib/types";

interface Props {
  mode: Mode;
  onChange: (m: Mode) => void;
}

export default function ModeTabs({ mode, onChange }: Props) {
  const idx = MODE_ORDER.indexOf(mode);
  return (
    <div
      role="tablist"
      aria-label="Timer mode"
      className="relative grid grid-cols-3 rounded-full border border-pine-600 bg-pine-800/80 p-1.5"
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-1.5 rounded-full border transition-all duration-300 ease-[cubic-bezier(.22,1,.36,1)]"
        style={{
          width: "calc((100% - 12px) / 3)",
          left: 6,
          transform: `translateX(${idx * 100}%)`,
          background: `color-mix(in srgb, ${MODE_META[mode].color} 16%, transparent)`,
          borderColor: `color-mix(in srgb, ${MODE_META[mode].color} 45%, transparent)`,
        }}
      />
      {MODE_ORDER.map((m) => {
        const active = m === mode;
        return (
          <button
            key={m}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(m)}
            className={`relative z-10 flex items-center justify-center gap-2 rounded-full px-3 py-2.5 text-sm font-semibold transition-colors duration-300 ${
              active ? "" : "text-ink-faint hover:text-ink-dim"
            }`}
            style={active ? { color: MODE_META[m].color } : undefined}
          >
            <span
              className="h-1.5 w-1.5 rounded-full transition-colors duration-300"
              style={{
                background: active ? MODE_META[m].color : "currentColor",
                opacity: active ? 1 : 0.5,
              }}
            />
            {MODE_META[m].label}
          </button>
        );
      })}
    </div>
  );
}
