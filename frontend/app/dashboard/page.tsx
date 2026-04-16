"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { authStore } from "@/lib/auth";
import { demoStore, demoResultsStore, DEMO_MAX_FILES, DEMO_MAX_FILE_SIZE_MB, type DemoFile } from "@/lib/demo-store";
import { DocumentItem } from "@/types";

type DocsResponse = { items: DocumentItem[] };
type QuizSummary = {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  num_questions: number;
  is_submitted: boolean;
  score_percentage: number | null;
  created_at: string;
};
type QuizzesResponse = { items: QuizSummary[] };

function DemoDashboard() {
  const [demoFiles, setDemoFiles] = useState<DemoFile[]>([]);
  const [quizCount, setQuizCount] = useState(0);
  const [avgScore, setAvgScore] = useState<number | null>(null);

  useEffect(() => {
    const refresh = () => {
      setDemoFiles(demoStore.getFiles());
      const results = demoResultsStore.getAll();
      setQuizCount(results.length);
      const scored = results.filter((r) => r.score !== null);
      setAvgScore(
        scored.length
          ? Math.round(scored.reduce((a, r) => a + (r.score?.pct ?? 0), 0) / scored.length)
          : null
      );
    };
    refresh();
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  function removeFile(id: string) {
    demoStore.removeFile(id);
    setDemoFiles(demoStore.getFiles());
  }

  return (
    <section className="space-y-6 py-6">
      {/* Profile card */}
      <Card className="flex items-center gap-5 p-5">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-amber-100 text-3xl">
          🧪
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-xl font-bold">Demo User</h2>
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
              Demo Mode
            </span>
          </div>
          <p className="mt-0.5 text-sm text-zinc-500">demo@example.com</p>
          <p className="mt-1 text-xs text-zinc-400">
            Limited to {DEMO_MAX_FILES} files · {DEMO_MAX_FILE_SIZE_MB} MB each · No data sent to server
          </p>
        </div>
        <Link
          href="/register"
          className="shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          Register for Full Access
        </Link>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-zinc-500">Uploaded Documents</p>
          <p className="mt-2 text-2xl font-bold">{demoFiles.length}</p>
          <p className="mt-0.5 text-xs text-zinc-400">{DEMO_MAX_FILES - demoFiles.length} slots remaining</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-zinc-500">Generated Quizzes</p>
          <p className="mt-2 text-2xl font-bold">{quizCount}</p>
          {quizCount > 0 ? (
            <Link href="/demo/results" className="mt-0.5 text-xs font-semibold text-primary hover:underline">
              View all results →
            </Link>
          ) : (
            <p className="mt-0.5 text-xs text-zinc-400">Available after upload</p>
          )}
        </Card>
        <Card className="p-4">
          <p className="text-sm text-zinc-500">Average Score</p>
          <p className="mt-2 text-2xl font-bold">{avgScore !== null ? `${avgScore}%` : "—"}</p>
          <p className="mt-0.5 text-xs text-zinc-400">{avgScore !== null ? "Across submitted quizzes" : "No quizzes taken yet"}</p>
        </Card>
      </div>

      {/* Files */}
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Your Demo Files</h2>
          <Link href="/upload" className="rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-white">
            Upload File
          </Link>
        </div>
        {demoFiles.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center">
            <p className="text-sm text-zinc-500">No files uploaded yet.</p>
            <Link href="/upload" className="mt-2 inline-block text-sm font-semibold text-primary">
              Upload your first file →
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {demoFiles.map((f) => (
              <li key={f.id} className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <p className="font-medium">{f.filename}</p>
                  <p className="text-xs text-zinc-500">
                    {(f.sizeBytes / 1024).toFixed(1)} KB · {new Date(f.uploadedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link href="/upload" className="text-sm font-semibold text-primary">Generate Quiz</Link>
                  <button
                    type="button"
                    onClick={() => removeFile(f.id)}
                    className="text-sm font-semibold text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Recent quiz results */}
      {quizCount > 0 && (
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Recent Quizzes</h2>
            <Link href="/demo/results" className="text-xs font-semibold text-primary hover:underline">
              View all →
            </Link>
          </div>
          <ul className="space-y-2">
            {demoResultsStore.getAll().slice(0, 5).map((r) => (
              <li key={r.id} className="flex items-center justify-between rounded-xl border p-3">
                <div>
                  <p className="font-medium">{r.title}</p>
                  <p className="text-xs text-zinc-500">
                    {r.numQuestions} questions · {new Date(r.generatedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {r.score !== null ? (
                    <span className={`text-sm font-bold ${r.score.pct >= 80 ? "text-green-600" : r.score.pct >= 50 ? "text-amber-600" : "text-red-500"}`}>
                      {r.score.pct}%
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-400">Not submitted</span>
                  )}
                  <Link href={`/demo/results/${r.id}`} className="text-sm font-semibold text-primary">
                    View
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Upgrade prompt */}
      <Card className="flex items-center justify-between gap-4 border-primary/30 bg-primary/5 p-5">
        <div>
          <p className="font-semibold text-primary">Want unlimited uploads &amp; real AI quizzes?</p>
          <p className="mt-0.5 text-sm text-zinc-600">Register a free account to unlock the full experience.</p>
        </div>
        <Link href="/register" className="shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">
          Get Full Access
        </Link>
      </Card>
    </section>
  );
}

export default function DashboardPage() {
  const [isDemo, setIsDemo] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setIsDemo(authStore.isDemo());
    setReady(true);
  }, []);

  const { data, isLoading, error } = useQuery({
    queryKey: ["documents"],
    queryFn: () => apiFetch<DocsResponse>("/documents"),
    enabled: ready && !isDemo,
  });
  const quizzesQuery = useQuery({
    queryKey: ["quizzes"],
    queryFn: () => apiFetch<QuizzesResponse>("/quizzes"),
    enabled: ready && !isDemo,
  });

  if (!ready) return null;
  if (isDemo) return <DemoDashboard />;

  const scored = (quizzesQuery.data?.items || []).filter((q) => q.score_percentage !== null);
  const average = scored.length
    ? Math.round(scored.reduce((acc, q) => acc + (q.score_percentage || 0), 0) / scored.length)
    : 0;

  return (
    <section className="space-y-6 py-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-3xl font-bold">Dashboard</h1>
        <Link href="/upload" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">
          Upload New Document
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm text-zinc-500">Uploaded Documents</p>
          <p className="mt-2 text-2xl font-bold">{data?.items.length ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-zinc-500">Generated Quizzes</p>
          <p className="mt-2 text-2xl font-bold">{quizzesQuery.data?.items.length ?? 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-zinc-500">Average Score</p>
          <p className="mt-2 text-2xl font-bold">{average}%</p>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 font-semibold">Your Documents</h2>
        {isLoading ? <p>Loading...</p> : null}
        {error ? <p className="text-red-600">{String(error)}</p> : null}
        <ul className="space-y-2">
          {(data?.items ?? []).map((doc) => (
            <li key={doc.id} className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="font-medium">{doc.filename}</p>
                <p className="text-xs text-zinc-500">{new Date(doc.created_at).toLocaleString()}</p>
              </div>
              <Link href={`/upload?documentId=${doc.id}`} className="text-sm font-semibold text-primary">
                Generate Quiz
              </Link>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">Quiz History</h2>
          <Link href="/dashboard/results" className="text-xs font-semibold text-primary hover:underline">View all results →</Link>
        </div>
        <ul className="space-y-2">
          {(quizzesQuery.data?.items ?? []).map((quiz) => (
            <li key={quiz.id} className="flex items-center justify-between rounded-xl border p-3">
              <div>
                <p className="font-medium">{quiz.title}</p>
                <p className="text-xs text-zinc-500">
                  {quiz.difficulty} • {quiz.num_questions} questions • {new Date(quiz.created_at).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">
                  {quiz.score_percentage !== null ? `${quiz.score_percentage}%` : "Not submitted"}
                </span>
                <Link href={`/quiz/${quiz.id}`} className="text-sm font-semibold text-primary">
                  Open
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  );
}
