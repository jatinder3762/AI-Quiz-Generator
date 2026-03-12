import type { Metadata } from "next";

import { Navbar } from "@/components/navbar";

import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "AI Quiz Generator",
  description: "Generate adaptive MCQ quizzes from your documents.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <Navbar />
          <main className="mx-auto w-full max-w-6xl px-4 pb-12">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
