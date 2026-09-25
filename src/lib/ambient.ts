import type { Ambient } from "./types";

/**
 * Ambient soundscapes generated entirely with WebAudio — no audio files.
 * A looping noise buffer is shaped by filters and a slow LFO so the bed
 * breathes instead of sounding like a static hiss.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let live: { sources: AudioBufferSourceNode[]; lfo: OscillatorNode | null } | null = null;
let current: Ambient = "off";
let level = 0.8;

type NoiseKind = "white" | "pink" | "brown";
const buffers = new Map<NoiseKind, AudioBuffer>();

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC: typeof AudioContext | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function noiseBuffer(kind: NoiseKind): AudioBuffer {
  const c = ensureCtx()!;
  const cached = buffers.get(kind);
  if (cached) return cached;
  const len = c.sampleRate * 4; // 4s loop
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const data = buf.getChannelData(ch);
    let pink1 = 0, pink2 = 0, pink3 = 0, brown = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (kind === "white") {
        data[i] = w * 0.6;
      } else if (kind === "pink") {
        // Paul Kellet approximation
        pink1 = 0.99765 * pink1 + w * 0.099046;
        pink2 = 0.963 * pink2 + w * 0.2965164;
        pink3 = 0.57 * pink3 + w * 1.0526913;
        data[i] = (pink1 + pink2 + pink3 + w * 0.1848) * 0.11;
      } else {
        brown = (brown + 0.02 * w) / 1.02;
        data[i] = brown * 3.2;
      }
    }
  }
  buffers.set(kind, buf);
  return buf;
}

function stopLive() {
  if (!live) return;
  live.sources.forEach((s) => {
    try { s.stop(); } catch { /* already stopped */ }
    s.disconnect();
  });
  live.lfo?.stop();
  live.lfo?.disconnect();
  live = null;
}

function startScene(id: Ambient) {
  const c = ensureCtx();
  if (!c || !master) return;
  stopLive();
  const sources: AudioBufferSourceNode[] = [];
  let lfo: OscillatorNode | null = null;

  const sceneGain = c.createGain();
  sceneGain.connect(master);

  const makeLoop = (kind: NoiseKind) => {
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(kind);
    src.loop = true;
    sources.push(src);
    return src;
  };
  const filter = (type: BiquadFilterType, freq: number, q = 0.8) => {
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.value = freq;
    f.Q.value = q;
    return f;
  };

  if (id === "rain") {
    // two offset white-noise bands, highpassed into a soft patter
    const bed = makeLoop("white");
    const bp = filter("bandpass", 3200, 0.6);
    const hp = filter("highpass", 900, 0.7);
    const g = c.createGain();
    g.gain.value = 0.055;
    bed.connect(hp); hp.connect(bp); bp.connect(g); g.connect(sceneGain);
    bed.start();
    sceneGain.gain.value = 1;
  } else if (id === "cafe") {
    // pink-noise murmur through a low shelf, with a slow swell
    const bed = makeLoop("pink");
    const lp = filter("lowpass", 1100, 0.5);
    const g = c.createGain();
    g.gain.value = 0.16;
    bed.connect(lp); lp.connect(g); g.connect(sceneGain);
    bed.start();
    lfo = c.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = c.createGain();
    lfoGain.gain.value = 0.045;
    lfo.connect(lfoGain);
    lfoGain.connect(g.gain);
    lfo.start();
    sceneGain.gain.value = 1;
  } else if (id === "drone") {
    // brown-noise floor, rolled off — a warm room tone
    const bed = makeLoop("brown");
    const lp = filter("lowpass", 260, 0.4);
    const g = c.createGain();
    g.gain.value = 0.22;
    bed.connect(lp); lp.connect(g); g.connect(sceneGain);
    bed.start();
    lfo = c.createOscillator();
    lfo.frequency.value = 0.045;
    const lfoGain = c.createGain();
    lfoGain.gain.value = 0.05;
    lfo.connect(lfoGain);
    lfoGain.connect(g.gain);
    lfo.start();
    sceneGain.gain.value = 1;
  }

  live = { sources, lfo };
}

/** Switch soundscape. Volume 0–1 follows the app's chime volume slider. */
export function setAmbient(id: Ambient, volume: number): void {
  level = Math.min(1, Math.max(0, volume));
  current = id;
  if (id === "off") {
    stopLive();
    if (ctx && master) master.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
    return;
  }
  const c = ensureCtx();
  if (!c || !master) return;
  startScene(id);
  master.gain.setTargetAtTime(0.9 * level + 0.02, c.currentTime, 0.4); // ease in
}

/** Called when the volume slider moves while a scene is already playing. */
export function setAmbientVolume(volume: number): void {
  level = Math.min(1, Math.max(0, volume));
  const c = ctx;
  if (!c || !master || current === "off") return;
  master.gain.setTargetAtTime(0.9 * level + 0.02, c.currentTime, 0.1);
}
