import { describe, it, expect } from 'vitest';
import { buildTree } from '../lib/buildTree';
import type { FileEntry } from '../lib/types';

function entry(path: string, content = 'x'): FileEntry {
  return { path, file: new File([content], path.split('/').pop()!) };
}

describe('buildTree', () => {
  it('nests files under their folders', () => {
    const tree = buildTree([
      entry('repo/src/index.ts'),
      entry('repo/src/utils.ts'),
      entry('repo/README.md'),
    ]);
    const repo = tree.children.find((c) => c.name === 'repo')!;
    expect(repo.type).toBe('folder');
    const src = repo.children.find((c) => c.name === 'src')!;
    expect(src.children.map((c) => c.name)).toEqual(['index.ts', 'utils.ts']);
  });

  it('sorts folders before files, then alphabetically', () => {
    const tree = buildTree([
      entry('repo/zeta.ts'),
      entry('repo/alpha.ts'),
      entry('repo/zfolder/file.ts'),
      entry('repo/afolder/file.ts'),
    ]);
    const repo = tree.children[0];
    expect(repo.children.map((c) => c.name)).toEqual(['afolder', 'zfolder', 'alpha.ts', 'zeta.ts']);
  });

  it('aggregates leafPaths up through folders', () => {
    const tree = buildTree([entry('a/b/c.ts'), entry('a/b/d.ts'), entry('a/e.ts')]);
    const a = tree.children[0];
    expect(a.leafPaths.sort()).toEqual(['a/b/c.ts', 'a/b/d.ts', 'a/e.ts']);
    const b = a.children.find((c) => c.name === 'b')!;
    expect(b.leafPaths.sort()).toEqual(['a/b/c.ts', 'a/b/d.ts']);
  });

  it('sums folder size from its files', () => {
    const tree = buildTree([entry('a/one.ts', '12345'), entry('a/two.ts', '1234567890')]);
    const a = tree.children[0];
    expect(a.size).toBe(5 + 10);
  });
});