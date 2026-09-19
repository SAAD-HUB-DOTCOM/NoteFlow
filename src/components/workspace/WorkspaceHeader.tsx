import type { Meeting } from "@/types/meeting";
import { formatDuration, formatFullDate, initialsFrom } from "@/lib/format";
import { SpeakerStack } from "@/components/SpeakerStack";
import { CalendarIcon, ClockIcon, UsersIcon } from "@/components/icons";

/** Static meeting header: title + the facts you need before pressing play. */
export function WorkspaceHeader({ meeting }: { meeting: Meeting }) {
  const people = meeting.participants.map((p) => ({
    id: p.id,
    name: p.name,
    initials: p.initials ?? initialsFrom(p.name),
  }));
  const names = meeting.participants.map((p) => p.name);
  const nameLabel =
    names.length <= 3
      ? names.join(", ")
      : `${names.slice(0, 3).join(", ")} +${names.length - 3}`;

  return (
    <div>
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">
        {meeting.title}
      </h1>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted">
        <span className="inline-flex items-center gap-1.5">
          <CalendarIcon className="h-4 w-4" />
          {formatFullDate(meeting.startedAt)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <ClockIcon className="h-4 w-4" />
          {formatDuration(meeting.durationSec)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <UsersIcon className="h-4 w-4" />
          {meeting.participants.length}{" "}
          {meeting.participants.length === 1 ? "person" : "people"}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <SpeakerStack people={people} max={5} />
        <span className="text-sm text-foreground/80">{nameLabel}</span>
      </div>
    </div>
  );
}
