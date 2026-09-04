/// <reference lib="webworker" />
import { looksBinary, generateDigest } from '../digest';
import { countTokens } from '../tokens';
import type { WorkerRequest, WorkerResponse } from './protocol';

const ctx = self as unknown as DedicatedWorkerGlobalScope;

function post(msg: WorkerResponse) {
  ctx.postMessage(msg);
}

async function tokenize(id: number, req: Extract<WorkerRequest, { type: 'tokenize' }>) {
  const counts = new Map<string, number>();
  let done = 0;
  for (const entry of req.entries) {
    done++;
    if (done % 10 === 0) post({ id, type: 'progress', done, total: req.entries.length });
    if (looksBinary(entry.path, entry.file.type)) continue;
    try {
      const text = await entry.file.text();
      counts.set(entry.path, countTokens(text));
    } catch {
      // unreadable — left uncounted, same as the old main-thread precomputeTokenCounts
    }
  }
  post({ id, type: 'progress', done: req.entries.length, total: req.entries.length });
  post({ id, type: 'tokenize-done', counts: Array.from(counts.entries()) });
}

async function digest(id: number, req: Extract<WorkerRequest, { type: 'digest' }>) {
  const result = await generateDigest(req.entries, { maxFileSizeBytes: req.maxFileSizeBytes }, (done, total) => {
    post({ id, type: 'progress', done, total });
  });
  post({ id, type: 'digest-done', result });
}

ctx.addEventListener('message', (event: MessageEvent<WorkerRequest>) => {
  const req = event.data;
  (async () => {
    try {
      if (req.type === 'tokenize') await tokenize(req.id, req);
      else if (req.type === 'digest') await digest(req.id, req);
    } catch (err) {
      post({ id: req.id, type: 'error', message: err instanceof Error ? err.message : String(err) });
    }
  })();
});     