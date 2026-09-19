import type { Meeting } from "@/types/meeting";
import {
  formatDuration,
  initialsFrom,
  relativeMeetingTime,
  type DateGroup,
} from "@/lib/format";

/**
 * The lightweight projection of a Meeting that the dashboard needs. Building this on the
 * server keeps the full transcript (up to ~350 segments for the large meeting) out of the
 * client bundle — only these fields cross to the browser.
 */
export interface MeetingCardData {
  id: string;
  title: string;
  timeLabel: string;
  durationLabel: string;
  summaryPreview: string;
  participants: { id: string; name: string; initials: string }[];
  speakerCount: number;
  openActions: number;
  group: DateGroup;
  groupOrder: number;
}

export function toMeetingCard(meeting: Meeting, now: Date): MeetingCardData {
  const { group, groupOrder, label } = relativeMeetingTime(meeting.startedAt, now);
  const participants = meeting.participants.map((p) => ({
    id: p.id,
    name: p.name,
    initials: p.initials ?? initialsFrom(p.name),
  }));
  const openActions = meeting.actionItems.filter((a) => !a.completed).length;

  return {
    id: meeting.id,
    title: meeting.title,
    timeLabel: label,
    durationLabel: formatDuration(meeting.durationSec),
    summaryPreview: meeting.summary.tldr,
    participants,
    speakerCount: participants.length,
    openActions,
    group,
    groupOrder,
  };
}

/** Card data for all meetings, sorted newest-first within their date group. */
export function buildDashboardCards(meetings: Meeting[], now: Date): MeetingCardData[] {
  return meetings
    .map((m) => ({ card: toMeetingCard(m, now), startedAt: m.startedAt }))
    .sort((a, b) => {
      if (a.card.groupOrder !== b.card.groupOrder) {
        return a.card.groupOrder - b.card.groupOrder;
      }
      return b.startedAt.localeCompare(a.startedAt); // newest first within a group
    })
    .map((x) => x.card);
}
