import type { ReactNode } from "react";
import ByteDiagram from "../components/ByteDiagram";
import HexSample from "../components/HexSample";
import FieldTable from "../components/FieldTable";
import PackDecoder from "../components/PackDecoder";

export interface SectionDef {
  id: string;
  man: string;
  group: "formats" | "protocols";
  title: string;
  lede: string;
  keywords: string[];
  body: ReactNode;
}

const Note = ({ children }: { children: ReactNode }) => (
  <ul className="prose space-y-1.5 text-[14px] text-fog">
    {Array.isArray(children)
      ? children.map((c, i) => (
          <li key={i} className="flex gap-2.5">
            <span className="mt-[9px] h-[5px] w-[5px] shrink-0 rounded-[1.5px] bg-gitorange/80" />
            <span>{c}</span>
          </li>
        ))
      : children}
  </ul>
);

export const FORMATS: SectionDef[] = [
  {
    id: "format-bundle",
    man: "gitformat-bundle",
    group: "formats",
    title: "Bundle — a repository in one file",
    lede: "git bundle folds a set of refs and every object they need into a single portable file — a push or pull over a USB stick, an e-mail attachment, or an air-gapped network.",
    keywords: ["bundle", "v2", "v3", "prereq", "portable", "offline"],
    body: (
      <div className="space-y-4">
        <ByteDiagram
          title="anatomy of a .bundle file"
          caption="Headers are plain text lines; everything after the blank line is a normal packfile."
          rows={[
            {
              name: "magic",
              segs: [
                {
                  label: "# v2 git bundle\\n",
                  w: 3,
                  tone: "magic",
                  desc: "ASCII magic line. Bundles written by Git 2.41+ read “# v3 git bundle” and may carry capability headers.",
                },
              ],
            },
            {
              name: "caps (v3)",
              segs: [
                { label: "object-format=sha1", w: 2, tone: "var", desc: "v3 only: declares the hash algorithm used for the object IDs in this bundle." },
                { label: "filter=blob:none", w: 2, tone: "var", desc: "v3 only: records that the bundle was made from a partial clone." },
              ],
            },
            {
              name: "prereqs",
              segs: [
                {
                  label: "-<oid> <name>",
                  w: 2,
                  tone: "var",
                  desc: "A prerequisite: a commit the receiving repository must already have. The leading minus sign marks it.",
                },
              ],
            },
            {
              name: "refs",
              segs: [
                {
                  label: "<oid> <refname>",
                  w: 2,
                  tone: "var",
                  desc: "One line per bundled ref — e.g. HEAD, refs/heads/main, refs/tags/v1.0.",
                },
              ],
            },
            {
              name: "blank",
              segs: [{ label: "\\n", w: 1, tone: "field", size: "1 B", desc: "A single newline terminates the header block." }],
            },
            {
              name: "pack",
              segs: [
                {
                  label: "packfile",
                  w: 4,
                  tone: "cyan",
                  desc: "An ordinary packfile (see gitformat-pack) — which is why bundles can be streamed and piped.",
                },
              ],
            },
          ]}
        />
        <FieldTable
          caption="bundle versions"
          head={["version", "layout", "introduced"]}
          rows={[
            ["<code>v2</code>", "Magic line, header lines, pack — the classic layout", "Git 1.5.3"],
            ["<code>v3</code>", "Adds capability headers <code>object-format</code> and <code>filter</code>", "Git 2.41"],
          ]}
        />
        <Note>
          <span>
            <code>git bundle verify repo.bundle</code> checks that all prerequisites are present locally before you pull.
          </span>
          <span>
            You can <code>git clone repo.bundle</code> directly — Git treats it like a remote.
          </span>
          <span>
            Prerequisites let bundles stay small: <code>git bundle create</code> only packs objects the other side is missing.
          </span>
        </Note>
      </div>
    ),
  },
  {
    id: "format-chunk",
    man: "gitformat-chunk",
    group: "formats",
    title: "Chunk format — the shared skeleton",
    lede: "Git's newer binary files — commit-graph and multi-pack-index — share one layout: a format-specific header, a table of 12-byte chunk entries, then the chunk bodies.",
    keywords: ["chunk", "table", "commit-graph", "multi-pack-index", "4cc"],
    body: (
      <div className="space-y-4">
        <ByteDiagram
          title="generic chunked file"
          caption="Chunk IDs are four printable ASCII bytes — deliberately human-readable."
          rows={[
            {
              name: "header",
              segs: [
                {
                  label: "format header",
                  w: 2,
                  tone: "var",
                  desc: "Magic bytes, a version byte, flags. Shape differs per format — see each format's own page.",
                },
              ],
            },
            {
              name: "entry ×N",
              segs: [
                { label: "chunk ID", w: 2, tone: "field", size: "4 B", desc: "Four ASCII bytes naming the chunk: OIDF, CDAT, BLOOM…" },
                {
                  label: "offset",
                  w: 2,
                  tone: "cyan",
                  size: "8 B",
                  desc: "Big-endian offset from the start of the file to this chunk's body.",
                },
              ],
            },
            {
              name: "terminator",
              segs: [
                { label: "\\0\\0\\0\\0", w: 1.5, tone: "field", size: "4 B", desc: "A zero ID ends the table." },
                {
                  label: "file size",
                  w: 2,
                  tone: "field",
                  size: "8 B",
                  desc: "The terminator's offset field doubles as the total file size.",
                },
              ],
            },
            {
              name: "bodies",
              segs: [
                {
                  label: "chunk data …",
                  w: 4,
                  tone: "hash",
                  desc: "Bodies follow, usually laid out in table order. Alignment is not guaranteed — always seek by offset.",
                },
              ],
            },
          ]}
        />
        <FieldTable
          caption="chunks you will meet"
          head={["id", "lives in", "contents"]}
          rows={[
            ["<code>OIDF</code>", "commit-graph · MIDX", "Sorted object IDs (the commit-graph also packs a fanout inside)"],
            ["<code>CDAT</code>", "commit-graph", "Per-commit data: tree, parents, generation number, commit date"],
            ["<code>EDAT</code>", "commit-graph", "Extra parent edges for octopus merges; high bit = continuation"],
            ["<code>BIDX</code>", "commit-graph", "256 × 4-byte fanout over the first OID byte"],
            ["<code>BLOOM</code>", "commit-graph", "Changed-paths bloom filters powering fast <code>log -S</code>"],
            ["<code>MIDX</code>", "multi-pack-index", "Header chunk: hash version, fanout count, object &amp; pack counts"],
            ["<code>OIDL · OOFF · LIDX</code>", "multi-pack-index", "OID lookup, per-object pack+offset pairs, large-offset index"],
            ["<code>RIDX · BTMP</code>", "multi-pack-index", "Reverse index and bitmap positions, when present"],
          ]}
        />
        <Note>
          <span>Offsets are absolute — measured from byte zero of the file, not from the end of the table.</span>
          <span>Both consumers end the file with a trailing hash that authenticates everything before it.</span>
          <span>Readers ignore chunks they don't know; writers should leave unfamiliar chunks untouched.</span>
        </Note>
      </div>
    ),
  },
  {
    id: "format-commit-graph",
    man: "gitformat-commit-graph",
    group: "formats",
    title: "Commit-graph — the precomputed DAG",
    lede: "A cache of your history's shape, so `log --graph`, `merge-base` and `blame` never have to open and parse every commit object again.",
    keywords: ["commit-graph", "generation", "bloom", "CGPH", "cdat", "log graph"],
    body: (
      <div className="space-y-4">
        <ByteDiagram
          title="commit-graph file (v1)"
          caption="Stored in .git/objects/info/commit-graphs/ — rebuild it with `git commit-graph write`."
          rows={[
            {
              name: "magic",
              segs: [{ label: "CGPH", w: 2, tone: "magic", size: "4 B", desc: "The letters C-G-P-H, in ASCII." }],
            },
            {
              name: "header",
              segs: [
                { label: "version 01", w: 1.2, tone: "field", size: "1 B", desc: "Format version — 1 is the only one that exists." },
                { label: "hash 01|02", w: 1.2, tone: "field", size: "1 B", desc: "1 = SHA-1 repository, 2 = SHA-256." },
                { label: "bases 01", w: 1.2, tone: "field", size: "1 B", desc: "Number of base graphs this file chains onto (split graphs)." },
              ],
            },
            {
              name: "chunks",
              segs: [
                { label: "OIDF", w: 1.2, tone: "cyan", desc: "All commit OIDs, sorted, plus an embedded fanout." },
                { label: "CDAT", w: 1.2, tone: "cyan", desc: "The commit data array — one 20-byte record per commit." },
                { label: "EDAT", w: 1, tone: "cyan", desc: "Overflow edges for merges with more than two parents." },
                { label: "BLOOM", w: 1.4, tone: "cyan", desc: "Changed-paths bloom filters, optional but very useful." },
              ],
            },
            {
              name: "trailer",
              segs: [{ label: "hash", w: 2, tone: "hash", desc: "Hash of every preceding byte." }],
            },
          ]}
        />
        <FieldTable
          caption="inside CDAT — one 20-byte record per commit"
          head={["field", "size", "meaning"]}
          rows={[
            ["tree position", "4 B", "Index into <code>OIDF</code> of the commit's tree OID"],
            ["parent 1 · parent 2", "4 B each", "Positions in <code>OIDF</code>; <code>0x7fffffff</code> means absent"],
            ["generation + date", "8 B", "Generation number in the high bits, commit timestamp in the low 34"],
          ]}
        />
        <Note>
          <span>Generation numbers answer "is A an ancestor of B?" in O(1) — most history queries stop after two comparisons.</span>
          <span>
            The <code>BLOOM</code> chunk lets <code>log --changed-paths</code> skip tree diffs entirely for commits that can't
            touch your path.
          </span>
          <span>Split graphs (<code>--split</code>) append small incremental files instead of rewriting the whole cache.</span>
        </Note>
      </div>
    ),
  },
  {
    id: "format-index",
    man: "gitformat-index",
    group: "formats",
    title: "Index — the staging area on disk",
    lede: "`.git/index` is a header, one entry per staged path, a stack of optional extensions, and a checksum — rewritten on nearly every `git add`.",
    keywords: ["index", "staging", "DIRC", "cache tree", "extensions", "split index"],
    body: (
      <div className="space-y-4">
        <ByteDiagram
          title=".git/index header + entry"
          caption="Version 4 compresses path names and drops the NUL padding — smaller, but no longer mmap-friendly."
          rows={[
            {
              name: "header",
              segs: [
                { label: "DIRC", w: 1.5, tone: "magic", size: "4 B", desc: "ASCII “DIRC” — directory cache." },
                { label: "version 2|3|4", w: 1.8, tone: "field", size: "4 B", desc: "2 = classic, 3 = extended flags, 4 = path-compressed." },
                { label: "entries N", w: 1.5, tone: "cyan", size: "4 B", desc: "How many entries follow, big-endian." },
              ],
            },
            {
              name: "times",
              segs: [
                { label: "ctime", w: 1.5, tone: "field", size: "8 B", desc: "Seconds + nanoseconds. Compared against stat() to spot edits." },
                { label: "mtime", w: 1.5, tone: "field", size: "8 B", desc: "Modified time, same shape — the racily-clean detection hinges on it." },
              ],
            },
            {
              name: "stat",
              segs: [
                { label: "dev · ino", w: 1.6, tone: "field", size: "8 B", desc: "Raw stat fields, kept so Git can trust them." },
                { label: "mode", w: 1, tone: "field", size: "4 B", desc: "0o100644 or 0o100755 (0o120000 for symlinks)." },
                { label: "uid · gid", w: 1.6, tone: "field", size: "8 B", desc: "Owner fields from stat." },
                { label: "size", w: 1, tone: "field", size: "4 B", desc: "File size in bytes." },
              ],
            },
            {
              name: "content",
              segs: [
                { label: "OID", w: 2, tone: "cyan", size: "20 B*", desc: "Object ID of the staged blob — 32 bytes in a SHA-256 repo." },
                { label: "flags", w: 1.4, tone: "field", size: "4 B", desc: "assume-valid bit, merge stage bits 12–13, name length (capped 0xFFF)." },
                { label: "name + pad", w: 2.2, tone: "var", desc: "NUL-padded so the entry length is a multiple of 8 (v2/v3). v4 varint-compresses shared path prefixes instead." },
              ],
            },
            {
              name: "tail",
              segs: [
                { label: "extensions …", w: 3, tone: "var", desc: "Optional 4CC-tagged blocks: TREE, REUC, link, untr, FSMN, EOIE, IEOT…" },
                { label: "checksum", w: 2, tone: "hash", desc: "Hash over everything before it — a corrupt index is refused, not repaired." },
              ],
            },
          ]}
        />
        <FieldTable
          caption="well-known extensions"
          head={["sig", "name", "what it stores"]}
          rows={[
            ["<code>TREE</code>", "cache tree", "Tree OIDs for directories that already match a commit"],
            ["<code>REUC</code>", "resolve undo", "Staged blobs you can recover after resolving a conflict"],
            ["<code>link</code>", "split index", "A shared read-only base index plus a small mutable overlay"],
            ["<code>untr</code>", "untracked cache", "Directories proven to contain nothing tracked"],
            ["<code>FSMN</code>", "fsmonitor", "Cookie for the file-watcher daemon"],
            ["<code>EOIE · IEOT</code>", "offset tables", "Let large indexes be parsed in parallel"],
          ]}
        />
        <Note>
          <span>
            Uppercase signatures are <strong>mandatory to preserve</strong>: a writer that doesn't understand{" "}
            <code>TREE</code> must still copy it. Lowercase ones may be dropped.
          </span>
          <span>The merge stage lives in the flags — that's how conflict entries (stages 1–3) coexist for one path.</span>
        </Note>
      </div>
    ),
  },
  {
    id: "format-pack",
    man: "gitformat-pack",
    group: "formats",
    title: "Packfiles — how Git really stores objects",
    lede: "Loose objects are the exception. Nearly everything lives in packfiles: zlib-compressed, delta-chained, indexed by a companion `.idx`, and sealed with a trailing hash.",
    keywords: ["pack", "packfile", "idx", "delta", "ofs_delta", "ref_delta", "zlib", "PACK"],
    body: (
      <div className="space-y-4">
        <ByteDiagram
          title=".pack layout"
          caption="Entries are variable-length; the only fixed landmarks are the 12-byte header and the trailing hash."
          rows={[
            {
              name: "header",
              segs: [
                { label: "PACK", w: 1.5, tone: "magic", size: "4 B", desc: "The ASCII letters PACK." },
                { label: "version 2|3", w: 1.2, tone: "field", size: "4 B", desc: "Big-endian; 2 and 3 are the known versions." },
                { label: "count", w: 1.2, tone: "cyan", size: "4 B", desc: "Number of entries in this pack." },
              ],
            },
            {
              name: "entry hdr",
              segs: [
                {
                  label: "type+size varint",
                  w: 2.5,
                  tone: "cyan",
                  desc: "First byte: MSB = “more size bytes follow”, next 3 bits = object type, low 4 = size; later bytes extend the size, 7 bits each.",
                },
              ],
            },
            {
              name: "delta info",
              segs: [
                {
                  label: "OFS: negative-offset varint",
                  w: 2.5,
                  tone: "var",
                  desc: "For OBJ_OFS_DELTA — distance back to the base object, inside this same pack.",
                },
                {
                  label: "REF: base OID",
                  w: 2.5,
                  tone: "var",
                  desc: "For OBJ_REF_DELTA — the base's full object ID; used by thin packs and bundles.",
                },
              ],
            },
            {
              name: "payload",
              segs: [
                {
                  label: "zlib stream",
                  w: 4,
                  tone: "hash",
                  desc: "Deflated bytes: the whole object, or a delta to be applied on top of the base.",
                },
              ],
            },
            {
              name: "trailer",
              segs: [
                {
                  label: "hash",
                  w: 2,
                  tone: "hash",
                  desc: "Hash of everything before it — the pack's name (pack-<hash>.pack) comes from here.",
                },
              ],
            },
          ]}
        />
        <FieldTable
          caption="object types in the 3-bit type field"
          head={["value", "name", "notes"]}
          rows={[
            ["<code>1</code>", "OBJ_COMMIT", ""],
            ["<code>2</code>", "OBJ_TREE", ""],
            ["<code>3</code>", "OBJ_BLOB", "the usual delta fodder"],
            ["<code>4</code>", "OBJ_TAG", "annotated tag object"],
            ["<code>6</code>", "OBJ_OFS_DELTA", "base addressed by negative offset — the common case"],
            ["<code>7</code>", "OBJ_REF_DELTA", "base addressed by OID — thin packs, bundles"],
          ]}
        />
        <ByteDiagram
          title=".idx v2 — the lookup table"
          caption="Binary search on sorted OIDs turns a name into a pack offset in ~log₂(n) steps."
          rows={[
            {
              name: "header",
              segs: [
                { label: "ff 74 4f 63", w: 1.5, tone: "magic", size: "4 B", desc: "idx v2+ magic, printable as \\377tOc. v1 files skip straight to the fanout." },
                { label: "version 02", w: 1.2, tone: "field", size: "4 B", desc: "Always 2 for this layout." },
              ],
            },
            {
              name: "fanout",
              segs: [
                {
                  label: "fanout[256]",
                  w: 3,
                  tone: "cyan",
                  size: "256 × 4 B",
                  desc: "Cell N = count of objects whose first OID byte is ≤ N. The last cell is the total object count.",
                },
              ],
            },
            {
              name: "tables",
              segs: [
                { label: "sorted OIDs", w: 2.2, tone: "hash", desc: "All object IDs in ascending order." },
                { label: "CRC-32s", w: 1.6, tone: "field", desc: "One per object, over its bytes in the pack." },
                {
                  label: "offsets",
                  w: 2,
                  tone: "field",
                  size: "4 B each",
                  desc: "Pack offsets; high bit set means “look me up in the 64-bit table”.",
                },
                { label: "64-bit offsets", w: 1.6, tone: "var", desc: "Only present for packs larger than 2 GiB." },
              ],
            },
            {
              name: "trailer",
              segs: [
                { label: "pack hash", w: 1.8, tone: "hash", desc: "Copied from the pack's trailer." },
                { label: "idx hash", w: 1.8, tone: "hash", desc: "Hash of the index itself." },
              ],
            },
          ]}
        />
        <PackDecoder />
        <Note>
          <span>
            <code>git verify-pack -v</code> lists every entry with its type, size, delta depth and offset.
          </span>
          <span>
            <code>git repack</code> recomputes delta chains — depth and window control the size/CPU trade-off.
          </span>
          <span>Packs are immutable: any mutation invalidates the trailing hash, so Git never edits one in place.</span>
        </Note>
      </div>
    ),
  },
  {
    id: "format-signature",
    man: "gitformat-signature",
    group: "formats",
    title: "Signatures — signed objects",
    lede: "A signature is not a sidecar file: it is embedded in the object's own bytes, and it covers everything except itself — which is exactly what gets verified.",
    keywords: ["gpg", "ssh", "sign", "signature", "gpgsig", "verify", "x509"],
    body: (
      <div className="space-y-4">
        <HexSample
          title="a signed commit, as stored"
          lines={[
            { text: "tree 4b825dc642cb6eb9a060e54bf8d69288fbee4904" },
            { text: "author A. U. Thor <author@example.com> 1700000000 +0000" },
            { text: "committer C. O. Mitter <committer@example.com> 1700000000 +0000" },
            { text: "gpgsig -----BEGIN PGP SIGNATURE-----", note: "header opens the embedded signature" },
            { text: " iQIzBAABCAAdFiEEq8sKf3…", note: "continuation lines begin with one space" },
            { text: " -----END PGP SIGNATURE-----" },
            { text: "" },
            { text: "a signed commit message" },
          ]}
        />
        <FieldTable
          caption="supported signature formats"
          head={["format", "armor marker", "keys come from"]}
          rows={[
            ["OpenPGP", "<code>BEGIN PGP SIGNATURE</code>", "<code>gpg --list-secret-keys</code>"],
            ["SSH", "<code>BEGIN SSH SIGNATURE</code>", "<code>~/.config/git/allowed_signers</code>, with <code>gpg.format = ssh</code>"],
            ["X.509", "S/MIME envelope", "<code>gpg.format = x509</code>, <code>gpg.x509.program</code>"],
          ]}
        />
        <Note>
          <span>
            Commits carry the signature in the <code>gpgsig</code> header; tags append it after the message, covering the whole
            tag body.
          </span>
          <span>
            Verify with <code>git verify-commit</code>, <code>git verify-tag</code>, or <code>log --show-signature</code>.
          </span>
          <span>
            Sign everything with <code>commit.gpgSign = true</code> and <code>tag.forceSignAnnotated = true</code>.
          </span>
        </Note>
      </div>
    ),
  },
];
