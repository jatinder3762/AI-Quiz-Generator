"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";

import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
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

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["documents"],
    queryFn: () => apiFetch<DocsResponse>("/documents"),
  });
  const quizzesQuery = useQuery({
    queryKey: ["quizzes"],
    queryFn: () => apiFetch<QuizzesResponse>("/quizzes"),
  });

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
        <h2 className="mb-3 font-semibold">Quiz History</h2>
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
