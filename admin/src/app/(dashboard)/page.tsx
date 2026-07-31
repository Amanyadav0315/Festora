import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <div>
      <h1 className="text-xl font-bold sm:text-2xl">Dashboard</h1>
      <p className="mt-1 text-sm text-gray-500">Manage the categories shown across Festora.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/categories"
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <p className="text-sm font-semibold text-gray-900">Categories</p>
          <p className="mt-1 text-xs text-gray-500">Add, edit, delete categories and their pictures</p>
        </Link>

        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-5 text-gray-400">
          <p className="text-sm font-semibold">Listings</p>
          <p className="mt-1 text-xs">Coming soon</p>
        </div>

        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-5 text-gray-400">
          <p className="text-sm font-semibold">Users &amp; Vendors</p>
          <p className="mt-1 text-xs">Coming soon</p>
        </div>
      </div>
    </div>
  );
}