import Link from "next/link";

import { Card } from "@/components/ui/card";

export default function HomePage() {
  return (
    <section className="space-y-6 py-8">
      <div className="animate-fadeInUp space-y-3">
        <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
          Turn Study Material Into Smart Quizzes
        </h1>
        <p className="max-w-2xl text-zinc-700">
          Upload a PDF or DOCX, generate AI-powered MCQs, take timed quizzes, and track your learning analytics.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <h3 className="font-semibold">1. Upload Notes</h3>
          <p className="mt-2 text-sm text-zinc-600">Securely process PDF/DOCX files into searchable chunks.</p>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">2. Generate Quiz</h3>
          <p className="mt-2 text-sm text-zinc-600">Choose question count and difficulty for each quiz session.</p>
        </Card>
        <Card className="p-5">
          <h3 className="font-semibold">3. Analyze Results</h3>
          <p className="mt-2 text-sm text-zinc-600">Review explanations, scores, and export reports in PDF/CSV.</p>
        </Card>
      </div>

      <div className="flex gap-3">
        <Link href="/register" className="rounded-xl bg-primary px-4 py-2 font-semibold text-white">
          Get Started
        </Link>
        <Link href="/login" className="rounded-xl bg-secondary px-4 py-2 font-semibold text-black">
          Login
        </Link>
      </div>
    </section>
  );
}
