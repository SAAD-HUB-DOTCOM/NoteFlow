"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { apiFetch, ApiError, type RecordingDTO } from "@/lib/api";
import { Skeleton } from "@/components/Skeleton";
import { MicIcon } from "@/components/icons";

export interface RecordingPlayerHandle {
  /** Seek the recording to `seconds` and start playing (used by transcript click-to-seek). */
  seekTo: (seconds: number) => void;
}

const SPEEDS = [1, 1.5, 2] as const;

/**
 * Real Recall mixed-recording player (Phase 7). Fetches a fresh (expiring) playback URL from the
 * backend and renders an HTML5 <video>/<audio> element with native controls plus ±10s and speed.
 * Reports currentTime up so the transcript can highlight the active segment, and exposes seekTo()
 * so a transcript click can jump the recording. Truthful loading / processing / unavailable states.
 * No fake URLs — if Recall hasn't finalized the recording, we say so.
 */
export const RecordingPlayer = forwardRef<
  RecordingPlayerHandle,
  { meetingId: string; onTime: (seconds: number) => void }
>(function RecordingPlayer({ meetingId, onTime }, ref) {
  const [rec, setRec] = useState<RecordingDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1);
  const mediaRef = useRef<HTMLVideoElement & HTMLAudioElement>(null);
  const refetchedOnError = useRef(false);

  const load = useCallback(async () => {
    try {
      const d = await apiFetch<RecordingDTO>(`/api/v1/meetings/${meetingId}/recording`);
      setRec(d);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn’t load the recording.");
    }
  }, [meetingId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Poll gently while Recall is still finalizing the recording, so it appears on its own.
  useEffect(() => {
    if (rec?.status !== "processing") return;
    const t = setInterval(() => void load(), 15_000);
    return () => clearInterval(t);
  }, [rec?.status, load]);

  useImperativeHandle(ref, () => ({
    seekTo: (seconds: number) => {
      const el = mediaRef.current;
      if (!el) return;
      el.currentTime = Math.max(0, seconds);
      void el.play().catch(() => {
        /* autoplay may be blocked; the seek still lands */
      });
    },
  }));

  const nudge = (delta: number) => {
    const el = mediaRef.current;
    if (el) el.currentTime = Math.max(0, el.currentTime + delta);
  };

  const changeSpeed = (rate: number) => {
    setSpeed(rate);
    if (mediaRef.current) mediaRef.current.playbackRate = rate;
  };

  // If the presigned URL expired mid-session, refetch a fresh one once.
  const handleMediaError = () => {
    if (refetchedOnError.current) return;
    refetchedOnError.current = true;
    void load();
  };

  if (error) {
    return (
      <Frame>
        <p className="text-sm text-muted">{error}</p>
      </Frame>
    );
  }
  if (!rec) {
    return (
      <Frame>
        <Skeleton className="aspect-video w-full rounded-lg" />
      </Frame>
    );
  }
  if (rec.status === "unavailable") {
    return (
      <Frame>
        <Note title="Recording not available" body="No recording was captured for this meeting." />
      </Frame>
    );
  }
  if (rec.status === "processing" || !rec.url) {
    return (
      <Frame>
        <Note
          title="Preparing the recording…"
          body="Recall is still finalizing the recording. This appears here automatically once it’s ready."
          pulse
        />
      </Frame>
    );
  }

  const isAudio = rec.media_type === "audio";

  return (
    <div className="mb-8">
      <div className="overflow-hidden rounded-xl border border-border bg-black">
        {isAudio ? (
          <div className="flex items-center gap-3 bg-surface px-4 py-5">
            <MicIcon className="h-5 w-5 shrink-0 text-muted" />
            <audio
              ref={mediaRef}
              src={rec.url}
              controls
              onTimeUpdate={(e) => onTime(e.currentTarget.currentTime)}
              onError={handleMediaError}
              className="w-full"
            />
          </div>
        ) : (
          <video
            ref={mediaRef}
            src={rec.url}
            controls
            playsInline
            onTimeUpdate={(e) => onTime(e.currentTarget.currentTime)}
            onError={handleMediaError}
            className="aspect-video w-full bg-black"
          />
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <ControlButton onClick={() => nudge(-10)} label="Back 10 seconds">
          −10s
        </ControlButton>
        <ControlButton onClick={() => nudge(10)} label="Forward 10 seconds">
          +10s
        </ControlButton>
        <div className="ml-auto flex items-center gap-1">
          <span className="mr-1 text-xs text-muted">Speed</span>
          {SPEEDS.map((rate) => (
            <button
              key={rate}
              type="button"
              onClick={() => changeSpeed(rate)}
              className={`rounded-md px-2 py-1 text-xs font-medium tabular-nums transition-colors ${
                speed === rate
                  ? "bg-primary text-white"
                  : "text-muted hover:bg-surface-hover hover:text-foreground"
              }`}
            >
              {rate}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

function ControlButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground/90 transition-colors hover:bg-surface-hover"
    >
      {children}
    </button>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return <div className="mb-8">{children}</div>;
}

function Note({ title, body, pulse }: { title: string; body: string; pulse?: boolean }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-dashed border-border bg-surface/40 px-5 py-6">
      <div
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-full border border-border bg-surface ${
          pulse ? "animate-pulse" : ""
        }`}
      >
        <MicIcon className="h-5 w-5 text-muted" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-0.5 text-sm text-muted">{body}</p>
      </div>
    </div>
  );
}
