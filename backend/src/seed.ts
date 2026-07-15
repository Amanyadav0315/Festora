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
import { SEED_VENDORS, PLACEHOLDER_IMAGE } from "./modules/listings/listing.seed-data";

const DEMO_PASSWORD = "demo1234";

async function seed() {
  await connectDB();

  for (const category of SEED_CATEGORIES) {
    await CategoryModel.updateOne({ slug: category.slug }, { $set: category }, { upsert: true });
  }
  console.log(`[seed] upserted ${SEED_CATEGORIES.length} categories`);

  for (const subcategory of SEED_SUBCATEGORIES) {
    await SubcategoryModel.updateOne({ slug: subcategory.slug }, { $set: subcategory }, { upsert: true });
  }
  console.log(`[seed] upserted ${SEED_SUBCATEGORIES.length} subcategories`);

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);
  let listingCount = 0;

  for (const vendor of SEED_VENDORS) {
    const user = await UserModel.findOneAndUpdate(
      { email: vendor.email },
      { $set: { name: vendor.name, email: vendor.email, passwordHash, role: "vendor" } },
      { upsert: true, new: true }
    );

    const store = await StoreModel.findOneAndUpdate(
      { ownerId: user._id },
      {
        $set: {
          ownerId: user._id,
          name: vendor.storeName,
          categories: vendor.categories,
          city: vendor.city,
        },
      },
      { upsert: true, new: true }
    );

    for (const listing of vendor.listings) {
      await ListingModel.updateOne(
        { storeId: store._id, title: listing.title },
        {
          $set: {
            ...listing,
            storeId: store._id,
            city: vendor.city,
            images: [PLACEHOLDER_IMAGE],
            isActive: true,
          },
        },
        { upsert: true }
      );
      listingCount += 1;
    }
  }

  console.log(`[seed] upserted ${SEED_VENDORS.length} demo vendors/stores and ${listingCount} listings`);
  console.log(`[seed] demo vendor password: ${DEMO_PASSWORD}`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error("[seed] failed", err);
  process.exit(1);
});
