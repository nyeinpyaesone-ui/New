import { useMemo, useState } from "react";
import { IconCheck, IconCopy, IconSignal } from "./icons";

type Tab = "encode" | "decode";

interface Frame {
  kind: "data" | "flush" | "delim" | "response-end" | "error";
  lenHex: string;
  payload: string;
  channel?: 1 | 2 | 3;
  note: string;
}

const hex4 = (n: number) => n.toString(16).padStart(4, "0");

function encodeFrames(input: string): { frames: Frame[]; wire: string } {
  const lines = input.split("\n");
  if (lines.length && lines[lines.length - 1] === "") lines.pop();
  const frames: Frame[] = [];
  let wire = "";
  for (const line of lines) {
    const tok = line.trim().toLowerCase();
    if (tok === "flush") {
      frames.push({ kind: "flush", lenHex: "0000", payload: "", note: "flush-pkt — end of a message group" });
      wire += "0000";
    } else if (tok === "delim") {
      frames.push({ kind: "delim", lenHex: "0001", payload: "", note: "delim-pkt — section separator (protocol v2)" });
      wire += "0001";
    } else if (tok === "response-end" || tok === "end") {
      frames.push({ kind: "response-end", lenHex: "0002", payload: "", note: "response-end-pkt — terminates a response (v2)" });
      wire += "0002";
    } else {
      const payload = line + "\n";
      const len = 4 + payload.length;
      if (len > 65520) {
        frames.push({ kind: "error", lenHex: "????", payload: line, note: `payload too long: ${len} bytes (limit 65520)` });
        continue;
      }
      const h = hex4(len);
      frames.push({ kind: "data", lenHex: h, payload, note: `length ${len} = 4 header + ${payload.length} payload` });
      wire += h + payload;
    }
  }
  return { frames, wire };
}

function decodeFrames(input: string, sideband: boolean): { frames: Frame[]; error: string | null } {
  const hex = input.replace(/(0x|\s|,)/gi, "");
  if (hex === "") return { frames: [], error: null };
  if (!/^[0-9a-f]*$/i.test(hex)) {
    return { frames: [], error: "input contains non-hex characters — paste raw wire bytes as hex" };
  }
  if (hex.length % 2 !== 0) {
    return { frames: [], error: "odd number of hex digits — every byte needs two" };
  }
  const frames: Frame[] = [];
  let i = 0;
  while (i < hex.length) {
    const lenHex = hex.slice(i, i + 4);
    if (lenHex.length < 4) {
      frames.push({ kind: "error", lenHex: lenHex + "…", payload: "", note: "truncated length header — need 4 hex digits" });
      break;
    }
    i += 4;
    if (lenHex === "0000") {
      frames.push({ kind: "flush", lenHex, payload: "", note: "flush-pkt" });
      continue;
    }
    if (lenHex === "0001") {
      frames.push({ kind: "delim", lenHex, payload: "", note: "delim-pkt" });
      continue;
    }
    if (lenHex === "0002") {
      frames.push({ kind: "response-end", lenHex, payload: "", note: "response-end-pkt" });
      continue;
    }
    const len = parseInt(lenHex, 16);
    if (len < 4) {
      frames.push({ kind: "error", lenHex, payload: "", note: `length ${len} is illegal — the 4 header bytes count toward it` });
      break;
    }
    const payloadBytes = (len - 4) * 2;
    if (hex.length - i < payloadBytes) {
      frames.push({
        kind: "error",
        lenHex,
        payload: "",
        note: `claims ${len - 4} payload bytes but only ${(hex.length - i) / 2} remain — truncated stream`,
      });
      break;
    }
    const raw = hex.slice(i, i + payloadBytes);
    i += payloadBytes;
    const bytes: number[] = [];
    for (let j = 0; j < raw.length; j += 2) bytes.push(parseInt(raw.slice(j, j + 2), 16));
    let channel: 1 | 2 | 3 | undefined;
    let body = bytes;
    if (sideband && bytes.length > 0 && (bytes[0] === 1 || bytes[0] === 2 || bytes[0] === 3)) {
      channel = bytes[0] as 1 | 2 | 3;
      body = bytes.slice(1);
    }
    const printable = body.every((b) => b === 0x0a || (b >= 0x20 && b <= 0x7e));
    const text = printable
      ? body.map((b) => (b === 0x0a ? "\n" : String.fromCharCode(b))).join("")
      : bytes.map((b) => b.toString(16).padStart(2, "0")).join(" ") + "  (binary)";
    const chNote =
      channel === 1 ? " · side-band channel 1: pack data" :
      channel === 2 ? " · side-band channel 2: progress text" :
      channel === 3 ? " · side-band channel 3: fatal error" : "";
    frames.push({ kind: "data", lenHex, payload: text, channel, note: `length ${len}${chNote}` });
  }
  const hasError = frames.some((f) => f.kind === "error");
  return { frames, error: hasError ? null : null };
}

const kindStyle: Record<Frame["kind"], string> = {
  data: "text-chalkcyan",
  flush: "text-flare",
  delim: "text-flare",
  "response-end": "text-flare",
  error: "text-alert",
};

/**
 * The pkt-line workbench: type plain lines and watch them framed for the
 * wire, or paste raw hex bytes and have them parsed back into frames.
 */
export default function PktLineLab() {
  const [tab, setTab] = useState<Tab>("encode");
  const [encodeInput, setEncodeInput] = useState(
    "want 74730d410fcb6603ace96f1dc55ea6196122532d multi_ack thin-pack side-band-64k\nhave 1c2b3d4e5f60718293a4b5c6d7e8f9012345678\nflush",
  );
  const [decodeInput, setDecodeInput] = useState(
    "003c77616e742037343733306434313066636236363033616365393666316463353565613631393631323235333264206d756c74695f61636b0a0000",
  );
  const [sideband, setSideband] = useState(true);
  const [copied, setCopied] = useState(false);

  const encoded = useMemo(() => encodeFrames(encodeInput), [encodeInput]);
  const decoded = useMemo(() => decodeFrames(decodeInput, sideband), [decodeInput, sideband]);

  const frames = tab === "encode" ? encoded.frames : decoded.frames;
  const wire = tab === "encode" ? encoded.wire : decodeInput.replace(/(0x|\s|,)/gi, "");

  const copyWire = () => {
    void navigator.clipboard?.writeText(wire);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <section className="panel overflow-hidden" aria-label="pkt-line workbench">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line/70 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <IconSignal size={17} className="text-gitorange" />
          <div>
            <h4 className="font-display text-[15px] font-bold leading-tight text-chalk">pkt-line workbench</h4>
            <p className="font-mono text-[10.5px] text-faint">type lines → framed bytes · paste hex → parsed frames</p>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-line bg-abyss/60 p-1">
          <button className={`lab-tab ${tab === "encode" ? "on" : ""}`} onClick={() => setTab("encode")}>
            Encode
          </button>
          <button className={`lab-tab ${tab === "decode" ? "on" : ""}`} onClick={() => setTab("decode")}>
            Decode
          </button>
        </div>
      </header>

      <div className="grid gap-4 p-4 lg:grid-cols-2">
        <div>
          <label className="mb-1.5 block font-mono text-[10.5px] font-bold uppercase tracking-[0.18em] text-dim">
            {tab === "encode" ? "message lines (flush / delim / response-end are keywords)" : "raw wire bytes (hex)"}
          </label>
          <textarea
            className="lab-input min-h-[150px]"
            spellCheck={false}
            value={tab === "encode" ? encodeInput : decodeInput}
            onChange={(e) => (tab === "encode" ? setEncodeInput(e.target.value) : setDecodeInput(e.target.value))}
            placeholder={
              tab === "encode"
                ? "want <oid> multi_ack\nhave <oid>\nflush"
                : "003c77616e7420…  (whitespace and 0x prefixes are ignored)"
            }
          />
          {tab === "decode" && (
            <label className="mt-2.5 flex w-fit cursor-pointer select-none items-center gap-2 rounded-md border border-line bg-abyss/50 px-2.5 py-1.5 text-xs text-fog transition-colors hover:border-line2">
              <input
                type="checkbox"
                checked={sideband}
                onChange={(e) => setSideband(e.target.checked)}
                className="accent-[#f05033]"
              />
              split side-band channel byte
            </label>
          )}
        </div>

        <div className="flex flex-col">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.18em] text-dim">
              parsed frames
            </span>
            <span className="font-mono text-[10.5px] text-faint">{frames.length} frame{frames.length === 1 ? "" : "s"}</span>
          </div>
          <div className="min-h-[150px] flex-1 space-y-1.5 overflow-x-auto rounded-lg border border-line bg-abyss/60 p-3">
            {frames.length === 0 && (
              <p className="font-mono text-[11.5px] text-faint">Nothing to parse yet — start typing on the left.</p>
            )}
            {frames.map((f, i) => (
              <div key={`${tab}-${i}-${f.lenHex}`} className="pop flex items-start gap-2 font-mono text-[12px]">
                <span className="w-4 shrink-0 select-none text-right text-faint/60">{i + 1}</span>
                <span className={`shrink-0 rounded border px-1.5 py-0.5 font-bold ${
                  f.kind === "error"
                    ? "border-alert/60 bg-alert/10 text-alert"
                    : f.kind === "data"
                      ? "border-gitorange/60 bg-gitorange/10 text-flare"
                      : "border-flare/50 bg-flare/10 text-flare"
                }`}>
                  {f.lenHex}
                </span>
                <span className={`whitespace-pre-wrap break-all leading-relaxed ${kindStyle[f.kind]}`}>
                  {f.payload.replace(/\n$/, "␊") || f.kind !== "data" ? (f.payload.replace(/\n$/, "␊") || (f.kind === "flush" ? "∅" : f.kind === "delim" ? "◆" : "■")) : ""}
                </span>
                <span className="an ml-auto hidden pl-3 text-right text-[10.5px] leading-relaxed text-faint sm:block">
                  {f.note}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="flex flex-wrap items-center gap-3 border-t border-line/70 bg-abyss/50 px-4 py-3">
        <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.18em] text-dim">wire bytes</span>
        <code className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-chalkcyan" title={wire}>
          {wire || "∅"}
        </code>
        <button
          onClick={copyWire}
          className="flex items-center gap-1.5 rounded-md border border-line bg-hull px-2.5 py-1.5 font-mono text-[10.5px] font-bold text-fog transition-all hover:border-line2 hover:text-chalk active:scale-95"
        >
          {copied ? <IconCheck size={12} className="text-seafoam" /> : <IconCopy size={12} />}
          {copied ? "copied" : "copy stream"}
        </button>
      </footer>
    </section>
  );
}
