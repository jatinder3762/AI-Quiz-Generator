"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { authStore } from "@/lib/auth";

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

const difficultyColor: Record<string, string> = {
  easy: "bg-green-100 text-green-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-red-100 text-red-700",
};

function scoreBadge(pct: number | null) {
  if (pct === null) return { label: "Not submitted", cls: "bg-zinc-100 text-zinc-500" };
  if (pct >= 80) return { label: `${pct}%`, cls: "bg-green-100 text-green-700" };
  if (pct >= 50) return { label: `${pct}%`, cls: "bg-amber-100 text-amber-700" };
  return { label: `${pct}%`, cls: "bg-red-100 text-red-700" };
}

export default function MyResultsPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["quizzes"],
    queryFn: () => apiFetch<QuizzesResponse>("/quizzes"),
    enabled: ready,
  });

  const quizzes = data?.items ?? [];
  const submitted = quizzes.filter((q) => q.is_submitted);
  const pending = quizzes.filter((q) => !q.is_submitted);

  const avg =
    submitted.length > 0
      ? Math.round(submitted.reduce((acc, q) => acc + (q.score_percentage ?? 0), 0) / submitted.length)
      : null;

  if (!ready || isLoading) {
    return (
      <section className="py-8">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-zinc-200" />
        <div className="mt-6 space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-zinc-100" />
          ))}
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-8">
        <p className="text-red-600">Could not load results. {String(error)}</p>
        <Button className="mt-4" onClick={() => refetch()}>Retry</Button>
      </section>
    );
  }

  return (
    <section className="space-y-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">My Results</h1>
          <p className="mt-1 text-sm text-zinc-500">
            {submitted.length} completed quiz{submitted.length !== 1 ? "zes" : ""}
            {avg !== null && ` · avg score ${avg}%`}
          </p>
        </div>
        <Link href="/upload" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">
          New Quiz
        </Link>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Total Quizzes</p>
          <p className="mt-2 text-3xl font-bold">{quizzes.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Completed</p>
          <p className="mt-2 text-3xl font-bold text-primary">{submitted.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Average Score</p>
          <p className="mt-2 text-3xl font-bold">{avg !== null ? `${avg}%` : "—"}</p>
        </Card>
      </div>

      {/* Submitted results table */}
      {submitted.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="border-b border-zinc-100 px-5 py-4">
            <h2 className="font-semibold">Completed Quizzes</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-5 py-3 text-left">Quiz Title</th>
                  <th className="px-4 py-3 text-left">Difficulty</th>
                  <th className="px-4 py-3 text-center">Questions</th>
                  <th className="px-4 py-3 text-center">Score</th>
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-center">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {submitted.map((quiz) => {
                  const badge = scoreBadge(quiz.score_percentage);
                  return (
                    <tr key={quiz.id} className="transition hover:bg-zinc-50">
                      <td className="max-w-xs px-5 py-4">
                        <p className="truncate font-medium">{quiz.title}</p>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${difficultyColor[quiz.difficulty] ?? "bg-zinc-100 text-zinc-600"}`}>
                          {quiz.difficulty}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center text-zinc-600">{quiz.num_questions}</td>
                      <td className="px-4 py-4 text-center">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-4 py-4 text-zinc-500">
                        {new Date(quiz.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Link
                          href={`/results/${quiz.id}`}
                          className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Pending (not submitted) quizzes */}
      {pending.length > 0 && (
        <Card className="overflow-hidden p-0">
          <div className="border-b border-zinc-100 px-5 py-4">
            <h2 className="font-semibold">In Progress</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-50 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-5 py-3 text-left">Quiz Title</th>
                  <th className="px-4 py-3 text-left">Difficulty</th>
                  <th className="px-4 py-3 text-center">Questions</th>
                  <th className="px-4 py-3 text-left">Created</th>
                  <th className="px-4 py-3 text-center">Continue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {pending.map((quiz) => (
                  <tr key={quiz.id} className="transition hover:bg-zinc-50">
                    <td className="max-w-xs px-5 py-4">
                      <p className="truncate font-medium">{quiz.title}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${difficultyColor[quiz.difficulty] ?? "bg-zinc-100 text-zinc-600"}`}>
                        {quiz.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center text-zinc-600">{quiz.num_questions}</td>
                    <td className="whitespace-nowrap px-4 py-4 text-zinc-500">
                      {new Date(quiz.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Link
                        href={`/quiz/${quiz.id}`}
                        className="rounded-lg border border-primary px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/5"
                      >
                        Continue
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {quizzes.length === 0 && (
        <Card className="p-10 text-center">
          <p className="text-zinc-500">No quizzes yet.</p>
          <Link href="/upload" className="mt-3 inline-block rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white">
            Generate your first quiz
          </Link>
        </Card>
      )}
    </section>
  );
}
