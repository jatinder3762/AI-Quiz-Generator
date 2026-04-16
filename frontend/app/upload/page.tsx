"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getApiBase } from "@/lib/api";
import { authStore } from "@/lib/auth";
import {
  demoStore,
  demoResultsStore,
  DEMO_MAX_FILES,
  DEMO_MAX_FILE_SIZE_MB,
  DEMO_MAX_FILE_SIZE_BYTES,
  type DemoFile,
  type DemoQuestion,
  type DemoResult,
} from "@/lib/demo-store";

// ──── Types ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
type DemoQuiz = {
  title: string;
  num_questions: number;
  questions: DemoQuestion[];
};

// â”€â”€â”€ Demo upload + quiz panel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function DemoUploadPanel() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);
  const [demoFiles, setDemoFiles] = useState<DemoFile[]>([]);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [replaceTarget, setReplaceTarget] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState("");
  const [showUpload, setShowUpload] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // quiz generator state
  const [numQuestions, setNumQuestions] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [activeQuiz, setActiveQuiz] = useState<DemoQuiz | null>(null);

  // active quiz answer state
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [activeResultId, setActiveResultId] = useState<string | null>(null);

  // dynamic import of cache helpers (client-only, avoids SSR issues)
  const cacheRef = useRef<{
    cacheFile: (id: string, f: File) => Promise<void>;
    getCachedFile: (id: string) => Promise<File | null>;
    removeCachedFile: (id: string) => Promise<void>;
  } | null>(null);

  useEffect(() => {
    import("@/lib/demo-file-cache").then((m) => { cacheRef.current = m; });
    const files = demoStore.getFiles();
    setDemoFiles(files);
    // auto-check all files on mount
    setCheckedIds(new Set(files.map((f) => f.id)));
    // show upload area if no files yet
    if (files.length === 0) setShowUpload(true);
  }, []);

  function refresh(newIds?: Set<string>) {
    const files = demoStore.getFiles();
    setDemoFiles(files);
    if (newIds !== undefined) {
      setCheckedIds(newIds);
    } else {
      // keep only IDs that still exist
      setCheckedIds((prev) => new Set([...prev].filter((id) => files.some((f) => f.id === id))));
    }
    if (files.length === 0) setShowUpload(true);
  }

  function toggleCheck(id: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;
    await processFiles(files, replaceTarget);
    e.target.value = "";
  }

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) => {
      const ext = f.name.split(".").pop()?.toLowerCase();
      return ext === "pdf" || ext === "docx";
    });
    if (files.length === 0) {
      setUploadError("Only PDF or DOCX files are accepted.");
      return;
    }
    await processFiles(files, null);
  }, [demoFiles]); // eslint-disable-line react-hooks/exhaustive-deps

  async function processFiles(files: File[], replaceId: string | null) {
    setUploadError("");
    setUploadSuccess("");

    if (replaceId) {
      // replace mode: only use the first file
      const f = files[0];
      if (f.size > DEMO_MAX_FILE_SIZE_BYTES) {
        setUploadError(`"${f.name}" exceeds the ${DEMO_MAX_FILE_SIZE_MB} MB demo limit.`);
        return;
      }
      cacheRef.current?.removeCachedFile(replaceId);
      const entry = demoStore.replaceFile(replaceId, f);
      await cacheRef.current?.cacheFile(entry.id, f);
      setReplaceTarget(null);
      setUploadSuccess(`"${f.name}" replaced successfully.`);
      setShowUpload(false);
      refresh(new Set([entry.id]));
      return;
    }

    const currentFiles = demoStore.getFiles();
    const slotsLeft = DEMO_MAX_FILES - currentFiles.length;
    if (slotsLeft <= 0) {
      setUploadError(`Demo limit of ${DEMO_MAX_FILES} files reached. Remove a file or register for full access.`);
      return;
    }

    const toAdd = files.slice(0, slotsLeft);
    const skipped = files.length - toAdd.length;
    const newIds = new Set<string>();
    const added: string[] = [];
    const errors: string[] = [];

    for (const f of toAdd) {
      if (f.size > DEMO_MAX_FILE_SIZE_BYTES) {
        errors.push(`"${f.name}" exceeds the ${DEMO_MAX_FILE_SIZE_MB} MB limit.`);
        continue;
      }
      const entry = demoStore.addFile(f);
      await cacheRef.current?.cacheFile(entry.id, f);
      newIds.add(entry.id);
      added.push(f.name);
    }

    if (errors.length > 0) {
      setUploadError(errors.join(" "));
    }
    if (added.length > 0) {
      const msg = added.length === 1
        ? `"${added[0]}" uploaded and ready.`
        : `${added.length} files uploaded and ready.`;
      setUploadSuccess(skipped > 0 ? `${msg} (${skipped} skipped — limit reached)` : msg);
    }

    if (newIds.size > 0) {
      setShowUpload(false);
      setActiveQuiz(null);
      setAnswers({});
      setSubmitted(false);
      setGenError("");
      // merge new IDs with existing checked IDs
      refresh(new Set([...checkedIds, ...newIds]));
    }
  }

  function triggerReplace(id: string) {
    setReplaceTarget(id);
    replaceInputRef.current?.click();
  }

  async function removeFile(id: string) {
    demoStore.removeFile(id);
    cacheRef.current?.removeCachedFile(id);
    setActiveQuiz(null);
    setAnswers({});
    setSubmitted(false);
    refresh();
  }

  async function generateQuiz(e: FormEvent) {
    e.preventDefault();
    setGenError("");
    setActiveQuiz(null);
    setAnswers({});
    setSubmitted(false);

    if (checkedIds.size === 0) {
      setGenError("Check at least one file to generate from.");
      return;
    }

    // Retrieve blobs from IndexedDB for each checked file
    const blobs: File[] = [];
    for (const id of checkedIds) {
      const blob = await cacheRef.current?.getCachedFile(id);
      if (blob) {
        blobs.push(blob);
      } else {
        const meta = demoFiles.find((f) => f.id === id);
        setGenError(`File "${meta?.filename ?? id}" is not in cache. Please re-upload it.`);
        return;
      }
    }

    setGenerating(true);
    try {
      const form = new FormData();
      for (const f of blobs) form.append("files", f);
      form.append("num_questions", String(numQuestions));

      const res = await fetch(`${getApiBase()}/demo/generate-quiz`, {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Generation failed" }));
        throw new Error(err.detail || "Generation failed");
      }
      const quiz: DemoQuiz = await res.json();
      setActiveQuiz(quiz);

      // Persist quiz to localStorage so results are viewable later
      const resultId = crypto.randomUUID();
      setActiveResultId(resultId);
      const result: DemoResult = {
        id: resultId,
        title: quiz.title,
        generatedAt: new Date().toISOString(),
        numQuestions: quiz.num_questions,
        questions: quiz.questions,
        answers: {},
        submittedAt: null,
        score: null,
      };
      demoResultsStore.save(result);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Quiz generation failed");
    } finally {
      setGenerating(false);
    }
  }

  const score = submitted && activeQuiz
    ? (() => {
        const correct = activeQuiz.questions.filter((q) => answers[q.id] === q.correct_answer).length;
        return { correct, total: activeQuiz.questions.length, pct: Math.round((correct / activeQuiz.questions.length) * 100) };
      })()
    : null;

  const atLimit = demoFiles.length >= DEMO_MAX_FILES;

  return (
    <section className="space-y-5 py-6">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-3xl font-bold">Upload &amp; Generate Quiz</h1>
        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">Demo Mode</span>
      </div>

      {/* Hidden inputs — multi for normal, single for replace */}
      <input ref={fileInputRef} type="file" accept=".pdf,.docx" multiple className="hidden" onChange={handleFileChange} />
      <input ref={replaceInputRef} type="file" accept=".pdf,.docx" className="hidden" onChange={handleFileChange} />

      {/* Error / success banners */}
      {uploadError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          &#9888; {uploadError}
        </div>
      )}
      {uploadSuccess && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          &#10004; {uploadSuccess}
        </div>
      )}

      {/* Main card: file list + generate form */}
      <Card className="p-5">
        <div className="mb-1 flex items-center justify-between">
          <h2 className="font-semibold">
            Your Files
            <span className="ml-2 text-xs font-normal text-zinc-400">
              {demoFiles.length}/{DEMO_MAX_FILES} slot &middot; {DEMO_MAX_FILE_SIZE_MB} MB max
            </span>
          </h2>
          <Link href="/register" className="text-xs font-semibold text-primary hover:underline">
            Upgrade for more &rarr;
          </Link>
        </div>

        {/* File list with checkboxes */}
        {demoFiles.length === 0 ? (
          <div className="mt-3 rounded-xl border border-dashed border-zinc-300 p-8 text-center">
            <p className="text-sm text-zinc-500">No file uploaded yet.</p>
          </div>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-100 rounded-xl border border-zinc-200">
            {demoFiles.map((f) => {
              const checked = checkedIds.has(f.id);
              return (
                <li key={f.id} className={`flex items-center gap-3 px-4 py-3 transition ${checked ? "bg-primary/5" : "bg-white"}`}>
                  {/* Checkbox */}
                  <input
                    id={`check-${f.id}`}
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleCheck(f.id)}
                    className="h-4 w-4 shrink-0 cursor-pointer rounded border-zinc-300 accent-primary"
                  />
                  {/* File info */}
                  <label htmlFor={`check-${f.id}`} className="flex-1 cursor-pointer min-w-0">
                    <p className="truncate text-sm font-medium">{f.filename}</p>
                    <p className="text-xs text-zinc-400">
                      {(f.sizeBytes / 1024).toFixed(1)} KB &middot; {new Date(f.uploadedAt).toLocaleDateString()}
                    </p>
                  </label>
                  {/* Actions */}
                  <div className="flex shrink-0 items-center gap-3">
                    <button
                      type="button"
                      onClick={() => triggerReplace(f.id)}
                      className="text-xs font-semibold text-zinc-400 hover:text-zinc-700"
                    >
                      Replace
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFile(f.id)}
                      className="text-xs font-semibold text-red-400 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {/* Upload area — shown when empty OR when user clicks "Add file" */}
        {(demoFiles.length === 0 || showUpload) && !atLimit && (
          <div
            className={`mt-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-zinc-300 bg-zinc-50 hover:border-primary/50"
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center gap-3">
              <svg className={`h-10 w-10 ${isDragging ? "text-primary" : "text-zinc-400"}`} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              <div>
                <p className="text-sm font-medium text-zinc-700">
                  {isDragging ? "Drop files here" : "Drag & drop files here"}
                </p>
                <p className="mt-0.5 text-xs text-zinc-400">
                  PDF or DOCX · max {DEMO_MAX_FILE_SIZE_MB} MB each · up to {DEMO_MAX_FILES} files
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setReplaceTarget(null); fileInputRef.current?.click(); }}
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
                >
                  Choose Files
                </button>
                {demoFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowUpload(false)}
                    className="rounded-xl border border-zinc-300 px-4 py-2 text-sm text-zinc-500 hover:bg-zinc-100"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* "Add more files" link — only if limit not reached and upload area hidden */}
        {!showUpload && !atLimit && demoFiles.length > 0 && (
          <button
            type="button"
            onClick={() => setShowUpload(true)}
            className="mt-3 text-xs font-semibold text-primary hover:underline"
          >
            + Add another file
          </button>
        )}

        {atLimit && !showUpload && (
          <p className="mt-3 text-xs text-zinc-500">
            Limit reached. Replace or remove to swap your file, or{" "}
            <Link href="/register" className="font-semibold text-primary underline">register for full access</Link>.
          </p>
        )}

        {/* Generate form — shown when files exist */}
        {demoFiles.length > 0 && (
          <>
            <hr className="my-5 border-zinc-100" />
            <form className="space-y-4" onSubmit={generateQuiz}>
              <p className="text-sm font-semibold text-zinc-700">
                {checkedIds.size === 0
                  ? "Check file(s) above to generate a quiz"
                  : `Generate from ${checkedIds.size} selected file${checkedIds.size > 1 ? "s" : ""}`}
              </p>

              <div className="flex flex-wrap items-end gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500">
                    Number of questions (1–50)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(Math.min(50, Math.max(1, Number(e.target.value))))}
                    className="w-28 rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <Button type="submit" disabled={generating || checkedIds.size === 0}>
                  {generating ? "Generating..." : "Generate Quiz"}
                </Button>
              </div>

              {genError && (
                <p className="text-sm text-red-600">&#9888; {genError}</p>
              )}
            </form>
          </>
        )}
      </Card>

      {/* Active quiz */}
      {activeQuiz && (
        <Card className="p-5">
          <h2 className="font-display text-2xl font-bold">{activeQuiz.title}</h2>
          <p className="mt-1 text-sm text-zinc-500">
            {activeQuiz.num_questions} questions &middot; medium difficulty
          </p>

          <form
            className="mt-5 space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              setSubmitted(true);
              if (activeResultId && activeQuiz) {
                const correct = activeQuiz.questions.filter((q) => answers[q.id] === q.correct_answer).length;
                const total = activeQuiz.questions.length;
                demoResultsStore.update(activeResultId, {
                  answers,
                  submittedAt: new Date().toISOString(),
                  score: { correct, total, pct: Math.round((correct / total) * 100) },
                });
              }
            }}
          >
            {activeQuiz.questions.map((q, i) => (
              <div key={q.id} className="rounded-xl border border-zinc-200 p-4">
                <p className="font-medium">{i + 1}. {q.prompt}</p>
                <div className="mt-3 grid gap-2">
                  {Object.entries(q.options).map(([key, value]) => {
                    const selected = answers[q.id] === key;
                    const showCorrect = submitted && key === q.correct_answer;
                    const showWrong = submitted && selected && key !== q.correct_answer;
                    return (
                      <label
                        key={key}
                        className={`cursor-pointer rounded-lg border px-3 py-2 text-sm transition ${
                          showCorrect
                            ? "border-green-500 bg-green-50"
                            : showWrong
                            ? "border-red-500 bg-red-50"
                            : selected
                            ? "border-primary bg-primary/5"
                            : "border-zinc-200 hover:border-zinc-400"
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          value={key}
                          checked={selected}
                          disabled={submitted}
                          onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: key }))}
                          className="mr-2"
                        />
                        <span className="font-semibold">{key}.</span> {value}
                      </label>
                    );
                  })}
                </div>
                {submitted && (
                  <p className="mt-2 text-xs text-zinc-500">
                    <span className="font-semibold">Explanation:</span> {q.explanation}
                  </p>
                )}
              </div>
            ))}

            <div className="flex flex-wrap gap-3">
              <Button type="submit" disabled={submitted}>Submit Quiz</Button>
              <Button type="button" variant="secondary" onClick={() => { setAnswers({}); setSubmitted(false); }}>
                Reset
              </Button>
              <Button type="button" variant="secondary" onClick={() => { setActiveQuiz(null); setAnswers({}); setSubmitted(false); setActiveResultId(null); }}>
                New Quiz
              </Button>
              {submitted && activeResultId && (
                <Link
                  href={`/demo/results/${activeResultId}`}
                  className="inline-flex items-center rounded-xl border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5"
                >
                  View Full Result →
                </Link>
              )}
            </div>
          </form>

          {score && (
            <div className={`mt-5 rounded-xl border p-4 ${score.pct >= 80 ? "border-green-200 bg-green-50" : score.pct >= 50 ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50"}`}>
              <p className="font-display text-lg font-bold">
                Score: {score.correct}/{score.total} ({score.pct}%)
              </p>
              <p className="mt-1 text-sm text-zinc-600">
                {score.pct >= 80
                  ? "Excellent work! Keep it up."
                  : score.pct >= 50
                  ? "Good effort - review the explanations above."
                  : "Keep studying - the explanations above will help."}
              </p>
            </div>
          )}
        </Card>
      )}

      {/* Upgrade CTA */}
      <Card className="flex items-center justify-between gap-4 border-primary/30 bg-primary/5 p-5">
        <div>
          <p className="font-semibold text-primary">Want unlimited uploads &amp; AI quizzes?</p>
          <p className="mt-0.5 text-sm text-zinc-600">Register a free account to unlock the full experience.</p>
        </div>
        <Link href="/register" className="shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">
          Get Full Access
        </Link>
      </Card>
    </section>
  );
}
// â”€â”€â”€ Real upload panel (authenticated) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function UploadPageContent() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [isDraggingAuth, setIsDraggingAuth] = useState(false);
  const authDropRef = useRef<HTMLDivElement>(null);
  const [uploadError, setUploadError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setIsDemo(authStore.isDemo());
    setReady(true);
  }, []);

  async function onUpload(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploadError("");
    setUploading(true);

    const token = authStore.getToken();
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${getApiBase()}/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!response.ok) throw new Error(await response.text());
      router.push("/generate");
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (!ready) return null;
  if (isDemo) return <DemoUploadPanel />;

  return (
    <section className="mx-auto max-w-xl py-10">
      <h1 className="font-display text-3xl font-bold">Upload Study Material</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Supports PDF and DOCX · max 15 MB. After upload you can pick files and generate a quiz.
      </p>

      <form className="mt-6" onSubmit={onUpload}>
        <div
          ref={authDropRef}
          className={`rounded-2xl border-2 border-dashed p-12 text-center transition-colors cursor-pointer ${
            isDraggingAuth ? "border-primary bg-primary/5" : "border-zinc-300 bg-zinc-50 hover:border-primary/50"
          }`}
          onDragOver={(e) => { e.preventDefault(); setIsDraggingAuth(true); }}
          onDragEnter={(e) => { e.preventDefault(); setIsDraggingAuth(true); }}
          onDragLeave={() => setIsDraggingAuth(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDraggingAuth(false);
            const dropped = e.dataTransfer.files[0];
            if (dropped) setFile(dropped);
          }}
          onClick={() => authDropRef.current?.querySelector("input")?.click()}
        >
          <svg className={`mx-auto h-12 w-12 ${isDraggingAuth ? "text-primary" : "text-zinc-400"}`} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          {file ? (
            <p className="mt-3 text-base font-semibold text-zinc-800">{file.name}</p>
          ) : (
            <p className="mt-3 text-sm font-medium text-zinc-600">
              {isDraggingAuth ? "Drop file here" : "Drag & drop or click to choose a file"}
            </p>
          )}
          <p className="mt-1 text-xs text-zinc-400">PDF or DOCX · max 15 MB</p>
          <input type="file" accept=".pdf,.docx" className="hidden" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
        </div>

        {uploadError && (
          <p className="mt-3 text-sm text-red-600">⚠ {uploadError}</p>
        )}

        <Button type="submit" disabled={!file || uploading} className="mt-5 w-full">
          {uploading ? "Uploading…" : "Upload Document"}
        </Button>
      </form>
    </section>
  );
}

export default function UploadPage() {
  return (
    <Suspense fallback={<section className="py-6">Loading…</section>}>
      <UploadPageContent />
    </Suspense>
  );
}

