"use client";

import { useEffect, useRef, useState } from "react";
import type { Meeting } from "@/types/meeting";
import { PlaybackProvider, usePlayback } from "@/lib/playback";
import { Player } from "@/components/workspace/Player";
import { SummaryPanel } from "@/components/workspace/SummaryPanel";
import { ActionItemsPanel } from "@/components/workspace/ActionItemsPanel";
import { TranscriptPanel } from "@/components/workspace/TranscriptPanel";
import { AskNoteFlow } from "@/components/workspace/AskNoteFlow";

type TabId = "summary" | "actions" | "transcript" | "ask";

const TAB_ORDER: TabId[] = ["summary", "actions", "transcript", "ask"];

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
    ask: null,
  });

  const openActions = meeting.actionItems.filter((a) => !a.completed).length;

  const tabs: { id: TabId; label: string; badge?: number }[] = [
    { id: "summary", label: "Summary" },
    { id: "actions", label: "Action Items", badge: openActions || undefined },
    { id: "transcript", label: "Transcript" },
    { id: "ask", label: "Ask NoteFlow" },
  ];

  // Jump into the recording at a moment and reveal it in the transcript (shared seek primitive).
  function jumpToTranscript(seconds: number) {
    setTab("transcript");
    seekTo(seconds);
  }

  // Deep link from cross-meeting search (?t=seconds): open on the transcript and seek there.
  useEffect(() => {
    const t = new URLSearchParams(window.location.search).get("t");
    if (t === null) return;
    const secs = Number(t);
    if (!Number.isNaN(secs)) jumpToTranscript(secs);
    // Run once on mount; jumpToTranscript is stable enough for this deep-link intent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function onTabKeyDown(e: React.KeyboardEvent) {
    const idx = TAB_ORDER.indexOf(tab);
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const next =
        e.key === "ArrowRight"
          ? TAB_ORDER[(idx + 1) % TAB_ORDER.length]
          : TAB_ORDER[(idx - 1 + TAB_ORDER.length) % TAB_ORDER.length];
      setTab(next);
      tabRefs.current[next]?.focus();
    }
  }

  return (
    <div className="space-y-5">
      <Player seed={meeting.id} />

      <div className="border-b border-border">
        <div
          role="tablist"
          aria-label="Meeting sections"
          className="flex gap-6 overflow-x-auto"
          onKeyDown={onTabKeyDown}
        >
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
                className={`-mb-px flex shrink-0 items-center gap-2 whitespace-nowrap border-b-2 pb-3 pt-1 text-sm font-medium transition-colors ${
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
        {tab === "ask" && (
          <AskNoteFlow askAnswers={meeting.askAnswers} onSeekTo={jumpToTranscript} />
        )}
      </div>
    </div>
  );
}
