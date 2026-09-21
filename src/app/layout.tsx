import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";

// One family for display + body (see DESIGN.md §1.2), self-hosted via next/font (no CDN).
const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
  weight: ["400", "500", "600", "700"],
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
    <html lang="en" className={sora.variable}>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
