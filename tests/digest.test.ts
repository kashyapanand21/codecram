import { describe, it, expect } from 'vitest';
import { looksBinary, generateDigest } from '../lib/digest';
import type { FileEntry } from '../lib/types';

function entry(path: string, content: string, type = ''): FileEntry {
  return { path, file: new File([content], path.split('/').pop()!, { type }) };
}

describe('looksBinary', () => {
  it('catches common binary extensions', () => {
    expect(looksBinary('photo.jpg')).toBe(true);
    expect(looksBinary('photo.jpeg')).toBe(true);
    expect(looksBinary('scan.pdf')).toBe(true);
    expect(looksBinary('icon.png')).toBe(true);
    expect(looksBinary('archive.zip')).toBe(true);
  });

  it('does not flag ordinary text/code files', () => {
    expect(looksBinary('index.ts')).toBe(false);
    expect(looksBinary('README.md')).toBe(false);
    expect(looksBinary('data.json')).toBe(false);
  });

  it('falls back to MIME type for extensions not in the hardcoded list', () => {
    // .heic isn't in BINARY_EXT, but a real browser reports it as image/heic —
    // this is the exact gap the extension-only version had.
    expect(looksBinary('photo.heic', 'image/heic')).toBe(true);
    expect(looksBinary('clip.mkv', 'video/x-matroska')).toBe(true);
    expect(looksBinary('unknownfile', 'application/octet-stream')).toBe(true);
  });

  it('does not false-positive on text MIME types', () => {
    expect(looksBinary('notes.txt', 'text/plain')).toBe(false);
  });
});

describe('generateDigest — binary handling', () => {
  it('skips images and PDFs by reason "binary", never dumping their bytes into the output', async () => {
    const entries = [
      entry('src/index.ts', 'export const x = 1;', 'text/typescript'),
      entry('assets/logo.png', 'not-real-png-bytes', 'image/png'),
      entry('docs/spec.pdf', '%PDF-1.4 fake', 'application/pdf'),
    ];
    const result = await generateDigest(entries, { maxFileSizeBytes: 1_000_000 });

    expect(result.skipped).toEqual(
      expect.arrayContaining([
        { path: 'assets/logo.png', reason: 'binary' },
        { path: 'docs/spec.pdf', reason: 'binary' },
      ])
    );
    expect(result.fileCount).toBe(1); // only index.ts actually got read
    expect(result.text).not.toContain('not-real-png-bytes');
    expect(result.text).not.toContain('%PDF-1.4');
    expect(result.text).toContain('export const x = 1;');
  });

  it('skips an unlisted-extension image via MIME fallback instead of reading it as text', async () => {
    const entries = [entry('assets/photo.heic', 'binary-garbage-bytes', 'image/heic')];
    const result = await generateDigest(entries, { maxFileSizeBytes: 1_000_000 });

    expect(result.skipped).toEqual([{ path: 'assets/photo.heic', reason: 'binary' }]);
    expect(result.text).not.toContain('binary-garbage-bytes');
  });

  it('skips files over the size limit, separately from binary detection', async () => {
    const entries = [entry('big.ts', 'x'.repeat(1000), 'text/typescript')];
    const result = await generateDigest(entries, { maxFileSizeBytes: 10 });
    expect(result.skipped).toEqual([{ path: 'big.ts', reason: 'too large' }]);
  });

  it('includes the directory tree and per-file token counts for text files', async () => {
    const entries = [entry('a.ts', 'hello world'), entry('b.ts', 'foo bar baz')];
    const result = await generateDigest(entries, { maxFileSizeBytes: 1_000_000 });
    expect(result.text).toContain('DIRECTORY STRUCTURE');
    expect(result.text).toContain('FILE: a.ts');
    expect(result.perFile.map((f) => f.path).sort()).toEqual(['a.ts', 'b.ts']);
    expect(result.perFile.every((f) => f.tokens > 0)).toBe(true);
  });
});