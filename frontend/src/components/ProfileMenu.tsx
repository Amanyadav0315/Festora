"use client";

import { useRouter } from "next/navigation";
import type { UserDTO } from "@festora/types";

export function ProfileMenu({ user, size = "md" }: { user: UserDTO; size?: "sm" | "md" }) {
  const router = useRouter();
  const initials = user.name.trim().charAt(0).toUpperCase() || "U";
  const avatarSize = size === "sm" ? "h-9 w-9 text-sm" : "h-10 w-10 text-base";

  return (
    <button
      type="button"
      onClick={() => router.push("/profile")}
      aria-label="Open profile menu"
      className={`flex ${avatarSize} items-center justify-center rounded-full border-2 border-orange-500 bg-orange-100 font-semibold text-orange-700 hover:border-orange-600`}
    >
      {initials}
    </button>
  );
}
