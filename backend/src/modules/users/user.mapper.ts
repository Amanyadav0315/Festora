import type { UserDTO } from "@eventsaman/types";
import type { UserDocument } from "./user.model";

export function toUserDTO(user: UserDocument): UserDTO {
  return {
    id: user._id.toString(),
    name: user.name,
    // Legacy accounts created before this field existed have "" — fall back to their name so
    // nothing renders blank on screen.
    businessName: (user as any).businessName || user.name,
    phone: user.phone,
    email: user.email ?? undefined,
    role: user.role as UserDTO["role"],
    about: (user as any).about || undefined,
    avatarUrl: (user as any).avatarUrl || undefined,
    showPhonePublicly: Boolean((user as any).showPhonePublicly),
    createdAt: (user as any).createdAt.toISOString(),
  };
}
