export interface FileEntry {
  path: string;
  file: File;
}

export interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'folder';
  children: TreeNode[];
  file?: File;
  size: number;
  /** paths of every file beneath this node (or just itself, if a file) */
  leafPaths: string[];
}

export interface DigestResult {
  text: string;
  tokenCount: number;
  fileCount: number;
  totalSize: number;
  skipped: { path: string; reason: string }[];
  perFile: { path: string; tokens: number }[];
}
