import type { FileEntry, TreeNode } from './types';

export function buildTree(entries: FileEntry[]): TreeNode {
  const root: TreeNode = {
    name: '',
    path: '',
    type: 'folder',
    children: [],
    size: 0,
    leafPaths: [],
  };

  for (const entry of entries) {
    const parts = entry.path.split('/').filter(Boolean);
    let node = root;
    let currentPath = '';

    parts.forEach((part, idx) => {
      currentPath = currentPath ? `${currentPath}/${part}` : part;
      const isFile = idx === parts.length - 1;
      let child = node.children.find((c) => c.name === part);
      if (!child) {
        child = {
          name: part,
          path: currentPath,
          type: isFile ? 'file' : 'folder',
          children: [],
          size: isFile ? entry.file.size : 0,
          leafPaths: [],
          file: isFile ? entry.file : undefined,
        };
        node.children.push(child);
      }
      node = child;
    });
  }

  attachLeafPaths(root);
  sortTree(root);
  return root;
}

function attachLeafPaths(node: TreeNode): string[] {
  if (node.type === 'file') {
    node.leafPaths = [node.path];
    return node.leafPaths;
  }
  const leaves: string[] = [];
  for (const child of node.children) {
    leaves.push(...attachLeafPaths(child));
  }
  node.leafPaths = leaves;
  node.size = node.children.reduce((sum, c) => sum + c.size, 0);
  return leaves;
}

function sortTree(node: TreeNode) {
  node.children.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
  node.children.forEach(sortTree);
}
