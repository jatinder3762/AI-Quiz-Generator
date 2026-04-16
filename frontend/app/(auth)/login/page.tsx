"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api";
import { authStore } from "@/lib/auth";
import { demoStore } from "@/lib/demo-store";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [demoLoading, setDemoLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const response = await apiFetch<{ access_token: string }>("/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      authStore.setToken(response.access_token);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  }

  function enterDemo() {
    setDemoLoading(true);
    demoStore.clear();
    authStore.setDemo();
    router.push("/dashboard");
  }

  return (
    <Card className="mx-auto mt-10 max-w-md p-6">
      <h1 className="font-display text-2xl font-semibold">Login</h1>
      <form className="mt-5 space-y-3" onSubmit={onSubmit}>
        <Input placeholder="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input
          placeholder="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit" className="w-full">
          Sign In
        </Button>
      </form>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-zinc-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-xs text-zinc-400">or</span>
        </div>
      </div>

      <button
        type="button"
        onClick={enterDemo}
        disabled={demoLoading}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:border-primary hover:bg-primary/5 hover:text-primary disabled:opacity-60"
      >
        <span className="text-base">🧪</span>
        {demoLoading ? "Entering demo…" : "Try Demo — No account needed"}
      </button>

      <p className="mt-3 text-center text-xs text-zinc-400">
        Demo is limited to 3 files (2 MB each). No data is sent to any server.
      </p>

      <p className="mt-5 text-center text-sm text-zinc-500">
        No account?{" "}
        <Link href="/register" className="font-semibold text-primary">
          Register for full access
        </Link>
      </p>
    </Card>
  );
}

