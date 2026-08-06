"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { apiUpload, ApiRequestError } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-client";
import { BackHeader } from "@/components/BackHeader";

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function AttachIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth={1.8}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21.44 11.05l-9.19 9.19a5 5 0 0 1-7.07-7.07l9.19-9.19a3.5 3.5 0 0 1 4.95 4.95l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"
      />
    </svg>
  );
}

const MAX_SCREENSHOTS = 4;

export default function ReportIssuePage() {
  const t = useTranslations("profileMenu");
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previews = files.map((f) => URL.createObjectURL(f));

  function onFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!picked.length) return;
    setFiles((prev) => [...prev, ...picked].slice(0, MAX_SCREENSHOTS));
  }

  function removeFile(idx: number) {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  }

  async function submit() {
    if (message.trim().length < 3) {
      setError(t("reportIssueTooShort"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const token = getAccessToken() ?? undefined;
      const formData = new FormData();
      formData.set("message", message.trim());
      files.forEach((f) => formData.append("screenshots", f));
      await apiUpload("/support/issues", formData, { accessToken: token });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t("somethingWrong"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm px-4 pb-10 sm:px-6 sm:pb-16">
      <BackHeader title={t("reportIssue")} backHref="/help" />

      {done ? (
        <div className="mt-4 rounded-xl border border-gray-100 bg-white px-4 py-8 text-center shadow-sm">
          <p className="text-sm text-gray-600">{t("reportIssueThanks")}</p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-500">{t("reportIssueLabel")}</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("reportIssuePlaceholder")}
              rows={5}
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-500">
              {t("reportIssueScreenshots", { count: MAX_SCREENSHOTS })}
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={onFilesSelected}
            />
            <div className="mt-1.5 flex flex-wrap gap-2">
              {previews.map((src, idx) => (
                <div key={idx} className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-200">
                  <img src={src} alt="Attachment" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    aria-label="Remove"
                    className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-white"
                  >
                    <CloseIcon className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
              {files.length < MAX_SCREENSHOTS && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-gray-300 text-gray-400 hover:border-orange-400 hover:text-orange-500"
                >
                  <AttachIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="button"
            disabled={busy}
            onClick={submit}
            className="w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
          >
            {busy ? t("reportIssueSubmitting") : t("reportIssueSubmit")}
          </button>
        </div>
      )}
    </main>
  );
}
