"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Spinner } from "@/components/ui/Spinner";
import {
  completeFarmerProfile,
  createProduct,
  signUpFarmer,
  updateOrderItemStatus,
  updateProduct,
  type FarmerActionState,
} from "@/lib/farmer/actions";
import {
  FARMER_ITEM_STATUS_TRANSITIONS,
  getFarmerStatusLabel,
  getOrderItemStatusLabel,
  getProductStatusLabel,
} from "@/lib/orders/labels";
import { formatPrice, formatUnit } from "@/lib/shop/format";
import type { FarmerOrderItem, FarmerProduct } from "@/lib/farmer/queries";
import type { Category, Farmer, OrderItemStatus, UnitType } from "@/types";

const initialState: FarmerActionState = {};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("az-AZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function FarmerSignUpForm() {
  const [state, action, pending] = useActionState(signUpFarmer, initialState);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium text-zinc-700">
          Ad və soyad
        </label>
        <input
          id="full_name"
          name="full_name"
          required
          className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-base text-zinc-900 outline-none ring-emerald-500 focus:ring-2"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-base text-zinc-900 outline-none ring-emerald-500 focus:ring-2"
        />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-zinc-700">
          Telefon
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-base text-zinc-900 outline-none ring-emerald-500 focus:ring-2"
        />
      </div>
      <div>
        <label htmlFor="farm_name" className="block text-sm font-medium text-zinc-700">
          Təsərrüfat adı *
        </label>
        <input
          id="farm_name"
          name="farm_name"
          required
          className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-base text-zinc-900 outline-none ring-emerald-500 focus:ring-2"
        />
      </div>
      <div>
        <label htmlFor="location_text" className="block text-sm font-medium text-zinc-700">
          Yerləşmə
        </label>
        <input
          id="location_text"
          name="location_text"
          className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-base text-zinc-900 outline-none ring-emerald-500 focus:ring-2"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-zinc-700">
          Təsvir
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-base text-zinc-900 outline-none ring-emerald-500 focus:ring-2"
        />
      </div>
      <PasswordInput id="password" name="password" label="Şifrə" autoComplete="new-password" />
      <PasswordInput
        id="password_confirm"
        name="password_confirm"
        label="Şifrəni təkrar yazın"
        autoComplete="new-password"
      />

      {state.error ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-200">
          {state.success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-70"
      >
        {pending ? <Spinner className="h-4 w-4" /> : null}
        Fermer kimi qeydiyyat
      </button>
    </form>
  );
}

export function CompleteFarmerProfileForm({
  defaultFarmName = "",
  defaultPhone = "",
}: {
  defaultFarmName?: string;
  defaultPhone?: string;
}) {
  const [state, action, pending] = useActionState(
    completeFarmerProfile,
    initialState,
  );

  return (
    <form action={action} className="space-y-4">
      <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-200">
        Hesabınız aktivdir. Təsərrüfat məlumatlarını tamamlayın — sonra fermer
        paneli açılacaq.
      </p>
      <div>
        <label htmlFor="farm_name" className="block text-sm font-medium text-zinc-700">
          Təsərrüfat adı *
        </label>
        <input
          id="farm_name"
          name="farm_name"
          required
          defaultValue={defaultFarmName}
          className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-base text-zinc-900 outline-none ring-emerald-500 focus:ring-2"
        />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-zinc-700">
          Telefon
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={defaultPhone}
          className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-base text-zinc-900 outline-none ring-emerald-500 focus:ring-2"
        />
      </div>
      <div>
        <label htmlFor="location_text" className="block text-sm font-medium text-zinc-700">
          Yerləşmə
        </label>
        <input
          id="location_text"
          name="location_text"
          className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-base text-zinc-900 outline-none ring-emerald-500 focus:ring-2"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-zinc-700">
          Təsvir
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="mt-1 w-full rounded-xl border border-zinc-200 px-3 py-2.5 text-base text-zinc-900 outline-none ring-emerald-500 focus:ring-2"
        />
      </div>

      {state.error ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          {state.error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-70"
      >
        {pending ? <Spinner className="h-4 w-4" /> : null}
        Fermer panelinə keç
      </button>
    </form>
  );
}

export function FarmerPendingCard({ farmer }: { farmer: Farmer }) {
  return (
    <div className="rounded-3xl bg-amber-50 p-8 ring-1 ring-amber-200">
      <h2 className="text-lg font-semibold text-amber-900">{farmer.farm_name}</h2>
      <p className="mt-2 text-sm text-amber-800">
        Status: {getFarmerStatusLabel(farmer.status)}. Admin təsdiqindən sonra
        məhsul əlavə edə biləcəksiniz.
      </p>
    </div>
  );
}

export function FarmerProductForm({
  categories,
  product,
}: {
  categories: Category[];
  product?: FarmerProduct;
}) {
  const action = product ? updateProduct : createProduct;
  const [state, formAction, pending] = useActionState(action, initialState);
  const existingImageUrl = product?.product_images?.[0]?.url ?? "";
  const [previewUrl, setPreviewUrl] = useState(existingImageUrl);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200"
    >
      {product ? <input type="hidden" name="product_id" value={product.id} /> : null}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-zinc-700">
          Məhsul adı
        </label>
        <input
          id="title"
          name="title"
          required
          defaultValue={product?.title}
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900"
        />
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-zinc-700">
          Təsvir
        </label>
        <textarea
          id="description"
          name="description"
          required
          rows={4}
          defaultValue={product?.description}
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="category_id" className="block text-sm font-medium text-zinc-700">
            Kateqoriya
          </label>
          <select
            id="category_id"
            name="category_id"
            required
            defaultValue={product?.category_id}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900"
          >
            <option value="">Seçin</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name_az}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="unit_type" className="block text-sm font-medium text-zinc-700">
            Vahid
          </label>
          <select
            id="unit_type"
            name="unit_type"
            required
            defaultValue={product?.unit_type ?? "kg"}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900"
          >
            <option value="kg">kq</option>
            <option value="piece">ədəd</option>
            <option value="liter">litr</option>
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="farmer_price" className="block text-sm font-medium text-zinc-700">
            Fermer qiyməti (₼)
          </label>
          <input
            id="farmer_price"
            name="farmer_price"
            type="number"
            step="0.01"
            min="0.01"
            required
            defaultValue={product?.farmer_price}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900"
          />
        </div>
        <div>
          <label
            htmlFor="quantity_available"
            className="block text-sm font-medium text-zinc-700"
          >
            Miqdar
          </label>
          <input
            id="quantity_available"
            name="quantity_available"
            type="number"
            step="0.01"
            min="0"
            required
            defaultValue={product?.quantity_available ?? 0}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900"
          />
        </div>
      </div>
      <div>
        <label htmlFor="image" className="block text-sm font-medium text-zinc-700">
          Məhsul şəkli {product ? "(istəyə bağlı yeniləyin)" : "*"}
        </label>
        <input
          id="image"
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          required={!product}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) {
              setPreviewUrl(existingImageUrl);
              return;
            }
            const nextUrl = URL.createObjectURL(file);
            setPreviewUrl((current) => {
              if (current.startsWith("blob:")) URL.revokeObjectURL(current);
              return nextUrl;
            });
          }}
          className="mt-1 block w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-emerald-800"
        />
        {previewUrl ? (
          <div className="mt-3 overflow-hidden rounded-2xl ring-1 ring-zinc-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Məhsul şəkli önbaxışı"
              className="h-48 w-full object-cover"
            />
          </div>
        ) : null}
      </div>

      {state.error ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-200">
          {state.success}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-70"
      >
        {pending ? <Spinner className="h-4 w-4" /> : null}
        {product ? "Yenilə və təsdiqə göndər" : "Məhsul əlavə et"}
      </button>
    </form>
  );
}

export function FarmerProductsList({ products }: { products: FarmerProduct[] }) {
  if (products.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center ring-1 ring-zinc-200">
        <p className="font-medium text-zinc-900">Hələ məhsul yoxdur</p>
        <Link
          href="/farmer/products/new"
          className="mt-4 inline-flex rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
        >
          İlk məhsulu əlavə et
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {products.map((product) => (
        <Link
          key={product.id}
          href={`/farmer/products/${product.id}`}
          className="block rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 hover:shadow-md"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="font-semibold text-zinc-900">{product.title}</div>
              <p className="mt-1 text-sm text-zinc-500">
                {product.categories?.name_az ?? "Kateqoriya"} ·{" "}
                {formatPrice(product.farmer_price)}
                {formatUnit(product.unit_type as UnitType)}
              </p>
            </div>
            <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200">
              {getProductStatusLabel(product.status)}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function FarmerOrderItemCard({ item }: { item: FarmerOrderItem }) {
  const [state, action, pending] = useActionState(
    updateOrderItemStatus,
    initialState
  );
  const nextStatuses = FARMER_ITEM_STATUS_TRANSITIONS[item.status] ?? [];
  const order = item.orders;

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

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-semibold text-zinc-900">{item.product_title}</div>
          <p className="mt-1 text-sm text-zinc-500">
            {order?.order_code ?? "Sifariş"} · {item.quantity}{" "}
            {formatUnit(item.unit_type)}
          </p>
          {order ? (
            <p className="mt-2 text-sm text-zinc-600">
              {order.contact_phone}
              {order.delivery_address_text ? ` · ${order.delivery_address_text}` : ""}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-zinc-500">
            {formatDate(item.created_at)}
          </p>
        </div>
        <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200">
          {getOrderItemStatusLabel(item.status)}
        </span>
      </div>

      {nextStatuses.length > 0 ? (
        <form action={action} className="mt-4 flex flex-wrap items-end gap-2">
          <input type="hidden" name="order_item_id" value={item.id} />
          <select
            name="next_status"
            required
            defaultValue=""
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
          >
            <option value="" disabled>
              Növbəti status
            </option>
            {nextStatuses.map((status) => (
              <option key={status} value={status}>
                {getOrderItemStatusLabel(status as OrderItemStatus)}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
          >
            {pending ? <Spinner className="h-3.5 w-3.5" /> : null}
            Yenilə
          </button>
        </form>
      ) : null}
    </article>
  );
}

export function FarmerOrdersList({ items }: { items: FarmerOrderItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center ring-1 ring-zinc-200">
        <p className="font-medium text-zinc-900">Hazırda sifariş yoxdur</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <FarmerOrderItemCard key={item.id} item={item} />
      ))}
    </div>
  );
}
