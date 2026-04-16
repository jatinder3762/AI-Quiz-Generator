"use client";

import { useMemo, useState } from "react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type DemoQuestion = {
  id: string;
  prompt: string;
  options: Record<string, string>;
  correctAnswer: string;
};

type DemoSample = {
  id: string;
  title: string;
  description: string;
  questions: DemoQuestion[];
};

const demoSamples: DemoSample[] = [
  {
    id: "python-basics",
    title: "Python Basics (5 Questions)",
    description: "A quick sample to show quiz generation format and scoring behavior.",
    questions: [
      {
        id: "q1",
        prompt: "Which keyword defines a function in Python?",
        options: { A: "func", B: "def", C: "lambda", D: "function" },
        correctAnswer: "B",
      },
      {
        id: "q2",
        prompt: "What is the output type of 3 / 2 in Python 3?",
        options: { A: "int", B: "str", C: "float", D: "bool" },
        correctAnswer: "C",
      },
      {
        id: "q3",
        prompt: "Which data structure is ordered and mutable?",
        options: { A: "tuple", B: "set", C: "list", D: "frozenset" },
        correctAnswer: "C",
      },
      {
        id: "q4",
        prompt: "Which statement handles exceptions?",
        options: { A: "try/except", B: "if/else", C: "for/in", D: "switch/case" },
        correctAnswer: "A",
      },
      {
        id: "q5",
        prompt: "What does len('quiz') return?",
        options: { A: "3", B: "4", C: "5", D: "Error" },
        correctAnswer: "B",
      },
    ],
  },
  {
    id: "networking-basics",
    title: "Networking Basics (5 Questions)",
    description: "A second sample that demonstrates domain-specific MCQ structure.",
    questions: [
      {
        id: "q1",
        prompt: "Which protocol is primarily used to load web pages?",
        options: { A: "FTP", B: "SMTP", C: "HTTP", D: "SSH" },
        correctAnswer: "C",
      },
      {
        id: "q2",
        prompt: "What does DNS translate?",
        options: {
          A: "IP addresses to MAC only",
          B: "Domain names to IP addresses",
          C: "URLs to HTML",
          D: "Packets to sockets",
        },
        correctAnswer: "B",
      },
      {
        id: "q3",
        prompt: "Which port is HTTPS by default?",
        options: { A: "21", B: "53", C: "80", D: "443" },
        correctAnswer: "D",
      },
      {
        id: "q4",
        prompt: "What is the main purpose of a firewall?",
        options: {
          A: "Compile source code",
          B: "Filter network traffic",
          C: "Encrypt only images",
          D: "Increase CPU speed",
        },
        correctAnswer: "B",
      },
      {
        id: "q5",
        prompt: "TCP is best described as:",
        options: {
          A: "Connectionless and unreliable",
          B: "Connection-oriented and reliable",
          C: "A physical cable",
          D: "A database protocol",
        },
        correctAnswer: "B",
      },
    ],
  },
];

export default function DemoPage() {
  const [sampleId, setSampleId] = useState(demoSamples[0].id);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const selectedSample = useMemo(
    () => demoSamples.find((sample) => sample.id === sampleId) || demoSamples[0],
    [sampleId]
  );

  const score = useMemo(() => {
    if (!submitted) return null;
    let correct = 0;
    for (const question of selectedSample.questions) {
      if (answers[question.id] === question.correctAnswer) correct += 1;
    }
    return {
      correct,
      total: selectedSample.questions.length,
      percentage: Math.round((correct / selectedSample.questions.length) * 100),
    };
  }, [answers, selectedSample, submitted]);

  function selectSample(nextSampleId: string) {
    setSampleId(nextSampleId);
    setAnswers({});
    setSubmitted(false);
  }

  function resetQuiz() {
    setAnswers({});
    setSubmitted(false);
  }

  return (
    <section className="space-y-6 py-6">
      <header className="space-y-2">
        <h1 className="font-display text-3xl font-bold">Interactive Demo Quizzes</h1>
        <p className="max-w-3xl text-sm text-zinc-600">
          These are built-in sample quizzes so website visitors can test the core flow immediately without upload,
          storage, or API keys.
        </p>
      </header>

      <Card className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Choose Demo Sample</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {demoSamples.map((sample) => {
            const isActive = sample.id === selectedSample.id;
            return (
              <button
                key={sample.id}
                type="button"
                onClick={() => selectSample(sample.id)}
                className={`rounded-xl border p-4 text-left transition ${
                  isActive ? "border-primary bg-zinc-50" : "border-zinc-200"
                }`}
              >
                <p className="font-semibold">{sample.title}</p>
                <p className="mt-1 text-sm text-zinc-600">{sample.description}</p>
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="font-display text-2xl font-bold">{selectedSample.title}</h2>
        <p className="mt-1 text-sm text-zinc-600">{selectedSample.description}</p>

        <form
          className="mt-4 space-y-5"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
        >
          {selectedSample.questions.map((question, index) => (
            <div key={question.id} className="rounded-xl border border-zinc-200 p-4">
              <p className="font-medium">
                {index + 1}. {question.prompt}
              </p>
              <div className="mt-3 grid gap-2">
                {Object.entries(question.options).map(([key, value]) => {
                  const selected = answers[question.id] === key;
                  const showCorrect = submitted && key === question.correctAnswer;
                  const showWrongSelected = submitted && selected && key !== question.correctAnswer;

                  return (
                    <label
                      key={key}
                      className={`cursor-pointer rounded-lg border px-3 py-2 text-sm ${
                        showCorrect
                          ? "border-green-500 bg-green-50"
                          : showWrongSelected
                            ? "border-red-500 bg-red-50"
                            : selected
                              ? "border-primary bg-zinc-50"
                              : "border-zinc-200"
                      }`}
                    >
                      <input
                        type="radio"
                        name={question.id}
                        value={key}
                        checked={selected}
                        disabled={submitted}
                        onChange={(e) => setAnswers((prev) => ({ ...prev, [question.id]: e.target.value }))}
                        className="mr-2"
                      />
                      <span className="font-semibold">{key}.</span> {value}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={submitted}>
              Submit Demo Quiz
            </Button>
            <Button type="button" variant="secondary" onClick={resetQuiz}>
              Reset
            </Button>
          </div>
        </form>
      </Card>

      {score ? (
        <Card className="p-5">
          <h3 className="font-display text-xl font-bold">Demo Result</h3>
          <p className="mt-2 text-sm text-zinc-700">
            You scored <span className="font-semibold">{score.correct}</span> / {score.total} (
            <span className="font-semibold">{score.percentage}%</span>)
          </p>
        </Card>
      ) : null}
    </section>
  );
}
