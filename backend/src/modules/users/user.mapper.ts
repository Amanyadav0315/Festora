import type { UserDTO } from "@eventsaman/types";
import type { UserDocument } from "./user.model";

export function toUserDTO(user: UserDocument): UserDTO {
  return {
    id: user._id.toString(),
    name: user.name,
    phone: user.phone,
    email: user.email ?? undefined,
    role: user.role as UserDTO["role"],
    about: (user as any).about || undefined,
    createdAt: (user as any).createdAt.toISOString(),
  };
}
