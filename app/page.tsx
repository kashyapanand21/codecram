import IngestTool from '@/components/IngestTool';

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b-[3px] border-ink pb-4">
        <h1 className="font-sans text-5xl font-extrabold tracking-tight text-ink sm:text-6xl">
          DIG<span className="text-signal">E</span>ST
        </h1>
        <p className="font-mono text-[11px] leading-relaxed text-dim">VOL. I &mdash; LOCAL EDITION</p>
      </div>
      <p className="mb-8 mt-3 max-w-md text-sm text-dim">
        Compile a folder from your disk into a single, well-set reference for language models —
        read entirely in your browser, kept off any server.
      </p>

      <IngestTool />

      <footer className="mt-10 border-t border-ink/10 pt-4 text-center font-mono text-[10.5px] tracking-wide text-dim">
        set in Switzer &amp; IBM Plex Mono — nothing opened here is ever uploaded
      </footer>
    </main>
  );
}