/**
 * Thin wrapper over the File System Access API with universal fallbacks.
 *
 * Capability tiers, picked at runtime per browser:
 *   Tier 1 (Chromium): full directory r/w via window.showDirectoryPicker
 *   Tier 2 (any modern browser): single-file open via <input type="file"> and
 *                                save via blob download
 */

export interface OpenedFile {
  name: string;
  text: string;
  /** Present only if we got it via File System Access API. */
  handle?: FileSystemFileHandle;
}

export const hasFileSystemAccess = (): boolean =>
  typeof window !== 'undefined' && 'showOpenFilePicker' in window;

export const hasDirectoryAccess = (): boolean =>
  typeof window !== 'undefined' && 'showDirectoryPicker' in window;

/**
 * Open a single .vdf via the native picker (when available) or a hidden <input>.
 * Returns null if the user cancelled.
 */
export async function openVdfFile(): Promise<OpenedFile | null> {
  if (hasFileSystemAccess()) {
    try {
      const [handle] = await (window as unknown as {
        showOpenFilePicker: (opts: unknown) => Promise<FileSystemFileHandle[]>;
      }).showOpenFilePicker({
        types: [{ description: 'Steam Input VDF', accept: { 'text/plain': ['.vdf'] } }],
        multiple: false,
      });
      if (!handle) return null;
      const file = await handle.getFile();
      const text = await file.text();
      return { name: file.name, text, handle };
    } catch (err) {
      // user cancelled
      if (err instanceof Error && err.name === 'AbortError') return null;
      throw err;
    }
  }
  return openViaInput();
}

function openViaInput(): Promise<OpenedFile | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.vdf,text/plain';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      const text = await file.text();
      resolve({ name: file.name, text });
    };
    input.click();
  });
}

/**
 * Save text to a file. If we have an existing handle from File System Access API,
 * write in place; otherwise trigger a download.
 */
export async function saveVdfFile(
  fileName: string,
  text: string,
  handle?: FileSystemFileHandle
): Promise<void> {
  if (handle && 'createWritable' in handle) {
    const writable = await (handle as unknown as {
      createWritable: () => Promise<{
        write: (data: string) => Promise<void>;
        close: () => Promise<void>;
      }>;
    }).createWritable();
    await writable.write(text);
    await writable.close();
    return;
  }
  triggerDownload(fileName, text);
}

function triggerDownload(fileName: string, text: string): void {
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
