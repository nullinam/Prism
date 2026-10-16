export type TaskDraftFields = {
  text: string;
  values: [string, string, string, string];
  ratio: string;
  pageStart: string;
  pageEnd: string;
  customName: string;
};

export type TaskDraft = {
  toolId: number;
  toolName: string;
  savedAt: number;
  wasRunning: boolean;
  fields: TaskDraftFields;
  files: File[];
};

type StoredTaskDraft = Omit<TaskDraft, "files"> & {
  files: Array<{ blob: Blob; name: string; type: string; lastModified: number }>;
};

const DATABASE = "prism-task-recovery";
const STORE = "drafts";
const DB_VERSION = 1;

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(new Error("This browser does not support local task recovery."));
      return;
    }
    const request = indexedDB.open(DATABASE, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "toolId" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open local task storage."));
  });
}

export async function saveTaskDraft(draft: TaskDraft): Promise<void> {
  const db = await openDatabase();
  try {
    const stored: StoredTaskDraft = {
      ...draft,
      files: draft.files.map((file) => ({
        blob: file,
        name: file.name,
        type: file.type,
        lastModified: file.lastModified,
      })),
    };
    await new Promise<void>((resolve, reject) => {
      const request = db.transaction(STORE, "readwrite").objectStore(STORE).put(stored);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error("Could not save this local task."));
    });
  } finally {
    db.close();
  }
}

export async function restoreTaskDraft(toolId: number): Promise<TaskDraft | null> {
  const db = await openDatabase();
  try {
    const stored = await new Promise<StoredTaskDraft | undefined>((resolve, reject) => {
      const request = db.transaction(STORE, "readonly").objectStore(STORE).get(toolId);
      request.onsuccess = () => resolve(request.result as StoredTaskDraft | undefined);
      request.onerror = () => reject(request.error ?? new Error("Could not read the saved task."));
    });
    if (!stored) return null;
    return {
      ...stored,
      files: stored.files.map(({ blob, name, type, lastModified }) => new File([blob], name, { type, lastModified })),
    };
  } finally {
    db.close();
  }
}

export async function clearTaskDraft(toolId: number): Promise<void> {
  const db = await openDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const request = db.transaction(STORE, "readwrite").objectStore(STORE).delete(toolId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error ?? new Error("Could not clear the local task."));
    });
  } finally {
    db.close();
  }
}

