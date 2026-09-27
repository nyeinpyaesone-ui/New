import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FORMATS, type SectionDef } from "./docs/formats";
import { PROTOCOLS } from "./docs/protocols";
import { IconAnchor, IconBranch, IconCheck, IconFileBin, IconPrompt, IconSearch, IconWire } from "./components/icons";

const SECTIONS: SectionDef[] = [...FORMATS, ...PROTOCOLS];

/** magic constants that jump straight to the page that explains them */
const MAGIC_CHIPS: { magic: string; section: string; hint: string }[] = [
  { magic: "PACK", section: "format-pack", hint: "packfile header" },
  { magic: "DIRC", section: "format-index", hint: "index header" },
  { magic: "CGPH", section: "format-commit-graph", hint: "commit-graph" },
  { magic: "ff 74 4f 63", section: "format-pack", hint: "pack index v2" },
  { magic: "# v2 git bundle", section: "format-bundle", hint: "bundle magic" },
  { magic: "0000", section: "protocol-common", hint: "flush-pkt" },
  { magic: "version 2", section: "protocol-v2", hint: "v2 handshake" },
];

function useScrollSpy(ids: string[]): string {
  const [active, setActive] = useState(ids[0] ?? "");
  useEffect(() => {
    const visible = new Map<string, number>();
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) visible.set(e.target.id, e.boundingClientRect.top);
          else visible.delete(e.target.id);
        }
        if (visible.size === 0) return;
        const top = [...visible.entries()].sort((a, b) => a[1] - b[1])[0][0];
        setActive(top);
      },
      { rootMargin: "-15% 0px -70% 0px" },
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, [ids]);
  return active;
}

function SectionAnchor({ id }: { id: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      aria-label="Copy link to this section"
      onClick={() => {
        void navigator.clipboard?.writeText(`${location.href.split("#")[0]}#${id}`);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      }}
      className="group/anchor flex items-center gap-1.5 rounded-md border border-transparent px-1.5 py-1 font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-faint opacity-0 transition-all duration-200 hover:border-line hover:text-flare focus-visible:opacity-100 group-hover/heading:opacity-100"
    >
      {copied ? <IconCheck size={12} className="text-seafoam" /> : <IconAnchor size={12} />}
      {copied ? "copied" : "link"}
    </button>
  );
}

export default function App() {
  const [query, setQuery] = useState("");
  const [progress, setProgress] = useState(0);
  const searchRef = useRef<HTMLInputElement | null>(null);
  const activeIds = useMemo(() => SECTIONS.map((s) => s.id), []);
  const active = useScrollSpy(activeIds);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SECTIONS;
    return SECTIONS.filter(
      (s) =>
        s.id.toLowerCase().includes(q) ||
        s.title.toLowerCase().includes(q) ||
        s.keywords.some((k) => k.toLowerCase().includes(q)),
    );
  }, [query]);

  /* reading progress */
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const doc = document.documentElement;
        const max = doc.scrollHeight - doc.clientHeight;
        setProgress(max > 0 ? Math.min(100, (doc.scrollTop / max) * 100) : 0);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  /* scroll reveals */
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            obs.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    document.querySelectorAll(".reveal").forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [filtered]);

  /* "/" focuses the filter */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) {
        if (e.key === "Escape") (el as HTMLInputElement).blur();
        return;
      }
      if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const jump = useCallback((id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const formatSections = filtered.filter((s) => s.group === "formats");
  const protocolSections = filtered.filter((s) => s.group === "protocols");

  return (
    <div className="min-h-screen">
      {/* reading progress */}
      <div className="fixed inset-x-0 top-0 z-50 h-[3px] bg-transparent">
        <div
          className="h-full bg-gitorange shadow-[0_0_12px_rgba(240,80,51,0.7)] transition-[width] duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        {/* ---------- man-page masthead ---------- */}
        <header className="man-rule pb-5 pt-7">
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 font-mono text-[11px] font-bold uppercase tracking-[0.22em] text-fog">
            <span>GITFIELD(5)</span>
            <span className="hidden text-dim sm:inline">Git Internals Manual</span>
            <span className="text-dim">File Formats &amp; Wire Protocols</span>
          </div>

          <div className="mt-6 grid items-end gap-8 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <p className="kicker flex items-center gap-2.5">
                <IconBranch size={15} />
                eleven pages of plumbing, annotated
              </p>
              <h1 className="mt-3 font-display text-[clamp(2.4rem,5.4vw,4.1rem)] font-bold leading-[1.02] tracking-tight text-chalk">
                The Git Internals
                <br />
                Field Guide<span className="cursor-blink ml-2" />
              </h1>
              <p className="mt-4 max-w-[56ch] text-[15.5px] leading-relaxed text-fog">
                What <strong className="text-chalk">PACK</strong>, <strong className="text-chalk">DIRC</strong> and{" "}
                <strong className="text-chalk">0000</strong> actually mean — byte layouts for the on-disk formats, frame-by-frame
                walkthroughs of the wire protocols, and two live decoders to play with.
              </p>

              {/* magic chip strip */}
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <span className="mr-1 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-faint">
                  recognise a magic?
                </span>
                {MAGIC_CHIPS.map((c) => (
                  <button
                    key={c.magic}
                    onClick={() => jump(c.section)}
                    title={c.hint}
                    className="rounded-md border border-line bg-hull/70 px-2.5 py-1 font-mono text-[11.5px] font-semibold text-chalkcyan transition-all duration-200 hover:-translate-y-0.5 hover:border-gitorange/70 hover:bg-gitorange/10 hover:text-flare active:scale-95"
                  >
                    {c.magic}
                  </button>
                ))}
              </div>
            </div>

            {/* specimen card */}
            <div className="panel relative overflow-hidden p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-dim">
                  specimen · head of a packfile
                </span>
                <IconFileBin size={15} className="text-gitorange" />
              </div>
              <pre className="mt-3 font-mono text-[12px] leading-[2] text-fog">
                <span className="text-flare">50 41 43 4b</span> <span className="text-chalkcyan">00 00 00 02</span>{" "}
                <span className="text-seafoam">00 00 00 03</span>
                {"\n"}
                <span className="text-dim">P  A  C  K</span> <span className="text-dim">version: 2</span> {"   "}
                <span className="text-dim">objects: 3</span>
              </pre>
              <div className="wire mt-3" />
              <p className="mt-2.5 font-mono text-[10.5px] leading-relaxed text-faint">
                twelve bytes decide everything — feed them to the decoder on the{" "}
                <button onClick={() => jump("format-pack")} className="text-flare underline decoration-gitorange/50 underline-offset-2 transition-colors hover:text-chalk">
                  gitformat-pack
                </button>{" "}
                page.
              </p>
            </div>
          </div>
        </header>

        {/* ---------- body ---------- */}
        <div className="grid gap-10 py-8 lg:grid-cols-[248px_1fr]">
          {/* sidebar */}
          <nav className="lg:sticky lg:top-6 lg:h-fit lg:self-start" aria-label="Manual pages">
            <div className="relative">
              <IconSearch size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="filter pages…  ( / )"
                aria-label="Filter manual pages"
                className="w-full rounded-lg border border-line bg-deck/80 py-2 pl-9 pr-8 font-mono text-[12px] text-chalk placeholder-faint transition-all focus:border-gitorange/70 focus:shadow-[0_0_0_3px_rgba(240,80,51,0.15)] focus:outline-none"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  aria-label="Clear filter"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 font-mono text-[13px] text-faint transition-colors hover:text-chalk"
                >
                  ×
                </button>
              )}
            </div>

            <div className="mt-5 space-y-5">
              <div>
                <p className="flex items-center gap-2 px-2 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-faint">
                  <IconFileBin size={12} className="text-gitorange" /> gitformat-*
                </p>
                <div className="mt-2 space-y-0.5">
                  {formatSections.map((s) => (
                    <button key={s.id} onClick={() => jump(s.id)} className={`side-item ${active === s.id ? "active" : ""}`}>
                      <span className="truncate">{s.man}</span>
                      <span className="ml-auto font-mono text-[9.5px] text-faint">(5)</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="flex items-center gap-2 px-2 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-faint">
                  <IconWire size={12} className="text-chalkcyan" /> gitprotocol-*
                </p>
                <div className="mt-2 space-y-0.5">
                  {protocolSections.map((s) => (
                    <button key={s.id} onClick={() => jump(s.id)} className={`side-item ${active === s.id ? "active" : ""}`}>
                      <span className="truncate">{s.man}</span>
                      <span className="ml-auto font-mono text-[9.5px] text-faint">(7)</span>
                    </button>
                  ))}
                </div>
              </div>
              {filtered.length === 0 && (
                <p className="rounded-lg border border-dashed border-line px-3 py-4 text-center font-mono text-[11.5px] text-faint">
                  no page matches "{query}"
                </p>
              )}
            </div>

            <div className="mt-6 hidden rounded-lg border border-line bg-deck/60 p-3 lg:block">
              <p className="flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-faint">
                <IconPrompt size={12} className="text-flare" /> read the real thing
              </p>
              <p className="mt-2 font-mono text-[11px] leading-relaxed text-dim">
                man gitformat-pack
                <br />
                man gitprotocol-v2
              </p>
            </div>
          </nav>

          {/* sections */}
          <main className="min-w-0 space-y-14 pb-10">
            {filtered.map((s, idx) => (
              <article key={s.id} id={s.id} className="reveal scroll-mt-24" style={{ transitionDelay: `${Math.min(idx, 3) * 60}ms` }}>
                <header className="group/heading">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="kicker">{s.man}(5)</span>
                    <span className="h-px flex-1 bg-line/80" />
                    <SectionAnchor id={s.id} />
                  </div>
                  <h2 className="mt-2 font-display text-[clamp(1.5rem,2.6vw,2rem)] font-bold leading-tight tracking-tight text-chalk">
                    {s.title}
                  </h2>
                  <p className="prose mt-2.5 max-w-[72ch] text-[15px] leading-relaxed text-fog">{s.lede}</p>
                </header>
                <div className="mt-6">{s.body}</div>
              </article>
            ))}

            {filtered.length === 0 && (
              <div className="panel px-6 py-12 text-center">
                <p className="font-display text-xl font-bold text-chalk">Nothing in the manual matches that.</p>
                <button
                  onClick={() => setQuery("")}
                  className="mt-4 rounded-lg border border-gitorange/60 bg-gitorange/10 px-4 py-2 font-mono text-[12px] font-bold text-flare transition-all hover:bg-gitorange/20 active:scale-95"
                >
                  clear the filter
                </button>
              </div>
            )}
          </main>
        </div>

        {/* ---------- man-page footer ---------- */}
        <footer className="mb-8 pt-5" style={{ borderTop: "3px double var(--color-line2)" }}>
          <div className="wire mb-5" />
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-dim">
            <span>GITFIELD(5)</span>
            <span className="flex items-center gap-2 normal-case tracking-normal text-faint">
              <IconBranch size={13} className="text-gitorange" />
              rendered for the web — consult <code className="text-chalkcyan">man gitformat-*</code> for canon
            </span>
            <span>Git Internals Manual · 2026</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
