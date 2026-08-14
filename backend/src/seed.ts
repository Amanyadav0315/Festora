import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { connectDB } from "./config/db";
import { CategoryModel } from "./modules/categories/category.model";
import { SEED_CATEGORIES } from "./modules/categories/category.data";
import { SubcategoryModel } from "./modules/categories/subcategory.model";
import { SEED_SUBCATEGORIES } from "./modules/categories/subcategory.data";
import { UserModel } from "./modules/users/user.model";
import { StoreModel } from "./modules/stores/store.model";
import { ListingModel } from "./modules/listings/listing.model";

const ADMIN_EMAIL = "adm@eventsaman.com";
const ADMIN_PASSWORD = "Pass@EventSaman1";
const ADMIN_PHONE = "9800000000";

async function seed() {
  await connectDB();

  // Bootstrap only: categories/subcategories are managed from the admin panel afterwards,
  // so re-running seed must never overwrite admin edits.
  for (const category of SEED_CATEGORIES) {
    await CategoryModel.updateOne({ slug: category.slug }, { $setOnInsert: category }, { upsert: true });
  }
  console.log(`[seed] bootstrapped ${SEED_CATEGORIES.length} categories (existing ones left untouched)`);

  for (const subcategory of SEED_SUBCATEGORIES) {
    await SubcategoryModel.updateOne({ slug: subcategory.slug }, { $setOnInsert: subcategory }, { upsert: true });
  }
  console.log(`[seed] bootstrapped ${SEED_SUBCATEGORIES.length} subcategories (existing ones left untouched)`);

  const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await UserModel.updateOne(
    { email: ADMIN_EMAIL },
    {
      $set: {
        name: "Event Saman Admin",
        businessName: "Event Saman Admin",
        phone: ADMIN_PHONE,
        email: ADMIN_EMAIL,
        passwordHash: adminPasswordHash,
        role: "admin",
      },
    },
    { upsert: true }
  );
  console.log(`[seed] upserted admin account: ${ADMIN_EMAIL}`);

  // One-time cleanup: earlier seeds inserted demo vendors/stores/listings under @eventsaman.demo
  // emails. Remove them so the site only shows real user-created content.
  const demoUsers = await UserModel.find({ email: /@eventsaman\.demo$/ });
  if (demoUsers.length > 0) {
    const demoUserIds = demoUsers.map((u) => u._id);
    const demoStores = await StoreModel.find({ ownerId: { $in: demoUserIds } });
    const demoStoreIds = demoStores.map((s) => s._id);

    const { deletedCount: listingsDeleted } = await ListingModel.deleteMany({ storeId: { $in: demoStoreIds } });
    const { deletedCount: storesDeleted } = await StoreModel.deleteMany({ ownerId: { $in: demoUserIds } });
    const { deletedCount: usersDeleted } = await UserModel.deleteMany({ _id: { $in: demoUserIds } });

    console.log(`[seed] removed ${usersDeleted} demo users, ${storesDeleted} demo stores, ${listingsDeleted} demo listings`);
  }

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("[seed] failed", err);
  process.exit(1);
});
