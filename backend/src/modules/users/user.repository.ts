import { UserModel } from "./user.model";

const PHONE_REGEX = /^[6-9]\d{9}$/;

export const userRepository = {
  findByEmail(email: string) {
    return UserModel.findOne({ email: email.toLowerCase() });
  },
  findByPhone(phone: string) {
    return UserModel.findOne({ phone });
  },
  findByIdentifier(identifier: string) {
    return PHONE_REGEX.test(identifier)
      ? UserModel.findOne({ phone: identifier })
      : UserModel.findOne({ email: identifier.toLowerCase() });
  },
  findById(id: string) {
    return UserModel.findById(id);
  },
  updateProfile(id: string, data: { name?: string; email?: string; about?: string }) {
    return UserModel.findByIdAndUpdate(id, { $set: data }, { new: true });
  },
  updateAvatar(id: string, avatarUrl: string) {
    return UserModel.findByIdAndUpdate(id, { $set: { avatarUrl } }, { new: true });
  },
  removeAvatar(id: string) {
    return UserModel.findByIdAndUpdate(id, { $unset: { avatarUrl: "" } }, { new: true });
  },
  updatePasswordHash(id: string, passwordHash: string) {
    return UserModel.findByIdAndUpdate(id, { $set: { passwordHash } }, { new: true });
  },
  updatePhoneVisibility(id: string, showPhonePublicly: boolean) {
    return UserModel.findByIdAndUpdate(id, { $set: { showPhonePublicly } }, { new: true });
  },
  create(data: {
    name: string;
    businessName: string;
    phone: string;
    email?: string;
    passwordHash: string;
    role?: "user" | "admin";
    termsAcceptedAt?: Date;
  }) {
    return UserModel.create(data);
  },
};
