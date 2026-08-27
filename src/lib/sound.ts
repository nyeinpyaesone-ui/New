let ctx: AudioContext | null = null;

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC: typeof AudioContext | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) ctx = new AC();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tone(
  freq: number,
  at: number,
  dur: number,
  type: OscillatorType = "sine",
  gain = 0.11,
) {
  const c = ensureCtx();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t = c.currentTime + at;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

/** warm two-note chime — a focus session just landed */
export function playChime() {
  tone(659.25, 0, 0.22);
  tone(880, 0.15, 0.28);
  tone(1318.5, 0.3, 0.42, "sine", 0.06);
}

/** gentle descending pair — break is over */
export function playBreakEnd() {
  tone(783.99, 0, 0.2);
  tone(587.33, 0.14, 0.32);
}

/** tiny mechanical click for start / pause / skip */
export function playClick() {
  tone(540, 0, 0.06, "triangle", 0.05);
}
