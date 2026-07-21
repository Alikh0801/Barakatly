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

function coverFromPosts(posts: FarmerBlogPost[]): string | null {
  for (const post of posts) {
    const image = post.farmer_post_media.find((m) => m.media_type === "image");
    if (image) return image.url;
  }
  return null;
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

function ProfileHero({
  farmName,
  avatarUrl,
  locationText,
  description,
  verified,
  productCount,
  postCount,
  coverUrl,
  actions,
}: {
  farmName: string;
  avatarUrl: string | null;
  locationText: string | null;
  description: string | null;
  verified: boolean;
  productCount: number;
  postCount: number;
  coverUrl: string | null;
  actions?: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-[1.75rem] bg-white shadow-[0_20px_60px_-40px_rgba(15,40,28,0.55)] ring-1 ring-zinc-200/80">
      <div className="relative h-40 overflow-hidden sm:h-52 md:h-60">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.18), transparent 40%), radial-gradient(circle at 80% 10%, rgba(190,242,100,0.25), transparent 35%), linear-gradient(135deg, #0f2f22 0%, #1f5c3d 48%, #3f7a3a 100%)",
            }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-transparent" />
        <div
          className="pointer-events-none absolute inset-0 opacity-30 mix-blend-soft-light"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
      </div>

      <div className="relative px-4 pb-5 sm:px-6 sm:pb-6">
        <div className="-mt-12 flex flex-col gap-4 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <FarmerAvatar
              name={farmName}
              url={avatarUrl}
              className="h-24 w-24 text-3xl ring-4 ring-white sm:h-28 sm:w-28"
            />
            <div className="min-w-0 pb-1">
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
            </div>
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </div>

        {description ? (
          <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-700 sm:text-[15px]">
            {description}
          </p>
        ) : null}

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
      </div>
    </section>
  );
}

function ProfileTabs({
  tabs,
  active,
}: {
  tabs: { id: string; label: string; href: string }[];
  active: string;
}) {
  return (
    <nav className="sticky top-0 z-10 -mx-1 mt-5 flex gap-1 overflow-x-auto rounded-2xl bg-white/90 p-1 shadow-sm ring-1 ring-zinc-200 backdrop-blur">
      {tabs.map((tab) => {
        const isActive = tab.id === active;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
              isActive
                ? "bg-[#1f5c3d] text-white shadow-sm"
                : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800"
            }`}
          >
            {tab.label}
          </Link>
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
        <div>
          <label className="block text-sm font-medium text-zinc-700">
            Profil şəkli
          </label>
          <input
            type="file"
            name="avatar"
            accept="image/jpeg,image/png,image/webp"
            className="mt-2 block w-full text-sm text-zinc-600"
            onChange={(event) => {
              const file = event.target.files?.[0];
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
      <div>
        <label className="block text-sm font-medium text-zinc-700">
          Şəkil / video
        </label>
        <input
          type="file"
          name="media"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
          multiple
          required
          className="mt-2 block w-full text-sm text-zinc-600"
        />
        <p className="mt-1 text-xs text-zinc-500">
          Ən çox 6 fayl · max 50 MB
        </p>
      </div>
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
  tab,
  products,
  orders,
  posts,
}: {
  farmer: Farmer;
  profile: Profile;
  tab: FarmerProfileTab;
  products: FarmerProduct[];
  orders: FarmerOrderItem[];
  posts: FarmerBlogPost[];
}) {
  const coverUrl = coverFromPosts(posts);
  const tabs = [
    { id: "posts", label: "Paylaşımlar", href: "/farmer?tab=posts" },
    { id: "products", label: "Məhsullar", href: "/farmer?tab=products" },
    { id: "orders", label: "Sifarişlər", href: "/farmer?tab=orders" },
    { id: "about", label: "Redaktə", href: "/farmer?tab=about" },
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
        coverUrl={coverUrl}
        actions={
          <>
            <Link
              href={`/farmers/${farmer.id}`}
              className="inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#1f5c3d] ring-1 ring-[#1f5c3d]/20 transition hover:bg-[#f3faf6]"
            >
              Müştəri görünüşü
            </Link>
            <Link
              href="/farmer?tab=posts"
              className="inline-flex rounded-full bg-[#1f5c3d] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#184a31]"
            >
              Paylaş
            </Link>
          </>
        }
      />

      <ProfileTabs tabs={tabs} active={tab} />

      <div className="mt-5">
        {tab === "posts" ? (
          <div className="space-y-5">
            <BlogComposer />
            <FarmerBlogFeed posts={posts} canManage />
          </div>
        ) : null}

        {tab === "products" ? (
          <div className="space-y-4">
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
        ) : null}

        {tab === "orders" ? <FarmerOrdersList items={orders} /> : null}

        {tab === "about" ? (
          <ProfileAboutForm farmer={farmer} profile={profile} />
        ) : null}
      </div>
    </div>
  );
}

export function PublicFarmerProfile({
  farmer,
  tab,
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
  tab: PublicFarmerProfileTab;
  products: ProductListItem[];
  posts: FarmerBlogPost[];
}) {
  const coverUrl = coverFromPosts(posts);
  const tabs = [
    {
      id: "posts",
      label: "Paylaşımlar",
      href: `/farmers/${farmer.id}?tab=posts`,
    },
    {
      id: "products",
      label: "Məhsullar",
      href: `/farmers/${farmer.id}?tab=products`,
    },
    {
      id: "about",
      label: "Haqqında",
      href: `/farmers/${farmer.id}?tab=about`,
    },
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
        coverUrl={coverUrl}
        actions={
          <Link
            href="/shop"
            className="inline-flex rounded-full bg-[#1f5c3d] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#184a31]"
          >
            Məhsullara bax
          </Link>
        }
      />

      <ProfileTabs tabs={tabs} active={tab} />

      <div className="mt-5">
        {tab === "posts" ? <FarmerBlogFeed posts={posts} /> : null}

        {tab === "products" ? (
          products.length > 0 ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <p className="rounded-[1.5rem] bg-white px-4 py-10 text-center text-sm text-zinc-600 ring-1 ring-zinc-200">
              Bu fermerin hazırda satışda məhsulu yoxdur.
            </p>
          )
        ) : null}

        {tab === "about" ? (
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
        ) : null}
      </div>
    </div>
  );
}
