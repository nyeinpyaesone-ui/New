import { useState } from "react";

export type SegTone = "magic" | "field" | "cyan" | "var" | "hash";

export interface Seg {
  label: string;
  /** relative byte width for layout (stylised, not to scale) */
  w: number;
  tone?: SegTone;
  /** size annotation shown under the label, e.g. "4 B" or "×256" */
  size?: string;
  desc: string;
}

export interface DiagramRow {
  name: string;
  segs: Seg[];
}

interface Props {
  title?: string;
  rows: DiagramRow[];
  caption?: string;
}

const toneClass: Record<SegTone, string> = {
  magic: "seg-magic",
  field: "",
  cyan: "seg-cyan",
  var: "seg-var",
  hash: "seg-hash",
};

/**
 * Stylised byte-layout diagrams. Every segment is hoverable and reports its
 * meaning in the inspector strip below — the diagram's own "man page".
 */
export default function ByteDiagram({ title, rows, caption }: Props) {
  const [info, setInfo] = useState<string | null>(null);

  return (
    <figure className="panel overflow-hidden">
      {title && (
        <figcaption className="flex items-center justify-between border-b border-line/70 px-4 py-2.5">
          <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-dim">
            {title}
          </span>
          <span className="font-mono text-[10px] text-faint">byte layout · not to scale</span>
        </figcaption>
      )}
      <div className="space-y-2.5 p-4" onMouseLeave={() => setInfo(null)}>
        {rows.map((row) => (
          <div key={row.name} className="grid grid-cols-[92px_1fr] items-stretch gap-2 sm:grid-cols-[118px_1fr]">
            <span
              className="self-center truncate font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-faint"
              title={row.name}
            >
              {row.name}
            </span>
            <div className="flex gap-1.5">
              {row.segs.map((seg) => (
                <div
                  key={seg.label}
                  className={`seg ${toneClass[seg.tone ?? "field"]}`}
                  style={{ flexGrow: seg.w, flexBasis: 0 }}
                  onMouseEnter={() => setInfo(seg.desc)}
                >
                  <span className="truncate text-[11px] font-semibold leading-tight text-chalk">
                    {seg.label}
                  </span>
                  {seg.size && <span className="text-[9.5px] leading-tight text-dim">{seg.size}</span>}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex min-h-[38px] items-center gap-2 border-t border-line/70 bg-abyss/50 px-4 py-2">
        <span className="pulse-dot h-1.5 w-1.5 shrink-0 rounded-full bg-gitorange" />
        <p className="font-mono text-[11.5px] leading-snug text-fog">
          {info ?? caption ?? "Hover any field for its story."}
        </p>
      </div>
    </figure>
  );
}
