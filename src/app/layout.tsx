import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import SessionProviderWrapper from "@/components/session-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AutoJob Hunter — Autonomous Job Application Agent",
  description:
    "An AI-powered autonomous job hunter that searches, matches, generates tailored resumes, writes cover letters, and tracks every application — while you sleep.",
  keywords: ["job hunter", "AI agent", "MERN", "resume", "auto apply"],
  authors: [{ name: "AutoJob Hunter" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <SessionProviderWrapper>
          {children}
        </SessionProviderWrapper>
        <Toaster />
        <SonnerToaster richColors position="top-right" />
      </body>
    </html>
  );
}
