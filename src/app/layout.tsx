import type { Metadata } from "next";
import { Sora, Instrument_Serif } from "next/font/google";
import "./globals.css";

// One family for display + body (see DESIGN.md §1.2), self-hosted via next/font (no CDN).
const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

// Italic serif accent for the hero headline's emphasized word (Vesper hero reference).
const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  style: "italic",
  weight: "400",
  variable: "--font-instrument-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "NoteFlow — AI meeting notetaker",
  description:
    "Synchronized recording and transcript playback, AI summaries, action items, search, and contextual answers with timestamp citations.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${sora.variable} ${instrumentSerif.variable}`}>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
