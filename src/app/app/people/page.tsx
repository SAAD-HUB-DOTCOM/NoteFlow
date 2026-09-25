import { ComingScreen } from "@/components/app/ComingScreen";

export const metadata = { title: "People — NoteFlow" };

export default function PeoplePage() {
  return (
    <ComingScreen
      eyebrow="People"
      title="People"
      description="The people in your conversations — who you meet with, what you discuss, and what they own."
      detail="NoteFlow will group meetings by participant once speaker identity is exposed by the backend. It stays conversation-centric — no invented contact details or org data."
    />
  );
}
