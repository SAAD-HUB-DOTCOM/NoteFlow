"use client";

/**
 * The shared playback state and the `seekTo(seconds)` primitive (PLAN §6 lists this as
 * lib/seekTo.ts; it's implemented here as a provider because the primitive needs live state
 * — a media element or a synthetic clock — not a pure function).
 *
 * Everything that navigates the recording goes through `seekTo`: clicking a transcript
 * segment, an action-item timestamp, and later Ask NoteFlow citations / search results
 * (PLAN §4 — "build this once as a reusable primitive, then reuse it everywhere").
 *
 * Two clock sources:
 *   - If `recordingUrl` is set, a real <audio> element drives currentTime.
 *   - Otherwise a synthetic requestAnimationFrame clock advances over `duration`, so the
 *     sync interaction is demonstrable on every seeded meeting even though the capture
 *     layer is stubbed (the brief explicitly allows stubbing capture).
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface PlaybackApi {
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  /** Whether playback is backed by a real media file vs. the synthetic clock. */
  hasMedia: boolean;
  play: () => void;
  pause: () => void;
  toggle: () => void;
  /** Seek to a time in seconds and start playing — the one navigation primitive. */
  seekTo: (seconds: number) => void;
}

const PlaybackContext = createContext<PlaybackApi | null>(null);

export function usePlayback(): PlaybackApi {
  const ctx = useContext(PlaybackContext);
  if (!ctx) throw new Error("usePlayback must be used within <PlaybackProvider>");
  return ctx;
}

export function PlaybackProvider({
  duration,
  recordingUrl,
  children,
}: {
  duration: number;
  recordingUrl?: string;
  children: React.ReactNode;
}) {
  const hasMedia = Boolean(recordingUrl);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);

  // Synthetic clock: only runs when there's no real media and we're playing.
  useEffect(() => {
    if (hasMedia || !isPlaying) {
      lastTsRef.current = null;
      return;
    }
    const tick = (ts: number) => {
      if (lastTsRef.current === null) lastTsRef.current = ts;
      const dt = (ts - lastTsRef.current) / 1000;
      lastTsRef.current = ts;
      setCurrentTime((prev) => {
        const next = prev + dt;
        if (next >= duration) {
          setIsPlaying(false);
          return duration;
        }
        return next;
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [hasMedia, isPlaying, duration]);

  const play = useCallback(() => {
    setCurrentTime((t) => (t >= duration ? 0 : t)); // restart if at the end
    if (hasMedia) void audioRef.current?.play();
    setIsPlaying(true);
  }, [hasMedia, duration]);

  const pause = useCallback(() => {
    if (hasMedia) audioRef.current?.pause();
    setIsPlaying(false);
  }, [hasMedia]);

  const toggle = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, play, pause]);

  const seekTo = useCallback(
    (seconds: number) => {
      const t = Math.max(0, Math.min(seconds, duration));
      if (hasMedia && audioRef.current) {
        audioRef.current.currentTime = t;
        void audioRef.current.play();
      }
      setCurrentTime(t);
      setIsPlaying(true); // seeking starts playback so the sync is immediately visible
    },
    [duration, hasMedia],
  );

  const value: PlaybackApi = {
    currentTime,
    duration,
    isPlaying,
    hasMedia,
    play,
    pause,
    toggle,
    seekTo,
  };

  return (
    <PlaybackContext.Provider value={value}>
      {recordingUrl && (
        <audio
          ref={audioRef}
          src={recordingUrl}
          preload="metadata"
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}
      {children}
    </PlaybackContext.Provider>
  );
}
