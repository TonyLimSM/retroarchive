import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import Link from "next/link";
import { isDemoMode } from "@/lib/data/games";
import { getCurrentUser } from "@/lib/supabase/auth";
import { signOut } from "@/app/login/actions";

export const metadata: Metadata = {
  title: "RetroVault — your collection",
  description: "Inventory and pricing for a retro game collection",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900">
        <header className="sticky top-0 z-10 border-b border-stone-200 bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
            <Link href="/" className="font-semibold tracking-tight">
              <span className="font-mono text-stone-500">▣</span> RetroVault
            </Link>
            <nav className="flex items-center gap-6 text-sm">
              <Link href="/" className="hover:underline">Dashboard</Link>
              <Link href="/games" className="hover:underline">Games</Link>
              <Link href="/import" className="hover:underline">Import</Link>
              {!isDemoMode && (
                user ? (
                  <form action={signOut}>
                    <button
                      type="submit"
                      className="text-stone-500 hover:text-stone-900"
                      title={user.email ?? undefined}
                    >
                      Sign out
                    </button>
                  </form>
                ) : (
                  <Link href="/login" className="hover:underline">Sign in</Link>
                )
              )}
            </nav>
          </div>
          {isDemoMode && (
            <div className="bg-amber-100 px-6 py-1 text-center text-xs text-amber-900">
              Demo mode — showing seeded data. Connect Supabase via{" "}
              <code className="font-mono">.env.local</code> to use the real DB.
            </div>
          )}
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
