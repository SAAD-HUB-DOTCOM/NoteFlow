import { ComingScreen } from "@/components/app/ComingScreen";

export const metadata = { title: "Settings — NoteFlow" };

export default function SettingsPage() {
  return (
    <ComingScreen
      eyebrow="Settings"
      title="Settings"
      description="Account, capture defaults, and workspace preferences."
      detail="Settings surfaces will be wired to real account and capture endpoints as they land. Sign-out is available from your account menu at the bottom of the sidebar."
    />
  );
}
