import { useEffect } from "react";
import { IconClose } from "./icons";

interface Props {
  open: boolean;
  onClose: () => void;
}

const SHORTCUTS: { keys: string[]; action: string }[] = [
  { keys: ["Space"], action: "Start / pause the timer" },
  { keys: ["R"], action: "Reset the current session" },
  { keys: ["S"], action: "Skip to the next session" },
  { keys: ["1", "2", "3"], action: "Focus · short break · long break" },
  { keys: ["?"], action: "Show this panel" },
  { keys: ["Esc"], action: "Close dialogs" },
];

export default function ShortcutsOverlay({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "?") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-pine-950/75 p-4 backdrop-blur-[3px]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Keyboard shortcuts"
    >
      <div
        className="anim-pop w-full max-w-sm rounded-[24px] border border-pine-600 bg-pine-800 p-6 shadow-[0_40px_120px_-30px_rgba(0,0,0,0.8)]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-extrabold tracking-tight text-ink">
              Keep your hands on the keys
            </h2>
            <p className="mt-0.5 text-xs text-ink-faint">Every control, one keystroke away.</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close shortcuts"
            className="rounded-xl border border-pine-600 p-2 text-ink-dim transition-all hover:border-pine-500 hover:text-ink active:scale-90"
          >
            <IconClose size={16} />
          </button>
        </header>

        <ul className="mt-5 space-y-1">
          {SHORTCUTS.map((s) => (
            <li
              key={s.action}
              className="flex items-center justify-between gap-4 rounded-xl px-2 py-2 transition-colors hover:bg-pine-700/50"
            >
              <span className="text-sm text-ink-dim">{s.action}</span>
              <span className="flex shrink-0 items-center gap-1">
                {s.keys.map((k, i) => (
                  <span key={k} className="flex items-center gap-1">
                    {i > 0 && <span className="text-[10px] text-ink-faint">·</span>}
                    <kbd className="key">{k}</kbd>
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>

        <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.22em] text-ink-faint">
          shortcuts pause while you type
        </p>
      </div>
    </div>
  );
}
