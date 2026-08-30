# Code-cram

Compile any local folder into a single, well-set reference for language
models. This reads your folder **entirely in the browser**. Nothing is ever uploaded anywhere.

## Run it

```bash
npm install
npm run dev
```

Open `http://localhost:3000`, drop a folder onto the page (or click to pick
one), select what you want, and generate a digest.

## Design

Built around Swiss International Typographic Style, laid out as a Bento
grid — chosen because Swiss design wasn't invented as decoration, it was
invented for information systems (transit timetables, signage), which is
exactly the kind of thing a file tree + token counts is. Bento gives that
grid discipline a natural way to organize the tool's distinct zones (stats,
index, controls, output) as clean modular blocks.

- **Palette:** `ink` (#111110), `paper` (#F5F4EF), `signal` (#D2361C, the one
  accent — classic Swiss poster red), `dim` (#767672). Zero border-radius
  anywhere, on purpose — hairline black rules are the only dividers.
- **Type:** [Switzer](https://www.fontshare.com/fonts/switzer) (Fontshare /
  Indian Type Foundry) for UI text, IBM Plex Mono for paths/code/data.
  Switzer was picked over a Google Font specifically because it's built in
  the Suisse Int'l / Neue Haas Grotesk lineage — the actual typographic
  tradition Swiss design comes from — free for commercial use. (If this
  project ever needs the literal typeface Stripe/Linear use, that's
  [Söhne](https://klim.co.nz/retail-fonts/sohne/) from Klim Type Foundry,
  paid.) Switzer is loaded via Fontshare's CDN (`<link>` in `app/layout.tsx`)
  rather than self-hosted — their license doesn't permit redistributing the
  font files without written consent, so the CDN link is the correct
  approach, not a shortcut.
- **Checkboxes** are drawn as filled ink squares with a paper checkmark
  (`.mark` in `globals.css`), not native browser checkboxes with an
  accent-color fill.
- **Tabular alignment** — filenames flush left, token counts flush right —
  instead of decorative dot leaders, since Swiss information design aligns
  data with grid columns, not typographic devices.

## How it works

- **Reading the folder** (`lib/entries.ts`) — supports both the folder
  picker (`<input webkitdirectory>`) and drag-and-drop of a real folder,
  recursively walking `FileSystemDirectoryEntry` (`readEntries()` only
  returns up to 100 items per call, so it loops).
- **Building the tree** (`lib/buildTree.ts`) — nests the flat file list and
  caches every descendant file path (`leafPaths`) on each folder node, so
  toggling a folder's checkbox is O(children), not a full re-walk.
- **Default exclusions** (`lib/defaultIgnore.ts`, `lib/ignoreMatcher.ts`) —
  common junk (`.git`, `node_modules`, lockfiles, and yes, images/PDFs — see
  below) is pre-excluded using real `.gitignore` syntax via the `ignore` npm
  package. The folder's own `.gitignore` is auto-detected and applied too.
- **Live token estimate** (`lib/tokenCache.ts`) — every eligible file is
  read and tokenized once when the folder loads, so toggling checkboxes
  afterward just sums a precomputed map instead of re-reading files.
- **Generating the digest** (`lib/digest.ts`) — reads each included file,
  renders a real `tree`-style ASCII directory listing, concatenates
  everything with `FILE:` headers, and yields to the main thread every few
  files so a large folder doesn't freeze the tab.

## What happens with images, PDFs, and other binary files?

Short answer: they're excluded twice over, and the digest never contains
their raw bytes.

1. **Pre-selection.** `DEFAULT_IGNORE_PATTERNS` already lists the common
   image/PDF extensions (`.png .jpg .jpeg .gif .webp .svg .ico .pdf`, etc.),
   so these show up struck-through and unchecked in the tree from the
   moment a folder loads — before you've touched anything.
2. **Safety net at generation time.** Even if you manually re-check one, or
   it's a format not covered by the default-ignore list, `looksBinary()` in
   `lib/digest.ts` catches it a second way: first by extension (a much
   longer list than the default-ignore one — includes `.heic`, `.avif`,
   `.bmp`, `.tiff`, `.mp3`, `.wasm`, and more), and then by the browser's
   own MIME-type detection (`file.type`) as a fallback for anything the
   extension list still misses. If either check matches, the file is added
   to `digest.skipped` with reason `"binary"` and its bytes are never read
   as text.

**The gap this closes:** the original version only checked a short,
hardcoded extension list. A photo in a format that list didn't cover (say,
`.heic` from an iPhone) would slip through both checks, get its raw bytes
decoded as UTF-8 "text" (mostly garbage/replacement characters), and that
garbage would land in the actual digest output — and get counted toward the
token estimate. The MIME-type fallback closes that gap: it doesn't matter
whether an extension is on the list, if the browser reports it as
`image/*`, `video/*`, `audio/*`, or `application/pdf`, it's treated as
binary. `tests/digest.test.ts` has a regression test for exactly this case.

One real edge that's still open: a binary file with *no* recognizable
extension *and* a generic MIME type (`application/octet-stream` is caught;
some obscure formats report nothing useful at all) could still slip
through. There's no fully general fix for that short of sniffing file
contents (checking for null bytes / non-UTF-8 sequences), which isn't
implemented yet — see Roadmap
