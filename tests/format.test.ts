import { describe, it, expect } from 'vitest';
import { formatBytes, formatTokens } from '../lib/format';

describe('formatBytes', () => {
  it('handles zero', () => {
    expect(formatBytes(0)).toBe('0 B');
  });
  it('formats bytes, KB, MB with appropriate precision', () => {
    expect(formatBytes(500)).toBe('500 B');
    expect(formatBytes(2048)).toBe('2.0 KB');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 MB');
  });
});

describe('formatTokens', () => {
  it('shows raw numbers under 1000', () => {
    expect(formatTokens(0)).toBe('0');
    expect(formatTokens(999)).toBe('999');
  });
  it('shows one decimal "k" above 1000', () => {
    expect(formatTokens(1000)).toBe('1.0k');
    expect(formatTokens(41200)).toBe('41.2k');
  });
});