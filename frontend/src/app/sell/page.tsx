"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import type { CategoryDTO, ListingCondition, ListingDTO, ListingPurpose, SubcategoryDTO } from "@eventsaman/types";
import {
  MAX_LISTING_CATEGORIES,
  MAX_LISTING_KEYWORDS,
  MAX_LISTING_DESCRIPTION_LENGTH,
  MAX_LISTING_IMAGES,
  MIN_LISTING_IMAGES,
  MIN_LISTING_KEYWORDS,
} from "@eventsaman/types";
import { ASSET_BASE_URL, apiFetch, apiUpload, ApiRequestError } from "@/lib/api";
import { getAccessToken, getUser } from "@/lib/auth-client";
import { CityAutocomplete } from "@/components/CityAutocomplete";

const TOTAL_STEPS = 6;
const DRAFT_KEY = "eventsaman_sell_draft";

interface Draft {
  condition: ListingCondition | null;
  purpose: ListingPurpose | null;
  categorySlugs: string[];
  subcategorySlug: string | null;
  keywords: string[];
  title: string;
  price: string;
  priceUnit: string;
  city: string;
  locationUrl: string;
  description: string;
  descriptionHi: string;
}

function resolveImageUrl(src: string) {
  return src.startsWith("http") ? src : `${ASSET_BASE_URL}${src}`;
}

export default function SellPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("sell");

  const editId = searchParams.get("edit");
  const duplicateId = searchParams.get("duplicate");
  const sourceId = editId ?? duplicateId;
  const isEdit = Boolean(editId);

  const [checkedAuth, setCheckedAuth] = useState(false);
  const [loadingSource, setLoadingSource] = useState(Boolean(sourceId));
  const [step, setStep] = useState(1);

  const [condition, setCondition] = useState<ListingCondition | null>(null);
  const [purpose, setPurpose] = useState<ListingPurpose | null>(null);
  const [categories, setCategories] = useState<CategoryDTO[]>([]);
  const [categorySlugs, setCategorySlugs] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<SubcategoryDTO[]>([]);
  const [subcategorySlug, setSubcategorySlug] = useState<string | null>(null);
  const [keywords, setKeywords] = useState<string[]>([]);
  const [keywordInput, setKeywordInput] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [priceUnit, setPriceUnit] = useState("");
  const [city, setCity] = useState("");
  const [locationUrl, setLocationUrl] = useState("");
  const [priceGuidance, setPriceGuidance] = useState<number | null>(null);
  const [description, setDescription] = useState("");
  const [descriptionHi, setDescriptionHi] = useState("");

  const [existingImages, setExistingImages] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const totalImageCount = existingImages.length + newImages.length;

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<ListingDTO | null>(null);

  // Draft prompt shown on a fresh /sell visit when a previously saved draft exists — lets the
  // user choose to resume it or start blank, instead of silently restoring it every time.
  const [pendingDraft, setPendingDraft] = useState<Draft | null>(null);
  // Leave-without-posting prompt shown when the user tries to navigate back with unsaved changes.
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  useEffect(() => {
    if (!getUser()) {
      router.replace("/login");
      return;
    }
    setCheckedAuth(true);
    apiFetch<{ categories: CategoryDTO[] }>("/categories")
      .then((res) => setCategories(res.categories))
      .catch(() => setCategories([]));
    apiFetch<{ subcategories: SubcategoryDTO[] }>("/subcategories")
      .then((res) => setSubcategories(res.subcategories))
      .catch(() => setSubcategories([]));
  }, [router]);

  // Load source listing for edit/duplicate, otherwise restore an autosaved draft.
  useEffect(() => {
    if (!checkedAuth) return;

    if (sourceId) {
      apiFetch<{ listing: ListingDTO }>(`/listings/${sourceId}`)
        .then(({ listing }) => {
          setCondition(listing.condition);
          setPurpose(listing.purpose);
          setCategorySlugs(listing.categorySlugs);
          setSubcategorySlug(listing.subcategorySlug ?? null);
          setKeywords(listing.keywords);
          setTitle(listing.title);
          setPrice(String(listing.price));
          setPriceUnit(listing.priceUnit ?? "");
          setCity(listing.city ?? "");
          setLocationUrl(listing.locationUrl ?? "");
          setDescription(listing.description);
          setDescriptionHi(listing.descriptionHi ?? "");
          if (isEdit) setExistingImages(listing.images);
        })
        .catch(() => setError(t("somethingWrong")))
        .finally(() => setLoadingSource(false));
      return;
    }

    // A saved draft exists — ask the user whether to resume it or start a new listing,
    // instead of silently restoring it every time they open /sell.
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      setPendingDraft(JSON.parse(raw) as Draft);
    } catch {
      localStorage.removeItem(DRAFT_KEY);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkedAuth, sourceId]);

  function applyDraft(draft: Draft) {
    setCondition(draft.condition);
    setPurpose(draft.purpose);
    setCategorySlugs(draft.categorySlugs);
    setSubcategorySlug(draft.subcategorySlug);
    setKeywords(draft.keywords);
    setTitle(draft.title);
    setPrice(draft.price);
    setPriceUnit(draft.priceUnit);
    setCity(draft.city);
    setLocationUrl(draft.locationUrl ?? "");
    setDescription(draft.description);
    setDescriptionHi(draft.descriptionHi);
  }

  function useSavedDraft() {
    if (pendingDraft) applyDraft(pendingDraft);
    setPendingDraft(null);
  }

  function discardSavedDraft() {
    localStorage.removeItem(DRAFT_KEY);
    setPendingDraft(null);
  }

  // True once the user has filled in anything worth not losing — drives both the "unsaved
  // changes" back-navigation prompt and whether there's anything to save as a draft.
  const isDirty =
    condition !== null ||
    purpose !== null ||
    categorySlugs.length > 0 ||
    subcategorySlug !== null ||
    keywords.length > 0 ||
    title.trim() !== "" ||
    price.trim() !== "" ||
    priceUnit.trim() !== "" ||
    city !== "" ||
    locationUrl.trim() !== "" ||
    description.trim() !== "" ||
    descriptionHi.trim() !== "" ||
    newImages.length > 0;

  function saveDraftToStorage() {
    const draft: Draft = {
      condition,
      purpose,
      categorySlugs,
      subcategorySlug,
      keywords,
      title,
      price,
      priceUnit,
      city,
      locationUrl,
      description,
      descriptionHi,
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }

  // Intercepts the browser/hardware back action while there are unsaved changes, instead of
  // letting it navigate away silently. Only active for brand-new listings (not edit/duplicate,
  // and not after a successful post) and only once the user has actually typed/selected something.
  // A dummy history entry is pushed (and re-pushed on every back attempt) so the real
  // navigation only happens once the user explicitly picks Discard or Save draft; backGuardCount
  // tracks how many dummy entries stacked up so we can skip past all of them in one go.
  const backGuardStarted = useRef(false);
  const backGuardCount = useRef(0);

  useEffect(() => {
    if (!checkedAuth || sourceId || created || pendingDraft || !isDirty || backGuardStarted.current) return;
    backGuardStarted.current = true;

    window.history.pushState(null, "", window.location.href);
    backGuardCount.current += 1;
    function onPopState() {
      window.history.pushState(null, "", window.location.href);
      backGuardCount.current += 1;
      setShowLeaveModal(true);
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [checkedAuth, sourceId, created, pendingDraft, isDirty]);

  function leavePastGuard() {
    const steps = backGuardCount.current;
    backGuardCount.current = 0;
    if (steps > 0) window.history.go(-steps);
    else router.back();
  }

  function discardAndLeave() {
    localStorage.removeItem(DRAFT_KEY);
    setShowLeaveModal(false);
    leavePastGuard();
  }

  function saveDraftAndLeave() {
    saveDraftToStorage();
    setShowLeaveModal(false);
    leavePastGuard();
  }

  // Fetch a rough average price for similar listings once enough context is known.
  useEffect(() => {
    if (categorySlugs.length === 0 || !condition || !purpose) {
      setPriceGuidance(null);
      return;
    }
    let cancelled = false;
    const query = new URLSearchParams({
      categorySlug: categorySlugs[0],
      condition,
      purpose,
      limit: "50",
    });
    apiFetch<{ listings: ListingDTO[] }>(`/listings?${query.toString()}`)
      .then(({ listings: similar }) => {
        if (cancelled) return;
        const prices = similar.map((l) => l.price).filter((p) => p > 0);
        if (prices.length === 0) {
          setPriceGuidance(null);
          return;
        }
        setPriceGuidance(Math.round(prices.reduce((a, b) => a + b, 0) / prices.length));
      })
      .catch(() => setPriceGuidance(null));
    return () => {
      cancelled = true;
    };
  }, [categorySlugs, condition, purpose]);

  function toggleCategory(slug: string) {
    setCategorySlugs((prev) => {
      if (prev.includes(slug)) return prev.filter((s) => s !== slug);
      if (prev.length >= MAX_LISTING_CATEGORIES) return prev;
      return [...prev, slug];
    });
  }

  function addKeyword() {
    const value = keywordInput.trim();
    if (!value || keywords.length >= MAX_LISTING_KEYWORDS) return;
    if (keywords.some((k) => k.toLowerCase() === value.toLowerCase())) {
      setKeywordInput("");
      return;
    }
    setKeywords((prev) => [...prev, value]);
    setKeywordInput("");
  }

  function removeKeyword(value: string) {
    setKeywords((prev) => prev.filter((k) => k !== value));
  }

  const keywordSuggestions = [
    ...categories.filter((c) => categorySlugs.includes(c.slug)).map((c) => c.name),
    ...subcategories.filter((s) => categorySlugs.includes(s.categorySlug)).map((s) => s.name),
  ]
    .filter((name, i, arr) => arr.indexOf(name) === i)
    .filter((name) => !keywords.some((k) => k.toLowerCase() === name.toLowerCase()))
    .slice(0, 6);

  function addSuggestedKeyword(value: string) {
    if (keywords.length >= MAX_LISTING_KEYWORDS) return;
    setKeywords((prev) => [...prev, value]);
  }

  function addImages(files: FileList | null) {
    if (!files || files.length === 0) return;
    const room = MAX_LISTING_IMAGES - totalImageCount;
    if (room <= 0) return;
    // Snapshot into a plain array now: `files` is a live FileList tied to the
    // input element, and the onChange handler resets input.value right after
    // this call, which would otherwise clear the list before it's read.
    const picked = Array.from(files).slice(0, room);
    setNewImages((prev) => [...prev, ...picked]);
  }

  function removeExistingImage(url: string) {
    setExistingImages((prev) => prev.filter((u) => u !== url));
  }

  function removeNewImage(index: number) {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
  }

  function canGoNext(): boolean {
    if (step === 1) return condition !== null;
    if (step === 2) return purpose !== null;
    if (step === 3) return categorySlugs.length > 0;
    if (step === 4) return keywords.length >= MIN_LISTING_KEYWORDS;
    if (step === 5) {
      return (
        title.trim().length >= 3 &&
        price.trim() !== "" &&
        description.trim().length > 0 &&
        totalImageCount >= MIN_LISTING_IMAGES
      );
    }
    return true;
  }

  async function handleSubmit() {
    if (!condition || !purpose) return;
    setSubmitting(true);
    setError("");
    try {
      const accessToken = getAccessToken();
      if (!accessToken) {
        router.push("/login");
        return;
      }
      const formData = new FormData();
      formData.append("categorySlugs", JSON.stringify(categorySlugs));
      if (subcategorySlug) formData.append("subcategorySlug", subcategorySlug);
      formData.append("condition", condition);
      formData.append("purpose", purpose);
      formData.append("title", title.trim());
      formData.append("keywords", JSON.stringify(keywords));
      formData.append("description", description.trim());
      if (descriptionHi.trim()) formData.append("descriptionHi", descriptionHi.trim());
      formData.append("price", price);
      if (priceUnit.trim()) formData.append("priceUnit", priceUnit.trim());
      if (city) formData.append("city", city);
      if (locationUrl.trim()) formData.append("locationUrl", locationUrl.trim());
      if (isEdit) formData.append("existingImages", JSON.stringify(existingImages));
      newImages.forEach((file) => formData.append("images", file));

      const result = isEdit
        ? await apiUpload<{ listing: ListingDTO }>(`/listings/${editId}`, formData, {
            method: "PATCH",
            accessToken,
          })
        : await apiUpload<{ listing: ListingDTO }>("/listings", formData, { accessToken });

      localStorage.removeItem(DRAFT_KEY);
      setCreated(result.listing);
    } catch (err) {
      // Only ever show the backend's message for the specific "client did something we can
      // explain" statuses (bad input, not found, conflict, rate-limited) — those messages are
      // curated, user-facing text set deliberately by the controller (see ApiError usages in
      // listing.controller.ts). Anything else — 5xx server failures, unexpected statuses, or a
      // plain network error that never reached the API at all — falls back to the generic,
      // translated message so no raw backend/server detail ever reaches the screen.
      const SAFE_TO_SHOW_STATUSES = [400, 404, 409, 422, 429];
      setError(
        err instanceof ApiRequestError && SAFE_TO_SHOW_STATUSES.includes(err.status)
          ? err.message
          : t("somethingWrong")
      );
    } finally {
      setSubmitting(false);
    }
  }

  function resetWizard() {
    setStep(1);
    setCondition(null);
    setPurpose(null);
    setCategorySlugs([]);
    setSubcategorySlug(null);
    setKeywords([]);
    setKeywordInput("");
    setTitle("");
    setPrice("");
    setPriceUnit("");
    setCity("");
    setLocationUrl("");
    setDescription("");
    setDescriptionHi("");
    setExistingImages([]);
    setNewImages([]);
    setCreated(null);
    setError("");
    router.replace("/sell");
  }

  if (!checkedAuth || loadingSource) return null;

  if (created) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="mt-4 text-xl font-bold">{t("success")}</h1>
        <p className="mt-1 text-sm text-gray-500">{t("successSubtitle")}</p>
        <div className="mt-6 flex justify-center gap-3">
          <button
            onClick={() => router.push(`/listings/${created.id}`)}
            className="rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
          >
            {t("viewListing")}
          </button>
          <button
            onClick={resetWizard}
            className="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            {t("postAnother")}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-6 sm:py-10">
      {pendingDraft && (
        <ChoiceModal
          title={t("draftFoundTitle")}
          subtitle={t("draftFoundSubtitle")}
          primaryLabel={t("useDraft")}
          onPrimary={useSavedDraft}
          secondaryLabel={t("postNew")}
          onSecondary={discardSavedDraft}
        />
      )}

      {showLeaveModal && (
        <ChoiceModal
          title={t("leaveTitle")}
          subtitle={t("leaveSubtitle")}
          primaryLabel={t("saveDraft")}
          onPrimary={saveDraftAndLeave}
          secondaryLabel={t("discard")}
          onSecondary={discardAndLeave}
          tertiaryLabel={t("stayHere")}
          onTertiary={() => setShowLeaveModal(false)}
        />
      )}

      <h1 className="text-lg font-bold sm:text-xl">{t("title")}</h1>
      <p className="mt-1 text-xs text-gray-500">{t("step", { current: step, total: TOTAL_STEPS })}</p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-orange-600 transition-all"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>

      <div className="mt-6">
        {step === 1 && (
          <div>
            <h2 className="text-base font-semibold">{t("conditionTitle")}</h2>
            <p className="mt-1 text-sm text-gray-500">{t("conditionSubtitle")}</p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <OptionCard
                selected={condition === "new"}
                title={t("conditionNew")}
                hint={t("conditionNewHint")}
                onClick={() => setCondition("new")}
              />
              <OptionCard
                selected={condition === "old"}
                title={t("conditionOld")}
                hint={t("conditionOldHint")}
                onClick={() => setCondition("old")}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-base font-semibold">{t("purposeTitle")}</h2>
            <p className="mt-1 text-sm text-gray-500">{t("purposeSubtitle")}</p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <OptionCard
                selected={purpose === "sell"}
                title={t("purposeSell")}
                hint={t("purposeSellHint")}
                onClick={() => setPurpose("sell")}
              />
              <OptionCard
                selected={purpose === "rent"}
                title={t("purposeRent")}
                hint={t("purposeRentHint")}
                onClick={() => setPurpose("rent")}
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">{t("categoriesTitle")}</h2>
              <span className="text-xs text-gray-500">{t("categoriesCount", { count: categorySlugs.length })}</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">{t("categoriesSubtitle")}</p>
            {categories.length === 0 ? (
              <p className="mt-4 text-sm text-gray-400">{t("categoriesEmpty")}</p>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                {categories.map((cat) => {
                  const selected = categorySlugs.includes(cat.slug);
                  const disabled = !selected && categorySlugs.length >= MAX_LISTING_CATEGORIES;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      disabled={disabled}
                      onClick={() => toggleCategory(cat.slug)}
                      className={`rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition ${
                        selected
                          ? "border-orange-500 bg-orange-50 text-orange-700"
                          : disabled
                            ? "cursor-not-allowed border-gray-200 text-gray-300"
                            : "border-gray-200 text-gray-700 hover:border-orange-300"
                      }`}
                    >
                      {cat.icon ? `${cat.icon} ` : ""}
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            )}

            {categorySlugs.length > 0 &&
              subcategories.some((s) => categorySlugs.includes(s.categorySlug)) && (
                <div className="mt-5">
                  <h3 className="text-sm font-medium text-gray-700">{t("subcategoryTitle")}</h3>
                  <p className="mt-0.5 text-xs text-gray-500">{t("subcategorySubtitle")}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {subcategories
                      .filter((s) => categorySlugs.includes(s.categorySlug))
                      .map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSubcategorySlug((prev) => (prev === s.slug ? null : s.slug))}
                          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                            subcategorySlug === s.slug
                              ? "border-orange-500 bg-orange-50 text-orange-700"
                              : "border-gray-200 text-gray-600 hover:border-orange-300"
                          }`}
                        >
                          {s.icon ? `${s.icon} ` : ""}
                          {s.name}
                        </button>
                      ))}
                  </div>
                </div>
              )}
          </div>
        )}

        {step === 4 && (
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold">{t("keywordsTitle")}</h2>
              <span className="text-xs text-gray-500">{t("keywordsCount", { count: keywords.length })}</span>
            </div>
            <p className="mt-1 text-sm text-gray-500">{t("keywordsSubtitle")}</p>
            <div className="mt-4 flex gap-2">
              <input
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addKeyword();
                  }
                }}
                disabled={keywords.length >= MAX_LISTING_KEYWORDS}
                placeholder={t("keywordsPlaceholder")}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
              />
              <button
                type="button"
                onClick={addKeyword}
                disabled={keywords.length >= MAX_LISTING_KEYWORDS || !keywordInput.trim()}
                className="shrink-0 rounded-md bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-40"
              >
                {t("keywordsAdd")}
              </button>
            </div>
            {keywords.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {keywords.map((k) => (
                  <span
                    key={k}
                    className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700"
                  >
                    {k}
                    <button type="button" onClick={() => removeKeyword(k)} aria-label={`Remove ${k}`}>
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
            {keywordSuggestions.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-500">{t("keywordsSuggestedTitle")}</p>
                <div className="mt-1.5 flex flex-wrap gap-2">
                  {keywordSuggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => addSuggestedKeyword(s)}
                      className="rounded-full border border-dashed border-gray-300 px-3 py-1 text-xs font-medium text-gray-500 hover:border-orange-300 hover:text-orange-600"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <p className="mt-2 text-xs text-gray-400">{t("keywordsHint")}</p>
          </div>
        )}

        {step === 5 && (
          <div>
            <h2 className="text-base font-semibold">{t("detailsTitle")}</h2>
            <p className="mt-1 text-sm text-gray-500">{t("detailsSubtitle")}</p>

            <div className="mt-4 space-y-4">
              <Field label={t("listingTitle")}>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("listingTitlePlaceholder")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label={t("price")}>
                  <input
                    type="number"
                    min={0}
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                  />
                  {priceGuidance !== null && (
                    <p className="mt-1 text-xs text-gray-400">
                      {t("priceGuidance", { price: `₹${priceGuidance.toLocaleString("en-IN")}` })}
                    </p>
                  )}
                </Field>
                {purpose === "rent" && (
                  <Field label={t("priceUnit")}>
                    <input
                      value={priceUnit}
                      onChange={(e) => setPriceUnit(e.target.value)}
                      placeholder={t("priceUnitPlaceholder")}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                    />
                  </Field>
                )}
              </div>

              <Field label={t("city")}>
                <CityAutocomplete value={city} onChange={setCity} placeholder="Search city" />
              </Field>

              <Field label={`${t("locationUrl")} (${t("optional")})`}>
                <input
                  type="url"
                  value={locationUrl}
                  onChange={(e) => setLocationUrl(e.target.value)}
                  placeholder={t("locationUrlPlaceholder")}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                />
                <p className="mt-1 text-xs text-gray-400">{t("locationUrlHint")}</p>
              </Field>

              <Field label={t("description")}>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, MAX_LISTING_DESCRIPTION_LENGTH))}
                  placeholder={t("descriptionPlaceholder")}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                />
                <p className="mt-1 text-xs text-gray-400">
                  {t("charsLeft", { count: MAX_LISTING_DESCRIPTION_LENGTH - description.length })}
                </p>
              </Field>

              <Field label={t("descriptionHi")}>
                <textarea
                  value={descriptionHi}
                  onChange={(e) => setDescriptionHi(e.target.value.slice(0, MAX_LISTING_DESCRIPTION_LENGTH))}
                  placeholder={t("descriptionHiPlaceholder")}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
                />
                <p className="mt-1 text-xs text-gray-400">{t("descriptionHiHint")}</p>
              </Field>

              <Field label={`${t("photos")} · ${totalImageCount}/${MAX_LISTING_IMAGES}`}>
                {(existingImages.length > 0 || newImages.length > 0) && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {existingImages.map((url) => (
                      <div key={url} className="relative h-16 w-16 overflow-hidden rounded-md border border-gray-200">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={resolveImageUrl(url)} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeExistingImage(url)}
                          aria-label="Remove photo"
                          className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-[10px] text-white"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                    {newImages.map((file, i) => (
                      <div
                        key={`${file.name}-${i}`}
                        className="relative h-16 w-16 overflow-hidden rounded-md border border-gray-200"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeNewImage(i)}
                          aria-label="Remove photo"
                          className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-[10px] text-white"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {totalImageCount < MAX_LISTING_IMAGES && (
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      addImages(e.target.files);
                      e.target.value = "";
                    }}
                    className="w-full text-sm"
                  />
                )}
                <p className="mt-1 text-xs text-gray-400">{t("photosHint")}</p>
                {totalImageCount === 0 && <p className="mt-1 text-xs text-red-500">{t("photosRequired")}</p>}
              </Field>
            </div>
          </div>
        )}

        {step === 6 && (
          <div>
            <h2 className="text-base font-semibold">{t("reviewTitle")}</h2>
            <p className="mt-1 text-sm text-gray-500">{t("reviewSubtitle")}</p>

            {(existingImages.length > 0 || newImages.length > 0) && (
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {existingImages.map((url) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={url}
                    src={resolveImageUrl(url)}
                    alt=""
                    className="h-20 w-20 shrink-0 rounded-md object-cover"
                  />
                ))}
                {newImages.map((file, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={`${file.name}-${i}`}
                    src={URL.createObjectURL(file)}
                    alt=""
                    className="h-20 w-20 shrink-0 rounded-md object-cover"
                  />
                ))}
              </div>
            )}

            <dl className="mt-4 divide-y divide-gray-100 rounded-lg border border-gray-200 text-sm">
              <ReviewRow label={t("conditionTitle")} value={condition === "new" ? t("conditionNew") : t("conditionOld")} />
              <ReviewRow label={t("purposeTitle")} value={purpose === "rent" ? t("purposeRent") : t("purposeSell")} />
              <ReviewRow
                label={t("categoriesTitle")}
                value={categories
                  .filter((c) => categorySlugs.includes(c.slug))
                  .map((c) => c.name)
                  .join(", ")}
              />
              {subcategorySlug && (
                <ReviewRow
                  label={t("subcategoryTitle")}
                  value={subcategories.find((s) => s.slug === subcategorySlug)?.name ?? ""}
                />
              )}
              <ReviewRow label={t("keywordsTitle")} value={keywords.join(", ")} />
              <ReviewRow label={t("listingTitle")} value={title} />
              <ReviewRow label={t("price")} value={`₹${price}${priceUnit ? ` / ${priceUnit}` : ""}`} />
              {city && <ReviewRow label={t("city")} value={city} />}
              {locationUrl && <ReviewRow label={t("locationUrl")} value={locationUrl} />}
              <ReviewRow label={t("description")} value={description} />
              {descriptionHi && <ReviewRow label={t("descriptionHi")} value={descriptionHi} />}
            </dl>

            {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(1, s - 1))}
          disabled={step === 1 || submitting}
          className="rounded-full border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
        >
          {t("back")}
        </button>

        {step < TOTAL_STEPS ? (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(TOTAL_STEPS, s + 1))}
            disabled={!canGoNext()}
            className="rounded-full bg-orange-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-40"
          >
            {t("next")}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="rounded-full bg-orange-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
          >
            {submitting ? t("submitting") : t("submit")}
          </button>
        )}
      </div>

      {step < TOTAL_STEPS && !canGoNext() && (
        <p className="mt-2 text-center text-xs font-medium text-red-500">{t("fillRequiredHint")}</p>
      )}
    </main>
  );
}

// Two/three-option confirmation dialog used for the "leave without posting" and "resume draft"
// prompts — kept generic so both reuse the same modal chrome instead of duplicating markup.
function ChoiceModal({
  title,
  subtitle,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  tertiaryLabel,
  onTertiary,
}: {
  title: string;
  subtitle: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel: string;
  onSecondary: () => void;
  tertiaryLabel?: string;
  onTertiary?: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <p className="mt-1.5 text-sm text-gray-500">{subtitle}</p>

        <button
          type="button"
          onClick={onPrimary}
          className="mt-4 w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
        >
          {primaryLabel}
        </button>
        <button
          type="button"
          onClick={onSecondary}
          className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          {secondaryLabel}
        </button>
        {tertiaryLabel && onTertiary && (
          <button
            type="button"
            onClick={onTertiary}
            className="mt-2 w-full rounded-lg px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50"
          >
            {tertiaryLabel}
          </button>
        )}
      </div>
    </div>
  );
}

function OptionCard({
  selected,
  title,
  hint,
  onClick,
}: {
  selected: boolean;
  title: string;
  hint: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border-2 px-4 py-4 text-left transition ${
        selected ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-orange-300"
      }`}
    >
      <p className={`text-sm font-semibold ${selected ? "text-orange-700" : "text-gray-800"}`}>{title}</p>
      <p className="mt-0.5 text-xs text-gray-500">{hint}</p>
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
      {children}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 px-3 py-2.5">
      <dt className="shrink-0 text-gray-500">{label}</dt>
      <dd className="text-right font-medium text-gray-800">{value}</dd>
    </div>
  );
}
