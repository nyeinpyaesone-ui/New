import type { ReactNode } from "react";
import ByteDiagram from "../components/ByteDiagram";
import HexSample from "../components/HexSample";
import FieldTable from "../components/FieldTable";
import PktLineLab from "../components/PktLineLab";
import type { SectionDef } from "./formats";

const Note = ({ children }: { children: ReactNode }) => (
  <ul className="prose space-y-1.5 text-[14px] text-fog">
    {Array.isArray(children)
      ? children.map((c, i) => (
          <li key={i} className="flex gap-2.5">
            <span className="mt-[9px] h-[5px] w-[5px] shrink-0 rounded-[1.5px] bg-chalkcyan/80" />
            <span>{c}</span>
          </li>
        ))
      : children}
  </ul>
);

const Flow = ({ steps }: { steps: { cmd: string; note: string }[] }) => (
  <ol className="panel divide-y divide-line/60 overflow-hidden">
    {steps.map((s, i) => (
      <li key={i} className="flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-hull/40">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-gitorange/50 bg-gitorange/10 font-mono text-[10.5px] font-bold text-flare">
          {i + 1}
        </span>
        <div className="min-w-0">
          <code className="block break-all font-mono text-[12.5px] font-semibold text-chalkcyan">{s.cmd}</code>
          <p className="text-[12.5px] leading-snug text-fog">{s.note}</p>
        </div>
      </li>
    ))}
  </ol>
);

export const PROTOCOLS: SectionDef[] = [
  {
    id: "protocol-common",
    man: "gitprotocol-common",
    group: "protocols",
    title: "pkt-line — four hex digits rule everything",
    lede: "Every word on the wire is framed as a pkt-line: four ASCII hex digits of length — counting themselves — followed by the payload, usually LF-terminated. Three magic lengths carry control meaning.",
    keywords: ["pkt-line", "framing", "flush", "delim", "side-band", "0000"],
    body: (
      <div className="space-y-4">
        <ByteDiagram
          title="one pkt-line on the wire"
          caption="The length field is ASCII hex and includes its own four bytes — a 12-byte payload travels as 0010."
          rows={[
            {
              name: "length",
              segs: [
                {
                  label: "4 hex digits",
                  w: 1.5,
                  tone: "magic",
                  size: "4 B",
                  desc: "Total line length in ASCII hex, the four digits included. 65520 (0xFFF0) is the maximum.",
                },
              ],
            },
            {
              name: "payload",
              segs: [
                {
                  label: "bytes … usually ending LF",
                  w: 4,
                  tone: "var",
                  desc: "Arbitrary bytes. Text lines conventionally end with \\n; binary channels (side-band) need not.",
                },
              ],
            },
            {
              name: "control",
              segs: [
                { label: "0000 flush", w: 1.5, tone: "field", desc: "Ends a message group — e.g. closes the list of wants." },
                { label: "0001 delim", w: 1.5, tone: "cyan", desc: "Section separator introduced for protocol v2 requests." },
                { label: "0002 end", w: 1.5, tone: "cyan", desc: "response-end-pkt: terminates a complete v2 response." },
              ],
            },
          ]}
        />
        <FieldTable
          caption="side-band channels (side-band-64k)"
          head={["byte", "carries", "client does"]}
          rows={[
            ["<code>1</code>", "pack data", "writes it to the pack file"],
            ["<code>2</code>", "progress messages", "prints to stderr"],
            ["<code>3</code>", "fatal error", "aborts the transfer"],
          ]}
        />
        <HexSample
          title="a single framed line, counted out"
          lines={[
            { hex: "003c", note: "4 + 56 = 60 = 0x3c" },
            { text: "want 74730d410fcb6603ace96f1dc55ea6196122532d multi_ack", note: "55 bytes of command" },
            { text: "\\n", note: "trailing LF — payload is 5 + 40 + 10 + 1 = 56" },
          ]}
        />
        <PktLineLab />
        <Note>
          <span>
            <code>0003</code> is illegal — a length below 4 can't even cover the header. Only 0001 and 0002 are reserved there.
          </span>
          <span>
            Watch any conversation live with <code>GIT_TRACE_PACKET=1 git fetch</code> — frames print to stderr.
          </span>
        </Note>
      </div>
    ),
  },
  {
    id: "protocol-capabilities",
    man: "gitprotocol-capabilities",
    group: "protocols",
    title: "Capabilities — the v0 feature handshake",
    lede: "Protocol v0 negotiates features with tokens: the server lists its capabilities after a NUL on the first advertised ref line, and the client echoes a subset on its first `want`.",
    keywords: ["capabilities", "multi_ack", "side-band", "thin-pack", "agent", "v0", "advertisement"],
    body: (
      <div className="space-y-4">
        <HexSample
          title="ref advertisement, decoded"
          lines={[
            {
              text: "74730d410fcb6603ace96f1dc55ea6196122532d HEAD\\0multi_ack thin-pack side-band-64k agent=git/2.43",
              note: "first line: ref, NUL, then capabilities",
            },
            {
              text: "74730d410fcb6603ace96f1dc55ea6196122532d refs/heads/main",
              note: "later lines are plain refs — no caps",
            },
            {
              text: "0000000000000000000000000000000000000000 capabilities^{}",
              note: "empty repo: caps ride a pseudo-ref",
            },
            { hex: "0000", note: "flush ends the advertisement" },
          ]}
        />
        <FieldTable
          caption="the tokens you will actually see"
          head={["capability", "offered by", "what it enables"]}
          rows={[
            ["<code>multi_ack</code>", "upload-pack", "ACKs on common commits during negotiation"],
            ["<code>multi_ack_detailed</code>", "upload-pack", "<code>ACK &lt;oid&gt; common|ready</code> lines — fewer round-trips"],
            ["<code>side-band · side-band-64k</code>", "upload-pack", "multiplex pack data with progress and errors"],
            ["<code>thin-pack</code>", "upload-pack", "deltas against objects the client already has"],
            ["<code>ofs-delta</code>", "both", "allow OBJ_OFS_DELTA entries on the wire"],
            ["<code>shallow</code> (+ deepen-*)", "both", "partial-history clones: <code>deepen &lt;n&gt;</code>, <code>deepen-since</code>, <code>deepen-not</code>"],
            ["<code>agent=&lt;id&gt;</code>", "both", "implementation identifier — pure telemetry"],
            ["<code>report-status</code>", "receive-pack", "per-ref <code>ok</code>/<code>ng</code> results after a push"],
            ["<code>delete-refs</code>", "receive-pack", "allow ref deletions"],
            ["<code>atomic</code>", "receive-pack", "all-or-nothing pushes"],
            ["<code>push-options</code>", "receive-pack", "arbitrary <code>-o</code> options handed to server hooks"],
            ["<code>include-tag</code>", "upload-pack", "send annotated tags along with wanted objects"],
            ["<code>no-progress</code>", "upload-pack", "suppress side-band channel 2"],
            ["<code>symref=HEAD:refs/heads/main</code>", "upload-pack", "symbolic-ref targets inside the advertisement"],
            ["<code>filter</code>", "upload-pack", "partial-clone object filters"],
          ]}
        />
        <Note>
          <span>Order is not guaranteed, and unknown tokens must be ignored — that's how the list has grown for 15 years.</span>
          <span>
            The client may only use a capability the server advertised; servers may only rely on what the client echoed.
          </span>
          <span>Protocol v2 replaces this whole flood — capabilities become structured key=value lines.</span>
        </Note>
      </div>
    ),
  },
  {
    id: "protocol-http",
    man: "gitprotocol-http",
    group: "protocols",
    title: "Smart HTTP — stateless RPC",
    lede: "A GET discovers the service; each POST then carries an entire request. No session state survives between round-trips, which is exactly why it survives corporate proxies.",
    keywords: ["http", "smart", "dumb", "info/refs", "upload-pack", "proxy", "stateless"],
    body: (
      <div className="space-y-4">
        <Flow
          steps={[
            {
              cmd: "GET /repo/info/refs?service=git-upload-pack",
              note: "Discovery. Response Content-Type: application/x-git-upload-pack-advertisement; body is the service announcement, a flush, then the ref advertisement (v2 if asked for).",
            },
            {
              cmd: "Git-Protocol: version=2  (request header)",
              note: "Optional. Tells a capable server to answer with protocol v2 — on SSH and local transports this travels as the GIT_PROTOCOL environment variable instead.",
            },
            {
              cmd: "POST /repo/git-upload-pack",
              note: "The RPC. Content-Type …-request on the way in, …-result on the way out; the body is the client's wants/haves and the server's ACKs plus the pack.",
            },
          ]}
        />
        <HexSample
          title="discovery response body, decoded"
          lines={[
            { text: "001e# service=git-upload-pack", note: "4 + 26 = 30 = 0x1e" },
            { hex: "0000", note: "flush" },
            { text: "…advertisement (protocol-common, or v2 capability lines)…", note: "" },
          ]}
        />
        <div className="rounded-lg border border-dashed border-line2 bg-hull/30 px-4 py-3">
          <p className="text-[13px] leading-relaxed text-fog">
            <strong className="text-flare">Dumb HTTP, for the archaeologists:</strong> before smart HTTP, Git fetched plain
            files — <code>info/refs</code>, <code>objects/xx/yyyy…</code>, <code>objects/info/packs</code> — with ordinary GETs.
            You can still spot it: no <code>?service=</code> parameter, no pkt-lines, and painfully slow clones.
          </p>
        </div>
        <Note>
          <span>
            Stateless means every POST repeats the full <code>want</code>/<code>have</code> context — nothing is cached
            server-side.
          </span>
          <span>Large POST bodies occasionally trip proxies with small upload limits; that's an ops problem, not a protocol one.</span>
          <span>The same endpoints serve pushes, with <code>git-receive-pack</code> as the service name.</span>
        </Note>
      </div>
    ),
  },
  {
    id: "protocol-pack",
    man: "gitprotocol-pack",
    group: "protocols",
    title: "Pack protocol — negotiating who has what",
    lede: "Given an advertisement, the peers compute a minimal pack: the client states its wants, prunes them with haves, the server ACKs — and then the pack flows, usually interleaved with progress on side-band channels.",
    keywords: ["want", "have", "ack", "nak", "negotiation", "shallow", "push", "receive-pack"],
    body: (
      <div className="space-y-4">
        <Flow
          steps={[
            {
              cmd: "want <oid> <capabilities>   (×N, then flush)",
              note: "The client's shopping list. Only the first want line carries the echoed capability tokens.",
            },
            {
              cmd: "shallow <oid> · deepen <n> · deepen-since <ts> · deepen-not <ref>",
              note: "Optional partial-history requests, each block closed by a flush.",
            },
            {
              cmd: "have <oid>   (×N, then flush, then done)",
              note: "“I already have these” — the server uses them to find the cut point and skip sending ancestry.",
            },
            {
              cmd: "NAK  /  ACK <oid> [continue|common|ready]   →   pack data",
              note: "The server answers, then streams the packfile — typically multiplexed on side-band-64k channels 1/2/3.",
            },
          ]}
        />
        <FieldTable
          caption="the multi_ack family"
          head={["flavour", "behaviour", "why it matters"]}
          rows={[
            ["plain", "one final <code>ACK</code> after <code>done</code>", "simplest; a round-trip per negotiation step"],
            ["<code>multi_ack</code>", "ACKs on common commits during the have phase", "server can stop early"],
            [
              "<code>multi_ack_detailed</code>",
              "<code>ACK &lt;oid&gt; common</code> and <code>ACK &lt;oid&gt; ready</code> lines",
              "client knows exactly when to stop — the default on big servers",
            ],
          ]}
        />
        <div className="rounded-lg border border-dashed border-line2 bg-hull/30 px-4 py-3">
          <p className="text-[13px] leading-relaxed text-fog">
            <strong className="text-flare">Pushes mirror this</strong> over <code>receive-pack</code>: the client sends ref
            updates as <code>&lt;old-oid&gt; &lt;new-oid&gt; &lt;refname&gt;</code> lines (capabilities after the first NUL),
            then the pack. With <code>report-status</code> the server answers <code>unpack ok</code> plus one{" "}
            <code>ok &lt;ref&gt;</code> or <code>ng &lt;ref&gt; &lt;reason&gt;</code> per ref.
          </p>
        </div>
        <Note>
          <span>
            Negotiation is the expensive part of big clones — <code>--negotiation-tip</code>, the commit-graph, and
            partial-clone filters all exist to shrink it.
          </span>
          <span>
            A <code>done</code> is not required when the client still expects more ACKs — that's the whole point of{" "}
            <code>multi_ack_detailed</code> + <code>no-done</code>.
          </span>
        </Note>
      </div>
    ),
  },
  {
    id: "protocol-v2",
    man: "gitprotocol-v2",
    group: "protocols",
    title: "Protocol v2 — commands, not capability soup",
    lede: "Git 2.18 replaced v0's ref flood with an explicit capability list and sub-commands — and negotiates the protocol version itself, in-band, before anything else happens.",
    keywords: ["v2", "version 2", "ls-refs", "fetch", "command", "GIT_PROTOCOL", "ref-prefix"],
    body: (
      <div className="space-y-4">
        <ByteDiagram
          title="the v2 handshake, both directions"
          caption="If the server doesn't understand v2 it simply never sends the `version 2` line — and answers in v0."
          rows={[
            {
              name: "client",
              segs: [
                {
                  label: "GIT_PROTOCOL=version=2",
                  w: 3,
                  tone: "var",
                  desc: "Environment variable over SSH/local; a Git-Protocol HTTP header over smart HTTP.",
                },
              ],
            },
            {
              name: "server",
              segs: [
                { label: "version 2", w: 1.5, tone: "magic", desc: "First pkt-line, only if v2 is supported." },
                { label: "ls-refs", w: 1.2, tone: "cyan", desc: "Capability line: list and filter refs." },
                { label: "fetch", w: 1, tone: "cyan", desc: "Capability line: the fetch command and its features." },
                { label: "server-option", w: 1.6, tone: "cyan", desc: "Capability line: accept arbitrary -o options." },
                { label: "0000", w: 0.9, tone: "field", desc: "Flush ends the capability advertisement." },
              ],
            },
            {
              name: "request",
              segs: [
                { label: "command=ls-refs", w: 2.2, tone: "var", desc: "Names the sub-command for this round-trip." },
                { label: "agent=git", w: 1.4, tone: "var", desc: "Capability arguments as key=value lines." },
                { label: "0001 delim", w: 1.3, tone: "field", desc: "delim-pkt separates capabilities from command arguments." },
                { label: "arguments …", w: 1.8, tone: "var", desc: "Command-specific lines: peel, symrefs, ref-prefix HEAD…" },
                { label: "0000", w: 0.9, tone: "field", desc: "Flush ends the arguments; the response follows." },
              ],
            },
          ]}
        />
        <HexSample
          title="a real ls-refs request, frame by frame"
          lines={[
            { hex: "0014", note: "command line: 4 + 16 = 20" },
            { text: "command=ls-refs\\n" },
            { hex: "000e", note: "capability arg: 4 + 10 = 14" },
            { text: "agent=git\\n" },
            { hex: "0001", note: "delim-pkt — capabilities done" },
            { hex: "0009", note: "argument: 4 + 5 = 9" },
            { text: "peel\\n" },
            { hex: "000c", note: "4 + 8 = 12" },
            { text: "symrefs\\n" },
            { hex: "0014", note: "4 + 16 = 20" },
            { text: "ref-prefix HEAD\\n" },
            { hex: "001b", note: "4 + 23 = 27" },
            { text: "ref-prefix refs/heads/\\n" },
            { hex: "0000", note: "flush — server now answers with matching refs only" },
          ]}
        />
        <FieldTable
          caption="v0 → v2, side by side"
          head={["aspect", "protocol v0", "protocol v2"]}
          rows={[
            ["advertisement", "every ref, caps after a NUL on line one", "capability list; <code>ls-refs</code> with <code>ref-prefix</code> filters"],
            ["features", "opaque tokens", "key=value lines, cleanly extensible"],
            ["versioning", "assumed", "negotiated: the <code>version 2</code> pkt-line"],
            ["HTTP", "stateless RPC", "same RPC, plus the <code>Git-Protocol</code> header"],
            ["default since", "—", "Git 2.26 (<code>protocol.version = 2</code>)"],
          ]}
        />
        <Note>
          <span>
            Servers may advertise capabilities a client has never heard of — unknown ones are ignored, so the format can grow
            without breaking anyone.
          </span>
          <span>
            <code>ref-prefix</code> is why fetching from a repo with 200k refs no longer downloads all 200k advertisements.
          </span>
          <span>
            <code>GIT_TRACE_PACKET=1</code> shows every frame; <code>GIT_TRACE2_PERF=1</code> times each command.
          </span>
        </Note>
      </div>
    ),
  },
];
