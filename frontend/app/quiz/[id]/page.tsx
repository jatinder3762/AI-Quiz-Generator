"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";
import { Quiz } from "@/types";

const TIMER_SECONDS = 15 * 60;
const QUESTIONS_PER_PAGE = 5;

export default function QuizPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const [submitError, setSubmitError] = useState("");
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers]);
  const totalQuestions = data?.questions.length || 0;
  const unansweredCount = Math.max(totalQuestions - answeredCount, 0);
  const totalPages = useMemo(() => {
    if (!totalQuestions) return 1;
    return Math.ceil(totalQuestions / QUESTIONS_PER_PAGE);
  }, [totalQuestions]);
  const startQuestionIndex = currentPage * QUESTIONS_PER_PAGE;
  const endQuestionIndex = startQuestionIndex + QUESTIONS_PER_PAGE;
  const questionsOnPage = data?.questions.slice(startQuestionIndex, endQuestionIndex) || [];
  const isQuizLocked = data?.is_submitted || isSubmitting;
  const progress = useMemo(() => {
    if (!totalQuestions) return 0;
    return Math.round((answeredCount / totalQuestions) * 100);
  }, [answeredCount, totalQuestions]);

  useEffect(() => {
    if (currentPage >= totalPages) {
      setCurrentPage(Math.max(totalPages - 1, 0));
    }
  }, [currentPage, totalPages]);

  async function submitQuiz() {
    if (!data) return;
    setSubmitError("");
    setIsSubmitting(true);
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
      setIsSubmitting(false);
    }
  }

  if (isLoading || !data) return <p className="py-8">Loading quiz...</p>;

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
        <p className="mt-2 text-sm">
          Answered {answeredCount} of {data.questions.length} questions
        </p>
        <p className="mt-1 text-xs text-zinc-600">
          Page {currentPage + 1} of {totalPages}
        </p>
        {data.is_submitted ? (
          <p className="mt-2 text-sm font-medium text-amber-700">
            This quiz is already submitted. Answers are locked and can no longer be edited.
          </p>
        ) : null}
      </Card>

      <Card className="space-y-5 p-5">
        {questionsOnPage.map((question, idx) => (
          <div key={question.id} className="rounded-xl border border-zinc-200 p-4">
            <h2 className="text-lg font-semibold">
              Question {startQuestionIndex + idx + 1}: {question.prompt}
            </h2>
            <div className="mt-3 space-y-2">
              {Object.entries(question.options).map(([key, value]) => (
                <label key={key} className="flex cursor-pointer items-center gap-3 rounded-xl border p-3">
                  <input
                    type="radio"
                    name={question.id}
                    checked={answers[question.id] === key}
                    disabled={isQuizLocked}
                    onChange={() => setAnswers((prev) => ({ ...prev, [question.id]: key }))}
                  />
                  <span>
                    <strong>{key}.</strong> {value}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}

        <div className="flex flex-wrap gap-2">
          {Array.from({ length: totalPages }).map((_, idx) => (
            <Button
              key={`page-${idx}`}
              variant={idx === currentPage ? "primary" : "ghost"}
              onClick={() => setCurrentPage(idx)}
            >
              {idx + 1}
            </Button>
          ))}
        </div>
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" disabled={currentPage === 0} onClick={() => setCurrentPage((v) => v - 1)}>
          Previous Page
        </Button>
        <Button
          variant="secondary"
          disabled={currentPage >= totalPages - 1}
          onClick={() => setCurrentPage((v) => v + 1)}
        >
          Next Page
        </Button>
        {data.is_submitted ? (
          <Button onClick={() => router.push(`/results/${data.id}`)}>View Result</Button>
        ) : (
          <Button
            onClick={() => {
              setSubmitError("");
              setShowSubmitConfirm(true);
            }}
          >
            Submit Quiz
          </Button>
        )}
        {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}
      </div>

      {showSubmitConfirm && !data.is_submitted ? (
        <Card className="p-4">
          <h3 className="font-semibold">Confirm Submission</h3>
          <p className="mt-2 text-sm text-zinc-700">
            You answered {answeredCount} out of {totalQuestions} questions.
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            {unansweredCount > 0
              ? `${unansweredCount} question(s) are still unanswered. If you submit now, unanswered questions will be marked incorrect.`
              : "All questions are answered. Submit now to view your result."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => setShowSubmitConfirm(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button onClick={submitQuiz} disabled={isSubmitting}>
              {isSubmitting ? "Submitting..." : "Submit and View Result"}
            </Button>
          </div>
        </Card>
      ) : null}
    </section>
  );
}
