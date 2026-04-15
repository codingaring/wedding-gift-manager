// File System Access API type declarations (Chrome/Edge)

interface FileSystemFileHandle {
  getFile(): Promise<File>;
  createWritable(): Promise<FileSystemWritableFileStream>;
  queryPermission(opts?: { mode?: "read" | "readwrite" }): Promise<PermissionState>;
  requestPermission(opts?: { mode?: "read" | "readwrite" }): Promise<PermissionState>;
}

interface FileSystemWritableFileStream extends WritableStream {
  write(data: string | Blob | ArrayBuffer | ArrayBufferView): Promise<void>;
  close(): Promise<void>;
}

interface FilePickerAcceptType {
  description?: string;
  accept: Record<string, string[]>;
}

interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: FilePickerAcceptType[];
}

interface OpenFilePickerOptions {
  types?: FilePickerAcceptType[];
  multiple?: boolean;
}

interface Window {
  showSaveFilePicker(options?: SaveFilePickerOptions): Promise<FileSystemFileHandle>;
  showOpenFilePicker(options?: OpenFilePickerOptions): Promise<FileSystemFileHandle[]>;
}
