
# Codecram

Compile any local folder into a single, well-set reference for language
models — read entirely in your browser. Nothing is ever uploaded.

Codecram solves the same problem as [gitingest](https://gitingest.com), but
for the far more common case: the code you want to paste into an LLM is
sitting on your own disk, not in a public GitHub repo. No `git init`, no
pushing a branch just to summarize it — drop the folder in and it's read
locally in that tab.

## Why local-only matters

There's no backend. Your code is read using the browser's local file APIs,
tokenized in memory, and turned into a digest — all without a single network
request carrying your files anywhere. That's not just a privacy nicety, it's
the actual architecture: for a private client repo, an uncommitted branch, or
coursework you don't want leaving your machine, there's nothing to configure
or trust — there's simply no server to send it to.

## Features

- **Drag-and-drop or folder picker** — reads a real directory tree via
  `webkitdirectory` or the drag-and-drop `FileSystemEntry` API.
- **Sensible default exclusions** — `node_modules`, `.git`, build output,
  lockfiles, and binary formats (images, fonts, PDFs, archives) are
  pre-excluded, and directories like `node_modules` are skipped during the
  filesystem walk itself rather than filtered out after being read, so large
  projects don't freeze the tab.
- **Your `.gitignore`, respected** — auto-detected and applied on top of the
  defaults.
- **Live token estimate** — every eligible file is tokenized once on load
  (via `gpt-tokenizer`), so toggling files afterward is an instant sum, not a
  re-read.
- **Full control over what's included** — an interactive checkbox tree with
  folder-level toggling, a max-file-size limit, and a search box.
- **Copy or download** the finished digest as a single text file.

## Tech stack

- [Next.js](https://nextjs.org) (App Router) + [React](https://react.dev) +
  TypeScript
- [Tailwind CSS](https://tailwindcss.com) for styling
- [`ignore`](https://www.npmjs.com/package/ignore) for real `.gitignore`
  pattern matching
- [`gpt-tokenizer`](https://www.npmjs.com/package/gpt-tokenizer) for token
  counting
- [Vitest](https://vitest.dev) for unit tests

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), drop a folder onto the
page (or click to pick one), select what you want included, and generate a
digest.

## Scripts

| Command                | Description                  |
| ---------------------- | ---------------------------- |
| `npm run dev`        | Start the development server |
| `npm run build`      | Production build             |
| `npm run start`      | Serve the production build   |
| `npm run lint`       | Run Next.js's linter         |
| `npm run test`       | Run the test suite once      |
| `npm run test:watch` | Run tests in watch mode      |

## Project structure

```
app/                  Next.js App Router pages and layout
components/           React components (Dropzone, FileTree, IngestTool, OutputPanel)
lib/                  Core logic — folder walking, tree building, ignore matching,
                       token counting/caching, digest generation
tests/                Vitest unit tests, mirroring the lib/ modules
```

The core pipeline lives entirely in `lib/`:

1. `entries.ts` walks the picked/dropped folder into a flat file list,
   skipping known-junk directories during the walk itself.
2. `buildTree.ts` nests that flat list into the tree the UI renders, caching
   each folder's descendant paths so toggling a folder is O(children), not a
   full re-walk.
3. `ignoreMatcher.ts` layers the built-in default-ignore patterns with the
   folder's own `.gitignore`, using real gitignore syntax.
4. `tokenCache.ts` precomputes a token count per eligible file once, so the
   live estimate is just a lookup.
5. `digest.ts` reads the final included files, renders a directory tree, and
   concatenates everything into the final digest text.

## Testing

```bash
npm run test
```

Tests cover tree building, binary-file detection (including MIME-type
fallback for extensions not on the hardcoded list), ignore-pattern matching,
token counting, and formatting helpers.

## Deployment

Codecram has no backend and no environment variables to configure, which
makes it a straightforward static/SSR deploy on [Vercel](https://vercel.com):
connect the GitHub repo, let Vercel auto-detect Next.js, and deploy. See
`CODECRAM_REDESIGN_BRIEF.md` for the current design direction if you're
picking up UI work.

## Privacy

Nothing about a loaded folder — file names, paths, or contents — is ever
sent to a server. Everything happens in the browser tab you're using.

## License

Add your chosen license here before publishing (e.g. MIT).
