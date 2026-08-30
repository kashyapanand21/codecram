import type { FileEntry, DigestResult } from './types';
import { countTokens } from './tokens';

const BINARY_EXT = new Set([
  
  'png', 'jpg', 'jpeg', 'gif', 'webp', 'ico', 'svg', 'bmp', 'tiff', 'tif',
  'heic', 'heif', 'avif', 'psd', 'ai',

  'pdf', 'zip', 'tar', 'gz', 'rar', '7z', 'iso', 'dmg',
  
  'woff', 'woff2', 'ttf', 'eot', 'otf',
  
  'mp4', 'mov', 'mp3', 'wav', 'flac', 'ogg', 'webm', 'mkv', 'avi',
  
  'exe', 'dll', 'so', 'class', 'jar', 'wasm', 'apk',
]);

/**
 * Extension list first (cheap, works even without a File object), then a
 * MIME-type fallback for anything the extension list misses — a .heic or
 * .avif photo, a file with no extension, an extension that isn't in the
 * list yet. Without this fallback, an unlisted binary format would have its
 * raw bytes decoded as UTF-8 "text" and land in the actual digest output.
 */
export function looksBinary(path: string, mimeType?: string): boolean {
  const ext = path.split('.').pop()?.toLowerCase() ?? '';
  if (BINARY_EXT.has(ext)) return true;
  if (mimeType) {
    if (
      mimeType.startsWith('image/') ||
      mimeType.startsWith('video/') ||
      mimeType.startsWith('audio/') ||
      mimeType === 'application/pdf' ||
      mimeType === 'application/zip' ||
      mimeType === 'application/octet-stream'
    ) {
      return true;
    }
  }
  return false;
}

export function yieldToMain(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function renderTreeLines(paths: string[]): string[] {
  type Node = { name: string; children: Map<string, Node> };
  const root: Node = { name: '', children: new Map() };

  for (const p of paths) {
    let node = root;
    for (const part of p.split('/')) {
      if (!node.children.has(part)) node.children.set(part, { name: part, children: new Map() });
      node = node.children.get(part)!;
    }
  }

  const lines: string[] = [];
  function walk(node: Node, prefix: string) {
    const kids = Array.from(node.children.values());
    kids.forEach((child, idx) => {
      const last = idx === kids.length - 1;
      lines.push(`${prefix}${last ? '└── ' : '├── '}${child.name}`);
      walk(child, `${prefix}${last ? '    ' : '│   '}`);
    });
  }
  walk(root, '');
  return lines;
}

/**
 * Reads the given (already-filtered) files and produces one concatenated,
 * LLM-ready text digest — a directory tree followed by each file's content.
 * Runs on the main thread but yields periodically so the tab stays responsive.
 */
export async function generateDigest(
  entries: FileEntry[],
  opts: { maxFileSizeBytes: number },
  onProgress?: (done: number, total: number) => void
): Promise<DigestResult> {
  const skipped: DigestResult['skipped'] = [];
  const perFile: DigestResult['perFile'] = [];
  let totalSize = 0;

  const sorted = [...entries].sort((a, b) => a.path.localeCompare(b.path));

  const parts: string[] = [];
  parts.push('DIRECTORY STRUCTURE');
  parts.push(renderTreeLines(sorted.map((e) => e.path)).join('\n'));
  parts.push('');
  parts.push('='.repeat(60));
  parts.push('');

  let done = 0;
  for (const entry of sorted) {
    done++;
    if (onProgress && done % 5 === 0) {
      onProgress(done, sorted.length);
      await yieldToMain();
    }

    if (looksBinary(entry.path, entry.file.type)) {
      skipped.push({ path: entry.path, reason: 'binary' });
      continue;
    }
    if (entry.file.size > opts.maxFileSizeBytes) {
      skipped.push({ path: entry.path, reason: 'too large' });
      continue;
    }

    let text: string;
    try {
      text = await entry.file.text();
    } catch {
      skipped.push({ path: entry.path, reason: 'unreadable' });
      continue;
    }

    totalSize += entry.file.size;
    const tokens = countTokens(text);
    perFile.push({ path: entry.path, tokens });

    parts.push(`FILE: ${entry.path}`);
    parts.push('-'.repeat(60));
    parts.push(text);
    parts.push('');
  }
  onProgress?.(sorted.length, sorted.length);

  const text = parts.join('\n');
  return {
    text,
    tokenCount: countTokens(text),
    fileCount: perFile.length,
    totalSize,
    skipped,
    perFile,
  };
}