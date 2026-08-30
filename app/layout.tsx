import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'Digest — a folder, set for reading',
  description: 'Compile any local folder into a single, well-set reference for language models.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={mono.variable}>
      <body className="min-h-screen bg-paper font-sans text-ink antialiased">{children}</body>
    </html>
  );
}