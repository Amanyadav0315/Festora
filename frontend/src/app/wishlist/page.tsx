import { BackHeader } from "@/components/BackHeader";

export default function WishlistPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 pb-10 sm:pb-16">
      <BackHeader title="Wishlist" />
      <div className="mt-4 rounded-xl border border-gray-100 bg-white px-4 py-10 text-center shadow-sm">
        <p className="text-sm text-gray-500">Coming soon — save listings to your wishlist.</p>
      </div>
    </main>
  );
}
