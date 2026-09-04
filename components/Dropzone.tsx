'use client';

import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { fromFileList, fromDataTransferItems } from '@/lib/entries';
import type { FileEntry } from '@/lib/types';

export default function Dropzone({ onFiles }: { onFiles: (entries: FileEntry[]) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setDragging] = useState(false);
  const [isReading, setReading] = useState(false);

  async function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    if (!e.dataTransfer?.items?.length) return;
    setReading(true);
    const entries = await fromDataTransferItems(e.dataTransfer.items);
    setReading(false);
    onFiles(entries);
  }

  function handlePick(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return;
    onFiles(fromFileList(e.target.files));
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      role="button"
      tabIndex={0}
      className="cursor-pointer border-2 border-ink bg-paper px-6 py-20 text-center"
    >
      <div className={`mx-auto flex max-w-sm flex-col items-center border-2 border-dashed px-6 py-10 transition-colors ${isDragging ? 'border-signal' : 'border-ink/25'}`}>
        <p className="font-sans text-lg font-semibold text-ink">
          {isReading ? 'Reading the folder…' : 'Place a folder here to begin'}
        </p>
        <p className="mt-2 font-mono text-[10.5px] uppercase tracking-widest text-dim">or click to choose one</p>
      </div>
      <input
        ref={inputRef}
        type="file"
        // @ts-expect-error webkitdirectory isn't in the DOM lib typings
        webkitdirectory=""
        directory=""
        multiple
        className="hidden"
        onClick={(e) => e.stopPropagation()}
        onChange={handlePick}
      />
      <p className="mt-6 font-mono text-[10px] uppercase tracking-widest text-dim/70">nothing is uploaded — everything runs in this tab</p>
    </div>
  );
}