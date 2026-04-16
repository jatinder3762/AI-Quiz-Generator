"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { apiFetch } from "@/lib/api";
import { authStore } from "@/lib/auth";
import { DocumentItem, Quiz } from "@/types";

type DocsResponse = { items: DocumentItem[] };

export default function GeneratePage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState("medium");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authStore.getToken()) {
      router.replace("/login");
      return;
    }
    setReady(true);
  }, [router]);

  const docsQuery = useQuery({
    queryKey: ["documents"],
    queryFn: () => apiFetch<DocsResponse>("/documents"),
    enabled: ready,
  });

  const docs = docsQuery.data?.items ?? [];

  function toggleCheck(id: string) {
    setCheckedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (checkedIds.size === docs.length) {
      setCheckedIds(new Set());
    } else {
      setCheckedIds(new Set(docs.map((d) => d.id)));
    }
  }

  // Animated progress bar while waiting for the LLM
  useEffect(() => {
    if (!generating) { setProgress(0); return; }
    setProgress(5);
    const steps = [
      { target: 30, delay: 800 },
      { target: 55, delay: 2000 },
      { target: 75, delay: 3500 },
      { target: 88, delay: 6000 },
      { target: 95, delay: 10000 },
    ];
    const timers: ReturnType<typeof setTimeout>[] = [];
    steps.forEach(({ target, delay }) => {
      timers.push(setTimeout(() => setProgress(target), delay));
    });
    return () => timers.forEach(clearTimeout);
  }, [generating]);

  async function onGenerate(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (checkedIds.size === 0) {
      setError("Please select at least one document.");
      return;
    }

    setGenerating(true);
    try {
      const quiz = await apiFetch<Quiz>("/generate-quiz", {
        method: "POST",
        body: JSON.stringify({
          document_ids: Array.from(checkedIds),
          num_questions: numQuestions,
          difficulty,
        }),
      });
      setProgress(100);
      // Small delay so the 100% bar is visible before navigation
      await new Promise((r) => setTimeout(r, 400));
      router.push(`/quiz/${quiz.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Quiz generation failed");
      setGenerating(false);
    }
  }

  if (!ready) return null;

  return (
    <>
      {/* Full-screen progress overlay */}
      {generating && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-white/90 backdrop-blur-sm">
          <div className="text-center">
            <p className="font-display text-2xl font-bold text-zinc-800">Generating your quiz…</p>
            <p className="mt-1 text-sm text-zinc-500">The AI is reading your documents and crafting questions. Please wait.</p>
          </div>
          <div className="w-80 overflow-hidden rounded-full bg-zinc-200">
            <div
              className="h-3 rounded-full bg-primary transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-sm font-semibold text-primary">{progress}%</p>
        </div>
      )}

      <section className="mx-auto max-w-2xl py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold">Generate Quiz</h1>
            <p className="mt-1 text-sm text-zinc-600">Select the documents you want questions from, then configure your quiz.</p>
          </div>
          <Link href="/upload" className="text-sm font-semibold text-primary hover:underline">
            + Upload new file
          </Link>
        </div>

        <form className="mt-8 space-y-6" onSubmit={onGenerate}>
          {/* Document selection */}
          <Card className="p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-zinc-800">Your Documents</h2>
              {docs.length > 0 && (
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-xs font-semibold text-primary hover:underline"
                >
                  {checkedIds.size === docs.length ? "Deselect all" : "Select all"}
                </button>
              )}
            </div>

            {docsQuery.isLoading && (
              <p className="mt-4 text-sm text-zinc-500">Loading documents…</p>
            )}

            {!docsQuery.isLoading && docs.length === 0 && (
              <div className="mt-4 rounded-xl border border-dashed border-zinc-300 p-8 text-center">
                <p className="text-sm text-zinc-500">No documents yet.</p>
                <Link href="/upload" className="mt-2 inline-block text-sm font-semibold text-primary hover:underline">
                  Upload your first file →
                </Link>
              </div>
            )}

            {docs.length > 0 && (
              <ul className="mt-3 divide-y divide-zinc-100 rounded-xl border border-zinc-200">
                {docs.map((doc) => {
                  const checked = checkedIds.has(doc.id);
                  return (
                    <li
                      key={doc.id}
                      className={`flex cursor-pointer items-center gap-3 px-4 py-3 transition ${checked ? "bg-primary/5" : "hover:bg-zinc-50"}`}
                      onClick={() => toggleCheck(doc.id)}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCheck(doc.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="h-4 w-4 shrink-0 cursor-pointer rounded border-zinc-300 accent-primary"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-zinc-800">{doc.filename}</p>
                        <p className="text-xs text-zinc-400">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      {checked && (
                        <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                          Selected
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {error && (
              <p className="mt-3 text-sm font-medium text-red-600">⚠ {error}</p>
            )}
          </Card>

          {/* Quiz settings */}
          {docs.length > 0 && (
            <Card className="p-5">
              <h2 className="font-semibold text-zinc-800">Quiz Settings</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500">Number of Questions (1–30)</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(Math.min(30, Math.max(1, Number(e.target.value))))}
                    disabled={generating}
                    className="w-full rounded-xl border border-zinc-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-zinc-500">Difficulty</label>
                  <Select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    disabled={generating}
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </Select>
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <Button
                  type="submit"
                  disabled={generating || checkedIds.size === 0}
                  className="px-8"
                >
                  {generating ? "Generating…" : `Generate Quiz from ${checkedIds.size} file${checkedIds.size !== 1 ? "s" : ""}`}
                </Button>
                {checkedIds.size === 0 && (
                  <p className="text-xs text-zinc-500">Select at least one document above</p>
                )}
              </div>
            </Card>
          )}
        </form>
      </section>
    </>
  );
}
