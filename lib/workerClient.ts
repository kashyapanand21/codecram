'use client';

import type { FileEntry, DigestResult } from './types';
import type { WorkerRequest, WorkerResponse } from './worker/protocol';
import { precomputeTokenCounts as precomputeTokenCountsMainThread } from './tokenCache';
import { generateDigest as generateDigestMainThread } from './digest';

let worker: Worker | null = null;
let nextId = 1;

function getWorker(): Worker | null {
  if (typeof Worker === 'undefined') return null; // SSR or unsupported browser
  if (!worker) {
    worker = new Worker(new URL('./worker/digest.worker.ts', import.meta.url));
  }
  return worker;
}

function request<TDone extends WorkerResponse['type']>(
  msg: WorkerRequest,
  doneType: TDone,
  onProgress?: (done: number, total: number) => void
): Promise<Extract<WorkerResponse, { type: TDone }>> {
  return new Promise((resolve, reject) => {
    const w = getWorker();
    if (!w) { reject(new Error('no-worker')); return; }

    function handleMessage(event: MessageEvent<WorkerResponse>) {
      const res = event.data;
      if (res.id !== msg.id) return; // reply to a different in-flight request
      if (res.type === 'progress') { onProgress?.(res.done, res.total); return; }
      w!.removeEventListener('message', handleMessage);
      if (res.type === 'error') reject(new Error(res.message));
      else if (res.type === doneType) resolve(res as Extract<WorkerResponse, { type: TDone }>);
    }

    w.addEventListener('message', handleMessage);
    w.postMessage(msg);
  });
}

/** Drop-in replacement for lib/tokenCache.ts's precomputeTokenCounts, off the main thread. */
export async function precomputeTokenCounts(
  entries: FileEntry[],
  onProgress?: (done: number, total: number) => void
): Promise<Map<string, number>> {
  const id = nextId++;
  try {
    const res = await request({ id, type: 'tokenize', entries }, 'tokenize-done', onProgress);
    return new Map(res.counts);
  } catch {
    // Worker unavailable or failed — fall back to the original main-thread implementation.
    return precomputeTokenCountsMainThread(entries, onProgress);
  }
}

/** Drop-in replacement for lib/digest.ts's generateDigest, off the main thread. */
export async function generateDigest(
  entries: FileEntry[],
  opts: { maxFileSizeBytes: number },
  onProgress?: (done: number, total: number) => void
): Promise<DigestResult> {
  const id = nextId++;
  try {
    const res = await request({ id, type: 'digest', entries, maxFileSizeBytes: opts.maxFileSizeBytes }, 'digest-done', onProgress);
    return res.result;
  } catch {
    return generateDigestMainThread(entries, opts, onProgress);
  }
}