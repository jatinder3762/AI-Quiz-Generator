"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { Quiz } from "@/types";

const TIMER_SECONDS = 15 * 60;

export default function QuizPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [submitError, setSubmitError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["quiz", params.id],
    queryFn: () => apiFetch<Quiz>(`/quiz/${params.id}`),
    enabled: !!params.id,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const question = data?.questions[current];
  const progress = useMemo(() => {
    if (!data?.questions.length) return 0;
    return Math.round(((current + 1) / data.questions.length) * 100);
  }, [current, data?.questions.length]);

  async function submitQuiz() {
    if (!data) return;
    setSubmitError("");
    try {
      await apiFetch("/submit-quiz", {
        method: "POST",
        body: JSON.stringify({
          quiz_id: data.id,
          answers: Object.entries(answers).map(([question_id, selected_answer]) => ({ question_id, selected_answer })),
        }),
      });
      router.push(`/results/${data.id}`);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Submit failed");
    }
  }

  if (isLoading || !data || !question) return <p className="py-8">Loading quiz...</p>;

  return (
    <section className="space-y-4 py-6">
      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="font-display text-2xl font-bold">{data.title}</h1>
          <p className="text-sm font-semibold">Timer: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}</p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-zinc-200">
          <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
        </div>
        <p className="mt-2 text-sm">Question {current + 1} of {data.questions.length}</p>
      </Card>

      <Card className="p-5">
        <h2 className="text-lg font-semibold">{question.prompt}</h2>
        <div className="mt-4 space-y-2">
          {Object.entries(question.options).map(([key, value]) => (
            <label key={key} className="flex cursor-pointer items-center gap-3 rounded-xl border p-3">
              <input
                type="radio"
                name={question.id}
                checked={answers[question.id] === key}
                onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: key }))}
              />
              <span>
                <strong>{key}.</strong> {value}
              </span>
            </label>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" disabled={current === 0} onClick={() => setCurrent((v) => v - 1)}>
          Previous
        </Button>
        <Button
          variant="secondary"
          disabled={current >= data.questions.length - 1}
          onClick={() => setCurrent((v) => v + 1)}
        >
          Next
        </Button>
        <Button onClick={submitQuiz}>Submit Quiz</Button>
        {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
      </div>
    </section>
  );
}
