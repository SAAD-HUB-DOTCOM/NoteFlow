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

/** The authenticated user's NoteFlow application profile (GET /api/v1/me). `email` comes from the
 *  auth token; `display_name`/`avatar_url`/`timezone` are the editable Profile record. */
export interface MeDTO {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  timezone: string | null;
}

/** Authoritative source for application profile data (name/avatar/timezone). */
export function getMe() {
  return apiFetch<MeDTO>("/api/v1/me");
}

/** Update the editable Profile fields the backend supports. Only send what's supported. */
export function updateMe(body: { display_name?: string; timezone?: string }) {
  return apiFetch<MeDTO>("/api/v1/me", { method: "PATCH", body: JSON.stringify(body) });
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
  share_id: string | null;
}

export interface ActionItemDTO {
  text: string;
  owner: string | null;
  meeting_id: string;
  meeting_title: string;
  meeting_date: string;
  segment_id: string | null;
  start: number | null;
}

export interface HighlightDTO {
  title: string;
  meeting_id: string;
  meeting_title: string;
  meeting_date: string;
  segment_id: string | null;
  start: number | null;
}

export interface ShareDTO {
  meeting_id: string;
  share_id: string | null;
}

export interface SharedMeetingDTO {
  title: string | null;
  started_at: string | null;
  duration_seconds: number | null;
  segments: TranscriptSegmentDTO[];
  intelligence: IntelligenceContent | null;
}

/** Public fetch (no auth) for shared read-only views. */
export async function publicFetch<T>(path: string): Promise<T> {
  if (!BASE) throw new ApiError(0, "The NoteFlow backend URL isn’t configured yet.");
  const res = await fetch(`${BASE}${path}`);
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

export interface AskDTO {
  answer: string;
  citations: string[]; // real transcript_segment ids
}

export interface AskCitation {
  segment_id: string;
  meeting_id: string;
  meeting_title: string;
  start: number; // seconds
}

export interface AskAllDTO {
  answer: string;
  citations: AskCitation[];
}

export interface RecordingDTO {
  meeting_id: string;
  status: "ready" | "processing" | "unavailable";
  media_type: "video" | "audio" | null;
  url: string | null;
  duration_seconds: number | null;
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

/* ---------------------------------------------------------------- People (6D) */

/** A resolved cross-meeting identity. email/avatar_url are present ONLY when genuinely known;
 *  conversation_count and last_conversation_at are backend-derived (GET /api/v1/people). */
export interface PersonDTO {
  id: string;
  display_name: string | null;
  email: string | null;
  avatar_url: string | null;
  conversation_count: number;
  last_conversation_at: string | null; // ISO, null only if somehow uncounted
}

export interface PersonMeetingDTO {
  id: string;
  title: string | null;
  status: string;
  started_at: string | null;
  created_at: string;
}

export interface PersonDetailDTO extends PersonDTO {
  meetings: PersonMeetingDTO[];
}

/**
 * Identity-management mutations (owner-scoped) that the backend supports. They are typed here for
 * completeness, but NOTE: no current endpoint exposes MeetingParticipant ids to the browser, so
 * there is no way to *discover* the `meeting_participant_id`/source person these require. The
 * People UI therefore does NOT surface link/unlink/merge controls yet (Phase 6D §8) — building
 * them would mean inventing a participant-discovery API that does not exist. Once an endpoint
 * lists a meeting's participants, these become directly usable.
 */
export function createPerson(body: { meeting_participant_id?: string; display_name?: string }) {
  return apiFetch<PersonDetailDTO>("/api/v1/people", { method: "POST", body: JSON.stringify(body) });
}

export function linkParticipantToPerson(personId: string, meetingParticipantId: string) {
  return apiFetch<PersonDetailDTO>(`/api/v1/people/${personId}/link-participant`, {
    method: "POST",
    body: JSON.stringify({ meeting_participant_id: meetingParticipantId }),
  });
}

export function unlinkParticipantFromPerson(personId: string, meetingParticipantId: string) {
  return apiFetch<PersonDetailDTO>(`/api/v1/people/${personId}/unlink-participant`, {
    method: "POST",
    body: JSON.stringify({ meeting_participant_id: meetingParticipantId }),
  });
}

export function mergePeople(targetPersonId: string, sourcePersonId: string) {
  return apiFetch<PersonDetailDTO>(`/api/v1/people/${targetPersonId}/merge`, {
    method: "POST",
    body: JSON.stringify({ source_person_id: sourcePersonId }),
  });
}
