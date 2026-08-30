import { describe, it, expect } from 'vitest';
import { precomputeTokenCounts } from '../lib/tokenCache';
import type { FileEntry } from '../lib/types';

function entry(path: string, content: string, type = ''): FileEntry {
  return { path, file: new File([content], path.split('/').pop()!, { type }) };
}

describe('precomputeTokenCounts', () => {
  it('counts tokens for text files', async () => {
    const counts = await precomputeTokenCounts([entry('a.ts', 'hello world')]);
    expect(counts.get('a.ts')).toBeGreaterThan(0);
  });

  it('never counts images/binaries — even unlisted-extension ones via MIME', async () => {
    const counts = await precomputeTokenCounts([
      entry('logo.png', 'fake-png-bytes', 'image/png'),
      entry('photo.heic', 'fake-heic-bytes', 'image/heic'),
    ]);
    expect(counts.has('logo.png')).toBe(false);
    expect(counts.has('photo.heic')).toBe(false);
  });
});