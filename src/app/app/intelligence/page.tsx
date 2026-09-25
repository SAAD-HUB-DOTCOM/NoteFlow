import { ComingScreen } from "@/components/app/ComingScreen";

export const metadata = { title: "Intelligence — NoteFlow" };

export default function IntelligencePage() {
  return (
    <ComingScreen
      eyebrow="Intelligence"
      title="Intelligence"
      description="Aggregate insight across your conversations — themes, recurring questions, decisions, and open commitments."
      detail="This view will be computed from your real meetings once the aggregate endpoints are available. Nothing here is fabricated — until the data exists, per-meeting intelligence lives inside each meeting's workspace."
    />
  );
}
