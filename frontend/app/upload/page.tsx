"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { apiFetch, getApiBase } from "@/lib/api";
import { authStore } from "@/lib/auth";
import { DocumentItem, Quiz } from "@/types";

type DocsResponse = { items: DocumentItem[] };

export default function UploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [file, setFile] = useState<File | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [quizError, setQuizError] = useState("");
  const [documentId, setDocumentId] = useState(searchParams.get("documentId") || "");
  const [numQuestions, setNumQuestions] = useState(10);
  const [difficulty, setDifficulty] = useState("medium");

  const docsQuery = useQuery({
    queryKey: ["documents"],
    queryFn: () => apiFetch<DocsResponse>("/documents"),
  });

  async function onUpload(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploadError("");

    const token = authStore.getToken();
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${getApiBase()}/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!response.ok) throw new Error(await response.text());
      const data = (await response.json()) as DocumentItem;
      setDocumentId(data.id);
      docsQuery.refetch();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    }
  }

  async function onGenerateQuiz(e: FormEvent) {
    e.preventDefault();
    setQuizError("");
    try {
      const quiz = await apiFetch<Quiz>("/generate-quiz", {
        method: "POST",
        body: JSON.stringify({ document_id: documentId, num_questions: numQuestions, difficulty }),
      });
      router.push(`/quiz/${quiz.id}`);
    } catch (err) {
      setQuizError(err instanceof Error ? err.message : "Quiz generation failed");
    }
  }

  return (
    <section className="grid gap-4 py-6 md:grid-cols-2">
      <Card className="p-5">
        <h1 className="font-display text-2xl font-bold">Upload Study Material</h1>
        <p className="mt-1 text-sm text-zinc-600">Supports PDF and DOCX with secure validation.</p>
        <form className="mt-4 space-y-3" onSubmit={onUpload}>
          <Input type="file" accept=".pdf,.docx" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
          {uploadError ? <p className="text-sm text-red-600">{uploadError}</p> : null}
          <Button type="submit">Upload Document</Button>
        </form>
      </Card>

      <Card className="p-5">
        <h2 className="font-display text-2xl font-bold">Generate Quiz</h2>
        <form className="mt-4 space-y-3" onSubmit={onGenerateQuiz}>
          <Select value={documentId} onChange={(e) => setDocumentId(e.target.value)} required>
            <option value="">Select document</option>
            {(docsQuery.data?.items || []).map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.filename}
              </option>
            ))}
          </Select>
          <Input
            type="number"
            min={1}
            max={30}
            value={numQuestions}
            onChange={(e) => setNumQuestions(Number(e.target.value))}
          />
          <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </Select>
          {quizError ? <p className="text-sm text-red-600">{quizError}</p> : null}
          <Button type="submit" variant="secondary">
            Generate Quiz
          </Button>
        </form>
      </Card>
    </section>
  );
}
