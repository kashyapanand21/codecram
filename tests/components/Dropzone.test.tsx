// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Dropzone from '@/components/Dropzone';
import * as entries from '@/lib/entries';

vi.mock('@/lib/entries', () => ({
  fromFileList: vi.fn(),
  fromDataTransferItems: vi.fn(),
}));

describe('Dropzone', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows the idle prompt initially', () => {
    render(<Dropzone onFiles={vi.fn()} />);
    expect(screen.getByText('Place a folder here to begin')).toBeInTheDocument();
  });

  it('opens the hidden file input when clicked', async () => {
    render(<Dropzone onFiles={vi.fn()} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, 'click');
    await userEvent.click(screen.getByRole('button'));
    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it('passes fromFileList results to onFiles when the input changes', () => {
    const onFiles = vi.fn();
    const fakeEntries = [{ path: 'a/b.ts', file: new File(['x'], 'b.ts') }];
    vi.mocked(entries.fromFileList).mockReturnValue(fakeEntries);

    render(<Dropzone onFiles={onFiles} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [new File(['x'], 'b.ts')], writable: false });
    fireEvent.change(input);

    expect(entries.fromFileList).toHaveBeenCalled();
    expect(onFiles).toHaveBeenCalledWith(fakeEntries);
  });

  it('shows "Reading the folder…" while a drop is being walked, then resolves', async () => {
    const onFiles = vi.fn();
    let resolveWalk!: (v: unknown) => void;
    vi.mocked(entries.fromDataTransferItems).mockReturnValue(
      new Promise((resolve) => { resolveWalk = resolve; })
    );

    render(<Dropzone onFiles={onFiles} />);
    fireEvent.drop(screen.getByRole('button'), { dataTransfer: { items: [{}] } });

    expect(await screen.findByText('Reading the folder…')).toBeInTheDocument();

    const fakeEntries = [{ path: 'x.ts', file: new File(['y'], 'x.ts') }];
    resolveWalk(fakeEntries);

    expect(await screen.findByText('Place a folder here to begin')).toBeInTheDocument();
    expect(onFiles).toHaveBeenCalledWith(fakeEntries);
  });

  it('ignores a drop with no dataTransfer items', () => {
    const onFiles = vi.fn();
    render(<Dropzone onFiles={onFiles} />);
    fireEvent.drop(screen.getByRole('button'), { dataTransfer: { items: [] } });
    expect(entries.fromDataTransferItems).not.toHaveBeenCalled();
    expect(onFiles).not.toHaveBeenCalled();
  });
});