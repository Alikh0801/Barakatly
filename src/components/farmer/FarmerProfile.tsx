"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  createFarmerBlogPost,
  deleteFarmerBlogPost,
  updateFarmerProfile,
} from "@/lib/farmer/actions";
import { Spinner } from "@/components/ui/Spinner";
import {
  FarmerOrdersList,
  FarmerProductsList,
} from "@/components/farmer/FarmerPanels";
import type {
  FarmerBlogPost,
  FarmerOrderItem,
  FarmerProduct,
} from "@/lib/farmer/queries";
import type { Farmer, Profile } from "@/types";

type ActionResult = { error?: string; success?: string };
const initialState: ActionResult = {};

export type FarmerProfileTab = "about" | "products" | "orders" | "blog";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("az-AZ", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function FarmerAvatar({
  name,
  url,
  size = "lg",
}: {
  name: string;
  url: string | null;
  size?: "sm" | "lg";
}) {
  const dim = size === "lg" ? "h-24 w-24 text-3xl" : "h-12 w-12 text-lg";
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        className={`${dim} rounded-full object-cover ring-2 ring-white shadow-sm`}
      />
    );
  }
  return (
    <div
      className={`inline-flex ${dim} items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-800 ring-2 ring-white`}
    >
      {name.slice(0, 1).toUpperCase()}
    </div>
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
    <form action={action} className="space-y-5 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 sm:p-6">
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
        <FarmerAvatar name={farmer.farm_name} url={preview} />
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
          <p className="mt-1 text-xs text-zinc-500">JPEG, PNG və ya WebP · max 50 MB</p>
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
          Haqqında
        </label>
        <textarea
          id="description"
          name="description"
          rows={4}
          defaultValue={farmer.description ?? ""}
          className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900"
          placeholder="Təsərrüfatınız haqqında qısa məlumat..."
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
        className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-70"
      >
        {pending ? <Spinner className="h-3.5 w-3.5" /> : null}
        Profili yadda saxla
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
      className="space-y-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-zinc-200 sm:p-6"
    >
      <h3 className="text-base font-semibold text-zinc-900">Yeni paylaşım</h3>
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
        placeholder="Təsərrüfatınızdan bir an paylaşın..."
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
          Ən çox 6 fayl · şəkil və ya qısa video (max 50 MB)
        </p>
      </div>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-70"
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
    <article className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-zinc-200 sm:p-5">
      {canDelete && (state.error || state.success) ? (
        <p
          className={`mb-3 rounded-xl px-3 py-2 text-sm ${
            state.error
              ? "bg-rose-50 text-rose-700"
              : "bg-emerald-50 text-emerald-800"
          }`}
        >
          {state.error || state.success}
        </p>
      ) : null}

      {post.caption ? (
        <p className="text-sm leading-6 text-zinc-800">{post.caption}</p>
      ) : null}
      <p className="mt-2 text-xs text-zinc-500">{formatDate(post.created_at)}</p>

      {post.farmer_post_media.length > 0 ? (
        <div
          className={`mt-4 grid gap-2 ${
            post.farmer_post_media.length === 1
              ? "grid-cols-1"
              : "grid-cols-2"
          }`}
        >
          {post.farmer_post_media.map((media) =>
            media.media_type === "video" ? (
              <video
                key={media.id}
                src={media.url}
                controls
                className="max-h-80 w-full rounded-2xl bg-zinc-100 object-cover"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={media.id}
                src={media.url}
                alt=""
                className="max-h-80 w-full rounded-2xl object-cover"
              />
            )
          )}
        </div>
      ) : null}

      {canDelete ? (
        <form
          action={action}
          className="mt-4"
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
    </article>
  );
}

export function FarmerBlogFeed({
  posts,
  canManage = false,
}: {
  posts: FarmerBlogPost[];
  canManage?: boolean;
}) {
  if (posts.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-8 text-center ring-1 ring-zinc-200">
        <p className="font-medium text-zinc-900">Hələ paylaşım yoxdur</p>
        <p className="mt-2 text-sm text-zinc-500">
          Təsərrüfatınızdan şəkil və video paylaşın.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <BlogPostCard key={post.id} post={post} canDelete={canManage} />
      ))}
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
  const tabs: { id: FarmerProfileTab; label: string; href: string }[] = [
    { id: "about", label: "Profil", href: "/farmer?tab=about" },
    { id: "products", label: "Məhsullar", href: "/farmer?tab=products" },
    { id: "orders", label: "Sifarişlər", href: "/farmer?tab=orders" },
    { id: "blog", label: "Blog", href: "/farmer?tab=blog" },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-12">
      <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-zinc-200">
        <div className="bg-gradient-to-br from-emerald-700 via-emerald-600 to-lime-600 px-5 py-8 sm:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <FarmerAvatar name={farmer.farm_name} url={farmer.avatar_url} />
            <div className="min-w-0 text-white">
              <h1 className="text-3xl font-semibold tracking-tight">
                {farmer.farm_name}
              </h1>
              {farmer.location_text ? (
                <p className="mt-1 text-sm text-emerald-50/90">
                  {farmer.location_text}
                </p>
              ) : null}
              <p className="mt-2 text-sm text-emerald-50/80">
                {profile.full_name ?? "Fermer"} · Profil səhifəniz
              </p>
            </div>
          </div>
        </div>

        <nav className="flex gap-1 overflow-x-auto border-t border-zinc-100 px-2 sm:px-4">
          {tabs.map((item) => {
            const active = item.id === tab;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition ${
                  active
                    ? "border-emerald-600 text-emerald-800"
                    : "border-transparent text-zinc-500 hover:text-zinc-800"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </section>

      <div className="mt-6">
        {tab === "about" ? (
          <ProfileAboutForm farmer={farmer} profile={profile} />
        ) : null}

        {tab === "products" ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Link
                href="/farmer/products/new"
                className="inline-flex rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                Yeni məhsul
              </Link>
            </div>
            <FarmerProductsList products={products} />
          </div>
        ) : null}

        {tab === "orders" ? <FarmerOrdersList items={orders} /> : null}

        {tab === "blog" ? (
          <div className="space-y-6">
            <BlogComposer />
            <FarmerBlogFeed posts={posts} canManage />
          </div>
        ) : null}
      </div>
    </div>
  );
}
