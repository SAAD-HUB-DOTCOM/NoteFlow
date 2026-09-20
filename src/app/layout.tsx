import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Display voice for the cosmic marketing surface — a geometric grotesk with a
// spacey character, self-hosted via next/font (no CDN). Body stays Inter.
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
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
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="min-h-screen font-sans">{children}</body>
    </html>
  );
}
