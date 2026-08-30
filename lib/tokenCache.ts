import type { FileEntry } from './types';
import { countTokens } from './tokens';
import { looksBinary, yieldToMain } from './digest';

export async function precomputeTokenCounts(
  entries: FileEntry[],
  onProgress?: (done: number, total: number) => void
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  let done = 0;
  for (const entry of entries) {
    done++;
    if (onProgress && done % 10 === 0) {
      onProgress(done, entries.length);
      await yieldToMain();
    }
    if (looksBinary(entry.path, entry.file.type)) continue;
    try {
      const text = await entry.file.text();
      counts.set(entry.path, countTokens(text));
    } catch {
      // unreadable — left uncounted, generateDigest reports it as skipped
    }
  }
  onProgress?.(entries.length, entries.length);
  return counts;
}