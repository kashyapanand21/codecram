'use client';

import { useState } from 'react';
import { formatBytes, formatTokens } from '@/lib/format';
import type { DigestResult } from '@/lib/types';

export default function OutputPanel({
  digest, onCopy, onDownload, copied,
}: {
  digest: DigestResult | null;
  onCopy: () => void;
  onDownload: () => void;
  copied: boolean;
}) {
  const [showBreakdown, setShowBreakdown] = useState(false);

  if (!digest) {
    return (
      <div className="flex h-full min-h-[300px] flex-col items-center justify-center px-6 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-dim">proof will appear here</p>
      </div>
    );
  }

  const topFiles = [...digest.perFile].sort((a, b) => b.tokens - a.tokens);

  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3">
        <button
          onClick={() => setShowBreakdown((v) => !v)}
          className="font-mono text-[11px] text-dim underline decoration-dotted underline-offset-4 hover:text-ink"
        >
          {digest.fileCount} files · {formatBytes(digest.totalSize)} · {formatTokens(digest.tokenCount)} tok {showBreakdown ? '▲' : '▾'}
        </button>
        <div className="flex gap-2">
          <button onClick={onCopy} className="border border-ink px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-ink hover:bg-ink hover:text-paper">
            {copied ? 'copied' : 'copy'}
          </button>
          <button onClick={onDownload} className="border border-ink px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-ink hover:bg-ink hover:text-paper">
            download
          </button>
        </div>
      </div>

      {digest.skipped.length > 0 && (
        <p className="mb-2 font-mono text-[10.5px] text-signal">{digest.skipped.length} skipped (binary or over size limit)</p>
      )}

      {showBreakdown && (
        <div className="mb-3 max-h-[140px] overflow-auto border border-ink/15 bg-ink/[0.03] p-2 font-mono text-[11px]">
          {topFiles.map((f) => (
            <div key={f.path} className="flex justify-between gap-3 py-0.5 text-dim">
              <span className="truncate">{f.path}</span>
              <span className="shrink-0 text-ink">{formatTokens(f.tokens)}</span>
            </div>
          ))}
        </div>
      )}

      <pre className="max-h-[380px] flex-1 overflow-auto whitespace-pre-wrap break-words border-t border-ink/10 pt-3 font-mono text-[12px] leading-relaxed text-ink/85">
        {digest.text}
      </pre>
    </div>
  );
}