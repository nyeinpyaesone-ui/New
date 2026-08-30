import { Component, type ErrorInfo, type ReactNode } from "react";

const STORAGE_KEYS = [
  "simmer.settings.v1",
  "simmer.tasks.v1",
  "simmer.history.v1",
  "simmer.active.v1",
  "simmer.runtime.v1",
];

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Last line of defence — a crash anywhere in the tree lands here instead of a
 * blank white screen, with a recovery path that doesn't lose data by default.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("Simmer crashed:", error, info.componentStack);
  }

  private reload = () => window.location.reload();

  private hardReset = () => {
    try {
      STORAGE_KEYS.forEach((k) => window.localStorage.removeItem(k));
    } catch {
      /* storage unavailable — reload anyway */
    }
    window.location.reload();
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div className="flex min-h-screen items-center justify-center bg-pine-950 px-6 py-10 font-body text-ink">
        <div className="panel anim-pop w-full max-w-md p-8 text-center">
          <svg viewBox="0 0 48 48" width="56" height="56" fill="none" aria-hidden="true" className="mx-auto">
            <path
              d="M24 14.5c-9.5 0-16 6-16 13.6 0 8 7.2 13.4 16 13.4s16-5.4 16-13.4c0-7.6-6.5-13.6-16-13.6z"
              stroke="#ff6b4a"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            <path
              d="M24 14.5c-1.2-4 .2-7 4.5-9-.3 3.2-1.7 6.2-4.5 9z"
              stroke="#4fd6a4"
              strokeWidth="2.4"
              strokeLinejoin="round"
            />
            <path d="M18.5 24.5l4 4 7-8" stroke="#ede9dc" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h1 className="font-display mt-5 text-2xl font-extrabold tracking-tight">Something burnt</h1>
          <p className="mt-2 text-sm leading-relaxed text-ink-dim">
            An unexpected error interrupted the kitchen. Your tasks and history are saved locally, so a plain reload
            almost always fixes it.
          </p>
          <p className="mt-3 break-all rounded-xl border border-pine-600 bg-pine-900/80 px-3 py-2 font-mono text-[11px] text-ink-faint">
            {this.state.error.message || "unknown error"}
          </p>
          <div className="mt-6 flex flex-col gap-2.5">
            <button
              onClick={this.reload}
              className="rounded-xl bg-ember px-4 py-2.5 text-sm font-bold text-pine-950 transition-all hover:brightness-110 active:scale-[0.98]"
            >
              Reload the app
            </button>
            <button
              onClick={this.hardReset}
              className="rounded-xl border border-ember/40 px-4 py-2.5 text-sm font-semibold text-ember transition-all hover:bg-ember/10 active:scale-[0.98]"
            >
              Erase local data &amp; reload
            </button>
          </div>
        </div>
      </div>
    );
  }
}
