"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { authStore } from "@/lib/auth";
import { Button } from "@/components/ui/button";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/" && pathname?.startsWith(href));
  return (
    <Link
      href={href}
      className={`relative text-sm font-medium transition-colors duration-200 after:absolute after:-bottom-0.5 after:left-0 after:h-0.5 after:w-full after:origin-left after:scale-x-0 after:rounded-full after:bg-primary after:transition-transform after:duration-200 hover:text-primary hover:after:scale-x-100 ${
        isActive ? "text-primary after:scale-x-100" : "text-zinc-600"
      }`}
    >
      {children}
    </Link>
  );
}

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncAuth = () => {
      setIsLoggedIn(authStore.isLoggedIn());
      setIsDemo(authStore.isDemo());
      const token = authStore.getToken();
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          setUserEmail(payload.sub || payload.email || "");
        } catch {
          setUserEmail("");
        }
      } else {
        setUserEmail("");
      }
    };
    syncAuth();
    return authStore.subscribe(syncAuth);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  function logout() {
    authStore.clear();
    setDropdownOpen(false);
    router.push("/login");
    router.refresh();
  }

  const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/register");
  const initials = userEmail ? userEmail.slice(0, 2).toUpperCase() : "U";

  return (
    <nav className="sticky top-0 z-40 w-full border-b border-zinc-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center transition-opacity duration-200 hover:opacity-80"
          >
            <Image
              src="/logo-ai-quiz.png"
              alt="AI Quiz Generator"
              width={72}
              height={72}
              className="h-16 w-auto"
              priority
            />
          </Link>
          {isDemo && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
              Demo Mode
            </span>
          )}
        </div>

        {/* Desktop nav links — shown only when NOT logged in */}
        <div className="hidden items-center gap-6 md:flex">
          {!isLoggedIn && <NavLink href="/demo">Demo</NavLink>}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              {isDemo && (
                <Link
                  href="/register"
                  className="hidden rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-80 sm:inline-flex"
                >
                  Register for Full Access
                </Link>
              )}

              {/* User avatar dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((v) => !v)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-white shadow-sm transition-transform duration-150 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50"
                  aria-label="User menu"
                  aria-expanded={dropdownOpen}
                >
                  {initials}
                </button>

                {/* Dropdown panel */}
                <div
                  className={`absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-zinc-100 bg-white shadow-xl transition-all duration-150 ${
                    dropdownOpen
                      ? "scale-100 opacity-100"
                      : "pointer-events-none scale-95 opacity-0"
                  }`}
                >
                  {/* User info */}
                  <div className="border-b border-zinc-100 px-4 py-3">
                    <p className="text-xs text-zinc-400">Signed in as</p>
                    <p className="mt-0.5 truncate text-sm font-semibold text-zinc-800">{userEmail || "User"}</p>
                  </div>

                  {/* Nav links inside dropdown (mobile-accessible) */}
                  <div className="py-1.5">
                    <DropdownLink href="/dashboard">Dashboard</DropdownLink>
                    <DropdownLink href="/upload">Upload Document</DropdownLink>
                    {!isDemo && <DropdownLink href="/generate">Generate Quiz</DropdownLink>}
                    {!isDemo && <DropdownLink href="/dashboard/results">My Results</DropdownLink>}
                  </div>

                  <div className="border-t border-zinc-100 py-1.5">
                    <button
                      onClick={logout}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
                      </svg>
                      {isDemo ? "Exit Demo" : "Sign out"}
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              {!isAuthPage && (
                <Link
                  href="/login"
                  className="text-sm font-medium text-zinc-600 transition-colors hover:text-primary"
                >
                  Login
                </Link>
              )}
              <Link
                href="/register"
                className="rounded-xl bg-primary px-4 py-1.5 text-sm font-semibold text-white transition-opacity hover:opacity-80"
              >
                Register
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            className="ml-1 flex flex-col gap-1.5 p-1 md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            <span className={`block h-0.5 w-5 rounded bg-zinc-700 transition-transform duration-200 ${mobileOpen ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`block h-0.5 w-5 rounded bg-zinc-700 transition-opacity duration-200 ${mobileOpen ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-5 rounded bg-zinc-700 transition-transform duration-200 ${mobileOpen ? "-translate-y-2 -rotate-45" : ""}`} />
          </button>
        </div>
      </div>

      {/* Mobile slide-down menu */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out md:hidden ${
          mobileOpen ? "max-h-96" : "max-h-0"
        }`}
      >
        <div className="flex flex-col gap-1 border-t border-zinc-100 px-4 pb-4 pt-2">
          {!isLoggedIn && <MobileNavLink href="/demo">Demo</MobileNavLink>}
          {isLoggedIn ? (
            <>
              <MobileNavLink href="/dashboard">Dashboard</MobileNavLink>
              <MobileNavLink href="/upload">Upload Document</MobileNavLink>
              {!isDemo && <MobileNavLink href="/generate">Generate Quiz</MobileNavLink>}
              {!isDemo && <MobileNavLink href="/dashboard/results">My Results</MobileNavLink>}
              <button
                onClick={logout}
                className="mt-1 w-full rounded-xl py-2 text-left text-sm font-medium text-red-600"
              >
                {isDemo ? "Exit Demo" : "Sign out"}
              </button>
            </>
          ) : (
            <>
              {!isAuthPage && <MobileNavLink href="/login">Login</MobileNavLink>}
              <MobileNavLink href="/register">Register</MobileNavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

function DropdownLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/" && pathname?.startsWith(href));
  return (
    <Link
      href={href}
      className={`flex items-center px-4 py-2 text-sm font-medium transition-colors hover:bg-zinc-50 ${
        isActive ? "text-primary" : "text-zinc-700"
      }`}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/" && pathname?.startsWith(href));
  return (
    <Link
      href={href}
      className={`rounded-xl px-3 py-2 text-sm font-medium transition-colors hover:bg-zinc-50 ${
        isActive ? "bg-zinc-100 text-primary" : "text-zinc-700"
      }`}
    >
      {children}
    </Link>
  );
}
