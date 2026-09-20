"use client";

import { getSupabaseBrowser, isSupabaseConfigured } from "@/lib/supabase/client";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Call the FastAPI backend with the current Supabase JWT attached. */
export async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!BASE) throw new ApiError(0, "The NoteFlow backend URL isn’t configured yet.");
  if (!isSupabaseConfigured) throw new ApiError(0, "Sign-in isn’t configured yet.");

  const supabase = getSupabaseBrowser();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new ApiError(401, "You’re signed out — sign in again.");

  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });

  if (!res.ok) {
    let detail = `Request failed (${res.status}).`;
    try {
      const body = await res.json();
      if (body?.detail) detail = body.detail;
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(res.status, detail);
  }
  return (await res.json()) as T;
}

export interface MeetingDTO {
  id: string;
  title: string | null;
  provider: string | null;
  meeting_url: string | null;
  status: string;
  recall_bot_id: string | null;
  started_at: string | null;
  duration_seconds: number | null;
  created_at: string;
}

export interface TranscriptSegmentDTO {
  id: string;
  speaker: string | null;
  text: string;
  start: number; // seconds
  end: number; // seconds
  sequence: number;
}

export interface TranscriptDTO {
  meeting_id: string;
  status: string;
  segments: TranscriptSegmentDTO[];
}

export interface IntelligenceContent {
  summary: string;
  key_points: string[];
  decisions: { text: string; segment_ids: string[] }[];
  action_items: { text: string; owner: string | null; segment_ids: string[] }[];
  important_moments: { title: string; segment_ids: string[] }[];
}

export interface IntelligenceDTO {
  meeting_id: string;
  state: "ready" | "generating" | "unavailable";
  content: IntelligenceContent | null;
}
