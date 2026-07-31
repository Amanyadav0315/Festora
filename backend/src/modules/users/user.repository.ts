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
  create(data: { name: string; phone: string; email?: string; passwordHash: string; role: "buyer" | "vendor" | "admin" }) {
    return UserModel.create(data);
  },
};
