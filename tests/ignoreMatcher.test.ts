import { describe, it, expect } from 'vitest';
import { buildMatcher } from '../lib/ignoreMatcher';

describe('buildMatcher', () => {
  it('excludes common junk by default', () => {
    const m = buildMatcher([]);
    expect(m.ignores('node_modules/react/index.js')).toBe(true);
    expect(m.ignores('.git/HEAD')).toBe(true);
    expect(m.ignores('dist/bundle.js')).toBe(true);
    expect(m.ignores('package-lock.json')).toBe(true);
  });

  it('does not exclude ordinary source files', () => {
    const m = buildMatcher([]);
    expect(m.ignores('src/index.ts')).toBe(false);
    expect(m.ignores('README.md')).toBe(false);
  });

  it('layers in the repo\'s own .gitignore content', () => {
    const m = buildMatcher([], 'secrets/\n*.local.ts');
    expect(m.ignores('secrets/keys.json')).toBe(true);
    expect(m.ignores('config.local.ts')).toBe(true);
    expect(m.ignores('config.ts')).toBe(false);
  });

  it('layers in extra typed patterns', () => {
    const m = buildMatcher(['*.test.ts']);
    expect(m.ignores('index.test.ts')).toBe(true);
    expect(m.ignores('index.ts')).toBe(false);
  });
});