"use client";

import { useEffect, useState } from "react";
import type { CategoryDTO, SubcategoryDTO } from "@festora/types";
import { apiFetch, apiUpload, ApiRequestError, ASSET_BASE_URL } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-client";
import { ImageField } from "@/components/admin/ImageField";

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">{title}</h2>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function CategoryEditModal({
  category,
  onClose,
  onSaved,
}: {
  category: CategoryDTO;
  onClose: () => void;
  onSaved: (updated: CategoryDTO) => void;
}) {
  const [name, setName] = useState(category.name);
  const [nameHi, setNameHi] = useState(category.nameHi ?? "");
  const [description, setDescription] = useState(category.description ?? "");
  const [descriptionHi, setDescriptionHi] = useState(category.descriptionHi ?? "");
  const [icon, setIcon] = useState(category.icon ?? "");
  const [image, setImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("name", name);
      formData.set("nameHi", nameHi);
      formData.set("description", description);
      formData.set("descriptionHi", descriptionHi);
      formData.set("icon", icon);
      if (image) formData.set("image", image);

      const { category: updated } = await apiUpload<{ category: CategoryDTO }>(
        `/categories/${category.id}`,
        formData,
        { method: "PATCH", accessToken: getAccessToken() ?? undefined }
      );
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title="Edit category" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="text-xs font-medium text-gray-600">
          Name
          <input
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label className="text-xs font-medium text-gray-600">
          Name (Hindi)
          <input
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={nameHi}
            onChange={(e) => setNameHi(e.target.value)}
          />
        </label>
        <label className="text-xs font-medium text-gray-600">
          Description
          <textarea
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </label>
        <label className="text-xs font-medium text-gray-600">
          Description (Hindi)
          <textarea
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={descriptionHi}
            onChange={(e) => setDescriptionHi(e.target.value)}
            rows={2}
          />
        </label>
        <label className="text-xs font-medium text-gray-600">
          Icon (emoji, optional)
          <input
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            maxLength={10}
          />
        </label>
        <div>
          <p className="mb-1 text-xs font-medium text-gray-600">Picture</p>
          <ImageField currentImageUrl={category.imageUrl} onChange={setImage} />
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="mt-2 w-full rounded-md bg-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>
    </Modal>
  );
}

function SubcategoryFormModal({
  categories,
  subcategory,
  onClose,
  onSaved,
}: {
  categories: CategoryDTO[];
  subcategory: SubcategoryDTO | null;
  onClose: () => void;
  onSaved: (saved: SubcategoryDTO, isNew: boolean) => void;
}) {
  const [name, setName] = useState(subcategory?.name ?? "");
  const [nameHi, setNameHi] = useState(subcategory?.nameHi ?? "");
  const [categorySlug, setCategorySlug] = useState<string>(subcategory?.categorySlug ?? categories[0]?.slug ?? "");
  const [featured, setFeatured] = useState(subcategory?.featured ?? false);
  const [image, setImage] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("name", name);
      formData.set("nameHi", nameHi);
      formData.set("categorySlug", categorySlug);
      formData.set("featured", String(featured));
      if (image) formData.set("image", image);

      const accessToken = getAccessToken() ?? undefined;
      if (subcategory) {
        const { subcategory: updated } = await apiUpload<{ subcategory: SubcategoryDTO }>(
          `/subcategories/${subcategory.id}`,
          formData,
          { method: "PATCH", accessToken }
        );
        onSaved(updated, false);
      } else {
        const { subcategory: created } = await apiUpload<{ subcategory: SubcategoryDTO }>(
          "/subcategories",
          formData,
          { method: "POST", accessToken }
        );
        onSaved(created, true);
      }
      onClose();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={subcategory ? "Edit category tile" : "Add category tile"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="text-xs font-medium text-gray-600">
          Name
          <input
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
        <label className="text-xs font-medium text-gray-600">
          Name (Hindi)
          <input
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={nameHi}
            onChange={(e) => setNameHi(e.target.value)}
          />
        </label>
        <label className="text-xs font-medium text-gray-600">
          Parent category
          <select
            className="mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
            value={categorySlug}
            onChange={(e) => setCategorySlug(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-xs font-medium text-gray-600">
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} />
          Show in homepage quick-access row
        </label>
        <div>
          <p className="mb-1 text-xs font-medium text-gray-600">Picture</p>
          <ImageField currentImageUrl={subcategory?.imageUrl} onChange={setImage} />
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="mt-2 w-full rounded-md bg-orange-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : subcategory ? "Save changes" : "Create"}
        </button>
      </form>
    </Modal>
  );
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingCategory, setEditingCategory] = useState<CategoryDTO | null>(null);
  const [subModalOpen, setSubModalOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState<SubcategoryDTO | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [{ categories: cats }, { subcategories: subs }] = await Promise.all([
          apiFetch<{ categories: CategoryDTO[] }>("/categories"),
          apiFetch<{ subcategories: SubcategoryDTO[] }>("/subcategories"),
        ]);
        setCategories(cats);
        setSubcategories(subs);
      } catch (err) {
        setError(err instanceof ApiRequestError ? err.message : "Failed to load categories");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function openAddSubcategory() {
    setEditingSubcategory(null);
    setSubModalOpen(true);
  }

  function openEditSubcategory(sub: SubcategoryDTO) {
    setEditingSubcategory(sub);
    setSubModalOpen(true);
  }

  function handleSubSaved(saved: SubcategoryDTO, isNew: boolean) {
    setSubcategories((prev) =>
      isNew ? [...prev, saved].sort((a, b) => a.name.localeCompare(b.name)) : prev.map((s) => (s.id === saved.id ? saved : s))
    );
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await apiFetch(`/subcategories/${id}`, {
        method: "DELETE",
        accessToken: getAccessToken() ?? undefined,
      });
      setSubcategories((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to delete");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) return <p className="text-sm text-gray-500">Loading...</p>;

  return (
    <div>
      <h1 className="text-xl font-bold sm:text-2xl">Categories</h1>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-gray-900">Main categories</h2>
        <p className="mt-1 text-xs text-gray-500">
          Fixed set of 6 — you can edit their name, description, icon, and picture, but not add or remove them.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {categories.map((cat) => (
            <div key={cat.id} className="rounded-xl border border-gray-200 bg-white p-3 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
                {cat.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`${ASSET_BASE_URL}${cat.imageUrl}`} alt={cat.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl">{cat.icon ?? "🎉"}</span>
                )}
              </div>
              <p className="mt-2 text-xs font-medium text-gray-800">{cat.name}</p>
              {cat.nameHi && <p className="text-[10px] text-gray-400">{cat.nameHi}</p>}
              <button
                onClick={() => setEditingCategory(cat)}
                className="mt-2 text-xs font-medium text-orange-600 hover:underline"
              >
                Edit
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">Category tiles</h2>
            <p className="mt-1 text-xs text-gray-500">These show up on the homepage grid and browse filters.</p>
          </div>
          <button
            onClick={openAddSubcategory}
            className="shrink-0 rounded-md bg-orange-600 px-3 py-2 text-xs font-semibold text-white hover:bg-orange-700"
          >
            + Add tile
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {subcategories.map((sub) => (
            <div key={sub.id} className="rounded-xl border border-gray-200 bg-white p-3">
              <div className="aspect-square w-full overflow-hidden rounded-lg bg-gray-100">
                {sub.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={`${ASSET_BASE_URL}${sub.imageUrl}`} alt={sub.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl">{sub.icon ?? "🎉"}</div>
                )}
              </div>
              <p className="mt-2 truncate text-xs font-medium text-gray-800">{sub.name}</p>
              {sub.nameHi && <p className="truncate text-[10px] text-gray-400">{sub.nameHi}</p>}
              <p className="truncate text-[11px] text-gray-400">
                {categories.find((c) => c.slug === sub.categorySlug)?.name ?? sub.categorySlug}
                {sub.featured ? " · featured" : ""}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  onClick={() => openEditSubcategory(sub)}
                  className="flex-1 rounded-md border border-gray-300 py-1 text-[11px] font-medium text-gray-700 hover:bg-gray-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(sub.id)}
                  disabled={deletingId === sub.id}
                  className="flex-1 rounded-md border border-red-200 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  {deletingId === sub.id ? "..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {editingCategory && (
        <CategoryEditModal
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
          onSaved={(updated) => setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))}
        />
      )}

      {subModalOpen && (
        <SubcategoryFormModal
          categories={categories}
          subcategory={editingSubcategory}
          onClose={() => setSubModalOpen(false)}
          onSaved={handleSubSaved}
        />
      )}
    </div>
  );
}