"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Card } from "@/components/ui/card";
import { ScoreChart } from "@/components/score-chart";
import { demoResultsStore, type DemoResult } from "@/lib/demo-store";

export default function DemoResultDetailPage() {
  const { resultId } = useParams<{ resultId: string }>();
  const [result, setResult] = useState<DemoResult | null | undefined>(undefined);

  useEffect(() => {
    setResult(demoResultsStore.getById(resultId));
  }, [resultId]);

  if (result === undefined) return null; // loading

  if (result === null) {
    return (
      <section className="py-10 text-center">
        <p className="text-zinc-500">Result not found.</p>
        <Link href="/demo/results" className="mt-3 inline-block text-sm font-semibold text-primary hover:underline">
          ← Back to results
        </Link>
      </section>
    );
  }

  const pct = result.score?.pct ?? null;
  const scoreColor =
    pct === null ? "" : pct >= 80 ? "text-green-600" : pct >= 50 ? "text-amber-600" : "text-red-500";
  const scoreBg =
    pct === null
      ? "border-zinc-200"
      : pct >= 80
      ? "border-green-200 bg-green-50"
      : pct >= 50
      ? "border-amber-200 bg-amber-50"
      : "border-red-200 bg-red-50";

  return (
    <section className="space-y-6 py-6">
      {/* Back */}
      <Link
        href="/demo/results"
        className="inline-flex items-center gap-1 text-sm font-semibold text-zinc-500 hover:text-zinc-800"
      >
        ← Back to My Results
      </Link>

      {/* Score summary */}
      <Card className={`border p-5 ${scoreBg}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold">{result.title}</h1>
            <p className="mt-1 text-xs text-zinc-500">
              Generated {new Date(result.generatedAt).toLocaleString()}
              {result.submittedAt && (
                <> &middot; Submitted {new Date(result.submittedAt).toLocaleString()}</>
              )}
            </p>
            {pct !== null ? (
              <>
                <p className={`mt-3 text-4xl font-bold ${scoreColor}`}>{pct}%</p>
                <p className="mt-1 text-sm text-zinc-600">
                  {result.score!.correct} correct out of {result.score!.total} questions
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm text-zinc-500 italic">Quiz not submitted yet — answers not graded.</p>
            )}
          </div>
          {pct !== null && (
            <div className="w-36">
              <ScoreChart
                correct={result.score!.correct}
                incorrect={result.score!.total - result.score!.correct}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Stat cards */}
      {pct !== null && (
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Correct</p>
            <p className="mt-2 text-3xl font-bold text-green-600">{result.score!.correct}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Incorrect</p>
            <p className="mt-2 text-3xl font-bold text-red-500">
              {result.score!.total - result.score!.correct}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Total</p>
            <p className="mt-2 text-3xl font-bold">{result.score!.total}</p>
          </Card>
        </div>
      )}

      {/* Full Q&A review */}
      <Card className="overflow-hidden p-0">
        <div className="border-b border-zinc-100 px-5 py-4">
          <h2 className="font-semibold">Full Question Review</h2>
        </div>
        <div className="divide-y divide-zinc-100">
          {result.questions.map((q, i) => {
            const userAnswer = result.answers[q.id];
            const isCorrect = userAnswer === q.correct_answer;
            const wasAnswered = !!userAnswer;

            return (
              <div
                key={q.id}
                className={`p-5 ${
                  !wasAnswered
                    ? "bg-zinc-50/50"
                    : isCorrect
                    ? "bg-green-50/40"
                    : "bg-red-50/40"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      !wasAnswered
                        ? "bg-zinc-100 text-zinc-500"
                        : isCorrect
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {!wasAnswered ? "–" : isCorrect ? "✓" : "✗"} Q{i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-zinc-900">{q.prompt}</p>

                    {/* Options */}
                    <div className="mt-3 grid gap-1.5">
                      {Object.entries(q.options).map(([key, value]) => {
                        const isCorrectOption = key === q.correct_answer;
                        const isUserChoice = key === userAnswer;
                        const isWrongChoice = isUserChoice && !isCorrect;

                        return (
                          <div
                            key={key}
                            className={`rounded-lg border px-3 py-2 text-sm ${
                              isCorrectOption
                                ? "border-green-500 bg-green-50"
                                : isWrongChoice
                                ? "border-red-400 bg-red-50"
                                : "border-zinc-200 bg-white"
                            }`}
                          >
                            <span className="font-semibold">{key}.</span> {value}
                            {isCorrectOption && (
                              <span className="ml-2 text-xs font-semibold text-green-600">✓ Correct</span>
                            )}
                            {isWrongChoice && (
                              <span className="ml-2 text-xs font-semibold text-red-600">✗ Your answer</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {!wasAnswered && (
                      <p className="mt-2 text-xs text-zinc-400 italic">Not answered</p>
                    )}

                    {q.explanation && (
                      <div className="mt-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600">
                        <span className="font-semibold text-zinc-700">Explanation: </span>
                        {q.explanation}
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
        <Link
          href="/upload"
          className="inline-flex items-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
        >
          Generate New Quiz
        </Link>
        <Link
          href="/demo/results"
          className="inline-flex items-center rounded-xl border border-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
        >
          All Results
        </Link>
      </div>
    </section>
  );
}
