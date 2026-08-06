"use client";

import { useEffect, useState } from "react";
import type { ReportDTO, IssueReportDTO } from "@festora/types";
import { apiFetch, ApiRequestError, ASSET_BASE_URL } from "@/lib/api";
import { getAccessToken } from "@/lib/auth-client";

function imgSrc(src: string) {
  return src.startsWith("http") ? src : `${ASSET_BASE_URL}${src}`;
}

type Filter = "pending" | "reviewed" | "all";
type Tab = "users" | "issues";

function StatusPill({ status }: { status: "pending" | "reviewed" }) {
  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
        status === "pending" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
      }`}
    >
      {status}
    </span>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

function UserReportsTab() {
  const [reports, setReports] = useState<ReportDTO[] | null>(null);
  const [filter, setFilter] = useState<Filter>("pending");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    setReports(null);
    apiFetch<{ reports: ReportDTO[] }>(`/social/admin/reports${filter === "all" ? "" : `?status=${filter}`}`, {
      accessToken: token ?? undefined,
    })
      .then((body) => setReports(body.reports))
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Something went wrong"));
  }, [filter]);

  async function markReviewed(id: string) {
    const token = getAccessToken();
    setBusyId(id);
    try {
      await apiFetch(`/social/admin/reports/${id}`, { method: "PATCH", accessToken: token ?? undefined });
      setReports((prev) => (prev ? prev.map((r) => (r.id === id ? { ...r, status: "reviewed" } : r)) : prev));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1 text-sm">
          {(["pending", "reviewed", "all"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 font-medium capitalize ${
                filter === f ? "bg-orange-600 text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {reports === null ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : reports.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white px-4 py-14 text-center shadow-sm">
          <p className="text-sm text-gray-500">No {filter !== "all" ? filter : ""} reports.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((r) => (
            <div key={r.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold">{r.reporter.name}</span> reported{" "}
                    <span className="font-semibold">{r.reported.name}</span>
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">{formatDate(r.createdAt)}</p>
                </div>
                <StatusPill status={r.status} />
              </div>

              <p className="mt-3 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm text-gray-700">{r.reason}</p>

              {r.screenshots.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.screenshots.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => setLightbox(imgSrc(s))}
                      className="h-16 w-16 overflow-hidden rounded-md border border-gray-200"
                    >
                      <img src={imgSrc(s)} alt="Screenshot" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {r.status === "pending" && (
                <button
                  onClick={() => markReviewed(r.id)}
                  disabled={busyId === r.id}
                  className="mt-3 rounded-md bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
                >
                  Mark reviewed
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="Screenshot" className="max-h-full max-w-full rounded-lg object-contain" />
        </div>
      )}
    </>
  );
}

function IssueReportsTab() {
  const [issues, setIssues] = useState<IssueReportDTO[] | null>(null);
  const [filter, setFilter] = useState<Filter>("pending");
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState<string | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    setIssues(null);
    apiFetch<{ issues: IssueReportDTO[] }>(`/support/admin/issues${filter === "all" ? "" : `?status=${filter}`}`, {
      accessToken: token ?? undefined,
    })
      .then((body) => setIssues(body.issues))
      .catch((err) => setError(err instanceof ApiRequestError ? err.message : "Something went wrong"));
  }, [filter]);

  async function markReviewed(id: string) {
    const token = getAccessToken();
    setBusyId(id);
    try {
      await apiFetch(`/support/admin/issues/${id}`, { method: "PATCH", accessToken: token ?? undefined });
      setIssues((prev) => (prev ? prev.map((i) => (i.id === id ? { ...i, status: "reviewed" } : i)) : prev));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Something went wrong");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <div className="mb-4 flex justify-end">
        <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1 text-sm">
          {(["pending", "reviewed", "all"] as Filter[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-md px-3 py-1.5 font-medium capitalize ${
                filter === f ? "bg-orange-600 text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      {issues === null ? (
        <p className="text-sm text-gray-500">Loading...</p>
      ) : issues.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white px-4 py-14 text-center shadow-sm">
          <p className="text-sm text-gray-500">No {filter !== "all" ? filter : ""} issue reports.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {issues.map((i) => (
            <div key={i.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-gray-900">
                    <span className="font-semibold">{i.reporter.name}</span> reported an app issue
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">{formatDate(i.createdAt)}</p>
                </div>
                <StatusPill status={i.status} />
              </div>

              <p className="mt-3 whitespace-pre-wrap rounded-lg bg-gray-50 p-3 text-sm text-gray-700">{i.message}</p>

              {i.screenshots.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {i.screenshots.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => setLightbox(imgSrc(s))}
                      className="h-16 w-16 overflow-hidden rounded-md border border-gray-200"
                    >
                      <img src={imgSrc(s)} alt="Screenshot" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {i.status === "pending" && (
                <button
                  onClick={() => markReviewed(i.id)}
                  disabled={busyId === i.id}
                  className="mt-3 rounded-md bg-orange-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-60"
                >
                  Mark reviewed
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="Screenshot" className="max-h-full max-w-full rounded-lg object-contain" />
        </div>
      )}
    </>
  );
}

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>("users");

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Reports</h1>
        <div className="flex gap-1 rounded-lg border border-gray-200 bg-white p-1 text-sm">
          <button
            onClick={() => setTab("users")}
            className={`rounded-md px-3 py-1.5 font-medium ${
              tab === "users" ? "bg-orange-600 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            User reports
          </button>
          <button
            onClick={() => setTab("issues")}
            className={`rounded-md px-3 py-1.5 font-medium ${
              tab === "issues" ? "bg-orange-600 text-white" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            App issues
          </button>
        </div>
      </div>

      {tab === "users" ? <UserReportsTab /> : <IssueReportsTab />}
    </div>
  );
}
