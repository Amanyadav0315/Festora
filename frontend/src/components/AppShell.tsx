"use client";

import { usePathname } from "next/navigation";
import { isChatThreadPath } from "@/lib/chatRoute";

// The body reserves space for the mobile bottom tab bar (pb-16) and the sticky top navbar's
// height on every page — except chat thread screens, which hide both bars and go edge-to-edge.
// Padding is applied here (not on <body> itself) so it can react to the current route.
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const fullScreen = isChatThreadPath(pathname);

  return <div className={fullScreen ? "" : "pb-16 lg:pb-0"}>{children}</div>;
}
