import { useMemo, useState } from "react";
import { IconHex } from "./icons";

interface FieldResult {
  name: string;
  raw: string;
  value: string;
  ok: boolean;
  detail: string;
}

interface Verdict {
  kind: "pack" | "idx" | "unknown" | "short" | "invalid";
  message: string;
  fields: FieldResult[];
  /** byte index → tone for the byte map */
  tones: ("magic" | "ver" | "count" | "rest")[];
}

const EXAMPLE_PACK = "5041434b 00000002 00000003";
const EXAMPLE_IDX = "ff744f63 00000002 00000018";

function ascii(b: number[]) {
  return b
    .map((x) => (x >= 0x20 && x <= 0x7e ? String.fromCharCode(x) : "."))
    .join("");
}

function parse(input: string): Verdict {
  const hex = input.replace(/(0x|\s|,)/gi, "");
  if (hex === "") {
    return { kind: "invalid", message: "Paste the first bytes of a .pack (or .idx) file as hex.", fields: [], tones: [] };
  }
  if (!/^[0-9a-f]*$/i.test(hex)) {
    return { kind: "invalid", message: "That is not hex — only 0–9 and a–f bytes, please.", fields: [], tones: [] };
  }
  if (hex.length % 2 !== 0) {
    return { kind: "invalid", message: "Odd number of hex digits — every byte needs exactly two.", fields: [], tones: [] };
  }
  const bytes: number[] = [];
  for (let i = 0; i < hex.length; i += 2) bytes.push(parseInt(hex.slice(i, i + 2), 16));

  if (bytes.length < 12) {
    return {
      kind: "short",
      message: `Need 12 bytes (24 hex digits) to read the full header — got ${bytes.length}.`,
      fields: [],
      tones: bytes.map(() => "rest"),
    };
  }

  const be32 = (off: number) => ((bytes[off] << 24) | (bytes[off + 1] << 16) | (bytes[off + 2] << 8) | bytes[off + 3]) >>> 0;
  const magicHex = bytes.slice(0, 4).map((b) => b.toString(16).padStart(2, "0")).join("");
  const tones: Verdict["tones"] = [
    ..."mmmm".split("").map(() => "magic" as const),
    ..."vvvv".split("").map(() => "ver" as const),
    ..."cccc".split("").map(() => "count" as const),
    ...bytes.slice(12).map(() => "rest" as const),
  ];

  if (ascii(bytes.slice(0, 4)) === "PACK") {
    const version = be32(4);
    const count = be32(8);
    return {
      kind: "pack",
      message: `A packfile holding ${count.toLocaleString()} object${count === 1 ? "" : "s"}.`,
      tones,
      fields: [
        { name: "magic", raw: "50 41 43 4b", value: '"PACK"', ok: true, detail: "always the ASCII letters PACK" },
        {
          name: "version",
          raw: bytes.slice(4, 8).map((b) => b.toString(16).padStart(2, "0")).join(" "),
          value: String(version),
          ok: version === 2 || version === 3,
          detail: version === 2 || version === 3 ? "big-endian; 2 and 3 are the known versions" : "unknown — only 2 and 3 exist",
        },
        {
          name: "objects",
          raw: bytes.slice(8, 12).map((b) => b.toString(16).padStart(2, "0")).join(" "),
          value: count.toLocaleString(),
          ok: true,
          detail: "big-endian count of entries that follow this header",
        },
      ],
    };
  }

  if (magicHex === "ff744f63") {
    const version = be32(4);
    const fanout0 = be32(8);
    return {
      kind: "idx",
      message: `A pack index (version ${version}) — the lookup table that sits beside a .pack.`,
      tones,
      fields: [
        { name: "magic", raw: "ff 74 4f 63", value: "\\377tOc", ok: true, detail: "marks idx v2+; v1 files start straight at the fanout" },
        {
          name: "version",
          raw: bytes.slice(4, 8).map((b) => b.toString(16).padStart(2, "0")).join(" "),
          value: String(version),
          ok: version === 2,
          detail: version === 2 ? "version 2, the format in universal use" : "unexpected version",
        },
        {
          name: "fanout[0]",
          raw: bytes.slice(8, 12).map((b) => b.toString(16).padStart(2, "0")).join(" "),
          value: fanout0.toLocaleString(),
          ok: true,
          detail: "objects whose OID starts with byte 0x00 — first of 256 fanout cells",
        },
      ],
    };
  }

  return {
    kind: "unknown",
    message: `Unknown magic ${magicHex} ("${ascii(bytes.slice(0, 4))}") — not a packfile or pack index.`,
    tones,
    fields: [],
  };
}

const toneStyle: Record<string, string> = {
  magic: "border-gitorange/70 bg-gitorange/15 text-flare",
  ver: "border-chalkcyan/50 bg-chalkcyan/10 text-chalkcyan",
  count: "border-seafoam/50 bg-seafoam/10 text-seafoam",
  rest: "border-line bg-hull/60 text-dim",
};

/**
 * Drop in the leading bytes of a packfile (or pack index) and read the
 * header the way Git does: magic, version, object count.
 */
export default function PackDecoder() {
  const [input, setInput] = useState(EXAMPLE_PACK);
  const result = useMemo(() => parse(input), [input]);

  const hexBytes = input.replace(/(0x|\s|,)/gi, "");
  const bytePairs: string[] = [];
  for (let i = 0; i + 1 < hexBytes.length; i += 2) bytePairs.push(hexBytes.slice(i, i + 2).toLowerCase());

  return (
    <section className="panel overflow-hidden" aria-label="Pack header decoder">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line/70 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <IconHex size={17} className="text-gitorange" />
          <div>
            <h4 className="font-display text-[15px] font-bold leading-tight text-chalk">pack header decoder</h4>
            <p className="font-mono text-[10.5px] text-faint">
              <code className="text-chalkcyan">head -c 12 file.pack | xxd</code> → verdict
            </p>
          </div>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setInput(EXAMPLE_PACK)}
            className="rounded-md border border-line bg-abyss/60 px-2.5 py-1 font-mono text-[10.5px] font-bold text-fog transition-all hover:border-line2 hover:text-chalk active:scale-95"
          >
            load .pack
          </button>
          <button
            onClick={() => setInput(EXAMPLE_IDX)}
            className="rounded-md border border-line bg-abyss/60 px-2.5 py-1 font-mono text-[10.5px] font-bold text-fog transition-all hover:border-line2 hover:text-chalk active:scale-95"
          >
            load .idx
          </button>
        </div>
      </header>

      <div className="grid gap-4 p-4 lg:grid-cols-2">
        <div>
          <label className="mb-1.5 block font-mono text-[10.5px] font-bold uppercase tracking-[0.18em] text-dim">
            leading bytes (hex)
          </label>
          <textarea
            className="lab-input min-h-[110px]"
            spellCheck={false}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="5041434b 00000002 00000003"
          />
          <div className="mt-2.5 flex flex-wrap gap-1">
            {bytePairs.slice(0, 24).map((b, i) => (
              <span
                key={`${i}-${b}`}
                className={`rounded border px-1.5 py-0.5 font-mono text-[11px] font-bold ${toneStyle[result.tones[i] ?? "rest"]}`}
              >
                {b}
              </span>
            ))}
            {bytePairs.length > 24 && (
              <span className="px-1 font-mono text-[11px] text-faint">…{bytePairs.length - 24} more</span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div
            className={`rounded-lg border px-3.5 py-2.5 font-mono text-[12px] font-semibold ${
              result.kind === "unknown" || result.kind === "invalid" || result.kind === "short"
                ? "border-alert/50 bg-alert/8 text-alert"
                : "border-seafoam/45 bg-seafoam/8 text-seafoam"
            }`}
          >
            {result.message}
          </div>
          <div className="space-y-1.5">
            {result.fields.map((f) => (
              <div
                key={f.name}
                className="pop grid grid-cols-[72px_1fr] items-baseline gap-2 rounded-lg border border-line bg-abyss/50 px-3 py-2"
              >
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-dim">{f.name}</span>
                <div>
                  <span className={`font-mono text-[13px] font-bold ${f.ok ? "text-chalk" : "text-alert"}`}>{f.value}</span>
                  <span className="ml-2 font-mono text-[11px] text-faint">{f.raw}</span>
                  <p className="text-[11.5px] leading-snug text-fog">{f.detail}</p>
                </div>
              </div>
            ))}
            {result.fields.length === 0 && (result.kind === "unknown" || result.kind === "invalid" || result.kind === "short") && (
              <p className="px-1 font-mono text-[11.5px] text-faint">
                {result.kind === "short"
                  ? "A header is exactly 12 bytes: 4 of magic, 4 of version, 4 of count."
                  : "Try one of the example headers, or hexdump the start of any file under .git/objects/pack/."}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
