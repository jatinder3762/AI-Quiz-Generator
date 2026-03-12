"use client";

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

  if (isLoading) return <p className="py-8">Loading results...</p>;
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

  return (
    <section className="space-y-6 py-6">
      <Card className="p-5">
        <h1 className="font-display text-3xl font-bold">Quiz Results</h1>
        <p className="mt-2 text-zinc-700">
          Score: <strong>{data.score}/{data.total_questions}</strong> ({data.score_percentage}%)
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <p className="text-sm text-zinc-500">Correct Answers</p>
          <p className="text-2xl font-bold text-primary">{data.correct_answers}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-zinc-500">Incorrect Answers</p>
          <p className="text-2xl font-bold text-secondary">{data.incorrect_answers}</p>
        </Card>
      </div>

      <Card className="p-4">
        <ScoreChart correct={data.correct_answers} incorrect={data.incorrect_answers} />
      </Card>

      <Card className="p-4">
        <h2 className="mb-3 font-semibold">Answer Review</h2>
        <ul className="space-y-3">
          {data.reviews.map((review) => (
            <li key={review.question_id} className="rounded-xl border p-3">
              <p className="font-medium">{review.prompt}</p>
              <p className="text-sm">Your answer: {review.selected_answer}</p>
              <p className="text-sm">Correct answer: {review.correct_answer}</p>
              <p className="text-sm text-zinc-600">{review.explanation}</p>
            </li>
          ))}
        </ul>
      </Card>

      <div className="flex gap-3">
        <Button
          onClick={() => downloadReport("pdf")}
        >
          Download PDF
        </Button>
        <Button
          variant="secondary"
          onClick={() => downloadReport("csv")}
        >
          Download CSV
        </Button>
      </div>
    </section>
  );
}
