import { ASSET_BASE_URL } from "@/lib/api";

const SIZES = {
  sm: "h-9 w-9 text-sm",
  md: "h-14 w-14 text-lg",
  lg: "h-20 w-20 text-2xl",
} as const;

function resolveAvatarUrl(src: string) {
  return src.startsWith("http") ? src : `${ASSET_BASE_URL}${src}`;
}

// Single place that decides how a user's avatar renders — an uploaded photo if they have one,
// otherwise the initials-in-a-circle fallback every user-facing screen already used. Used
// anywhere a signed-in user's own avatar is shown (navbar, profile, dashboard, account menu) so
// the same photo appears consistently instead of each screen re-implementing its own fallback.
export function UserAvatar({
  name,
  avatarUrl,
  size = "md",
  className,
}: {
  name: string;
  avatarUrl?: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || "U";
  const dims = SIZES[size];

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolveAvatarUrl(avatarUrl)}
        alt={`${name}'s profile photo`}
        className={`shrink-0 rounded-full border-2 border-orange-500 object-cover ${dims} ${className ?? ""}`}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full border-2 border-orange-500 bg-orange-100 font-semibold text-orange-700 ${dims} ${className ?? ""}`}
    >
      {initial}
    </div>
  );
}
