"use client";

import Link from "next/link";
import { Syne } from "next/font/google";
import { useActionState, useMemo, useState } from "react";
import {
  createFarmerBlogPost,
  deleteFarmerBlogPost,
  updateFarmerProfile,
} from "@/lib/farmer/actions";
import { Spinner } from "@/components/ui/Spinner";
import { VerifiedIcon } from "@/components/ui/VerifiedIcon";
import {
  FarmerOrdersList,
  FarmerProductsList,
} from "@/components/farmer/FarmerPanels";
import { ProductCard } from "@/components/shop/ProductCard";
import type {
  FarmerBlogPost,
  FarmerOrderItem,
  FarmerProduct,
} from "@/lib/farmer/queries";
import type { ProductListItem } from "@/types/shop";
import type { Farmer, Profile } from "@/types";

const displayFont = Syne({
  subsets: ["latin"],
  weight: ["600", "700"],
});

type ActionResult = { error?: string; success?: string };
const initialState: ActionResult = {};

export type FarmerProfileTab = "posts" | "products" | "orders" | "about";
export type PublicFarmerProfileTab = "posts" | "products" | "about";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("az-AZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function FarmerAvatar({
  name,
  url,
  className = "",
}: {
  name: string;
  url: string | null;
  className?: string;
}) {
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        className={`rounded-full object-cover ${className}`}
      />
    );
  }
  return (
    <div
      className={`inline-flex items-center justify-center rounded-full bg-[#1a3d2b] font-semibold text-[#d7f5e3] ${className}`}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
  );
}

function FilePickerButton({
  name,
  accept,
  multiple = false,
  required = false,
  label,
  hint,
  onFilesChange,
}: {
  name: string;
  accept: string;
  multiple?: boolean;
  required?: boolean;
  label: string;
  hint?: string;
  onFilesChange?: (files: FileList | null) => void;
}) {
  const [fileNames, setFileNames] = useState<string[]>([]);

  return (
    <div>
      <label className="block text-sm font-medium text-zinc-700">{label}</label>
      <label className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#1f5c3d]/35 bg-[#f3faf6] px-4 py-6 text-center transition hover:border-[#1f5c3d] hover:bg-[#e8f6ee]">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[#1f5c3d] text-white">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="h-5 w-5"
          >
            <path
              d="M12 16V7m0 0 3.5 3.5M12 7 8.5 10.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M20 16.5v1a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5v-1"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <span className="text-sm font-semibold text-[#1f5c3d]">
          Fayl seçin
        </span>
        {hint ? <span className="text-xs text-zinc-500">{hint}</span> : null}
        {fileNames.length > 0 ? (
          <span className="max-w-full truncate text-xs font-medium text-zinc-700">
            {fileNames.join(", ")}
          </span>
        ) : null}
        <input
          type="file"
          name={name}
          accept={accept}
          multiple={multiple}
          required={required}
          className="sr-only"
          onChange={(event) => {
            const files = event.target.files;
            setFileNames(
              files ? Array.from(files).map((file) => file.name) : []
            );
            onFilesChange?.(files);
          }}
        />
      </label>
    </div>
  );
}

function ProfileHero({
  farmName,
  avatarUrl,
  locationText,
  description,
  verified,
  productCount,
  postCount,
  actions,
}: {
  farmName: string;
  avatarUrl: string | null;
  locationText: string | null;
  description: string | null;
  verified: boolean;
  productCount: number;
  postCount: number;
  actions?: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] bg-white p-5 shadow-[0_20px_60px_-40px_rgba(15,40,28,0.45)] ring-1 ring-zinc-200/80 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <FarmerAvatar
            name={farmName}
            url={avatarUrl}
            className="h-24 w-24 shrink-0 text-3xl ring-2 ring-zinc-100 sm:h-28 sm:w-28"
          />
          <div className="min-w-0 pt-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1
                className={`${displayFont.className} text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl`}
              >
                {farmName}
              </h1>
              {verified ? <VerifiedIcon className="h-5 w-5" /> : null}
            </div>
            {locationText ? (
              <p className="mt-1 text-sm text-zinc-500">{locationText}</p>
            ) : null}
            {description ? (
              <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-700 sm:text-[15px]">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {actions ? (
          <div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div>
        ) : null}
      </div>

      <div className="mt-5 flex gap-6 border-t border-zinc-100 pt-4">
        <div>
          <div className={`${displayFont.className} text-lg font-bold text-zinc-900`}>
            {postCount}
          </div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Paylaşım
          </div>
        </div>
        <div>
          <div className={`${displayFont.className} text-lg font-bold text-zinc-900`}>
            {productCount}
          </div>
          <div className="text-xs uppercase tracking-wide text-zinc-500">
            Məhsul
          </div>
        </div>
      </div>
    </section>
  );
}

function ProfileTabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <nav className="sticky top-0 z-10 -mx-1 mt-5 flex gap-1 overflow-x-auto rounded-2xl bg-white/90 p-1 shadow-sm ring-1 ring-zinc-200 backdrop-blur">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              isActive
                ? "bg-[#1f5c3d] text-white shadow-sm"
                : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}

function ProfileAboutForm({
  farmer,
  profile,
}: {
  farmer: Farmer;
  profile: Profile;
}) {
  const [state, action, pending] = useActionState(
    updateFarmerProfile,
    initialState
  );
  const [preview, setPreview] = useState<string | null>(farmer.avatar_url);

  return (
    <form
      action={action}
      className="space-y-5 rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-zinc-200 sm:p-6"
    >
      <h2 className={`${displayFont.className} text-xl font-bold text-zinc-900`}>
        Profili redaktə et
      </h2>
      {state.error ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {state.success}
        </p>
      ) : null}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <FarmerAvatar
          name={farmer.farm_name}
          url={preview}
          className="h-20 w-20 text-2xl ring-2 ring-zinc-100"
        />
        <div className="min-w-0 flex-1">
          <FilePickerButton
            name="avatar"
            accept="image/jpeg,image/png,image/webp"
            label="Profil şəkli"
            hint="JPEG, PNG və ya WebP"
            onFilesChange={(files) => {
              const file = files?.[0];
              if (!file) return;
              setPreview(URL.createObjectURL(file));
            }}
          />
        </div>
      </div>

      <div>
        <label htmlFor="farm_name" className="block text-sm font-medium text-zinc-700">
          Təsərrüfat adı
        </label>
        <input
          id="farm_name"
          name="farm_name"
          required
          defaultValue={farmer.farm_name}
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900"
        />
      </div>

      <div>
        <label htmlFor="location_text" className="block text-sm font-medium text-zinc-700">
          Ünvan / yer
        </label>
        <input
          id="location_text"
          name="location_text"
          defaultValue={farmer.location_text ?? ""}
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-zinc-700">
          Bio
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={farmer.description ?? ""}
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900"
          placeholder="Təsərrüfatınız haqqında qısa bio..."
        />
      </div>

      <div className="rounded-2xl bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
        <p>
          <span className="font-medium text-zinc-800">Ad:</span>{" "}
          {profile.full_name ?? "—"}
        </p>
        <p className="mt-1">
          <span className="font-medium text-zinc-800">Email:</span>{" "}
          {profile.email ?? "—"}
        </p>
        <p className="mt-1">
          <span className="font-medium text-zinc-800">Telefon:</span>{" "}
          {profile.phone ?? "—"}
        </p>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full bg-[#1f5c3d] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-70"
      >
        {pending ? <Spinner className="h-3.5 w-3.5" /> : null}
        Yadda saxla
      </button>
    </form>
  );
}

function BlogComposer() {
  const [state, action, pending] = useActionState(
    createFarmerBlogPost,
    initialState
  );

  return (
    <form
      action={action}
      className="space-y-4 rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-zinc-200 sm:p-6"
    >
      <h3 className={`${displayFont.className} text-lg font-bold text-zinc-900`}>
        Yeni paylaşım
      </h3>
      {state.error ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {state.success}
        </p>
      ) : null}
      <textarea
        name="caption"
        rows={3}
        placeholder="Bu gün təsərrüfatda nələr baş verir?"
        className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900"
      />
      <FilePickerButton
        name="media"
        accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
        multiple
        required
        label="Şəkil / video"
        hint="Ən çox 6 fayl · max 50 MB"
      />
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full bg-[#1f5c3d] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-70"
      >
        {pending ? <Spinner className="h-3.5 w-3.5" /> : null}
        Paylaş
      </button>
    </form>
  );
}

function BlogPostCard({
  post,
  canDelete = false,
}: {
  post: FarmerBlogPost;
  canDelete?: boolean;
}) {
  const [state, action, pending] = useActionState(
    deleteFarmerBlogPost,
    initialState
  );

  return (
    <article className="overflow-hidden rounded-[1.5rem] bg-white shadow-sm ring-1 ring-zinc-200">
      {canDelete && (state.error || state.success) ? (
        <p
          className={`mx-4 mt-4 rounded-xl px-3 py-2 text-sm ${
            state.error
              ? "bg-rose-50 text-rose-700"
              : "bg-emerald-50 text-emerald-800"
          }`}
        >
          {state.error || state.success}
        </p>
      ) : null}

      {post.farmer_post_media.length > 0 ? (
        <div
          className={`grid gap-0.5 bg-zinc-100 ${
            post.farmer_post_media.length === 1 ? "grid-cols-1" : "grid-cols-2"
          }`}
        >
          {post.farmer_post_media.map((media) =>
            media.media_type === "video" ? (
              <video
                key={media.id}
                src={media.url}
                controls
                className="max-h-[28rem] w-full bg-black object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={media.id}
                src={media.url}
                alt=""
                className="max-h-[28rem] w-full object-cover"
              />
            )
          )}
        </div>
      ) : null}

      <div className="p-4 sm:p-5">
        {post.caption ? (
          <p className="text-sm leading-6 text-zinc-800">{post.caption}</p>
        ) : null}
        <p className="mt-2 text-xs text-zinc-500">{formatDate(post.created_at)}</p>

        {canDelete ? (
          <form
            action={action}
            className="mt-3"
            onSubmit={(event) => {
              if (!window.confirm("Bu paylaşımı silmək istəyirsiniz?")) {
                event.preventDefault();
              }
            }}
          >
            <input type="hidden" name="post_id" value={post.id} />
            <button
              type="submit"
              disabled={pending}
              className="text-sm font-medium text-rose-700 hover:underline disabled:opacity-70"
            >
              {pending ? "Silinir..." : "Sil"}
            </button>
          </form>
        ) : null}
      </div>
    </article>
  );
}

function BlogMediaGrid({ posts }: { posts: FarmerBlogPost[] }) {
  const tiles = useMemo(
    () =>
      posts.flatMap((post) =>
        post.farmer_post_media.map((media) => ({
          ...media,
          caption: post.caption,
          postId: post.id,
        }))
      ),
    [posts]
  );

  if (tiles.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-1 overflow-hidden rounded-[1.25rem] sm:gap-1.5">
      {tiles.map((tile) => (
        <a
          key={tile.id}
          href={`#post-${tile.postId}`}
          className="group relative aspect-square overflow-hidden bg-zinc-200"
        >
          {tile.media_type === "video" ? (
            <>
              <video
                src={tile.url}
                muted
                playsInline
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
              <span className="absolute right-1.5 top-1.5 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                VIDEO
              </span>
            </>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tile.url}
              alt={tile.caption || ""}
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />
          )}
        </a>
      ))}
    </div>
  );
}

export function FarmerBlogFeed({
  posts,
  canManage = false,
  showGrid = true,
}: {
  posts: FarmerBlogPost[];
  canManage?: boolean;
  showGrid?: boolean;
}) {
  if (posts.length === 0) {
    return (
      <div className="rounded-[1.5rem] bg-white px-6 py-12 text-center ring-1 ring-zinc-200">
        <p className={`${displayFont.className} text-lg font-bold text-zinc-900`}>
          Hələ paylaşım yoxdur
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          Təsərrüfatdan ilk şəkil və ya videonu paylaşın.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showGrid ? <BlogMediaGrid posts={posts} /> : null}
      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} id={`post-${post.id}`}>
            <BlogPostCard post={post} canDelete={canManage} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function FarmerProfileDashboard({
  farmer,
  profile,
  initialTab = "posts",
  products,
  orders,
  posts,
}: {
  farmer: Farmer;
  profile: Profile;
  initialTab?: FarmerProfileTab;
  products: FarmerProduct[];
  orders: FarmerOrderItem[];
  posts: FarmerBlogPost[];
}) {
  const [tab, setTab] = useState<FarmerProfileTab>(initialTab);

  function selectTab(next: FarmerProfileTab) {
    setTab(next);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", next);
      window.history.replaceState(null, "", url.pathname + "?" + url.searchParams.toString());
    }
  }

  const tabs: { id: FarmerProfileTab; label: string }[] = [
    { id: "posts", label: "Paylaşımlar" },
    { id: "products", label: "Məhsullar" },
    { id: "orders", label: "Sifarişlər" },
    { id: "about", label: "Redaktə" },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-6 md:py-10">
      <ProfileHero
        farmName={farmer.farm_name}
        avatarUrl={farmer.avatar_url}
        locationText={farmer.location_text}
        description={farmer.description}
        verified={Boolean(farmer.verified_at)}
        productCount={products.filter((p) => p.status === "approved").length}
        postCount={posts.length}
        actions={
          <>
            <Link
              href={`/farmers/${farmer.id}`}
              className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#1f5c3d] ring-1 ring-[#1f5c3d]/20 transition hover:bg-[#f3faf6]"
            >
              Müştəri görünüşü
            </Link>
            <button
              type="button"
              onClick={() => selectTab("posts")}
              className="inline-flex rounded-full bg-[#1f5c3d] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#184a31]"
            >
              Paylaş
            </button>
          </>
        }
      />

      <ProfileTabs
        tabs={tabs}
        active={tab}
        onChange={(id) => selectTab(id as FarmerProfileTab)}
      />

      <div className="mt-5">
        <div className={tab === "posts" ? "space-y-5" : "hidden"}>
          <BlogComposer />
          <FarmerBlogFeed posts={posts} canManage />
        </div>

        <div className={tab === "products" ? "space-y-4" : "hidden"}>
          <div className="flex justify-end">
            <Link
              href="/farmer/products/new"
              className="inline-flex rounded-full bg-[#1f5c3d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#184a31]"
            >
              Yeni məhsul
            </Link>
          </div>
          <FarmerProductsList products={products} />
        </div>

        <div className={tab === "orders" ? "block" : "hidden"}>
          <FarmerOrdersList items={orders} />
        </div>

        <div className={tab === "about" ? "block" : "hidden"}>
          <ProfileAboutForm farmer={farmer} profile={profile} />
        </div>
      </div>
    </div>
  );
}

export function PublicFarmerProfile({
  farmer,
  initialTab = "posts",
  products,
  posts,
}: {
  farmer: {
    id: string;
    farm_name: string;
    description: string | null;
    location_text: string | null;
    verified_at: string | null;
    avatar_url: string | null;
    productCount: number;
  };
  initialTab?: PublicFarmerProfileTab;
  products: ProductListItem[];
  posts: FarmerBlogPost[];
}) {
  const [tab, setTab] = useState<PublicFarmerProfileTab>(initialTab);

  function selectTab(next: PublicFarmerProfileTab) {
    setTab(next);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", next);
      window.history.replaceState(
        null,
        "",
        url.pathname + "?" + url.searchParams.toString()
      );
    }
  }

  const tabs: { id: PublicFarmerProfileTab; label: string }[] = [
    { id: "posts", label: "Paylaşımlar" },
    { id: "products", label: "Məhsullar" },
    { id: "about", label: "Haqqında" },
  ];

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 md:px-6 md:py-10">
      <Link
        href="/farmers"
        className="mb-4 inline-flex text-sm font-medium text-[#1f5c3d] hover:underline"
      >
        ← Fermerlərə qayıt
      </Link>

      <ProfileHero
        farmName={farmer.farm_name}
        avatarUrl={farmer.avatar_url}
        locationText={farmer.location_text}
        description={tab === "about" ? null : farmer.description}
        verified={Boolean(farmer.verified_at)}
        productCount={farmer.productCount}
        postCount={posts.length}
        actions={
          <Link
            href="/shop"
            className="inline-flex rounded-full bg-[#1f5c3d] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#184a31]"
          >
            Məhsullara bax
          </Link>
        }
      />

      <ProfileTabs
        tabs={tabs}
        active={tab}
        onChange={(id) => selectTab(id as PublicFarmerProfileTab)}
      />

      <div className="mt-5">
        <div className={tab === "posts" ? "block" : "hidden"}>
          <FarmerBlogFeed posts={posts} />
        </div>

        <div className={tab === "products" ? "block" : "hidden"}>
          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="rounded-[1.5rem] bg-white px-4 py-10 text-center text-sm text-zinc-600 ring-1 ring-zinc-200">
              Bu fermerin hazırda satışda məhsulu yoxdur.
            </p>
          )}
        </div>

        <div className={tab === "about" ? "block" : "hidden"}>
          <div className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-zinc-200 sm:p-6">
            <h2 className={`${displayFont.className} text-xl font-bold text-zinc-900`}>
              Haqqında
            </h2>
            {farmer.description ? (
              <p className="mt-3 text-sm leading-7 text-zinc-700">
                {farmer.description}
              </p>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">
                Bu təsərrüfat haqqında əlavə təsvir hələ əlavə olunmayıb.
              </p>
            )}
            {farmer.location_text ? (
              <p className="mt-4 text-sm text-zinc-600">
                <span className="font-medium text-zinc-800">Yer:</span>{" "}
                {farmer.location_text}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
