// lib/entries.ts
import { isHardIgnored } from './defaultIgnore';

export function fromFileList(fileList: FileList): FileEntry[] {
  const entries: FileEntry[] = [];
  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    const path = (file as unknown as { webkitRelativePath?: string }).webkitRelativePath || file.name;
    if (isHardIgnored(path)) continue; // the picker gives us the whole flat list anyway — drop junk before it enters state
    entries.push({ path, file });
  }
  return entries;
}

function walk(entry: FileSystemEntry, path: string, out: FileEntry[]): Promise<void> {
  return new Promise((resolve, reject) => {
    if (entry.isFile) {
      (entry as FileSystemFileEntry).file((file) => {
        out.push({ path, file });
        resolve();
      }, reject);
      return;
    }
    if (entry.isDirectory) {
      if (isHardIgnored(path)) {
        resolve(); // stop here — don't even list what's inside node_modules/.git/etc.
        return;
      }
      const reader = (entry as FileSystemDirectoryEntry).createReader();
      const readBatch = () => {
        reader.readEntries(async (batch) => {
          if (batch.length === 0) { resolve(); return; }
          await Promise.all(batch.map((child) => walk(child, `${path}/${child.name}`, out)));
          readBatch();
        }, reject);
      };
      readBatch();
      return;
    }
    resolve();
  });
}