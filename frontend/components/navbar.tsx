"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { authStore } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const syncAuth = () => {
      setIsLoggedIn(Boolean(authStore.getToken()));
    };

    syncAuth();
    return authStore.subscribe(syncAuth);
  }, []);

  function logout() {
    authStore.clear();
    router.push("/login");
    router.refresh();
  }

  const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/register");

  return (
    <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
      <Link href="/" className="font-display text-xl font-bold">AI Quiz Generator</Link>
      <div className="flex items-center gap-3">
        {isLoggedIn ? (
          <>
            <Link href="/dashboard" className="text-sm font-medium">Dashboard</Link>
            <Link href="/upload" className="text-sm font-medium">Upload</Link>
            <Button variant="ghost" onClick={logout}>Logout</Button>
          </>
        ) : (
          <>
            {!isAuthPage ? <Link href="/login" className="text-sm font-medium">Login</Link> : null}
            <Link href="/register" className="text-sm font-medium">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}
