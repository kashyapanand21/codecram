import type { FileEntry, DigestResult } from '../types';

export type WorkerRequest =
  | { id: number; type: 'tokenize'; entries: FileEntry[] }
  | { id: number; type: 'digest'; entries: FileEntry[]; maxFileSizeBytes: number };

export type WorkerResponse =
  | { id: number; type: 'progress'; done: number; total: number }
  | { id: number; type: 'tokenize-done'; counts: [string, number][] }
  | { id: number; type: 'digest-done'; result: DigestResult }
  | { id: number; type: 'error'; message: string };