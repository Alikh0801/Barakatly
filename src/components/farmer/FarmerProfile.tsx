"use client";

import Link from "next/link";
import { Syne } from "next/font/google";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  createFarmerBlogPost,
  deleteFarmerBlogPost,
  updateFarmerProfile,
} from "@/lib/farmer/actions";
import {
  toggleFollowFarmer,
  type FollowActionState,
} from "@/lib/farmers/actions";
import { Spinner } from "@/components/ui/Spinner";
import { VerifiedIcon } from "@/components/ui/VerifiedIcon";
import {
  FarmerOrdersList,
  FarmerProductsList,
  RegionSelect,
} from "@/components/farmer/FarmerPanels";
import { AvatarField } from "@/components/farmer/AvatarField";
import { ProductCard } from "@/components/shop/ProductCard";
import type {
  FarmerBlogPost,
  FarmerOrderItem,
  FarmerProduct,
} from "@/lib/farmer/queries";
import type { ProductListItem } from "@/types/shop";
import type { Farmer, Profile } from "@/types";
import { formatDate, formatDateTime } from "@/lib/format/date";

const displayFont = Syne({
  subsets: ["latin"],
  weight: ["600", "700"],
});

type ActionResult = { error?: string; success?: string };
const initialState: ActionResult = {};

export type FarmerProfileTab = "posts" | "products" | "orders" | "about";
export type PublicFarmerProfileTab = "posts" | "products" | "about";

function getPublicFarmerUrl(farmerId: string) {
  if (typeof window === "undefined") return `/farmers/${farmerId}`;
  return `${window.location.origin}/farmers/${farmerId}`;
}

function ShareProfileButton({
  farmerId,
  farmName,
}: {
  farmerId: string;
  farmName: string;
}) {
  const [copied, setCopied] = useState(false);

  async function shareProfile() {
    const url = getPublicFarmerUrl(farmerId);
    const title = `${farmName} — Barakatly`;
    const text = `${farmName} təsərrüfatına baxın`;

    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share({ title, text, url });
        return;
      }
    } catch (error) {
      // User cancelled share sheet — don't fall through as an error toast.
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Profil linkini kopyalayın:", url);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void shareProfile()}
      className="inline-flex items-center gap-1.5 rounded-full bg-[#1f5c3d] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#184a31]"
    >
      {copied ? (
        "Link kopyalandı"
      ) : (
        <>
          <ShareIcon className="h-4 w-4" />
          Profili paylaş
        </>
      )}
    </button>
  );
}

const followInitialState: FollowActionState = { following: false };

function FollowButton({
  farmerId,
  initialFollowing,
  isAuthenticated,
}: {
  farmerId: string;
  initialFollowing: boolean;
  isAuthenticated: boolean;
}) {
  const [state, action, pending] = useActionState(toggleFollowFarmer, {
    ...followInitialState,
    following: initialFollowing,
  });

  if (!isAuthenticated) {
    return (
      <Link
        href="/signin"
        className="inline-flex items-center gap-1.5 rounded-full bg-[#1f5c3d] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#184a31]"
      >
        <PlusIcon className="h-4 w-4" />
        İzlə
      </Link>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <form action={action}>
        <input type="hidden" name="farmer_id" value={farmerId} />
        <button
          type="submit"
          disabled={pending}
          className={
            state.following
              ? "group inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#1f5c3d] ring-1 ring-[#1f5c3d]/30 transition hover:bg-rose-50 hover:text-rose-700 hover:ring-rose-200 disabled:opacity-70"
              : "inline-flex items-center gap-1.5 rounded-full bg-[#1f5c3d] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#184a31] disabled:opacity-70"
          }
        >
          {state.following ? (
            <>
              <CheckIcon className="h-4 w-4 group-hover:hidden" />
              <CloseIcon className="hidden h-4 w-4 group-hover:block" />
              <span className="group-hover:hidden">İzlənilir</span>
              <span className="hidden group-hover:inline">İzləmə</span>
            </>
          ) : (
            <>
              <PlusIcon className="h-4 w-4" />
              İzlə
            </>
          )}
        </button>
      </form>
      {state.error ? (
        <p className="text-xs text-rose-600">{state.error}</p>
      ) : null}
    </div>
  );
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

function ShareIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="M8.2 10.8l7.6-4.4M8.2 13.2l7.6 4.4" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className={className}
    >
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className={className}
    >
      <path d="M5 12l5 5L19 7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      className={className}
    >
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

function PackageIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <path d="M21 8 12 3 3 8l9 5 9-5Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M3 8v8l9 5 9-5V8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 13v8" strokeLinecap="round" />
    </svg>
  );
}

function ImageStackIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <rect x="3" y="3" width="18" height="18" rx="3" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5-9 9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UsersIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <circle cx="9" cy="8" r="3" />
      <path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M16.5 3.5c1.7.4 3 2 3 3.9 0 1.9-1.3 3.5-3 3.9" strokeLinecap="round" />
      <path d="M18 14.3c2 .5 3.5 2.3 3.5 4.7" strokeLinecap="round" />
    </svg>
  );
}

function PinIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <path
        d="M12 21s-7-7.2-7-12a7 7 0 1 1 14 0c0 4.8-7 12-7 12Z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function CalendarIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className={className}
    >
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3 10h18" strokeLinecap="round" />
    </svg>
  );
}

function StatTile({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-zinc-50 px-3.5 py-3 ring-1 ring-zinc-100 sm:px-4">
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
        {icon}
      </span>
      <div className="min-w-0">
        <div
          className={`${displayFont.className} text-lg font-bold leading-tight text-zinc-900 sm:text-xl`}
        >
          {value}
        </div>
        <div className="truncate text-[11px] font-medium uppercase tracking-wide text-zinc-500">
          {label}
        </div>
      </div>
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
  followerCount,
  createdAt,
  actions,
}: {
  farmName: string;
  avatarUrl: string | null;
  locationText: string | null;
  description: string | null;
  verified: boolean;
  productCount: number;
  postCount: number;
  followerCount: number;
  createdAt: string;
  actions?: React.ReactNode;
}) {
  return (
    <section className="rounded-[1.75rem] bg-white p-5 shadow-[0_20px_60px_-40px_rgba(15,40,28,0.45)] ring-1 ring-zinc-200/80 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <FarmerAvatar
            name={farmName}
            url={avatarUrl}
            className="h-20 w-20 shrink-0 text-2xl shadow-sm ring-2 ring-emerald-50 sm:h-24 sm:w-24"
          />
          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <h1 className="truncate text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
                {farmName}
              </h1>
              {verified ? <VerifiedIcon className="h-5 w-5 shrink-0" /> : null}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {locationText ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-600 ring-1 ring-zinc-100">
                  <PinIcon className="h-3.5 w-3.5 text-emerald-600" />
                  {locationText}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1 rounded-full bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-600 ring-1 ring-zinc-100">
                <CalendarIcon className="h-3.5 w-3.5 text-emerald-600" />
                Üzv: {formatDate(createdAt)}
              </span>
            </div>
          </div>
        </div>
        {actions ? (
          <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">{actions}</div>
        ) : null}
      </div>

      {description ? (
        <p className="mt-4 max-w-2xl text-sm leading-6 text-zinc-700 sm:text-[15px]">
          {description}
        </p>
      ) : null}

      <div className="mt-5 grid grid-cols-3 gap-3 border-t border-zinc-100 pt-5">
        <StatTile
          icon={<PackageIcon className="h-4 w-4" />}
          value={productCount}
          label="Məhsul"
        />
        <StatTile
          icon={<ImageStackIcon className="h-4 w-4" />}
          value={postCount}
          label="Paylaşım"
        />
        <StatTile
          icon={<UsersIcon className="h-4 w-4" />}
          value={followerCount}
          label="İzləyici"
        />
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

      <AvatarField farmName={farmer.farm_name} initialUrl={farmer.avatar_url} />

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

      <RegionSelect defaultValue={farmer.location_text ?? ""} />

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
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<
    { url: string; kind: "image" | "video"; name: string }[]
  >([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const next = files.map((file) => ({
      url: URL.createObjectURL(file),
      kind: file.type.startsWith("video/")
        ? ("video" as const)
        : ("image" as const),
      name: file.name,
    }));
    setPreviews(next);
    return () => {
      next.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [files]);

  useEffect(() => {
    if (state.success) {
      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }, [state.success]);

  function syncFiles(next: File[]) {
    const limited = next.slice(0, 5);
    setFiles(limited);
    if (!fileInputRef.current) return;
    const transfer = new DataTransfer();
    limited.forEach((file) => transfer.items.add(file));
    fileInputRef.current.files = transfer.files;
  }

  function removeFile(index: number) {
    syncFiles(files.filter((_, i) => i !== index));
  }

  return (
    <form
      action={action}
      className="overflow-hidden rounded-[1.5rem] bg-white shadow-sm ring-1 ring-zinc-200"
    >
      <div className="border-b border-zinc-100 px-4 py-3 sm:px-5">
        <h3 className={`${displayFont.className} text-lg font-bold text-zinc-900`}>
          Yeni paylaşım
        </h3>
      </div>

      {state.error ? (
        <p className="mx-4 mt-3 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 sm:mx-5">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="mx-4 mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800 sm:mx-5">
          {state.success}
        </p>
      ) : null}

      <div className="px-4 pt-3 sm:px-5">
        <textarea
          name="caption"
          rows={3}
          placeholder="Bu gün təsərrüfatda nələr baş verir?"
          className="w-full resize-none border-0 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
        />

        {previews.length > 0 ? (
          <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
            {previews.map((preview, index) => (
              <div
                key={`${preview.name}-${index}`}
                className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-zinc-200"
              >
                {preview.kind === "video" ? (
                  <video
                    src={preview.url}
                    className="h-full w-full object-cover"
                    muted
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview.url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                )}
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-xs font-bold text-white"
                  aria-label="Faylı sil"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-zinc-100 px-3 py-2.5 sm:px-4">
        <div className="flex items-center gap-1">
          <input
            ref={fileInputRef}
            type="file"
            name="media"
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
            multiple
            required={files.length === 0}
            className="sr-only"
            onChange={(event) => {
              const selected = event.target.files
                ? Array.from(event.target.files)
                : [];
              syncFiles([...files, ...selected].slice(0, 5));
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-[#1f5c3d] transition hover:bg-[#f3faf6]"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
            >
              <path
                d="M21.44 11.05 12.7 19.78a5.5 5.5 0 0 1-7.78-7.78l9.9-9.9a3.5 3.5 0 0 1 4.95 4.95l-9.9 9.9a1.5 1.5 0 1 1-2.12-2.12l8.49-8.49"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Əlavə et
          </button>
          <span className="hidden text-xs text-zinc-400 sm:inline">
            Şəkil və ya video · max 5
          </span>
        </div>

        <button
          type="submit"
          disabled={pending || files.length === 0}
          className="inline-flex items-center gap-2 rounded-full bg-[#1f5c3d] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {pending ? <Spinner className="h-3.5 w-3.5" /> : null}
          Paylaş
        </button>
      </div>
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
    <article
      id={`post-${post.id}`}
      className="overflow-hidden rounded-[1.5rem] bg-white shadow-sm ring-1 ring-zinc-200"
    >
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
        <p className="mt-2 text-xs text-zinc-500">{formatDateTime(post.created_at)}</p>

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

export function FarmerBlogFeed({
  posts,
  canManage = false,
}: {
  posts: FarmerBlogPost[];
  canManage?: boolean;
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
  initialTab = "posts",
  products,
  orders,
  posts,
  followerCount,
}: {
  farmer: Farmer;
  profile: Profile;
  initialTab?: FarmerProfileTab;
  products: FarmerProduct[];
  orders: FarmerOrderItem[];
  posts: FarmerBlogPost[];
  followerCount: number;
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
        followerCount={followerCount}
        createdAt={farmer.created_at}
        actions={
          <ShareProfileButton
            farmerId={farmer.id}
            farmName={farmer.farm_name}
          />
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
  followerCount,
  isFollowing,
  isAuthenticated,
}: {
  farmer: {
    id: string;
    farm_name: string;
    description: string | null;
    location_text: string | null;
    verified_at: string | null;
    avatar_url: string | null;
    productCount: number;
    created_at: string;
  };
  initialTab?: PublicFarmerProfileTab;
  products: ProductListItem[];
  posts: FarmerBlogPost[];
  followerCount: number;
  isFollowing: boolean;
  isAuthenticated: boolean;
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
        followerCount={followerCount}
        createdAt={farmer.created_at}
        actions={
          <>
            <FollowButton
              farmerId={farmer.id}
              initialFollowing={isFollowing}
              isAuthenticated={isAuthenticated}
            />
            <ShareProfileButton
              farmerId={farmer.id}
              farmName={farmer.farm_name}
            />
          </>
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
