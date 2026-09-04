// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import FileTree from '@/components/FileTree';
import type { TreeNode } from '@/lib/types';

function makeTree(): TreeNode {
    return {
        name: '', path: '', type: 'folder', size: 0,
        leafPaths: ['src/a.ts', 'src/b.ts', 'README.md'],
        children: [
            {
                name: 'src', path: 'src', type: 'folder', size: 0,
                leafPaths: ['src/a.ts', 'src/b.ts'],
                children: [
                    { name: 'a.ts', path: 'src/a.ts', type: 'file', size: 10, leafPaths: ['src/a.ts'], children: [] },
                    { name: 'b.ts', path: 'src/b.ts', type: 'file', size: 20, leafPaths: ['src/b.ts'], children: [] },
                ],
            },
            { name: 'README.md', path: 'README.md', type: 'file', size: 5, leafPaths: ['README.md'], children: [] },
        ],
    };
}

describe('FileTree', () => {
    it('renders folders and files', () => {
        render(<FileTree node={makeTree()} excluded={new Set()} onToggle={vi.fn()} search="" showIgnored />);
        expect(screen.getByText('src')).toBeInTheDocument();
        expect(screen.getByText('a.ts')).toBeInTheDocument();
        expect(screen.getByText('README.md')).toBeInTheDocument();
    });

    it('marks a folder checkbox indeterminate when only some children are excluded', () => {
        render(<FileTree node={makeTree()} excluded={new Set(['src/a.ts'])} onToggle={vi.fn()} search="" showIgnored />);
        const srcCheckbox = screen.getByText('src').closest('label')!.querySelector('input') as HTMLInputElement;
        expect(srcCheckbox.indeterminate).toBe(true);
        expect(srcCheckbox.checked).toBe(false);
    });

    it('calls onToggle with the folder node when its checkbox is clicked', () => {
        const onToggle = vi.fn();
        render(<FileTree node={makeTree()} excluded={new Set()} onToggle={onToggle} search="" showIgnored />);
        const srcCheckbox = screen.getByText('src').closest('label')!.querySelector('input')!;
        fireEvent.click(srcCheckbox);
        expect(onToggle).toHaveBeenCalledWith(expect.objectContaining({ path: 'src' }));
    });

    it('hides a fully-excluded node when showIgnored is false', () => {
        render(
            <FileTree node={makeTree()} excluded={new Set(['src/a.ts', 'src/b.ts'])} onToggle={vi.fn()} search="" showIgnored={false} />
        );
        expect(screen.queryByText('src')).not.toBeInTheDocument();
        expect(screen.getByText('README.md')).toBeInTheDocument();
    });

    it('shows the empty-state message when everything is excluded and showIgnored is false', () => {
        const tree = makeTree();
        render(<FileTree node={tree} excluded={new Set(tree.leafPaths)} onToggle={vi.fn()} search="" showIgnored={false} />);
        expect(screen.getByText(/Nothing to show/)).toBeInTheDocument();
    });

    it('filters by search query, keeping ancestor folders of a match', () => {
        render(<FileTree node={makeTree()} excluded={new Set()} onToggle={vi.fn()} search="a.ts" showIgnored />);
        expect(screen.getByText('src')).toBeInTheDocument();
        expect(screen.getByText('a.ts')).toBeInTheDocument();
        expect(screen.queryByText('b.ts')).not.toBeInTheDocument();
        expect(screen.queryByText('README.md')).not.toBeInTheDocument();
    });
});