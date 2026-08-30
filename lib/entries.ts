import type { FileEntry } from './types';
import { isHardIgnored } from './defaultIgnore';

/** From a plain <input webkitdirectory> selection. */
export function fromFileList(fileList: FileList): FileEntry[] {
  const entries: FileEntry[] = [];
  for (let i = 0; i < fileList.length; i++) {
    const file = fileList[i];
    // webkitRelativePath looks like "my-repo/src/index.ts"
    const path = (file as unknown as { webkitRelativePath?: string }).webkitRelativePath || file.name;
    if (isHardIgnored(path)) continue; // the picker gives us the whole flat list anyway — drop junk before it enters state
    entries.push({ path, file });
  }
  return entries;
}

/** From a drag-and-drop event's DataTransferItemList (supports nested folders). */
export async function fromDataTransferItems(items: DataTransferItemList): Promise<FileEntry[]> {
  const out: FileEntry[] = [];
  const roots: FileSystemEntry[] = [];

  for (let i = 0; i < items.length; i++) {
    const entry = (items[i] as unknown as { webkitGetAsEntry?: () => FileSystemEntry | null }).webkitGetAsEntry?.();
    if (entry) roots.push(entry);
  }

  await Promise.all(roots.map((entry) => walk(entry, entry.name, out)));
  return out;
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
          readBatch(); // readEntries only returns up to 100 at a time
        }, reject);
      };
      readBatch();
      return;
    }
    resolve();
  });
}