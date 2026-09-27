# The Git Internals Field Guide

A single-page annotated reference for Git's on-disk **file formats** and **wire protocols** —
the eleven `gitformat-*` / `gitprotocol-*` manual pages, rebuilt for the web with byte-level
diagrams, worked wire samples, and two live decoders.

Built with **React 18 + TypeScript + Vite + Tailwind CSS v4**. No backend, no state to lose —
it's a document that happens to compute.

---

## Pages

| Group | Pages |
| --- | --- |
| `gitformat-*` (6) | **bundle** · **chunk** · **commit-graph** · **index** · **pack** (+ pack index) · **signature** |
| `gitprotocol-*` (5) | **common** (pkt-line) · **capabilities** (v0) · **http** (smart/dumb) · **pack** (negotiation) · **v2** |

## Interactive pieces

- **pkt-line workbench** (`protocol-common`) — type message lines and watch them framed for the
  wire (`flush` / `delim` / `response-end` keywords supported), or paste raw hex bytes and have
  them parsed back into frames, with side-band channel splitting and precise truncation errors.
- **Pack header decoder** (`gitformat-pack`) — paste the leading bytes of any `.pack` or `.idx`
  file and read the verdict: magic, version, object count — with a colour-coded byte map.
- **Hoverable byte diagrams** — every field in every layout explains itself in an inspector strip.
- **Copyable wire samples** — every hex specimen copies in one click.

## Navigation & motion

- Scroll-spied sidebar (`gitformat-*` / `gitprotocol-*` groups) with a live filter — press `/` to jump to it.
- "Recognise a magic?" chip strip (`PACK`, `DIRC`, `CGPH`, `0000`, …) that jumps to the explaining page.
- Reading-progress bar, scroll-reveal sections, per-section anchor copy, animated "wire" flourishes.
- `prefers-reduced-motion` disables all ambient animation.

## Quick start

```bash
npm install
npm run dev      # local dev server
npm run build    # production build → dist/
```

## Architecture

```
index.html                 fonts (Chakra Petch / IBM Plex Sans / JetBrains Mono), data-URI icon
src/
  App.tsx                  shell — masthead, sidebar, scroll-spy, reveals, footer
  docs/
    formats.tsx            the six gitformat-* pages (SectionDef[])
    protocols.tsx          the five gitprotocol-* pages
  components/
    ByteDiagram.tsx        hoverable byte-layout diagrams with inspector strip
    HexSample.tsx          annotated hex specimens with copy button
    FieldTable.tsx         compact striped reference tables
    PktLineLab.tsx         pkt-line encoder/decoder workbench
    PackDecoder.tsx        packfile / pack-index header decoder
    icons.tsx              hand-drawn inline SVG icon set
```

Content is data: each page is a `SectionDef` (`id`, `man`, `group`, `title`, `lede`,
`keywords`, `body`) — adding a page is appending one object and the sidebar, search,
scroll-spy and anchors pick it up automatically.

## Notes

- All lengths in worked examples are computed from the pkt-line rule *length includes the four
  header bytes* — verified frame by frame.
- Diagrams are stylised (flex-weighted), not to scale; each says so in its caption.
- Design tokens live in `@theme` in `src/index.css` — re-skin the whole manual from one block.
