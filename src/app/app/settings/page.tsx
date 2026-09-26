import { AccountSettings } from "@/components/app/AccountSettings";

export const metadata = { title: "Settings — NoteFlow" };

export default function SettingsPage() {
  return (
    <main className="relative min-w-0 flex-1 overflow-hidden px-5 py-8 sm:px-8 lg:px-10">
      <div className="relative z-10 max-w-[760px]">
        <header>
          <h1 className="text-[1.4rem] font-medium tracking-[-0.02em] nf-t">Settings</h1>
          <p className="mt-1 text-sm nf-tm">Manage your NoteFlow account.</p>
        </header>

        <div className="mt-10">
          <AccountSettings />
        </div>
      </div>
    </main>
  );
}
