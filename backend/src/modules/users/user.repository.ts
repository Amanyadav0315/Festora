import { UserModel } from "./user.model";

export const userRepository = {
  findByEmail(email: string) {
    return UserModel.findOne({ email: email.toLowerCase() });
  },
  findById(id: string) {
    return UserModel.findById(id);
  },
  create(data: { name: string; email: string; passwordHash: string; role: "buyer" | "vendor" | "admin" }) {
    return UserModel.create(data);
  },
};
