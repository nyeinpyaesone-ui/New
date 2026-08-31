# Simmer — Pomodoro Focus Desk

A production-ready, local-first Pomodoro app built with **React 18 + TypeScript + Vite + Tailwind CSS v4**.
No account, no cloud, no backend — everything lives in `localStorage` and survives reloads, restarts and
backgrounded tabs.

---

## Features

| Area | What you get |
| --- | --- |
| Timer | Focus / short-break / long-break modes, start · pause · resume · reset · skip, auto-advancing rounds with a configurable long-break cadence, timestamp-based engine that stays accurate in background tabs |
| Customisation | Editable durations (focus 1–90 min, short 1–30, long 1–60), one-click **presets** (Classic 25·5·15, Deep work 50·10·20, Sprint 15·3·10), sessions per round, daily goal, auto-start toggles, completion sounds with a **volume slider + test chime** |
| Tasks | Focus queue with estimated tomatoes, per-task completed-tomato tracking, a "now focusing" selection, **drag-to-reorder rows** (mouse + keyboard, via dnd-kit), done / delete / clear-done |
| Journal | Timestamped record of every completed session, finished task and goal hit — grouped by day, capped at 60 entries, included in backups |
| Statistics | Today's pomodoros vs. goal, focus minutes, tasks completed, day streak, animated 7-day chart, a **12-week heatmap**, all-time rollups (total tomatoes, deep-work time, best day) |
| Ambience | Generative **ambient soundscapes** — Rain, Café, Deep flow — synthesised with WebAudio noise + filters (no audio files), animated EQ bars while playing, volume follows the chime slider |
| Data | Everything persisted to `localStorage`, JSON backup **export / import**, two-step "erase all data", validated hydration (corrupt or hand-edited storage can't crash the app) |
| Alerts | **Browser notifications** when a session completes while the tab is hidden (opt-in, permission-guarded), plus in-app toasts and confetti |
| Polish | Live countdown in the document title **and** the favicon, WebAudio chimes with volume control, a **keyboard shortcuts overlay** (`?`), error boundary with recovery, `prefers-reduced-motion` support, web manifest + SVG icon |

## Keyboard shortcuts

`Space` start/pause · `R` reset · `S` skip · `1`/`2`/`3` switch mode · `?` shortcuts overlay · `Esc` close dialogs

## Quick start

```bash
npm install
npm run dev        # local dev server
npm run build      # production build → dist/
npm run typecheck  # strict TS check
```

## Architecture

```
index.html                  fonts (Bricolage Grotesque / Instrument Sans / Spline Sans Mono), manifest, icon
public/                     static favicon + web manifest
src/
  main.tsx                  entry — mounts <App/> inside <ErrorBoundary> + StrictMode
  App.tsx                   all app state, timer engine, session flow, task & data operations
  lib/
    types.ts                domain model, defaults, mode metadata
    dates.ts                day keys, clock formatting, streak math
    data.ts                 storage sanitizers + backup serialize/parse (throws readable errors)
    favicon.ts              live SVG favicon (progress ring + minutes left)
    sound.ts                WebAudio chimes (lazy AudioContext, no assets)
    ambient.ts              generative soundscapes — pink/brown/white noise shaped by filters + LFO
    notify.ts               opt-in browser notifications for hidden-tab completions
  hooks/
    useLocalStorage.ts      persisted state with optional hydration sanitizer
  components/
    ModeTabs.tsx            sliding-pill mode switcher
    TimerDial.tsx           SVG dial — ticks, progress arc, halo, cycle dots
    StatsPanel.tsx          today's stats, goal bar, 7-day chart, all-time strip
    TaskPanel.tsx           draggable queue (dnd-kit) with estimate picker + empty state
    JournalPanel.tsx        day-grouped activity log
    SettingsModal.tsx       durations, presets, volume, flow toggles, backup export/import, danger zone
    ShortcutsOverlay.tsx    keyboard map dialog ("?")
    Toasts.tsx              inline notifications
    ErrorBoundary.tsx       crash recovery UI
    icons.tsx               hand-drawn inline SVG icon set
```

### Storage schema (all keys prefixed `simmer.`)

| Key | Shape |
| --- | --- |
| `settings.v1` | `{ focusMin, shortMin, longMin, longEvery, autoBreak, autoFocus, sound, volume, ambient, notify, dailyGoal }` |
| `tasks.v1` | `Task[]` — `{ id, title, est, donePomos, done, createdAt }` |
| `history.v1` | `{ "YYYY-MM-DD": { pomos, minutes, tasksDone } }` |
| `journal.v1` | `JournalEvent[]` — `{ id, at, type, text }`, newest first, max 60 |
| `active.v1` | `string | null` — id of the "now focusing" task |
| `runtime.v1` | `{ mode, secondsLeft, cyclePos }` — in-flight timer state |

Every value is re-validated on load (`src/lib/data.ts`), so the app tolerates schema drift and
tampered storage. Backups are the same shapes wrapped in `{ app: "simmer", version: 1, data }`.

## Reusing this as a stage

- **New domain, same shell** — swap `lib/types.ts` + the two side panels; the timer engine,
  persistence hook, toasts, modal, error boundary and styling system carry over unchanged.
- **Design tokens** — all colour, font and surface decisions live in `@theme` in `src/index.css`;
  re-skin the whole app from one block.
- **Drop-in utilities** — `useLocalStorage` (with sanitizer), `ErrorBoundary`, the backup
  export/import pair and the live-favicon module are dependency-free and copy straight into
  other Vite projects.

## Notes

- Timer completion is computed from wall-clock timestamps, so countdowns don't drift when the
  tab is throttled.
- Sounds use a lazily-created `AudioContext` (created on first user gesture) — no audio assets.
- `prefers-reduced-motion` disables all ambient animation.
