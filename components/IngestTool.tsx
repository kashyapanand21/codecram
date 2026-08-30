'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Dropzone from './Dropzone';
import FileTree from './FileTree';
import OutputPanel from './OutputPanel';
import { buildTree } from '@/lib/buildTree';
import { buildMatcher } from '@/lib/ignoreMatcher';
import { generateDigest, looksBinary } from '@/lib/digest';
import { precomputeTokenCounts } from '@/lib/tokenCache';
import { formatBytes, formatTokens } from '@/lib/format';
import type { FileEntry, TreeNode, DigestResult } from '@/lib/types';

export default function IngestTool() {
  const [entries, setEntries] = useState<FileEntry[]>([]);
  const [tree, setTree] = useState<TreeNode | null>(null);
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const [maxSizeKB, setMaxSizeKB] = useState(300);
  const [useGitignore, setUseGitignore] = useState(true);
  const [search, setSearch] = useState('');
  const [digest, setDigest] = useState<DigestResult | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const [showIgnored, setShowIgnored] = useState(false);

  const [tokenCounts, setTokenCounts] = useState<Map<string, number>>(new Map());
  const [isEstimating, setIsEstimating] = useState(false);
  const loadIdRef = useRef(0);

  const includedEntries = useMemo(
    () => entries.filter((e) => !excluded.has(e.path)),
    [entries, excluded]
  );

  const liveTokenEstimate = useMemo(() => {
    let total = 0;
    for (const e of includedEntries) {
      if (looksBinary(e.path, e.file.type)) continue;
      if (e.file.size > maxSizeKB * 1024) continue;
      total += tokenCounts.get(e.path) ?? 0;
    }
    return total;
  }, [includedEntries, maxSizeKB, tokenCounts]);

  // new: drives the "selected size" stat card — pure derived value, doesn't touch existing state
  const totalSizeBytes = useMemo(
    () => includedEntries.reduce((sum, e) => sum + e.file.size, 0),
    [includedEntries]
  );

  async function applyDefaultExclusions(newEntries: FileEntry[], gitignoreEnabled: boolean) {
    const gitignoreEntry = newEntries.find((e) => e.path.split('/').pop() === '.gitignore');
    const gitignoreContent = gitignoreEnabled && gitignoreEntry ? await gitignoreEntry.file.text() : undefined;
    const matcher = buildMatcher([], gitignoreContent);
    const next = new Set<string>();
    for (const e of newEntries) {
      if (matcher.ignores(e.path)) next.add(e.path);
    }
    setExcluded(next);
  }

  function handleFiles(newEntries: FileEntry[]) {
    const loadId = ++loadIdRef.current;
    setEntries(newEntries);
    setTree(buildTree(newEntries));
    setDigest(null);
    setTokenCounts(new Map());
    void applyDefaultExclusions(newEntries, useGitignore);
    const junkFilter = buildMatcher([]);
    const candidates = newEntries.filter(
      (e) => !junkFilter.ignores(e.path) && e.file.size <= maxSizeKB * 1024
    );

    setIsEstimating(true);
    void precomputeTokenCounts(candidates).then((counts) => {
      if (loadIdRef.current !== loadId) return;
      setTokenCounts(counts);
      setIsEstimating(false);
    });
  }

  useEffect(() => {
    const missing = includedEntries.filter(
      (e) => !looksBinary(e.path, e.file.type) && e.file.size <= maxSizeKB * 1024 && !tokenCounts.has(e.path)
    );
    if (missing.length === 0) return;
    let cancelled = false;
    void precomputeTokenCounts(missing).then((extra) => {
      if (cancelled) return;
      setTokenCounts((prev) => {
        const next = new Map(prev);
        extra.forEach((v, k) => next.set(k, v));
        return next;
      });
    });
    return () => { cancelled = true; };
  }, [includedEntries, maxSizeKB, tokenCounts]);

  function toggleNode(node: TreeNode) {
    setExcluded((prev) => {
      const next = new Set(prev);
      const allExcluded = node.leafPaths.every((p) => next.has(p));
      for (const p of node.leafPaths) {
        if (allExcluded) next.delete(p);
        else next.add(p);
      }
      return next;
    });
  }

  async function handleGenerate() {
    setProgress({ done: 0, total: includedEntries.length });
    const result = await generateDigest(
      includedEntries,
      { maxFileSizeBytes: maxSizeKB * 1024 },
      (done, total) => setProgress({ done, total })
    );
    setDigest(result);
    setProgress(null);
  }

  async function handleCopy() {
    if (!digest) return;
    await navigator.clipboard.writeText(digest.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleDownload() {
    if (!digest) return;
    const blob = new Blob([digest.text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'digest.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleReset() {
    setEntries([]);
    setTree(null);
    setExcluded(new Set());
    setDigest(null);
    setTokenCounts(new Map());
  }

  if (!tree) {
    return (
      <div className="mx-auto max-w-xl">
        <Dropzone onFiles={handleFiles} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-[2px] border-2 border-ink bg-ink lg:grid-cols-12">

      <div className="col-span-1 bg-paper p-5 lg:col-span-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-dim">Files indexed</div>
        <div className="mt-2 font-sans text-4xl font-extrabold text-ink">{entries.length}</div>
        <div className="mt-1 font-mono text-[11px] text-dim">{excluded.size} struck</div>
      </div>

      <div className="col-span-1 bg-paper p-5 lg:col-span-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-dim">Est. tokens</div>
        <div className="mt-2 font-sans text-4xl font-extrabold text-signal">
          {isEstimating ? '…' : formatTokens(liveTokenEstimate)}
        </div>
        <div className="mt-1 font-mono text-[11px] text-dim">updates live on toggle</div>
      </div>

      <div className="col-span-1 bg-paper p-5 lg:col-span-4">
        <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-dim">Selected size</div>
        <div className="mt-2 font-sans text-4xl font-extrabold text-ink">{formatBytes(totalSizeBytes)}</div>
        <div className="mt-1 font-mono text-[11px] text-dim">max {maxSizeKB} KB / file</div>
      </div>

      <div className="col-span-1 flex flex-col bg-paper p-5 lg:col-span-7 lg:row-span-2">
        <div className="mb-3 flex items-baseline justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-dim">Index</span>
          <button onClick={handleReset} className="font-mono text-[10.5px] text-dim underline decoration-dotted underline-offset-4 hover:text-ink">
            choose a different folder
          </button>
        </div>
        <div className="flex-1 overflow-auto">
          <FileTree node={tree} excluded={excluded} onToggle={toggleNode} search={search} tokenCounts={tokenCounts} showIgnored={showIgnored} />
        </div>
      </div>

      <div className="col-span-1 bg-paper p-5 lg:col-span-5">
        <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-dim">Controls</div>

        <input
          type="text"
          placeholder="search the index…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3 w-full border border-ink/25 bg-transparent px-2 py-1.5 font-mono text-xs text-ink outline-none focus:border-ink"
        />

        <div className="flex items-center justify-between border-t border-ink/10 py-2 font-mono text-[12px]">
          <span>Max file size</span>
          <span className="flex items-center gap-1.5 text-dim">
            <input
              type="number"
              value={maxSizeKB}
              onChange={(e) => setMaxSizeKB(Number(e.target.value) || 0)}
              className="w-14 border border-ink/25 bg-transparent px-1.5 py-0.5 text-right text-ink outline-none focus:border-ink"
            />
            KB
          </span>
        </div>

        <div className="flex items-center justify-between border-t border-ink/10 py-2 font-mono text-[12px]">
          <span>Respect .gitignore</span>
          <div className="flex items-center justify-between border-t border-ink/10 py-2 font-mono text-[12px]">
            <span>Show ignored files</span>
            <input
              type="checkbox"
              className="mark"
              checked={showIgnored}
              onChange={(e) => setShowIgnored(e.target.checked)}
            />
          </div>
          <input
            type="checkbox"
            className="mark"
            checked={useGitignore}
            onChange={(e) => {
              setUseGitignore(e.target.checked);
              void applyDefaultExclusions(entries, e.target.checked);
            }}
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={includedEntries.length === 0 || !!progress}
          className="mt-4 w-full bg-ink py-2.5 font-mono text-[11px] uppercase tracking-[0.18em] text-paper transition-opacity hover:opacity-90 disabled:opacity-30"
        >
          {progress ? `setting ${progress.done}/${progress.total}…` : `set the digest — ${includedEntries.length} files`}
        </button>
      </div>

      <div className="col-span-1 bg-paper p-5 lg:col-span-5">
        <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-dim">Proof</div>
        <OutputPanel digest={digest} onCopy={handleCopy} onDownload={handleDownload} copied={copied} />
      </div>

    </div>
  );
}