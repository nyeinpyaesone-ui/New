import { MODE_META, type Toast } from "../lib/types";
import { IconClose, IconTomato } from "./icons";

interface Props {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}

export default function Toasts({ toasts, onDismiss }: Props) {
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => {
        const color = t.kind === "info" ? "#ffb35c" : MODE_META[t.kind].color;
        return (
          <div
            key={t.id}
            role="status"
            className="anim-toast pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border bg-pine-800/95 py-3 pl-4 pr-2 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] backdrop-blur-sm"
            style={{ borderColor: `color-mix(in srgb, ${color} 40%, transparent)` }}
          >
            <div
              className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
              style={{ background: `color-mix(in srgb, ${color} 18%, transparent)`, color }}
            >
              <IconTomato size={14} />
            </div>
            <p className="flex-1 text-sm font-medium text-ink">{t.msg}</p>
            <button
              onClick={() => onDismiss(t.id)}
              aria-label="Dismiss notification"
              className="rounded-lg p-1.5 text-ink-faint transition-colors hover:bg-pine-700 hover:text-ink"
            >
              <IconClose size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
