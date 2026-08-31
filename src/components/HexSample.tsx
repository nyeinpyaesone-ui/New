import { useState } from "react";
import { IconCheck, IconCopy } from "./icons";

export interface HexLine {
  hex?: string;
  text?: string;
  note?: string;
}

interface Props {
  title: string;
  lines: HexLine[];
}

/** A tiny annotated wire sample with one-click copy. */
export default function HexSample({ title, lines }: Props) {
  const [copied, setCopied] = useState(false);
  const raw = lines.map((l) => l.hex ?? l.text ?? "").join("\n");

  const copy = () => {
    void navigator.clipboard?.writeText(raw);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  return (
    <figure className="panel overflow-hidden">
      <figcaption className="flex items-center justify-between border-b border-line/70 px-4 py-2.5">
        <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-dim">{title}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 rounded-md border border-line bg-hull px-2.5 py-1 font-mono text-[10.5px] font-bold text-fog transition-all duration-150 hover:border-line2 hover:text-chalk active:scale-95"
        >
          {copied ? <IconCheck size={12} className="text-seafoam" /> : <IconCopy size={12} />}
          {copied ? "copied" : "copy"}
        </button>
      </figcaption>
      <pre className="hexblock m-0 overflow-x-auto rounded-none border-0 px-4 py-3">
        {lines.map((l, i) => (
          <div key={i} className="flex gap-3 whitespace-pre">
            <span className="w-5 shrink-0 select-none text-right text-faint/70">{i + 1}</span>
            <span className="hx">{l.hex ?? l.text}</span>
            {l.note && <span className="an"># {l.note}</span>}
          </div>
        ))}
      </pre>
    </figure>
  );
}
