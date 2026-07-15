"use client";

import { useActionState } from "react";
import {
  approveFarmer,
  approveProduct,
  createCourier,
  rejectFarmer,
  rejectProduct,
  toggleCourierActive,
  type AdminPortalActionState,
} from "@/lib/admin/portal-actions";
import {
  getFarmerStatusLabel,
  getProductStatusLabel,
} from "@/lib/orders/labels";
import { Spinner } from "@/components/ui/Spinner";
import { formatPrice } from "@/lib/shop/format";
import type {
  AdminCourier,
  AdminFarmer,
  AdminProduct,
} from "@/lib/admin/queries";

const initialState: AdminPortalActionState = {};

export function AdminFarmersPanel({ farmers }: { farmers: AdminFarmer[] }) {
  if (farmers.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center ring-1 ring-zinc-200">
        <p className="font-medium text-zinc-900">Fermer yoxdur</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {farmers.map((farmer) => (
        <FarmerCard key={farmer.id} farmer={farmer} />
      ))}
    </div>
  );
}

function FarmerCard({ farmer }: { farmer: AdminFarmer }) {
  const [approveState, approveAction, approvePending] = useActionState(
    approveFarmer,
    initialState
  );
  const [rejectState, rejectAction, rejectPending] = useActionState(
    rejectFarmer,
    initialState
  );

  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
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

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="break-words font-semibold text-zinc-900">{farmer.farm_name}</div>
          <p className="mt-1 break-all text-sm text-zinc-600">
            {farmer.profiles?.full_name ?? "—"} · {farmer.profiles?.email}
          </p>
          {farmer.location_text ? (
            <p className="mt-1 text-sm text-zinc-600">{farmer.location_text}</p>
          ) : null}
        </div>
        <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200">
          {getFarmerStatusLabel(farmer.status)}
        </span>
      </div>

      {farmer.status === "pending" ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <form action={approveAction} className="w-full sm:w-auto">
            <input type="hidden" name="farmer_id" value={farmer.id} />
            <button
              type="submit"
              disabled={approvePending || rejectPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-70 sm:w-auto"
            >
              {approvePending ? <Spinner className="h-3.5 w-3.5" /> : null}
              Təsdiqlə
            </button>
          </form>
          <form action={rejectAction} className="w-full sm:w-auto">
            <input type="hidden" name="farmer_id" value={farmer.id} />
            <button
              type="submit"
              disabled={approvePending || rejectPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 ring-1 ring-rose-200 disabled:opacity-70 sm:w-auto"
            >
              {rejectPending ? <Spinner className="h-3.5 w-3.5" /> : null}
              Rədd et
            </button>
          </form>
        </div>
      ) : null}
    </article>
  );
}

export function AdminProductsPanel({ products }: { products: AdminProduct[] }) {
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
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function ProductCard({ product }: { product: AdminProduct }) {
  const [approveState, approveAction, approvePending] = useActionState(
    approveProduct,
    initialState
  );
  const [rejectState, rejectAction, rejectPending] = useActionState(
    rejectProduct,
    initialState
  );

  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
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

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-zinc-900">{product.title}</div>
          <p className="mt-1 text-sm text-zinc-600">
            {product.farmers?.farm_name ?? "Fermer"} ·{" "}
            {product.categories?.name_az ?? "Kateqoriya"}
          </p>
          <p className="mt-2 text-sm text-zinc-700">
            Fermer qiyməti: {formatPrice(product.farmer_price)}
          </p>
        </div>
        <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
          {getProductStatusLabel(product.status)}
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
        <form
          action={approveAction}
          className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-end"
        >
          <input type="hidden" name="product_id" value={product.id} />
          <div className="w-full sm:w-36">
            <label
              htmlFor={`price-${product.id}`}
              className="block text-xs font-medium text-zinc-600"
            >
              Final qiymət (₼)
            </label>
            <input
              id={`price-${product.id}`}
              name="final_price"
              type="number"
              step="0.01"
              min="0.01"
              required
              defaultValue={product.farmer_price}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900 sm:text-sm"
            />
          </div>
          <button
            type="submit"
            disabled={approvePending || rejectPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-70 sm:w-auto"
          >
            {approvePending ? <Spinner className="h-3.5 w-3.5" /> : null}
            Təsdiqlə
          </button>
        </form>
        <form action={rejectAction} className="w-full sm:w-auto">
          <input type="hidden" name="product_id" value={product.id} />
          <button
            type="submit"
            disabled={approvePending || rejectPending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-rose-700 ring-1 ring-rose-200 disabled:opacity-70 sm:w-auto"
          >
            {rejectPending ? <Spinner className="h-3.5 w-3.5" /> : null}
            Rədd et
          </button>
        </form>
      </div>
    </article>
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
