"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { ScoreChart } from "@/components/score-chart";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getApiBase } from "@/lib/api";
import { authStore } from "@/lib/auth";
import { QuizResult } from "@/types";

export default function ResultsPage() {
  const params = useParams<{ quizId: string }>();

  const { data, isLoading, error } = useQuery({
    queryKey: ["results", params.quizId],
    queryFn: async () => {
      const token = authStore.getToken();
      const response = await fetch(`${getApiBase()}/results/${params.quizId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error(await response.text());
      return (await response.json()) as QuizResult;
    },
  });

  if (isLoading) {
    return (
      <section className="space-y-4 py-8">
        <div className="h-8 w-64 animate-pulse rounded-xl bg-zinc-200" />
        <div className="h-32 animate-pulse rounded-xl bg-zinc-100" />
        <div className="h-64 animate-pulse rounded-xl bg-zinc-100" />
      </section>
    );
  }
  if (error || !data) return <p className="py-8 text-red-600">Could not load results.</p>;

  const exportBase = `${getApiBase()}/results/${params.quizId}/export`;

  async function downloadReport(format: "pdf" | "csv") {
    const token = authStore.getToken();
    if (!token) return;
    const response = await fetch(`${exportBase}?format=${format}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) return;
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `quiz-report.${format}`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  const pct = data.score_percentage;
  const scoreColor = pct >= 80 ? "text-green-600" : pct >= 50 ? "text-amber-600" : "text-red-600";
  const scoreBg = pct >= 80 ? "bg-green-50 border-green-200" : pct >= 50 ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";

  return (
    <section className="space-y-6 py-6">
      {/* Back link */}
      <Link href="/dashboard/results" className="inline-flex items-center gap-1 text-sm font-semibold text-zinc-500 hover:text-zinc-800">
        &#8592; Back to My Results
      </Link>

      {/* Score summary */}
      <Card className={`p-5 border ${scoreBg}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold">Quiz Results</h1>
            <p className={`mt-2 text-4xl font-bold ${scoreColor}`}>
              {data.score_percentage}%
            </p>
            <p className="mt-1 text-sm text-zinc-600">
              {data.correct_answers} correct out of {data.total_questions} questions
            </p>
          </div>
          <div className="w-40">
            <ScoreChart correct={data.correct_answers} incorrect={data.incorrect_answers} />
          </div>
        </div>
      </Card>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Correct</p>
          <p className="mt-2 text-3xl font-bold text-green-600">{data.correct_answers}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Incorrect</p>
          <p className="mt-2 text-3xl font-bold text-red-500">{data.incorrect_answers}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Total</p>
          <p className="mt-2 text-3xl font-bold">{data.total_questions}</p>
        </Card>
      </div>

      {/* Full Q&A review */}
      <Card className="overflow-hidden p-0">
        <div className="border-b border-zinc-100 px-5 py-4">
          <h2 className="font-semibold">Full Question Review</h2>
        </div>
        <div className="divide-y divide-zinc-100">
          {data.reviews.map((review, i) => {
            const isCorrect = review.is_correct;
            return (
              <div key={review.question_id} className={`p-5 ${isCorrect ? "bg-green-50/40" : "bg-red-50/40"}`}>
                <div className="flex items-start gap-3">
                  <span className={`mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${isCorrect ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {isCorrect ? "✓" : "✗"} Q{i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-900">{review.prompt}</p>

                    <div className="mt-3 grid gap-1.5 text-sm">
                      <p className="flex items-center gap-2">
                        <span className="w-28 shrink-0 text-xs font-semibold text-zinc-500">Your answer:</span>
                        <span className={`rounded px-2 py-0.5 font-medium ${isCorrect ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                          {review.selected_answer || "Not answered"}
                        </span>
                      </p>
                      {!isCorrect && (
                        <p className="flex items-center gap-2">
                          <span className="w-28 shrink-0 text-xs font-semibold text-zinc-500">Correct answer:</span>
                          <span className="rounded bg-green-100 px-2 py-0.5 font-medium text-green-800">
                            {review.correct_answer}
                          </span>
                        </p>
                      )}
                    </div>

                    {review.explanation && (
                      <div className="mt-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
                        <span className="font-semibold text-zinc-700">Explanation: </span>
                        {review.explanation}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => downloadReport("pdf")}>Download PDF</Button>
        <Button variant="secondary" onClick={() => downloadReport("csv")}>Download CSV</Button>
        <Link href="/upload" className="inline-flex items-center rounded-xl border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/5">
          Generate New Quiz
        </Link>
      </div>
    </section>
  );
}

