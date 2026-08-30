'use client';

import type { TreeNode } from '@/lib/types';
import { formatTokens } from '@/lib/format';

function matchesSearch(node: TreeNode, query: string): boolean {
  if (node.path.toLowerCase().includes(query)) return true;
  return node.children.some((c) => matchesSearch(c, query));
}

function tokensFor(node: TreeNode, counts?: Map<string, number>): number | null {
  if (!counts) return null;
  let sum = 0;
  let any = false;
  for (const p of node.leafPaths) {
    const t = counts.get(p);
    if (t !== undefined) { sum += t; any = true; }
  }
  return any ? sum : null;
}

export default function FileTree({
  node, excluded, onToggle, depth = 0, search, tokenCounts,
}: {
  node: TreeNode;
  excluded: Set<string>;
  onToggle: (node: TreeNode) => void;
  depth?: number;
  search: string;
  tokenCounts?: Map<string, number>;
}) {
  const query = search.trim().toLowerCase();

  return (
    <ul className={depth === 0 ? 'space-y-0.5' : 'ml-3.5 space-y-0.5 border-l border-ink/10 pl-3'}>
      {node.children.map((child) => {
        if (query && !matchesSearch(child, query)) return null;
        const excludedCount = child.leafPaths.filter((p) => excluded.has(p)).length;
        const state = excludedCount === 0 ? 'checked' : excludedCount === child.leafPaths.length ? 'unchecked' : 'partial';
        const tokens = tokensFor(child, tokenCounts);

        if (child.type === 'folder') {
          return (
            <li key={child.path} className="pt-2.5 first:pt-0">
              <label className="flex cursor-pointer items-baseline gap-2">
                <input
                  type="checkbox"
                  className="mark translate-y-[1px]"
                  checked={state === 'checked'}
                  ref={(el) => { if (el) el.indeterminate = state === 'partial'; }}
                  onChange={() => onToggle(child)}
                />
                <span className={`font-mono text-[10.5px] font-medium uppercase tracking-[0.14em] ${state === 'unchecked' ? 'text-dim/60 line-through' : 'text-dim'}`}>
                  {child.name}
                </span>
                {tokens !== null && (
                  <span className="ml-auto shrink-0 font-mono text-[10px] text-dim">{formatTokens(tokens)}</span>
                )}
              </label>
              {child.children.length > 0 && (
                <FileTree node={child} excluded={excluded} onToggle={onToggle} depth={depth + 1} search={search} tokenCounts={tokenCounts} />
              )}
            </li>
          );
        }

        return (
          <li key={child.path}>
            <label className="flex cursor-pointer items-center justify-between gap-3 py-0.5">
              <span className="flex min-w-0 items-center gap-2">
                <input type="checkbox" className="mark" checked={state === 'checked'} onChange={() => onToggle(child)} />
                <span className={`truncate font-mono text-[12.5px] ${state === 'unchecked' ? 'text-signal/70 line-through' : 'text-ink'}`}>
                  {child.name}
                </span>
              </span>
              <span className={`shrink-0 font-mono text-[11px] ${state === 'unchecked' ? 'text-dim/40' : 'text-dim'}`}>
                {tokens !== null ? formatTokens(tokens) : '—'}
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}