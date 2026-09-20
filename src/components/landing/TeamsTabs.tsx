"use client";

import { useState } from "react";
import {
  SparkleIcon,
  ChecklistIcon,
  SearchIcon,
  ShareIcon,
  UsersIcon,
  LayersIcon,
} from "@/components/icons";

type Feature = { icon: React.ReactNode; title: string; body: string };
type Tab = { id: string; label: string; lead: string; blurb: string; features: Feature[] };

const TABS: Tab[] = [
  {
    id: "teams",
    label: "For teams",
    lead: "One shared record, so nothing gets lost between meetings.",
    blurb:
      "Every call becomes searchable team memory — decisions, owners, and follow-ups visible to everyone, without the manual write-up.",
    features: [
      { icon: <ChecklistIcon className="h-5 w-5" />, title: "Follow-ups that carry over", body: "Action items from every call roll up in one place, assigned to the person who took them on." },
      { icon: <SearchIcon className="h-5 w-5" />, title: "Search the whole team's calls", body: "Find a decision or a customer's name across months of meetings in a single query." },
      { icon: <UsersIcon className="h-5 w-5" />, title: "Shared visibility", body: "Anyone who missed the call reads the recap instead of asking around." },
      { icon: <LayersIcon className="h-5 w-5" />, title: "Patterns across meetings", body: "Spot what keeps coming up — risks, blockers, and repeated asks — before they grow." },
    ],
  },
  {
    id: "individuals",
    label: "For individuals",
    lead: "Be fully present, and still have perfect notes.",
    blurb:
      "NoteFlow listens so you don't have to split your attention. Hang up, and the summary, transcript, and action items are already waiting.",
    features: [
      { icon: <SparkleIcon className="h-5 w-5" />, title: "Instant recaps", body: "A clean summary lands the moment your call ends — no blank page, no cleanup." },
      { icon: <ChecklistIcon className="h-5 w-5" />, title: "Your commitments, tracked", body: "Everything you agreed to is pulled out and waiting, tied to the moment you said it." },
      { icon: <SearchIcon className="h-5 w-5" />, title: "Recall on demand", body: "Ask what was decided three weeks ago and get an answer with the timestamp." },
      { icon: <ShareIcon className="h-5 w-5" />, title: "Share in a link", body: "Send a recap or a clip to anyone — they don't need a NoteFlow account." },
    ],
  },
];

export function TeamsTabs() {
  const [active, setActive] = useState(TABS[0].id);
  const tab = TABS.find((t) => t.id === active) ?? TABS[0];

  return (
    <div className="rounded-3xl border border-border bg-surface/40 p-6 backdrop-blur-sm sm:p-10">
      <div role="tablist" aria-label="Who NoteFlow is for" className="flex gap-8 border-b border-border">
        {TABS.map((t) => {
          const selected = t.id === active;
          return (
            <button
              key={t.id}
              role="tab"
              type="button"
              aria-selected={selected}
              onClick={() => setActive(t.id)}
              className={`-mb-px border-b-2 pb-4 font-display text-xl font-medium transition-colors sm:text-2xl ${
                selected
                  ? "border-accent text-foreground"
                  : "border-transparent text-muted hover:text-foreground"
              }`}
            >
              NoteFlow {t.label.replace("For ", "for ")}
            </button>
          );
        })}
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_1.4fr] lg:gap-16">
        <div>
          <h3 className="font-display text-2xl font-semibold leading-tight text-foreground">
            {tab.lead}
          </h3>
          <p className="mt-4 max-w-sm text-[0.95rem] leading-relaxed text-muted">{tab.blurb}</p>
        </div>
        {/* borderless feature list — deliberately not a card kit */}
        <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {tab.features.map((f) => (
            <div key={f.title}>
              <span className="text-primary">{f.icon}</span>
              <h4 className="mt-3 font-display text-base font-semibold text-foreground">{f.title}</h4>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
