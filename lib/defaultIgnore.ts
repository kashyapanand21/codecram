// Sensible defaults so a freshly-loaded folder isn't full of noise.
// Users can see/adjust the effective selection via the checkbox tree.
export const DEFAULT_IGNORE_PATTERNS = [
  '.git',
  '.git/**',
  'node_modules',
  'node_modules/**',
  '.next',
  '.next/**',
  'dist',
  'dist/**',
  'build',
  'build/**',
  'out',
  'out/**',
  'coverage',
  'coverage/**',
  '*.lock',
  'package-lock.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  '.env',
  '.env.*',
  '.DS_Store',
  '*.png',
  '*.jpg',
  '*.jpeg',
  '*.gif',
  '*.webp',
  '*.svg',
  '*.ico',
  '*.woff',
  '*.woff2',
  '*.ttf',
  '*.eot',
  '*.mp4',
  '*.mov',
  '*.zip',
  '*.tar',
  '*.gz',
  '*.pdf',
];

export const HARD_IGNORE_DIRS = new Set([
  '.git',
  'node_modules',
  '.next',
  'dist',
  'build',
  'out',
  'coverage',
]);

export function isHardIgnored(path: string): boolean {
  return path.split('/').some((segment) => HARD_IGNORE_DIRS.has(segment));
}