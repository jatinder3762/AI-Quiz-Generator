"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Card } from "@/components/ui/card";
import { demoResultsStore, type DemoResult } from "@/lib/demo-store";

export default function DemoResultsPage() {
  const [results, setResults] = useState<DemoResult[]>([]);

  useEffect(() => {
    setResults(demoResultsStore.getAll());
  }, []);

  function handleDelete(id: string) {
    demoResultsStore.remove(id);
    setResults(demoResultsStore.getAll());
  }

  return (
    <section className="space-y-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard"
            className="text-sm font-semibold text-zinc-500 hover:text-zinc-800"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="mt-2 font-display text-3xl font-bold">My Quiz Results</h1>
          <p className="mt-1 text-sm text-zinc-500">
            All quizzes you generated during this demo session.
          </p>
        </div>
        <Link
          href="/upload"
          className="shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          Generate New Quiz
        </Link>
      </div>

      {results.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-zinc-500">No quizzes generated yet.</p>
          <Link
            href="/upload"
            className="mt-3 inline-block text-sm font-semibold text-primary hover:underline"
          >
            Upload a file and generate your first quiz →
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {results.map((r) => {
            const scoreBg =
              r.score === null
                ? "border-zinc-200"
                : r.score.pct >= 80
                ? "border-green-200 bg-green-50/40"
                : r.score.pct >= 50
                ? "border-amber-200 bg-amber-50/40"
                : "border-red-200 bg-red-50/40";

            return (
              <Card key={r.id} className={`flex items-center justify-between gap-4 border p-4 ${scoreBg}`}>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{r.title}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {r.numQuestions} questions &middot; Generated {new Date(r.generatedAt).toLocaleString()}
                    {r.submittedAt && (
                      <> &middot; Submitted {new Date(r.submittedAt).toLocaleString()}</>
                    )}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-4">
                  {r.score !== null ? (
                    <div className="text-right">
                      <p
                        className={`text-xl font-bold ${
                          r.score.pct >= 80
                            ? "text-green-600"
                            : r.score.pct >= 50
                            ? "text-amber-600"
                            : "text-red-500"
                        }`}
                      >
                        {r.score.pct}%
                      </p>
                      <p className="text-xs text-zinc-500">
                        {r.score.correct}/{r.score.total}
                      </p>
                    </div>
                  ) : (
                    <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-500">
                      Not submitted
                    </span>
                  )}

                  <Link
                    href={`/demo/results/${r.id}`}
                    className="rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90"
                  >
                    View
                  </Link>

                  <button
                    type="button"
                    onClick={() => handleDelete(r.id)}
                    className="text-xs font-semibold text-red-400 hover:text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Card className="flex items-center justify-between gap-4 border-primary/30 bg-primary/5 p-5">
        <div>
          <p className="font-semibold text-primary">Save your results permanently</p>
          <p className="mt-0.5 text-sm text-zinc-600">
            Demo results are stored in this browser only. Register a free account to keep them forever.
          </p>
        </div>
        <Link
          href="/register"
          className="shrink-0 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white"
        >
          Register Free
        </Link>
      </Card>
    </section>
  );
}
