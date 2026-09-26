"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { apiFetch, ApiError, type RecordingDTO } from "@/lib/api";
import { formatTimestamp } from "@/lib/format";
import { PlayIcon, PauseIcon, MicIcon } from "@/components/icons";

export interface RecordingPlayerHandle {
  /** Seek the recording to `seconds` and start playing (used by transcript / citation click). */
  seekTo: (seconds: number) => void;
}

const SPEEDS = [1, 1.5, 2] as const;

function waveHeights(seed: string, count: number): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) { h ^= seed.charCodeAt(i); h = Math.imul(h, 16777619); }
  let state = (h >>> 0) || 1;
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    state ^= state << 13; state ^= state >>> 17; state ^= state << 5; state >>>= 0;
    const j = (state % 1000) / 1000;
    const env = Math.sin((i / (count - 1)) * Math.PI) * 0.3 + 0.55;
    out.push(Math.max(16, Math.round((0.3 + j * 0.7) * env * 100)));
  }
  return out;
}

/** Monochrome waveform timeline — the played portion brightens; click/drag/keys seek. */
function WaveScrubber({
  seed,
  current,
  total,
  onSeek,
}: {
  seed: string;
  current: number;
  total: number;
  onSeek: (seconds: number) => void;
}) {
  const bars = useMemo(() => waveHeights(seed, 90), [seed]);
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const fill = total > 0 ? Math.min(1, current / total) : 0;

  const seekAt = (clientX: number) => {
    const el = ref.current;
    if (!el || !total) return;
    const r = el.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (clientX - r.left) / r.width));
    onSeek(ratio * total);
  };

  return (
    <div
      ref={ref}
      role="slider"
      aria-label="Seek"
      aria-valuemin={0}
      aria-valuemax={Math.round(total)}
      aria-valuenow={Math.round(current)}
      tabIndex={0}
      onPointerDown={(e) => { dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); seekAt(e.clientX); }}
      onPointerMove={(e) => { if (dragging.current) seekAt(e.clientX); }}
      onPointerUp={() => { dragging.current = false; }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") onSeek(Math.min(total, current + 5));
        if (e.key === "ArrowLeft") onSeek(Math.max(0, current - 5));
      }}
      className="flex h-8 min-w-0 flex-1 cursor-pointer touch-none items-center gap-[2px]"
    >
      {bars.map((h, i) => {
        const played = (i + 0.5) / bars.length <= fill;
        return (
          <span
            key={i}
            className="flex-1 rounded-full transition-[opacity] duration-150"
            style={{ maxWidth: 3, height: `${h}%`, background: "#fff", opacity: played ? 0.45 + (h / 100) * 0.4 : 0.13 + (h / 100) * 0.1 }}
          />
        );
      })}
    </div>
  );
}

/**
 * Real Recall mixed-recording player, redesigned as NoteFlow's signature player object (Phase 3).
 * A monochrome waveform timeline on a tactile graphite surface drives the real <video>/<audio>
 * element — NOT a decorative waveform. Preserves seekTo(), reports currentTime (onTime) for
 * transcript sync, keeps the expiring-URL refetch, ±10s, speed, and video reveal. Truthful states.
 */
export const RecordingPlayer = forwardRef<
  RecordingPlayerHandle,
  { meetingId: string; onTime: (seconds: number) => void }
>(function RecordingPlayer({ meetingId, onTime }, ref) {
  const [rec, setRec] = useState<RecordingDTO | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [speed, setSpeed] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
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

  useEffect(() => { void load(); }, [load]);
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
      void el.play().catch(() => {});
    },
  }));

  const togglePlay = () => {
    const el = mediaRef.current;
    if (!el) return;
    if (el.paused) void el.play().catch(() => {});
    else el.pause();
  };
  const nudge = (delta: number) => {
    const el = mediaRef.current;
    if (el) el.currentTime = Math.max(0, el.currentTime + delta);
  };
  const changeSpeed = (rate: number) => {
    setSpeed(rate);
    if (mediaRef.current) mediaRef.current.playbackRate = rate;
  };
  const scrub = (v: number) => {
    const el = mediaRef.current;
    if (el) { el.currentTime = v; setCurrent(v); }
  };
  const handleMediaError = () => {
    if (refetchedOnError.current) return;
    refetchedOnError.current = true;
    void load();
  };
  const onTimeUpdate = (t: number) => { setCurrent(t); onTime(t); };

  if (error) return <Panel><StripNote body={error} /></Panel>;
  if (!rec) return <Panel><StripNote body="Loading recording…" pulse /></Panel>;
  if (rec.status === "unavailable") return <Panel><StripNote body="No recording was captured for this meeting." /></Panel>;
  if (rec.status === "processing" || !rec.url) {
    return <Panel><StripNote body="Preparing the recording… it appears here automatically once it’s ready." pulse /></Panel>;
  }

  const isAudio = rec.media_type === "audio";
  const total = duration || rec.duration_seconds || 0;

  return (
    <div>
      {!isAudio && (
        <div className={`overflow-hidden transition-all duration-300 ${showVideo ? "mb-3 max-h-[460px]" : "max-h-0"}`}>
          <video
            ref={mediaRef}
            src={rec.url}
            playsInline
            onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onError={handleMediaError}
            className="aspect-video w-full rounded-xl border bg-black"
            style={{ borderColor: "var(--nf-border)" }}
          />
        </div>
      )}
      {isAudio && (
        <audio
          ref={mediaRef}
          src={rec.url}
          onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onError={handleMediaError}
          className="hidden"
        />
      )}

      <Panel>
        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? "Pause" : "Play"}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full transition-transform hover:scale-[1.04]"
            style={{ background: "var(--nf-primary)", color: "var(--nf-primary-text)" }}
          >
            {playing ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4 translate-x-[1px]" />}
          </button>

          <span className="w-11 shrink-0 text-right font-mono text-xs tabular-nums nf-t2">{formatTimestamp(current)}</span>

          <WaveScrubber seed={meetingId} current={current} total={total} onSeek={scrub} />

          <span className="w-11 shrink-0 font-mono text-xs tabular-nums nf-tm">{formatTimestamp(total)}</span>

          <div className="hidden shrink-0 items-center gap-1 sm:flex">
            <button type="button" onClick={() => nudge(-10)} aria-label="Back 10 seconds" className="nf-btn-ghost rounded-md px-1.5 py-1 text-[11px] font-medium tabular-nums">−10</button>
            <button type="button" onClick={() => nudge(10)} aria-label="Forward 10 seconds" className="nf-btn-ghost rounded-md px-1.5 py-1 text-[11px] font-medium tabular-nums">+10</button>
          </div>

          <div className="flex shrink-0 items-center gap-0.5">
            {SPEEDS.map((rate) => (
              <button
                key={rate}
                type="button"
                onClick={() => changeSpeed(rate)}
                className="rounded-md px-1.5 py-1 text-[11px] font-medium tabular-nums transition-colors"
                style={speed === rate ? { background: "var(--nf-surface-3)", color: "var(--nf-text)" } : { color: "var(--nf-text-muted)" }}
              >
                {rate}×
              </button>
            ))}
          </div>

          {!isAudio && (
            <button
              type="button"
              onClick={() => setShowVideo((v) => !v)}
              className="nf-btn-ghost hidden shrink-0 rounded-md px-2 py-1 text-[11px] font-medium md:block"
            >
              {showVideo ? "Hide video" : "Video"}
            </button>
          )}
        </div>
      </Panel>
    </div>
  );
});

/** Tactile graphite player surface — subtle top-edge highlight, quiet border, generous padding. */
function Panel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl px-4 py-3 sm:px-5"
      style={{
        background: "linear-gradient(180deg, #151517 0%, #0d0d0f 100%)",
        border: "1px solid var(--nf-border)",
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
      }}
    >
      {children}
    </div>
  );
}

function StripNote({ body, pulse }: { body: string; pulse?: boolean }) {
  return (
    <div className="flex items-center gap-2.5 py-1 text-sm nf-tm">
      <span className={`h-1.5 w-1.5 rounded-full ${pulse ? "animate-pulse" : ""}`} style={{ background: "var(--nf-text-muted)" }} aria-hidden="true" />
      <MicIcon className="h-4 w-4 shrink-0" />
      {body}
    </div>
  );
}
