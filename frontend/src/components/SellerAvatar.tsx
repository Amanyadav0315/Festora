import { ASSET_BASE_URL } from "@/lib/api";

const AVATAR_COLORS = [
  "bg-orange-500",
  "bg-rose-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-sky-500",
  "bg-violet-500",
];

function colorFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function resolveAvatarUrl(src: string) {
  return src.startsWith("http") ? src : `${ASSET_BASE_URL}${src}`;
}

export function SellerAvatar({
  name,
  avatarUrl,
  size = "sm",
}: {
  name: string;
  avatarUrl?: string;
  size?: "sm" | "md";
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  const dims = size === "sm" ? "h-5 w-5 text-[10px]" : "h-9 w-9 text-sm";

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolveAvatarUrl(avatarUrl)}
        alt={`${name}'s profile photo`}
        className={`shrink-0 rounded-full object-cover ${dims}`}
      />
    );
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${colorFor(name)} ${dims}`}
    >
      {initial}
    </span>
  );
}
