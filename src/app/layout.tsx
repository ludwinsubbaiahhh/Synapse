import type { Metadata } from "next";
import { ReactNode } from "react";

import localFont from "next/font/local";

import "./globals.css";

import { AppHeader } from "@/components/navigation/app-header";
import { SupabaseProvider } from "@/components/providers/supabase-provider";
import { getClientEnv } from "@/lib/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "Synapse · Your Intelligent Second Brain",
  description:
    "Capture anything, enrich it automatically, and recall it instantly with semantic search.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const supabase = await createSupabaseServerClient();
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } =
    getClientEnv();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SupabaseProvider
          initialSession={session}
          supabaseUrl={NEXT_PUBLIC_SUPABASE_URL}
          supabaseAnonKey={NEXT_PUBLIC_SUPABASE_ANON_KEY}
        >
          <AppHeader />
          {children}
        </SupabaseProvider>
      </body>
    </html>
  );
}
