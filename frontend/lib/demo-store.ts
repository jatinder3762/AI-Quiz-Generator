"use client";

export const DEMO_MAX_FILES = 2;
export const DEMO_MAX_FILE_SIZE_MB = 5;
export const DEMO_MAX_FILE_SIZE_BYTES = DEMO_MAX_FILE_SIZE_MB * 1024 * 1024;

const DEMO_FILES_KEY = "aiq_demo_files";
const DEMO_RESULTS_KEY = "aiq_demo_results";

// ── Shared question type used by upload page and results pages ───────────
export type DemoQuestion = {
  id: string;
  prompt: string;
  options: Record<string, string>;
  correct_answer: string;
  explanation: string;
};

// ── Stored result (created on generate, updated on submit) ───────────────
export type DemoResult = {
  id: string;
  title: string;
  generatedAt: string;
  numQuestions: number;
  questions: DemoQuestion[];
  answers: Record<string, string>;
  submittedAt: string | null;
  score: { correct: number; total: number; pct: number } | null;
};

function loadResults(): DemoResult[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(DEMO_RESULTS_KEY) || "[]") as DemoResult[];
  } catch {
    return [];
  }
}

function saveResults(results: DemoResult[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEMO_RESULTS_KEY, JSON.stringify(results));
}

export const demoResultsStore = {
  getAll(): DemoResult[] {
    return loadResults().sort(
      (a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime()
    );
  },
  getById(id: string): DemoResult | null {
    return loadResults().find((r) => r.id === id) ?? null;
  },
  save(result: DemoResult): void {
    const results = loadResults().filter((r) => r.id !== result.id);
    saveResults([result, ...results]);
  },
  update(id: string, patch: Partial<DemoResult>): void {
    saveResults(loadResults().map((r) => (r.id === id ? { ...r, ...patch } : r)));
  },
  remove(id: string): void {
    saveResults(loadResults().filter((r) => r.id !== id));
  },
};

export type DemoFile = {
  id: string;
  filename: string;
  fileType: string;
  sizeBytes: number;
  uploadedAt: string;
};

function load(): DemoFile[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(DEMO_FILES_KEY) || "[]") as DemoFile[];
  } catch {
    return [];
  }
}

function save(files: DemoFile[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(DEMO_FILES_KEY, JSON.stringify(files));
}

export const demoStore = {
  getFiles(): DemoFile[] {
    return load();
  },
  addFile(file: File): DemoFile {
    const files = load();
    const entry: DemoFile = {
      id: crypto.randomUUID(),
      filename: file.name,
      fileType: file.type || file.name.split(".").pop() || "unknown",
      sizeBytes: file.size,
      uploadedAt: new Date().toISOString(),
    };
    save([...files, entry]);
    return entry;
  },
  replaceFile(replaceId: string, file: File): DemoFile {
    const files = load().filter((f) => f.id !== replaceId);
    const entry: DemoFile = {
      id: crypto.randomUUID(),
      filename: file.name,
      fileType: file.type || file.name.split(".").pop() || "unknown",
      sizeBytes: file.size,
      uploadedAt: new Date().toISOString(),
    };
    save([...files, entry]);
    return entry;
  },
  removeFile(id: string) {
    save(load().filter((f) => f.id !== id));
  },
  clear() {
    if (typeof window === "undefined") return;
    localStorage.removeItem(DEMO_FILES_KEY);
  },
  canUpload(): { ok: boolean; reason?: string } {
    const files = load();
    if (files.length >= DEMO_MAX_FILES) {
      return {
        ok: false,
        reason: `Demo accounts are limited to ${DEMO_MAX_FILES} files. Remove an existing file or register for full access.`,
      };
    }
    return { ok: true };
  },
};
