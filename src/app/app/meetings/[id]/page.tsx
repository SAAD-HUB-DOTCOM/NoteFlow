import { RealMeetingWorkspace } from "@/components/app/RealMeetingWorkspace";

export const metadata = { title: "Meeting — NoteFlow" };

export default async function MeetingWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <RealMeetingWorkspace meetingId={id} />;
}
