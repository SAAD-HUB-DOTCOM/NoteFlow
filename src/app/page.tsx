import { meetings } from "@/data/meetings";
import { buildDashboardCards } from "@/lib/dashboard";
import { buildSearchIndex } from "@/lib/search";
import { MeetingsView } from "@/components/MeetingsView";

export default function Home() {
  // Anchor "now" to the most recent meeting so the seeded data always groups sensibly
  // (Today / This week / Earlier) regardless of the server's wall clock — the alternative
  // would file every seeded meeting under "Earlier" whenever the demo is opened later.
  const latest = meetings.reduce(
    (max, m) => (m.startedAt > max ? m.startedAt : max),
    meetings[0]?.startedAt ?? "",
  );
  const now = latest ? new Date(latest) : new Date();

  const cards = buildDashboardCards(meetings, now);
  const totalOpenActions = meetings.reduce(
    (sum, m) => sum + m.actionItems.filter((a) => !a.completed).length,
    0,
  );

  return (
    <MeetingsView
      cards={cards}
      totalOpenActions={totalOpenActions}
      searchEntries={buildSearchIndex(meetings)}
    />
  );
}
