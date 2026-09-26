"use client";

import { useState } from "react";
import { Sidebar } from "@/components/app/shell/Sidebar";
import { AppTopbar } from "@/components/app/shell/AppTopbar";

/**
 * Authenticated app chrome: persistent left sidebar + light top bar, with the page filling the
 * scrollable content region. The sidebar is persistent on desktop and a drawer below `lg`.
 * `.nf-app` scopes the restrained --nf-* material to everything inside (REDESIGN.md §4–§5).
 */
export function AppShell({
  name,
  email,
  children,
}: {
  name: string | null;
  email: string | null;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="nf-app flex h-screen overflow-hidden">
      <Sidebar name={name} email={email} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppTopbar onMenu={() => setMobileOpen(true)} />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full min-w-0 max-w-[1440px]">{children}</div>
        </div>
      </div>
    </div>
  );
}
