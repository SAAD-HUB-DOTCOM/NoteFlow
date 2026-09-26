"use client";

import { usePlayback } from "@/lib/playback";
import { formatTimestamp } from "@/lib/format";
import { Waveform } from "@/components/Waveform";
import { PlayIcon, PauseIcon } from "@/components/icons";

/**
 * The recording player. Most seeded meetings have no media file (capture is stubbed), so the
 * scrubber sits over a waveform that represents the recording and shows played progress. It's
 * an accessible native range for keyboard + screen readers; the waveform + fill are the visual.
 */
export function Player({ seed }: { seed: string }) {
  const { currentTime, duration, isPlaying, toggle, seekTo, hasMedia } = usePlayback();
  const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 sm:gap-4 sm:p-4">
      <button
        type="button"
        onClick={toggle}
        aria-label={isPlaying ? "Pause" : "Play"}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#F2F2EF] text-[#0A0A0A] shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition-transform duration-150 hover:-translate-y-px focus-visible:-translate-y-px"
      >
        {isPlaying ? (
          <PauseIcon className="h-5 w-5" />
        ) : (
          <PlayIcon className="ml-0.5 h-5 w-5" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="relative h-10">
          {/* Waveform backdrop with a played/unplayed split */}
          <div className="absolute inset-0 opacity-40">
            <Waveform seed={seed} bars={64} />
          </div>
          <div
            className="absolute inset-y-0 left-0 overflow-hidden"
            style={{ width: `${progress * 100}%` }}
            aria-hidden="true"
          >
            <div className="h-full" style={{ width: `${progress > 0 ? 100 / progress : 0}%` }}>
              <Waveform seed={seed} bars={64} />
            </div>
          </div>
          {/* Playhead */}
          <div
            className="absolute inset-y-0 w-px bg-foreground/70"
            style={{ left: `${progress * 100}%` }}
            aria-hidden="true"
          />
          {/* Accessible seek control layered on top */}
          <input
            type="range"
            min={0}
            max={duration}
            step={0.1}
            value={currentTime}
            onChange={(e) => seekTo(Number(e.target.value))}
            aria-label="Seek recording"
            aria-valuetext={`${formatTimestamp(currentTime)} of ${formatTimestamp(duration)}`}
            className="absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent accent-white [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-foreground [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-foreground [&::-moz-range-track]:bg-transparent"
          />
        </div>
      </div>

      <div className="shrink-0 text-sm tabular-nums text-muted">
        <span className="text-foreground">{formatTimestamp(currentTime)}</span>
        <span> / {formatTimestamp(duration)}</span>
      </div>

      {!hasMedia && (
        <span
          className="hidden shrink-0 rounded-full border border-border bg-background/40 px-2.5 py-1 text-xs text-muted sm:inline"
          title="This seeded meeting has no media file; the player simulates playback to demonstrate transcript sync."
        >
          Simulated
        </span>
      )}
    </div>
  );
}
