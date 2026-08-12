"use client";

import { useRouter } from "next/navigation";
import type { UserDTO } from "@eventsaman/types";
import { UserAvatar } from "@/components/UserAvatar";

export function ProfileMenu({ user, size = "md" }: { user: UserDTO; size?: "sm" | "md" }) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push("/profile")}
      aria-label="Open profile menu"
      className="rounded-full hover:opacity-90"
    >
      <UserAvatar name={user.name} avatarUrl={user.avatarUrl} size="sm" />
    </button>
  );
}
