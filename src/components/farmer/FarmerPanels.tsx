"use client";

import {
  useActionState,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import Link from "next/link";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { Turnstile, type TurnstileHandle } from "@/components/auth/Turnstile";
import { VerifyOtpForm } from "@/components/auth/VerifyOtpForm";
import { AzPhoneInput } from "@/components/ui/AzPhoneInput";
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
import { AZ_REGIONS } from "@/lib/az/regions";
import { MAX_PRODUCT_IMAGES } from "@/lib/farmer/image-upload";
import { formatDateTime } from "@/lib/format/date";
import {
  formatPrice,
  formatUnit,
  getProductImageUrl,
  unitLabel,
} from "@/lib/shop/format";
import type { FarmerOrderItem, FarmerProduct } from "@/lib/farmer/queries";
import type {
  Category,
  Farmer,
  OrderItemStatus,
  Subcategory,
  UnitType,
} from "@/types";

const initialState: FarmerActionState = {};
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export function RegionSelect({
  id = "location_text",
  name = "location_text",
  defaultValue = "",
  required = false,
}: {
  id?: string;
  name?: string;
  defaultValue?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-zinc-700">
        Bölgə{required ? " *" : ""}
      </label>
      <select
        id={id}
        name={name}
        required={required}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900 outline-none ring-emerald-500 focus:ring-2"
      >
        <option value="">Bölgə seçin</option>
        {AZ_REGIONS.map((region) => (
          <option key={region} value={region}>
            {region}
          </option>
        ))}
      </select>
    </div>
  );
}

export function FarmerSignUpForm() {
  const [state, formAction, pending] = useActionState(signUpFarmer, initialState);
  const [isPending, startTransition] = useTransition();
  const [captchaError, setCaptchaError] = useState("");
  const turnstileRef = useRef<TurnstileHandle>(null);

  const busy = pending || isPending;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCaptchaError("");
    const formData = new FormData(event.currentTarget);

    if (TURNSTILE_SITE_KEY) {
      const token = await turnstileRef.current?.getToken();
      if (!token) {
        setCaptchaError(
          "Təhlükəsizlik yoxlaması tamamlanmadı. Yenidən cəhd edin."
        );
        return;
      }
      formData.set("captchaToken", token);
    }

    startTransition(() => formAction(formData));
  }

  if (state.otpEmail) {
    return <VerifyOtpForm email={state.otpEmail} />;
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4">
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
        <AzPhoneInput id="phone" name="phone" required />
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
        <RegionSelect required />
        <PasswordInput id="password" name="password" label="Şifrə" autoComplete="new-password" />
        <PasswordInput
          id="password_confirm"
          name="password_confirm"
          label="Şifrəni təkrar yazın"
          autoComplete="new-password"
        />

        {TURNSTILE_SITE_KEY ? (
          <Turnstile ref={turnstileRef} siteKey={TURNSTILE_SITE_KEY} />
        ) : null}

        {state.error || captchaError ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
            {captchaError || state.error}
          </p>
        ) : null}
        {state.success ? (
          <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800 ring-1 ring-emerald-200">
            {state.success}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={busy}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-70"
        >
          {busy ? <Spinner className="h-4 w-4" /> : null}
          Fermer kimi qeydiyyat
        </button>
      </form>

      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-zinc-200" />
        <span className="text-xs font-medium text-zinc-400">və ya</span>
        <span className="h-px flex-1 bg-zinc-200" />
      </div>

      <GoogleAuthButton next="/farmer/signup" />
    </div>
  );
}

export function CompleteFarmerProfileForm({
  accountEmail = "",
  defaultFarmName = "",
  defaultPhone = "",
}: {
  accountEmail?: string;
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
      {accountEmail ? (
        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Email (hesabınız)
          </label>
          <div className="mt-1 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-base text-zinc-700">
            {accountEmail}
          </div>
          <p className="mt-1 text-xs text-zinc-500">
            Bu email dəyişdirilmir — mövcud hesabınızla davam edirsiniz.
          </p>
        </div>
      ) : null}
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
      <AzPhoneInput
        id="phone"
        name="phone"
        required
        defaultValue={defaultPhone}
      />
      <RegionSelect required />

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
  const isSuspended = farmer.status === "suspended";

  return (
    <div
      className={
        isSuspended
          ? "rounded-3xl bg-orange-50 p-8 ring-1 ring-orange-200"
          : "rounded-3xl bg-amber-50 p-8 ring-1 ring-amber-200"
      }
    >
      <h2
        className={
          isSuspended
            ? "text-lg font-semibold text-orange-900"
            : "text-lg font-semibold text-amber-900"
        }
      >
        {farmer.farm_name}
      </h2>
      <p
        className={
          isSuspended
            ? "mt-2 text-sm text-orange-800"
            : "mt-2 text-sm text-amber-800"
        }
      >
        Status: {getFarmerStatusLabel(farmer.status)}.{" "}
        {isSuspended
          ? "Hesabınız deaktiv edilib — məhsullar satışda görünmür. Dəstək ilə əlaqə saxlayın."
          : "Admin təsdiqindən sonra məhsul əlavə edə biləcəksiniz."}
      </p>
    </div>
  );
}

export function FarmerProductForm({
  categories,
  subcategories,
  product,
}: {
  categories: Category[];
  subcategories: Subcategory[];
  product?: FarmerProduct;
}) {
  const action = product ? updateProduct : createProduct;
  const [state, formAction, pending] = useActionState(action, initialState);
  const existingImages = [...(product?.product_images ?? [])].sort(
    (a, b) => a.sort_order - b.sort_order,
  );
  const [images, setImages] = useState<File[]>([]);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const previews = useMemo(
    () => images.map((file) => URL.createObjectURL(file)),
    [images],
  );
  const [unitType, setUnitType] = useState<UnitType>(
    (product?.unit_type as UnitType) ?? "kg",
  );
  const [categoryId, setCategoryId] = useState<string>(
    product?.category_id ?? "",
  );
  const [subcategoryId, setSubcategoryId] = useState<string>(
    product?.subcategory_id ?? "",
  );

  const visibleSubcategories =
    categoryId && categoryId !== "__new__"
      ? subcategories.filter((sub) => sub.category_id === categoryId)
      : [];

  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  function syncImages(next: File[]) {
    const limited = next.slice(0, MAX_PRODUCT_IMAGES);
    setImages(limited);
    if (!imageInputRef.current) return;
    const transfer = new DataTransfer();
    limited.forEach((file) => transfer.items.add(file));
    imageInputRef.current.files = transfer.files;
  }

  function removeNewImage(index: number) {
    syncImages(images.filter((_, i) => i !== index));
  }

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
            value={categoryId}
            onChange={(event) => {
              setCategoryId(event.target.value);
              setSubcategoryId("");
            }}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900"
          >
            <option value="">Seçin</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name_az}
              </option>
            ))}
            <option value="__new__">+ Yeni kateqoriya əlavə et</option>
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
            value={unitType}
            onChange={(event) => setUnitType(event.target.value as UnitType)}
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900"
          >
            <option value="kg">kq</option>
            <option value="piece">ədəd</option>
            <option value="liter">litr</option>
          </select>
        </div>
      </div>

      {categoryId === "__new__" ? (
        <div>
          <label
            htmlFor="new_category_name"
            className="block text-sm font-medium text-zinc-700"
          >
            Yeni kateqoriya adı
          </label>
          <input
            id="new_category_name"
            name="new_category_name"
            required
            placeholder="Məs: Süd məhsulları"
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900"
          />
          <p className="mt-1 text-xs text-zinc-500">
            Admin təsdiqindən sonra mağazada görünəcək.
          </p>
        </div>
      ) : null}

      <div>
        <label
          htmlFor="subcategory_id"
          className="block text-sm font-medium text-zinc-700"
        >
          Alt kateqoriya
        </label>
        <select
          id="subcategory_id"
          name="subcategory_id"
          required
          value={subcategoryId}
          onChange={(event) => setSubcategoryId(event.target.value)}
          disabled={!categoryId}
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900 disabled:bg-zinc-50 disabled:text-zinc-400"
        >
          <option value="">
            {categoryId ? "Seçin" : "Əvvəlcə kateqoriya seçin"}
          </option>
          {visibleSubcategories.map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.name_az}
            </option>
          ))}
          {categoryId ? (
            <option value="__new__">+ Yeni alt kateqoriya əlavə et</option>
          ) : null}
        </select>
      </div>

      {subcategoryId === "__new__" ? (
        <div>
          <label
            htmlFor="new_subcategory_name"
            className="block text-sm font-medium text-zinc-700"
          >
            Yeni alt kateqoriya adı
          </label>
          <input
            id="new_subcategory_name"
            name="new_subcategory_name"
            required
            placeholder="Məs: Pendir"
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900"
          />
          <p className="mt-1 text-xs text-zinc-500">
            Admin təsdiqindən sonra mağazada görünəcək.
          </p>
        </div>
      ) : null}
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
            Əldə olan ({unitLabel(unitType)})
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
        <label className="block text-sm font-medium text-zinc-700">
          Məhsul şəkilləri {product ? "(istəyə bağlı yeniləyin)" : "*"}
        </label>
        <p className="mt-1 text-xs text-zinc-500">
          Ən azı 1, ən çox {MAX_PRODUCT_IMAGES} şəkil.
          {product
            ? " Yeni şəkil seçsəniz, mövcud bütün şəkillər əvəz olunacaq."
            : ""}
        </p>

        <input
          ref={imageInputRef}
          id="images"
          name="images"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          required={!product && images.length === 0}
          className="sr-only"
          onChange={(event) => {
            const selected = event.target.files
              ? Array.from(event.target.files)
              : [];
            syncImages([...images, ...selected].slice(0, MAX_PRODUCT_IMAGES));
          }}
        />
        <button
          type="button"
          onClick={() => imageInputRef.current?.click()}
          disabled={images.length >= MAX_PRODUCT_IMAGES}
          className="mt-2 inline-flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Şəkil seç ({images.length}/{MAX_PRODUCT_IMAGES})
        </button>

        {previews.length > 0 ? (
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {previews.map((url, index) => (
              <div
                key={url}
                className="relative aspect-square overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-zinc-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt="Məhsul şəkli önbaxışı"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeNewImage(index)}
                  className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-xs font-bold text-white"
                  aria-label="Şəkli sil"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : existingImages.length > 0 ? (
          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
            {existingImages.map((image) => (
              <div
                key={image.id}
                className="aspect-square overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-zinc-200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt="Mövcud məhsul şəkli"
                  className="h-full w-full object-cover"
                />
              </div>
            ))}
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
      {products.map((product) => {
        const imageUrl = getProductImageUrl(product.product_images ?? []);
        return (
          <Link
            key={product.id}
            href={`/farmer/products/${product.id}`}
            className="flex items-start gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 hover:shadow-md"
          >
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-zinc-200">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt={product.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] text-zinc-400">
                  Şəkil yox
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1 flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="font-semibold text-zinc-900">{product.title}</div>
                <p className="mt-1 text-sm text-zinc-500">
                  {product.categories?.name_az ?? "Kateqoriya"}
                </p>
                <p className="mt-2 text-sm text-zinc-700">
                  Təklif: {formatPrice(product.farmer_price)}
                  {formatUnit(product.unit_type as UnitType)}
                  {product.final_price != null ? (
                    <span className="ml-2 text-emerald-800">
                      · Son qiymət: {formatPrice(product.final_price)}
                      {formatUnit(product.unit_type as UnitType)}
                    </span>
                  ) : (
                    <span className="ml-2 text-amber-700">· Son qiymət gözlənilir</span>
                  )}
                </p>
              </div>
              <span className="inline-flex shrink-0 rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 ring-1 ring-zinc-200">
                {getProductStatusLabel(product.status)}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function farmerItemStatusTone(status: OrderItemStatus) {
  switch (status) {
    case "accepted":
      return "bg-sky-50 text-sky-900 ring-sky-200";
    case "preparing":
      return "bg-amber-50 text-amber-900 ring-amber-200";
    case "ready":
      return "bg-emerald-50 text-emerald-900 ring-emerald-200";
    case "awaiting_pickup":
      return "bg-violet-50 text-violet-900 ring-violet-200";
    case "picked_up":
      return "bg-zinc-100 text-zinc-700 ring-zinc-200";
    case "delivered":
      return "bg-emerald-50 text-emerald-900 ring-emerald-200";
    default:
      return "bg-zinc-100 text-zinc-700 ring-zinc-200";
  }
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
        <div className="min-w-0">
          <div className="font-semibold text-zinc-900">{item.product_title}</div>
          <p className="mt-1 text-sm text-zinc-500">
            {order?.order_code ?? "Sifariş"} · Say: {item.quantity}{" "}
            {formatUnit(item.unit_type)}
          </p>
          {order?.customer?.full_name ? (
            <p className="mt-2 text-sm text-zinc-600">
              Müştəri: {order.customer.full_name}
            </p>
          ) : null}
          <p className="mt-1 text-xs text-zinc-500">
            {formatDateTime(item.created_at)}
          </p>
        </div>
        <span
          className={`inline-flex max-w-[16rem] rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${farmerItemStatusTone(item.status)}`}
        >
          {getOrderItemStatusLabel(item.status)}
        </span>
      </div>

      {nextStatuses.length > 0 ? (
        <form action={action} className="mt-4 flex flex-wrap items-end gap-2">
          <input type="hidden" name="order_item_id" value={item.id} />
          <div className="min-w-[220px] flex-1">
            <label className="block text-xs font-medium text-zinc-600">
              Növbəti status
            </label>
            <select
              name="next_status"
              required
              defaultValue=""
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900"
            >
              <option value="" disabled>
                Seçin
              </option>
              {nextStatuses.map((status) => (
                <option key={status} value={status}>
                  {getOrderItemStatusLabel(status as OrderItemStatus)}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-70"
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
