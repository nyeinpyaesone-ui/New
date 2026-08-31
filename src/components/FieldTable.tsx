interface Props {
  head: string[];
  rows: string[][];
  caption?: string;
}

export default function FieldTable({ head, rows, caption }: Props) {
  return (
    <div className="panel overflow-hidden">
      {caption && (
        <p className="border-b border-line/70 px-4 py-2.5 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-dim">
          {caption}
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="fieldtable">
          <thead>
            <tr>
              {head.map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                {r.map((c, j) => (
                  <td key={j} dangerouslySetInnerHTML={{ __html: c }} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
