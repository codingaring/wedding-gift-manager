// File System Access API 기반 자동 백업
// Chrome/Edge 지원, Safari/Firefox는 수동 다운로드 폴백

const STORAGE_KEY = "wedding-backup-handle";

interface BackupData {
  version: 1;
  exportedAt: string;
  guestStore: unknown;
  budgetStore: unknown;
}

// --- File Handle 관리 ---

let cachedHandle: FileSystemFileHandle | null = null;

export function isFileSystemAccessSupported(): boolean {
  return "showSaveFilePicker" in window;
}

export async function pickBackupFile(): Promise<FileSystemFileHandle | null> {
  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: "wedding-backup.json",
      types: [
        {
          description: "JSON 백업 파일",
          accept: { "application/json": [".json"] },
        },
      ],
    });
    cachedHandle = handle;
    // IndexedDB에 handle 저장 (localStorage에는 저장 불가)
    await saveHandleToIDB(handle);
    return handle;
  } catch {
    // 사용자가 취소
    return null;
  }
}

export async function getStoredHandle(): Promise<FileSystemFileHandle | null> {
  if (cachedHandle) return cachedHandle;
  try {
    const handle = await loadHandleFromIDB();
    if (handle) {
      // 권한 확인
      const perm = await handle.queryPermission({ mode: "readwrite" });
      if (perm === "granted") {
        cachedHandle = handle;
        return handle;
      }
    }
  } catch {
    // IDB 접근 실패
  }
  return null;
}

export async function requestPermission(
  handle: FileSystemFileHandle,
): Promise<boolean> {
  try {
    const perm = await handle.requestPermission({ mode: "readwrite" });
    if (perm === "granted") {
      cachedHandle = handle;
      return true;
    }
  } catch {
    // 거부됨
  }
  return false;
}

// --- 백업 쓰기 ---

export async function writeBackup(
  handle: FileSystemFileHandle,
): Promise<boolean> {
  try {
    const data = buildBackupData();
    const writable = await handle.createWritable();
    await writable.write(JSON.stringify(data, null, 2));
    await writable.close();
    return true;
  } catch {
    return false;
  }
}

export async function autoSave(): Promise<{ success: boolean; needsSetup: boolean }> {
  if (!isFileSystemAccessSupported()) {
    return { success: false, needsSetup: false };
  }

  const handle = await getStoredHandle();
  if (!handle) {
    return { success: false, needsSetup: true };
  }

  const success = await writeBackup(handle);
  return { success, needsSetup: false };
}

// --- 백업 읽기 ---

export async function loadFromFile(): Promise<BackupData | null> {
  try {
    const [handle] = await window.showOpenFilePicker({
      types: [
        {
          description: "JSON 백업 파일",
          accept: { "application/json": [".json"] },
        },
      ],
    });
    const file = await handle.getFile();
    const text = await file.text();
    const data = JSON.parse(text) as BackupData;

    if (data.version !== 1) {
      throw new Error("Invalid backup format");
    }

    return data;
  } catch {
    return null;
  }
}

export async function loadFromHandle(
  handle: FileSystemFileHandle,
): Promise<BackupData | null> {
  try {
    const file = await handle.getFile();
    const text = await file.text();
    if (!text.trim()) return null;
    const data = JSON.parse(text) as BackupData;
    if (data.version !== 1) return null;
    return data;
  } catch {
    return null;
  }
}

// --- 수동 다운로드 폴백 (Safari/Firefox) ---

export function downloadBackup(): void {
  const data = buildBackupData();
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `wedding-backup-${new Date().toISOString().split("T")[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function uploadBackup(): Promise<BackupData | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      try {
        const text = await file.text();
        const data = JSON.parse(text) as BackupData;
        if (data.version !== 1) {
          throw new Error("Invalid backup format");
        }
        resolve(data);
      } catch {
        resolve(null);
      }
    };
    input.click();
  });
}

// --- 내부 헬퍼 ---

function buildBackupData(): BackupData {
  const guestRaw = localStorage.getItem("wedding-gift-admin");
  const budgetRaw = localStorage.getItem("wedding-budget");
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    guestStore: guestRaw ? JSON.parse(guestRaw) : null,
    budgetStore: budgetRaw ? JSON.parse(budgetRaw) : null,
  };
}

export function restoreBackupData(data: BackupData): void {
  if (data.guestStore) {
    localStorage.setItem(
      "wedding-gift-admin",
      JSON.stringify(data.guestStore),
    );
  }
  if (data.budgetStore) {
    localStorage.setItem(
      "wedding-budget",
      JSON.stringify(data.budgetStore),
    );
  }
}

// --- IndexedDB로 FileHandle 저장 ---

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("wedding-backup", 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore("handles");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveHandleToIDB(handle: FileSystemFileHandle): Promise<void> {
  const db = await openIDB();
  const tx = db.transaction("handles", "readwrite");
  tx.objectStore("handles").put(handle, STORAGE_KEY);
  await new Promise<void>((res, rej) => {
    tx.oncomplete = () => res();
    tx.onerror = () => rej(tx.error);
  });
}

async function loadHandleFromIDB(): Promise<FileSystemFileHandle | null> {
  const db = await openIDB();
  const tx = db.transaction("handles", "readonly");
  const req = tx.objectStore("handles").get(STORAGE_KEY);
  return new Promise((resolve) => {
    req.onsuccess = () => resolve(req.result ?? null);
    req.onerror = () => resolve(null);
  });
}
