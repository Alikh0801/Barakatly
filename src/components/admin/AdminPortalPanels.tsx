"use client";

import { useActionState, useEffect, useState } from "react";
import {
  approveFarmer,
  approveFarmerProfileEdit,
  approveProduct,
  createCourier,
  deleteFarmer,
  rejectFarmer,
  rejectFarmerProfileEdit,
  rejectProduct,
  suspendFarmer,
  toggleCourierActive,
  updateProductByAdmin,
  updateProductFinalPrice,
  type AdminPortalActionState,
} from "@/lib/admin/portal-actions";
import {
  approveCategory,
  approveSubcategory,
  renameSubcategory,
} from "@/lib/admin/category-actions";
import {
  getFarmerStatusLabel,
  getProductStatusLabel,
} from "@/lib/orders/labels";
import { Spinner } from "@/components/ui/Spinner";
import { FormPendingSpinner } from "@/components/ui/FormPendingSpinner";
import { formatPrice, getProductImageUrl } from "@/lib/shop/format";
import { formatStock, productVariants, variantLabel } from "@/lib/shop/variants";
import { formatDateTime } from "@/lib/format/date";
import { farmerDisplayName } from "@/lib/farmers/name";
import { azNormalize } from "@/lib/shop/normalize";
import type {
  AdminCategory,
  AdminCourier,
  AdminFarmer,
  AdminProduct,
} from "@/lib/admin/queries";

const initialState: AdminPortalActionState = {};

function ReasonInput({ id }: { id: string }) {
  return (
    <div>
      <label htmlFor={id} className="sr-only">
        Səbəb
      </label>
      <input
        id={id}
        name="reason"
        type="text"
        required
        placeholder="Səbəbi qeyd edin..."
        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
      />
    </div>
  );
}

function FarmerDetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:gap-3">
      <dt className="text-sm font-medium text-zinc-500">{label}</dt>
      <dd className="break-words text-sm text-zinc-900">{value || "—"}</dd>
    </div>
  );
}

type FarmerFilter = "all" | "approved" | "pending" | "rejected" | "suspended";

const FARMER_FILTERS: { value: FarmerFilter; label: string }[] = [
  { value: "all", label: "Hamısı" },
  { value: "approved", label: "Təsdiqlənib" },
  { value: "pending", label: "Gözləyir" },
  { value: "rejected", label: "Rədd edilib" },
  { value: "suspended", label: "Deaktiv" },
];

export function AdminFarmersPanel({ farmers }: { farmers: AdminFarmer[] }) {
  const [filter, setFilter] = useState<FarmerFilter>("all");
  const [query, setQuery] = useState("");
  const pendingEdits = farmers.filter((farmer) => farmer.pending_submitted_at);

  const needle = azNormalize(query);
  const visible = farmers.filter((farmer) => {
    if (filter !== "all" && farmer.status !== filter) return false;
    if (!needle) return true;
    return azNormalize(
      [farmer.profiles?.full_name, farmer.profiles?.email, farmer.profiles?.phone, farmer.location_text]
        .filter(Boolean)
        .join(" "),
    ).includes(needle);
  });

  return (
    <div className="space-y-8">
      {pendingEdits.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-zinc-900">
            Profil dəyişiklikləri gözləyir
            <span className="ml-2 text-sm font-normal text-zinc-500">
              ({pendingEdits.length})
            </span>
          </h2>
          {pendingEdits.map((farmer) => (
            <FarmerProfileEditCard key={farmer.id} farmer={farmer} />
          ))}
        </section>
      ) : null}

      <section className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {FARMER_FILTERS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                aria-pressed={filter === option.value}
                className={[
                  "rounded-full px-4 py-1.5 text-xs font-semibold transition",
                  filter === option.value
                    ? "bg-zinc-900 text-white"
                    : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50",
                ].join(" ")}
              >
                {option.label}
              </button>
            ))}
          </div>
          <label className="relative block sm:w-64">
            <span className="sr-only">Fermer axtar</span>
            <svg
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            >
              <circle cx="9" cy="9" r="5.5" />
              <path d="m13.5 13.5 3 3" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Fermer axtar..."
              className="w-full rounded-full border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm text-zinc-900 placeholder:text-zinc-400"
            />
          </label>
        </div>

        <div className="overflow-x-auto rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-zinc-100 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                <th className="px-5 py-3.5">Fermer</th>
                <th className="px-5 py-3.5">Yerləşmə</th>
                <th className="px-5 py-3.5">Məhsullar</th>
                <th className="px-5 py-3.5">Gəlir</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Əməliyyatlar</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-zinc-500">
                    Fermer tapılmadı.
                  </td>
                </tr>
              ) : (
                visible.map((farmer) => <FarmerRow key={farmer.id} farmer={farmer} />)
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function farmerStatusTone(status: string): string {
  return status === "pending"
    ? "bg-amber-50 text-amber-800"
    : status === "approved"
      ? "bg-emerald-50 text-emerald-700"
      : status === "suspended"
        ? "bg-orange-50 text-orange-800"
        : status === "rejected"
          ? "bg-rose-50 text-rose-700"
          : "bg-zinc-100 text-zinc-700";
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-4 w-4">
      <path d="M1.8 10S4.8 4.5 10 4.5 18.2 10 18.2 10 15.2 15.5 10 15.5 1.8 10 1.8 10Z" strokeLinejoin="round" />
      <circle cx="10" cy="10" r="2.5" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-4 w-4">
      <path d="M11.5 4.5h-6a1.5 1.5 0 0 0-1.5 1.5v8.5A1.5 1.5 0 0 0 5.5 16H14a1.5 1.5 0 0 0 1.5-1.5v-6" strokeLinecap="round" />
      <path d="M14.3 3.2a1.4 1.4 0 0 1 2 2L10 11.5 7.5 12.5l1-2.5 5.8-6.8Z" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="h-4 w-4">
      <path d="M3.5 5.5h13M8 5.5V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M5 5.5l.8 10a1.5 1.5 0 0 0 1.5 1.5h5.4a1.5 1.5 0 0 0 1.5-1.5l.8-10" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type FarmerPanel = "details" | "manage" | "delete";

/**
 * One farmer in the table. The eye opens their details, the pencil the
 * status actions (approve, reject, deactivate, activate), the bin the
 * delete form; each opens under the row.
 */
function FarmerRow({ farmer }: { farmer: AdminFarmer }) {
  const [panel, setPanel] = useState<FarmerPanel | null>(null);
  const [approveState, approveAction, approvePending] = useActionState(
    approveFarmer,
    initialState
  );
  const [rejectState, rejectAction, rejectPending] = useActionState(
    rejectFarmer,
    initialState
  );
  const [suspendState, suspendAction, suspendPending] = useActionState(
    suspendFarmer,
    initialState
  );
  const [deleteState, deleteAction, deletePending] = useActionState(
    deleteFarmer,
    initialState
  );

  const busy =
    approvePending || rejectPending || suspendPending || deletePending;
  const actionError =
    approveState.error ||
    rejectState.error ||
    suspendState.error ||
    deleteState.error;
  const actionSuccess =
    approveState.success ||
    rejectState.success ||
    suspendState.success ||
    deleteState.success;

  const name = farmerDisplayName(farmer.profiles?.full_name);
  const toggle = (next: FarmerPanel) => setPanel((current) => (current === next ? null : next));
  const iconButton = (active: boolean) =>
    [
      "inline-flex h-8 w-8 items-center justify-center rounded-full transition",
      active ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-800",
    ].join(" ");

  return (
    <>
      <tr className="border-b border-zinc-100 last:border-b-0">
        <td className="px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-100 text-xs font-semibold text-emerald-800">
              {farmer.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={farmer.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                name.slice(0, 2).toUpperCase()
              )}
            </span>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-zinc-900">{name}</div>
              <div className="text-xs text-zinc-500">
                Qoşulub: {new Date(farmer.created_at).getFullYear()}
              </div>
            </div>
          </div>
        </td>
        <td className="max-w-[220px] truncate px-5 py-3.5 text-sm text-zinc-500">
          {farmer.location_text || "—"}
        </td>
        <td className="px-5 py-3.5 text-sm text-zinc-700">{farmer.productCount}</td>
        <td className="px-5 py-3.5 text-sm font-semibold text-emerald-600">
          {formatPrice(farmer.revenue)}
        </td>
        <td className="px-5 py-3.5">
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${farmerStatusTone(farmer.status)}`}
          >
            {getFarmerStatusLabel(farmer.status)}
          </span>
        </td>
        <td className="px-5 py-3.5">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => toggle("details")}
              aria-label={`${name} — məlumat`}
              aria-expanded={panel === "details"}
              title="Məlumat"
              className={iconButton(panel === "details")}
            >
              <EyeIcon />
            </button>
            <button
              type="button"
              onClick={() => toggle("manage")}
              aria-label={`${name} — statusu dəyiş`}
              aria-expanded={panel === "manage"}
              title="Statusu dəyiş"
              className={iconButton(panel === "manage")}
            >
              <EditIcon />
            </button>
            <button
              type="button"
              onClick={() => toggle("delete")}
              aria-label={`${name} — sil`}
              aria-expanded={panel === "delete"}
              title="Sil"
              className={iconButton(panel === "delete")}
            >
              <TrashIcon />
            </button>
          </div>
        </td>
      </tr>

      {panel || actionError || actionSuccess ? (
        <tr className="border-b border-zinc-100 bg-zinc-50/70 last:border-b-0">
          <td colSpan={6} className="px-5 py-4">
            {actionError ? (
              <p className="mb-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
                {actionError}
              </p>
            ) : null}
            {actionSuccess ? (
              <p className="mb-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                {actionSuccess}
              </p>
            ) : null}

            {panel === "details" ? (
              <dl className="space-y-3">
                <FarmerDetailRow label="Ad, soyad" value={farmer.profiles?.full_name} />
                <FarmerDetailRow label="Email ünvanı" value={farmer.profiles?.email} />
                <FarmerDetailRow label="Telefon" value={farmer.profiles?.phone} />
                <FarmerDetailRow label="Yerləşmə" value={farmer.location_text} />
                {farmer.location_map_url ? (
                  <FarmerDetailRow
                    label="Xəritə linki"
                    value={
                      <a
                        href={farmer.location_map_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-emerald-700 hover:underline"
                      >
                        Xəritədə aç
                      </a>
                    }
                  />
                ) : null}
                <FarmerDetailRow
                  label="Ferma təsviri"
                  value={
                    farmer.description ? (
                      <span className="whitespace-pre-line">{farmer.description}</span>
                    ) : (
                      "—"
                    )
                  }
                />
                <FarmerDetailRow label="Müraciət" value={formatDateTime(farmer.created_at)} />
                {farmer.status === "approved" ? (
                  <FarmerDetailRow
                    label="Profil"
                    value={
                      <a
                        href={`/farmers/${farmer.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-emerald-700 hover:underline"
                      >
                        Səhifəni aç
                      </a>
                    }
                  />
                ) : null}
              </dl>
            ) : null}

            {panel === "manage" ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-start">
                {farmer.status === "pending" ? (
                  <>
                    <form action={approveAction} className="w-full sm:w-auto">
                      <input type="hidden" name="farmer_id" value={farmer.id} />
                      <button
                        type="submit"
                        disabled={busy}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-70 sm:w-auto"
                      >
                        {approvePending ? <Spinner className="h-3.5 w-3.5" /> : null}
                        Təsdiqlə
                      </button>
                    </form>
                    <form action={rejectAction} className="flex w-full flex-col gap-2 sm:w-64">
                      <input type="hidden" name="farmer_id" value={farmer.id} />
                      <ReasonInput id={`reject-reason-${farmer.id}`} />
                      <button
                        type="submit"
                        disabled={busy}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 ring-1 ring-rose-200 disabled:opacity-70"
                      >
                        {rejectPending ? <Spinner className="h-3.5 w-3.5" /> : null}
                        Rədd et
                      </button>
                    </form>
                  </>
                ) : null}

                {farmer.status === "suspended" ? (
                  <form action={approveAction} className="w-full sm:w-auto">
                    <input type="hidden" name="farmer_id" value={farmer.id} />
                    <button
                      type="submit"
                      disabled={busy}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-70 sm:w-auto"
                    >
                      {approvePending ? <Spinner className="h-3.5 w-3.5" /> : null}
                      Aktiv et
                    </button>
                  </form>
                ) : null}

                {farmer.status === "approved" ? (
                  <form action={suspendAction} className="flex w-full flex-col gap-2 sm:w-64">
                    <input type="hidden" name="farmer_id" value={farmer.id} />
                    <ReasonInput id={`suspend-reason-${farmer.id}`} />
                    <button
                      type="submit"
                      disabled={busy}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-orange-800 ring-1 ring-orange-200 disabled:opacity-70"
                    >
                      {suspendPending ? <Spinner className="h-3.5 w-3.5" /> : null}
                      Deaktiv et
                    </button>
                  </form>
                ) : null}

                {farmer.status === "rejected" ? (
                  <p className="text-sm text-zinc-500">Müraciət rədd edilib.</p>
                ) : null}
              </div>
            ) : null}

            {panel === "delete" ? (
              <form
                action={deleteAction}
                className="flex w-full flex-col gap-2 sm:w-72"
                onSubmit={(event) => {
                  if (
                    !window.confirm(
                      `"${name}" fermerini bazadan həmişəlik silmək istəyirsiniz? Məhsulları da silinəcək.`,
                    )
                  ) {
                    event.preventDefault();
                  }
                }}
              >
                <input type="hidden" name="farmer_id" value={farmer.id} />
                <ReasonInput id={`delete-reason-${farmer.id}`} />
                <button
                  type="submit"
                  disabled={busy}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-70 sm:w-auto"
                >
                  {deletePending ? <Spinner className="h-3.5 w-3.5" /> : null}
                  Fermeri sil
                </button>
              </form>
            ) : null}
          </td>
        </tr>
      ) : null}
    </>
  );
}

function ProfileFieldDiff({
  label,
  before,
  after,
}: {
  label: string;
  before: string | null;
  after: string | null;
}) {
  const changed = before !== after;
  return (
    <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:gap-3">
      <dt className="text-sm font-medium text-zinc-500">{label}</dt>
      <dd className="text-sm text-zinc-900">
        {changed ? (
          <>
            <span className="text-zinc-400 line-through">
              {before || "—"}
            </span>
            <span className="mx-1.5 text-zinc-400">→</span>
            <span className="font-medium text-emerald-700">
              {after || "—"}
            </span>
          </>
        ) : (
          <span>{after || "—"}</span>
        )}
      </dd>
    </div>
  );
}

function FarmerProfileEditCard({ farmer }: { farmer: AdminFarmer }) {
  const [approveState, approveAction, approvePending] = useActionState(
    approveFarmerProfileEdit,
    initialState
  );
  const [rejectState, rejectAction, rejectPending] = useActionState(
    rejectFarmerProfileEdit,
    initialState
  );

  const busy = approvePending || rejectPending;
  const actionError = approveState.error || rejectState.error;
  const actionSuccess = approveState.success || rejectState.success;

  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
      {actionError ? (
        <p className="mb-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {actionError}
        </p>
      ) : null}
      {actionSuccess ? (
        <p className="mb-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {actionSuccess}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h3 className="break-words text-base font-semibold text-zinc-900">
            {farmerDisplayName(farmer.profiles?.full_name)}
          </h3>
          <p className="mt-1 text-xs text-zinc-500">
            Göndərildi:{" "}
            {farmer.pending_submitted_at
              ? formatDateTime(farmer.pending_submitted_at)
              : "—"}
          </p>
        </div>
        <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
          Təsdiq gözləyir
        </span>
      </div>

      <dl className="mt-4 space-y-3 rounded-xl bg-zinc-50 px-4 py-4 ring-1 ring-zinc-100">
        <ProfileFieldDiff
          label="Yerləşmə"
          before={farmer.location_text}
          after={farmer.pending_location_text}
        />
        <ProfileFieldDiff
          label="Bio"
          before={farmer.description}
          after={farmer.pending_description}
        />
        {farmer.avatar_url !== farmer.pending_avatar_url ? (
          <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:gap-3">
            <dt className="text-sm font-medium text-zinc-500">
              Profil şəkli
            </dt>
            <dd className="flex items-center gap-3">
              {farmer.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={farmer.avatar_url}
                  alt=""
                  className="h-12 w-12 rounded-full object-cover ring-1 ring-zinc-200"
                />
              ) : (
                <span className="text-sm text-zinc-400">—</span>
              )}
              <span className="text-zinc-400">→</span>
              {farmer.pending_avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={farmer.pending_avatar_url}
                  alt=""
                  className="h-12 w-12 rounded-full object-cover ring-2 ring-emerald-300"
                />
              ) : (
                <span className="text-sm text-zinc-400">—</span>
              )}
            </dd>
          </div>
        ) : null}
        {farmer.cover_url !== farmer.pending_cover_url ? (
          <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:gap-3">
            <dt className="text-sm font-medium text-zinc-500">
              Arxa plan şəkli
            </dt>
            <dd className="flex items-center gap-3">
              {farmer.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={farmer.cover_url}
                  alt=""
                  className="h-12 w-28 rounded-lg object-cover ring-1 ring-zinc-200"
                />
              ) : (
                <span className="text-sm text-zinc-400">—</span>
              )}
              <span className="text-zinc-400">→</span>
              {farmer.pending_cover_url ? (
                <a href={farmer.pending_cover_url} target="_blank" rel="noreferrer">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={farmer.pending_cover_url}
                    alt="Yeni arxa plan şəkli"
                    className="h-12 w-28 rounded-lg object-cover ring-2 ring-emerald-300"
                  />
                </a>
              ) : (
                <span className="text-sm text-zinc-400">Silinir</span>
              )}
            </dd>
          </div>
        ) : null}
      </dl>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <form action={approveAction} className="w-full sm:w-auto">
          <input type="hidden" name="farmer_id" value={farmer.id} />
          <button
            type="submit"
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-70 sm:w-auto"
          >
            {approvePending ? <Spinner className="h-3.5 w-3.5" /> : null}
            Təsdiqlə
          </button>
        </form>
        <form action={rejectAction} className="flex w-full flex-col gap-2 sm:w-64">
          <input type="hidden" name="farmer_id" value={farmer.id} />
          <ReasonInput id={`edit-reject-reason-${farmer.id}`} />
          <button
            type="submit"
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 ring-1 ring-rose-200 disabled:opacity-70"
          >
            {rejectPending ? <Spinner className="h-3.5 w-3.5" /> : null}
            Rədd et
          </button>
        </form>
      </div>
    </article>
  );
}

export function AdminProductsPanel({
  products,
  categories,
}: {
  products: AdminProduct[];
  categories: AdminCategory[];
}) {
  if (products.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center ring-1 ring-zinc-200">
        <p className="font-medium text-zinc-900">Gözləyən məhsul yoxdur</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} categories={categories} />
      ))}
    </div>
  );
}

function PendingTaxonomyBadge({
  label,
  approveActionField,
  id,
}: {
  label: string;
  approveActionField: "category_id" | "subcategory_id";
  id: string;
}) {
  const action =
    approveActionField === "category_id" ? approveCategory : approveSubcategory;
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-800 ring-1 ring-amber-200">
      <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
      {label}
      <form action={formAction} className="inline">
        <input type="hidden" name={approveActionField} value={id} />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-70"
        >
          <FormPendingSpinner className="h-3 w-3" />
          {state.success ? "✓ təsdiqləndi" : "təsdiqlə"}
        </button>
      </form>
    </span>
  );
}

function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={className}>
      <path d="M5 12l5 5L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function XIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={className}>
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

function PencilIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M4 20h4L18.5 9.5a2.12 2.12 0 0 0-3-3L5 17v3Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13.5 6.5l3 3" strokeLinecap="round" />
    </svg>
  );
}

function TagIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9-9-9Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="7.5" cy="7.5" r="1.5" />
    </svg>
  );
}

function BoxIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M21 8 12 3 3 8l9 5 9-5Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 8v8l9 5 9-5V8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 13v8" strokeLinecap="round" />
    </svg>
  );
}

function ProductCard({
  product,
  categories,
}: {
  product: AdminProduct;
  categories: AdminCategory[];
}) {
  const [approveState, approveAction, approvePending] = useActionState(
    approveProduct,
    initialState
  );
  const [rejectState, rejectAction, rejectPending] = useActionState(
    rejectProduct,
    initialState
  );
  const [editing, setEditing] = useState(false);
  const imageUrl = getProductImageUrl(product.product_images ?? []);
  // The server refuses too; this explains why before the admin tries.
  const taxonomyPending =
    product.categories?.approved === false || product.subcategories?.approved === false;

  return (
    <article className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-zinc-200/70 transition hover:shadow-md">
      <div className="p-4 sm:p-5">
        {(approveState.error || rejectState.error) && (
          <p className="mb-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {approveState.error ?? rejectState.error}
          </p>
        )}
        {(approveState.success || rejectState.success) && (
          <p className="mb-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {approveState.success ?? rejectState.success}
          </p>
        )}

        <div className="flex items-start gap-4">
          <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-zinc-100 ring-1 ring-zinc-200 sm:h-28 sm:w-28">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl}
                alt={product.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
                Şəkil yox
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="break-words text-base font-semibold text-zinc-900">
                  {product.title}
                </h3>
                <p className="mt-0.5 break-words text-sm text-zinc-500">
                  {farmerDisplayName(product.farmers?.owner_name)}
                </p>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                {getProductStatusLabel(product.status)}
              </span>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {product.categories?.approved === false ? (
                <PendingTaxonomyBadge
                  label={product.categories.name_az}
                  approveActionField="category_id"
                  id={product.category_id}
                />
              ) : (
                <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-100">
                  {product.categories?.name_az ?? "Kateqoriya"}
                </span>
              )}
              {product.subcategories ? (
                product.subcategories.approved === false ? (
                  <PendingTaxonomyBadge
                    label={product.subcategories.name_az}
                    approveActionField="subcategory_id"
                    id={product.subcategory_id ?? ""}
                  />
                ) : (
                  <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-100">
                    {product.subcategories.name_az}
                  </span>
                )
              ) : (
                <span className="inline-flex rounded-full bg-zinc-50 px-2.5 py-1 text-[11px] text-zinc-400 ring-1 ring-zinc-200">
                  Alt kateqoriya yoxdur
                </span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {productVariants(product).map((variant) => (
                <span
                  key={variant.id || "default"}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-700 ring-1 ring-zinc-100"
                >
                  <TagIcon className="h-3.5 w-3.5 text-zinc-400" />
                  {variantLabel(variant.unit_type, variant.unit_size)} · Təklif: {formatPrice(variant.farmer_price)}
                  <BoxIcon className="ml-1 h-3.5 w-3.5 text-zinc-400" />
                  {formatStock(variant.unit_type, variant.quantity_available, variant.unit_size)}
                </span>
              ))}
              <button
                type="button"
                onClick={() => setEditing((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-50"
              >
                <PencilIcon className="h-3.5 w-3.5" />
                {editing ? "Bağla" : "Redaktə et"}
              </button>
            </div>
          </div>
        </div>

        {editing ? (
          <ProductEditForm
            product={product}
            categories={categories}
            onDone={() => setEditing(false)}
          />
        ) : null}
      </div>

      {taxonomyPending ? (
        <p className="border-t border-amber-100 bg-amber-50 px-4 py-2.5 text-xs text-amber-800 sm:px-5">
          Kateqoriya hələ təsdiqlənməyib. Məhsulu təsdiqləməzdən əvvəl yuxarıdakı
          “təsdiqlə” ilə kateqoriyanı təsdiqləyin və ya “Redaktə et” ilə başqa
          kateqoriya seçin.
        </p>
      ) : null}
      <div className="flex flex-col gap-3 border-t border-zinc-100 bg-zinc-50/60 p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
        <form
          action={approveAction}
          className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-end"
        >
          <input type="hidden" name="product_id" value={product.id} />
          <VariantFinalPriceInputs product={product} idPrefix="price" fallback="farmer" />
          <button
            type="submit"
            disabled={approvePending || rejectPending || taxonomyPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
          >
            {approvePending ? <Spinner className="h-3.5 w-3.5" /> : <CheckIcon className="h-4 w-4" />}
            Təsdiqlə
          </button>
        </form>
        <form action={rejectAction} className="flex w-full flex-col gap-2 sm:w-64">
          <input type="hidden" name="product_id" value={product.id} />
          <ReasonInput id={`product-reject-reason-${product.id}`} />
          <button
            type="submit"
            disabled={approvePending || rejectPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-50 disabled:opacity-70"
          >
            {rejectPending ? <Spinner className="h-3.5 w-3.5" /> : <XIcon className="h-4 w-4" />}
            Rədd et
          </button>
        </form>
      </div>
    </article>
  );
}

function ProductEditForm({
  product,
  categories,
  onDone,
}: {
  product: AdminProduct;
  categories: AdminCategory[];
  onDone: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    updateProductByAdmin,
    initialState
  );
  const [categoryId, setCategoryId] = useState(product.category_id);
  const [subcategoryId, setSubcategoryId] = useState(
    product.subcategory_id ?? ""
  );

  const visibleSubcategories =
    categories.find((c) => c.id === categoryId)?.subcategories ?? [];
  const selectedSubcategory = visibleSubcategories.find(
    (s) => s.id === subcategoryId
  );

  useEffect(() => {
    if (state.success) onDone();
  }, [state.success, onDone]);

  const fieldClass =
    "mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900";

  return (
    <div className="mt-4 space-y-3">
    <form
      action={formAction}
      className="space-y-3 rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200"
    >
      <input type="hidden" name="product_id" value={product.id} />

      {state.error ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}

      <label className="block">
        <span className="text-xs font-medium text-zinc-600">Ad</span>
        <input
          name="title"
          required
          defaultValue={product.title}
          className={fieldClass}
        />
      </label>

      <label className="block">
        <span className="text-xs font-medium text-zinc-600">Təsvir</span>
        <textarea
          name="description"
          required
          rows={3}
          defaultValue={product.description}
          className={fieldClass}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-medium text-zinc-600">Kateqoriya</span>
          <select
            name="category_id"
            required
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setSubcategoryId("");
            }}
            className={fieldClass}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_az}
                {c.approved ? "" : " (təsdiq gözləyir)"}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs font-medium text-zinc-600">Alt kateqoriya</span>
          <select
            name="subcategory_id"
            value={subcategoryId}
            onChange={(e) => setSubcategoryId(e.target.value)}
            className={fieldClass}
          >
            <option value="">Yoxdur</option>
            {visibleSubcategories.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name_az}
                {s.approved ? "" : " (təsdiq gözləyir)"}
              </option>
            ))}
          </select>
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
      >
        {pending ? <Spinner className="h-3.5 w-3.5" /> : null}
        Dəyişiklikləri saxla
      </button>
    </form>

    {selectedSubcategory ? (
      <SubcategoryRenameForm subcategory={selectedSubcategory} />
    ) : null}
    </div>
  );
}

function SubcategoryRenameForm({
  subcategory,
}: {
  subcategory: { id: string; name_az: string; approved: boolean };
}) {
  const [state, formAction, pending] = useActionState(
    renameSubcategory,
    initialState
  );

  return (
    <form
      action={formAction}
      className="rounded-2xl bg-white p-4 ring-1 ring-zinc-200"
    >
      <input type="hidden" name="subcategory_id" value={subcategory.id} />
      <span className="text-xs font-medium text-zinc-600">
        Alt kateqoriya adını düzəlt
        {subcategory.approved ? "" : " (təsdiq gözləyir)"}
      </span>
      {state.error ? (
        <p className="mt-1 text-xs text-rose-600">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="mt-1 text-xs text-emerald-700">{state.success}</p>
      ) : null}
      <div className="mt-1 flex flex-wrap gap-2">
        <input
          name="name_az"
          required
          defaultValue={subcategory.name_az}
          className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
        />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
        >
          {pending ? <Spinner className="h-3.5 w-3.5" /> : null}
          Adı yenilə
        </button>
      </div>
    </form>
  );
}

/** One final-price field per size ("final_price_<size id>"). */
function VariantFinalPriceInputs({
  product,
  idPrefix,
  fallback,
}: {
  product: AdminProduct;
  idPrefix: string;
  /** What the field starts at: the farmer's offer, or the current final price. */
  fallback: "farmer" | "final";
}) {
  const variants = productVariants(product);
  const several = variants.length > 1;
  return (
    <div className="flex flex-wrap gap-2">
      {variants.map((variant) => {
        const id = `${idPrefix}-${product.id}-${variant.id}`;
        return (
          <div key={variant.id || "default"} className="w-full sm:w-40">
            <label htmlFor={id} className="block text-xs font-medium text-zinc-600">
              {several
                ? `${variantLabel(variant.unit_type, variant.unit_size)} (₼)`
                : fallback === "final"
                  ? "Yeni son qiymət (₼)"
                  : "Final qiymət (₼)"}
            </label>
            <input
              id={id}
              name={`final_price_${variant.id}`}
              type="number"
              step="0.01"
              min="0.01"
              required
              defaultValue={
                fallback === "final"
                  ? (variant.final_price ?? variant.farmer_price)
                  : variant.farmer_price
              }
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900 sm:text-sm"
            />
          </div>
        );
      })}
    </div>
  );
}

function ApprovedPriceCard({ product }: { product: AdminProduct }) {
  const [state, action, pending] = useActionState(
    updateProductFinalPrice,
    initialState
  );
  const imageUrl = getProductImageUrl(product.product_images ?? []);

  return (
    <article className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 sm:p-5">
      {state.error ? (
        <p className="mb-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="mb-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {state.success}
        </p>
      ) : null}

      <div className="flex items-start gap-3 sm:gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-zinc-100 ring-1 ring-zinc-200 sm:h-24 sm:w-24">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={product.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-zinc-400">
              Şəkil yox
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="break-words font-semibold text-zinc-900">
            {product.title}
          </div>
          <p className="mt-1 break-words text-sm text-zinc-600">
            {farmerDisplayName(product.farmers?.owner_name)} ·{" "}
            {product.categories?.name_az ?? "Kateqoriya"}
          </p>
          {productVariants(product).map((variant) => (
            <p key={variant.id || "default"} className="mt-2 text-sm text-zinc-700">
              {variantLabel(variant.unit_type, variant.unit_size)} · Təklif:{" "}
              {formatPrice(variant.farmer_price)} · Son:{" "}
              {variant.final_price != null ? formatPrice(variant.final_price) : "—"}
            </p>
          ))}
        </div>
      </div>

      <form
        action={action}
        className="mt-4 flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-end"
      >
        <input type="hidden" name="product_id" value={product.id} />
        <VariantFinalPriceInputs product={product} idPrefix="approved-price" fallback="final" />
        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-70 sm:w-auto"
        >
          {pending ? <Spinner className="h-3.5 w-3.5" /> : null}
          Qiyməti yenilə
        </button>
      </form>
    </article>
  );
}

export function AdminApprovedProductsPanel({
  products,
}: {
  products: AdminProduct[];
}) {
  if (products.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center ring-1 ring-zinc-200">
        <p className="font-medium text-zinc-900">Təsdiqlənmiş məhsul yoxdur</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {products.map((product) => (
        <ApprovedPriceCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export function AdminCouriersPanel({ couriers }: { couriers: AdminCourier[] }) {
  const [createState, createAction, createPending] = useActionState(
    createCourier,
    initialState
  );

  return (
    <div className="space-y-6">
      <form
        action={createAction}
        className="space-y-4 rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6 ring-1 ring-zinc-200"
      >
        <h2 className="text-lg font-semibold text-zinc-900">Yeni kuryer</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <input
            name="full_name"
            required
            placeholder="Ad soyad"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900 placeholder:text-zinc-500 sm:text-sm"
          />
          <input
            name="email"
            type="email"
            required
            placeholder="Email"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900 placeholder:text-zinc-500 sm:text-sm"
          />
          <input
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="Şifrə"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900 placeholder:text-zinc-500 sm:col-span-2 sm:text-sm lg:col-span-1"
          />
        </div>
        {createState.error ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {createState.error}
          </p>
        ) : null}
        {createState.success ? (
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {createState.success}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={createPending}
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
        >
          {createPending ? <Spinner className="h-3.5 w-3.5" /> : null}
          Kuryer yarat
        </button>
      </form>

      {couriers.length === 0 ? (
        <div className="rounded-3xl bg-white p-8 text-center ring-1 ring-zinc-200">
          <p className="font-medium text-zinc-900">Kuryer yoxdur</p>
        </div>
      ) : (
        <div className="space-y-3">
          {couriers.map((courier) => (
            <CourierCard key={courier.id} courier={courier} />
          ))}
        </div>
      )}
    </div>
  );
}

function CourierCard({ courier }: { courier: AdminCourier }) {
  const [state, action, pending] = useActionState(
    toggleCourierActive,
    initialState
  );

  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
      {state.error ? (
        <p className="mb-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="mb-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {state.success}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-semibold text-zinc-900">
            {courier.profiles?.full_name ?? "Kuryer"}
          </div>
          <p className="mt-1 text-sm text-zinc-600">{courier.profiles?.email}</p>
        </div>
        <form action={action}>
          <input type="hidden" name="courier_id" value={courier.id} />
          <input
            type="hidden"
            name="is_active"
            value={courier.is_active ? "true" : "false"}
          />
          <button
            type="submit"
            disabled={pending}
            className={[
              "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold disabled:opacity-70",
              courier.is_active
                ? "bg-white text-zinc-700 ring-1 ring-zinc-200"
                : "bg-emerald-600 text-white",
            ].join(" ")}
          >
            {pending ? <Spinner className="h-3.5 w-3.5" /> : null}
            {courier.is_active ? "Deaktiv et" : "Aktiv et"}
          </button>
        </form>
      </div>
    </article>
  );
}
