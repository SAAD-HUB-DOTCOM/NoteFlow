import type { TranscriptSegment } from "@/types/meeting";

/**
 * Index of the segment active at time `t` (seconds): the one where `start <= t < end`
 * (PLAN §4). Returns -1 when `t` falls before the first segment or in a gap between
 * segments (real transcripts have silences). Binary search on `start` keeps this cheap
 * on the large ~340-segment meeting, since it runs on every playback frame.
 *
 * Assumes segments are sorted by `start` (the seed data is).
 */
export function findActiveSegmentIndex(
  segments: TranscriptSegment[],
  t: number,
): number {
  let lo = 0;
  let hi = segments.length - 1;
  let candidate = -1;

  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (segments[mid].start <= t) {
      candidate = mid; // last segment whose start is <= t
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }

  if (candidate === -1) return -1;
  return t < segments[candidate].end ? candidate : -1;
}
