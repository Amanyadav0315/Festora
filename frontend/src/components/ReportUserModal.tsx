"use client";

import { useRef, useState } from "react";
import { apiUpload, ApiRequestError } from "@/lib/api";

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

export function ReportUserModal({
  targetId,
  targetName,
  conversationId,
  accessToken,
  onClose,
}: {
  targetId: string;
  targetName: string;
  conversationId?: string;
  accessToken: string | undefined;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
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
    if (!accessToken) return;
    if (reason.trim().length < 3) {
      setError("Please describe the issue (min 3 characters).");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.set("reason", reason.trim());
      if (conversationId) formData.set("conversationId", conversationId);
      files.forEach((f) => formData.append("screenshots", f));
      await apiUpload(`/social/report/${targetId}`, formData, { accessToken });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="flex max-h-[85vh] w-full max-w-sm flex-col rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <h3 className="text-base font-bold text-gray-900">
            {done ? "Report submitted" : `Report ${targetName}`}
          </h3>
          <button onClick={onClose} aria-label="Close" className="text-gray-400 hover:text-gray-600">
            <CloseIcon className="h-5 w-5" />
          </button>
        </div>

        {done ? (
          <div className="p-5">
            <p className="text-sm text-gray-600">
              Thanks — our team will review this report. We may reach out if we need more details.
            </p>
            <button
              onClick={onClose}
              className="mt-4 w-full rounded-lg bg-orange-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto p-5">
              <label className="text-xs font-semibold text-gray-500">What's wrong?</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe the issue..."
                rows={4}
                className="mt-1.5 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-orange-400 focus:outline-none focus:ring-1 focus:ring-orange-400"
              />

              <label className="mt-4 block text-xs font-semibold text-gray-500">
                Screenshots (optional, up to {MAX_SCREENSHOTS})
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

              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
            </div>
            <div className="shrink-0 border-t border-gray-100 p-5">
              <button
                type="button"
                disabled={busy}
                onClick={submit}
                className="w-full rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {busy ? "Submitting..." : "Submit report"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-2 w-full rounded-lg px-4 py-2.5 text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
