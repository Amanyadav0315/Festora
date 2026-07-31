import type { UserDTO } from "@festora/types";
import type { UserDocument } from "./user.model";

export function toUserDTO(user: UserDocument): UserDTO {
  return {
    id: user._id.toString(),
    name: user.name,
    phone: user.phone,
    email: user.email ?? undefined,
    role: user.role as UserDTO["role"],
    createdAt: (user as any).createdAt.toISOString(),
  };
}
