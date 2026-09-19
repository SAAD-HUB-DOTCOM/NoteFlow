"use client";

import { useRef, useState } from "react";
import type { Meeting } from "@/types/meeting";
import { PlaybackProvider, usePlayback } from "@/lib/playback";
import { Player } from "@/components/workspace/Player";
import { SummaryPanel } from "@/components/workspace/SummaryPanel";
import { ActionItemsPanel } from "@/components/workspace/ActionItemsPanel";
import { TranscriptPanel } from "@/components/workspace/TranscriptPanel";

type TabId = "summary" | "actions" | "transcript";

/** Wraps the interactive workspace in shared playback state. */
export function MeetingWorkspace({ meeting }: { meeting: Meeting }) {
  return (
    <PlaybackProvider duration={meeting.durationSec} recordingUrl={meeting.recordingUrl}>
      <WorkspaceInner meeting={meeting} />
    </PlaybackProvider>
  );
}

function WorkspaceInner({ meeting }: { meeting: Meeting }) {
  const { seekTo } = usePlayback();
  const [tab, setTab] = useState<TabId>("summary");
  const tabRefs = useRef<Record<TabId, HTMLButtonElement | null>>({
    summary: null,
    actions: null,
    transcript: null,
  });

  const openActions = meeting.actionItems.filter((a) => !a.completed).length;

  const tabs: { id: TabId; label: string; badge?: number }[] = [
    { id: "summary", label: "Summary" },
    { id: "actions", label: "Action Items", badge: openActions || undefined },
    { id: "transcript", label: "Transcript", badge: meeting.transcript.length || undefined },
  ];

  // Jump into the recording at a moment and reveal it in the transcript (shared seek primitive).
  function jumpToTranscript(seconds: number) {
    setTab("transcript");
    seekTo(seconds);
  }

  function onTabKeyDown(e: React.KeyboardEvent) {
    const order: TabId[] = ["summary", "actions", "transcript"];
    const idx = order.indexOf(tab);
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const next =
        e.key === "ArrowRight"
          ? order[(idx + 1) % order.length]
          : order[(idx - 1 + order.length) % order.length];
      setTab(next);
      tabRefs.current[next]?.focus();
    }
  }

  return (
    <div className="space-y-5">
      <Player seed={meeting.id} />

      <div className="border-b border-border">
        <div role="tablist" aria-label="Meeting sections" className="flex gap-6" onKeyDown={onTabKeyDown}>
          {tabs.map((t) => {
            const selected = tab === t.id;
            return (
              <button
                key={t.id}
                ref={(el) => {
                  tabRefs.current[t.id] = el;
                }}
                role="tab"
                type="button"
                id={`tab-${t.id}`}
                aria-selected={selected}
                aria-controls={`panel-${t.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => setTab(t.id)}
                className={`-mb-px flex items-center gap-2 border-b-2 pb-3 pt-1 text-sm font-medium transition-colors ${
                  selected
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted hover:text-foreground"
                }`}
              >
                {t.label}
                {t.badge !== undefined && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-xs tabular-nums ${
                      selected ? "bg-primary/15 text-foreground" : "bg-surface text-muted"
                    }`}
                  >
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div
        role="tabpanel"
        id={`panel-${tab}`}
        aria-labelledby={`tab-${tab}`}
        className="pt-1"
      >
        {tab === "summary" && <SummaryPanel summary={meeting.summary} />}
        {tab === "actions" && (
          <ActionItemsPanel items={meeting.actionItems} onSeekTo={jumpToTranscript} />
        )}
        {tab === "transcript" && (
          <TranscriptPanel
            segments={meeting.transcript}
            participants={meeting.participants}
          />
        )}
      </div>
    </div>
  );
}
