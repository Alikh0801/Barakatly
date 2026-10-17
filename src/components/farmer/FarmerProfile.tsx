"use client";

import Link from "next/link";
import { Syne } from "next/font/google";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
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
import {
  FarmerOrdersList,
  FarmerProductsList,
  RegionSelect,
} from "@/components/farmer/FarmerPanels";
import { AvatarField } from "@/components/farmer/AvatarField";
import { CoverField } from "@/components/farmer/CoverField";
import {
  CertificateGrid,
  CertificateManager,
} from "@/components/farmer/FarmerCertificates";
import {
  FarmerProfileHeader,
  FarmerProfileTabs,
  memberSinceLabel,
  type FarmerProfileStats,
} from "@/components/farmer/FarmerProfileHeader";
import {
  FarmerStatsDashboard,
  type FarmerProductCounts,
} from "@/components/farmer/FarmerStatsDashboard";
import { ProductCard } from "@/components/shop/ProductCard";
import type {
  FarmerBlogPost,
  FarmerOrderItem,
  FarmerProduct,
} from "@/lib/farmer/queries";
import type { ProductListItem } from "@/types/shop";
import type { Farmer, FarmerCertificate, Profile } from "@/types";
import type { FarmerRatingSummary, PublicFarmer } from "@/lib/farmers/queries";
import type { FarmerSalesStats } from "@/lib/farmer/stats";
import { formatDateTime } from "@/lib/format/date";
import { validateFarmerMedia } from "@/lib/farmer/media-upload";
import { uploadPostMediaFile } from "@/lib/farmer/upload-post-media";
import { useBackgroundUploads } from "@/lib/files/use-background-uploads";
import {
  FileReviewDialog,
  releaseReviewItems,
  toReviewItems,
  type ReviewItem,
} from "@/components/ui/FileReviewDialog";
import { UploadStatusBadge } from "@/components/ui/UploadStatusBadge";
import { addFilesWithinLimit, limitExceededMessage } from "@/lib/files/select-limit";

const MAX_POST_MEDIA = 5;

const displayFont = Syne({
  subsets: ["latin"],
  weight: ["600", "700"],
});

type ActionResult = { error?: string; success?: string };
const initialState: ActionResult = {};

export type FarmerProfileTab = "stats" | "posts" | "products" | "orders" | "certificates" | "about";
export type PublicFarmerProfileTab = "products" | "posts" | "about" | "certificates";

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
      className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-5 text-[15px] font-semibold text-zinc-800 ring-1 ring-zinc-300 transition hover:bg-zinc-50"
    >
      {copied ? (
        "Link kopyalandı"
      ) : (
        <>
          <ShareIcon className="h-4 w-4" />
          Paylaş
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
        className="inline-flex h-11 items-center gap-2 rounded-full bg-[#2f7a3c] px-6 text-[15px] font-semibold text-white shadow-[0_8px_20px_-10px_rgba(31,77,44,0.7)] transition hover:bg-[#276833]"
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
              ? "group inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-[15px] font-semibold text-[#2f7a3c] ring-[1.5px] ring-[#2f7a3c] transition hover:bg-rose-50 hover:text-rose-700 hover:ring-rose-300 disabled:opacity-70"
              : "inline-flex h-11 items-center gap-2 rounded-full bg-[#2f7a3c] px-6 text-[15px] font-semibold text-white shadow-[0_8px_20px_-10px_rgba(31,77,44,0.7)] transition hover:bg-[#276833] disabled:opacity-70"
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
  const [coverBusy, setCoverBusy] = useState(false);

  return (
    <form
      action={action}
      className="space-y-5 rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-zinc-200 sm:p-6"
    >
      <h2 className={`${displayFont.className} text-xl font-bold text-zinc-900`}>
        Profili redaktə et
      </h2>
      {farmer.pending_submitted_at ? (
        <p className="rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
          {formatDateTime(farmer.pending_submitted_at)} tarixində göndərdiyiniz
          dəyişikliklər admin təsdiqini gözləyir. Təsdiqlənənə qədər profiliniz
          köhnə məlumatlarla göstərilir.
        </p>
      ) : null}
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

      {/* Remounted after each save so a sent cover is not sent again. */}
      <CoverField
        key={state.success ?? "cover"}
        userId={profile.id}
        initialUrl={farmer.cover_url}
        onBusyChange={setCoverBusy}
      />

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
        disabled={pending || coverBusy}
        className="inline-flex items-center gap-2 rounded-full bg-[#2f7a3c] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#276833] disabled:opacity-70"
      >
        {pending ? <Spinner className="h-3.5 w-3.5" /> : null}
        Yadda saxla
      </button>
    </form>
  );
}

type ComposerPreview = {
  file: File;
  url: string;
  kind: "image" | "video";
  name: string;
};

function BlogComposer({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState(
    createFarmerBlogPost,
    initialState
  );
  const [previews, setPreviews] = useState<ComposerPreview[]>([]);
  const [caption, setCaption] = useState("");
  const [lastSuccess, setLastSuccess] = useState(state.success);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [mediaLimitNotice, setMediaLimitNotice] = useState<string | null>(null);
  // Freshly picked files wait here for review in FileReviewDialog; nothing
  // is uploaded before the farmer confirms them.
  const [pendingReview, setPendingReview] = useState<ReviewItem[] | null>(null);
  const [waitingForUploads, setWaitingForUploads] = useState(false);
  const uploads = useBackgroundUploads((file) => uploadPostMediaFile(file, userId));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const liveUrlsRef = useRef<string[]>([]);
  const busy = waitingForUploads || pending;
  const doneCount = uploads.doneCount(previews.map((preview) => preview.file));

  // The action is dispatched by hand, so React no longer resets the form —
  // which also means clearing it after a successful post is up to us.
  if (state.success !== lastSuccess) {
    setLastSuccess(state.success);
    if (state.success) {
      if (previews.length > 0) setPreviews([]);
      setCaption("");
    }
  }

  // Single owner of object-URL lifetime: anything that dropped out of the
  // preview list since the last render gets revoked here.
  useEffect(() => {
    const current = previews.map((preview) => preview.url);
    for (const url of liveUrlsRef.current) {
      if (!current.includes(url)) URL.revokeObjectURL(url);
    }
    liveUrlsRef.current = current;

    if (current.length === 0 && fileInputRef.current?.value) {
      fileInputRef.current.value = "";
    }
  }, [previews]);

  useEffect(() => {
    return () => {
      for (const url of liveUrlsRef.current) URL.revokeObjectURL(url);
      liveUrlsRef.current = [];
    };
  }, []);

  function syncFiles(next: File[]) {
    const limited = next.slice(0, MAX_POST_MEDIA);
    const nextPreviews = limited.map((file) => {
      const existing = previews.find((preview) => preview.file === file);
      if (existing) return existing;
      return {
        file,
        url: URL.createObjectURL(file),
        kind: file.type.startsWith("video/")
          ? ("video" as const)
          : ("image" as const),
        name: file.name,
      };
    });
    setPreviews(nextPreviews);

    if (!fileInputRef.current) return;
    const transfer = new DataTransfer();
    limited.forEach((file) => transfer.items.add(file));
    fileInputRef.current.files = transfer.files;
  }

  function confirmReview(confirmed: File[]) {
    syncFiles([...previews.map((preview) => preview.file), ...confirmed]);
    // Upload right away, in the background, while the caption is written.
    confirmed.forEach((file) => void uploads.start(file));
    releaseReviewItems(pendingReview);
    setPendingReview(null);
  }

  function cancelReview() {
    // The picker left the cancelled files in the input; put back the
    // confirmed selection.
    syncFiles(previews.map((preview) => preview.file));
    releaseReviewItems(pendingReview);
    setPendingReview(null);
  }

  function removeFile(index: number) {
    syncFiles(
      previews.filter((_, i) => i !== index).map((preview) => preview.file)
    );
    // The notice named files that did not fit; with room freed it is stale.
    setMediaLimitNotice(null);
  }

  // Media goes browser → Storage first; the action only gets the paths.
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || previews.length === 0) return;
    setMediaError(null);

    // Usually already done: uploads start when the files are confirmed.
    setWaitingForUploads(true);
    const result = await uploads.finishAll(previews.map((preview) => preview.file));
    setWaitingForUploads(false);

    if ("error" in result) {
      setMediaError(result.error);
      return;
    }

    const formData = new FormData();
    formData.set("caption", caption);
    result.paths.forEach((path) => formData.append("media_paths", path));
    startTransition(() => action(formData));
  }

  return (
    <form
      onSubmit={handleSubmit}
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
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          placeholder="Bu gün təsərrüfatda nələr baş verir?"
          className="w-full resize-none border-0 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
        />

        {previews.length > 0 ? (
          <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
            {previews.map((preview, index) => (
              <figure key={`${preview.name}-${index}`} className="w-24 shrink-0">
              <div className="relative h-24 w-24 overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-zinc-200">
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
                <UploadStatusBadge status={uploads.statusOf(preview.file)} />
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/65 text-xs font-bold text-white"
                  aria-label={`${preview.name} sil`}
                >
                  ×
                </button>
              </div>
              <figcaption
                className="mt-1 truncate text-[11px] text-zinc-500"
                title={preview.name}
              >
                {preview.name}
              </figcaption>
              </figure>
            ))}
          </div>
        ) : null}
        {mediaLimitNotice ? (
          <p
            role="alert"
            className="mb-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200"
          >
            {mediaLimitNotice}
          </p>
        ) : null}
        {mediaError ? (
          <p role="alert" className="mb-2 text-sm text-rose-600">
            {mediaError}
          </p>
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
            required={previews.length === 0}
            className="sr-only"
            onChange={(event) => {
              const selected = event.target.files
                ? Array.from(event.target.files)
                : [];
              // Refuse oversized or unsupported files at pick time, with the
              // file name and reason, instead of after a failed upload.
              const invalid = selected
                .map((file) => ({ file, error: validateFarmerMedia(file) }))
                .filter((entry) => entry.error);
              setMediaError(
                invalid.length > 0
                  ? invalid.map((entry) => `${entry.file.name}: ${entry.error}`).join(" ")
                  : null,
              );
              // Files already picked are never displaced: new ones only fill
              // the free slots, and any that do not fit are named.
              const current = previews.map((preview) => preview.file);
              const { files, rejected } = addFilesWithinLimit(
                current,
                selected.filter((file) => !validateFarmerMedia(file)),
                MAX_POST_MEDIA,
              );
              setMediaLimitNotice(
                rejected.length > 0
                  ? limitExceededMessage(MAX_POST_MEDIA, "fayl", rejected)
                  : null,
              );
              // Review first, upload after confirmation.
              const fresh = files.slice(current.length);
              if (fresh.length > 0) setPendingReview(toReviewItems(fresh));
              else syncFiles(current);
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={previews.length >= MAX_POST_MEDIA}
            className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold text-[#1f5c3d] transition hover:bg-[#f3faf6] disabled:cursor-not-allowed disabled:opacity-50"
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
            Əlavə et ({previews.length}/{MAX_POST_MEDIA})
          </button>
          {pendingReview ? (
            <FileReviewDialog
              items={pendingReview}
              title="Seçilmiş fayllar"
              notice={mediaLimitNotice}
              onConfirm={confirmReview}
              onCancel={cancelReview}
            />
          ) : null}
          <span className="hidden text-xs text-zinc-400 sm:inline">
            Şəkil və ya video · max 5 · hər biri 50 MB-a qədər
          </span>
        </div>

        <button
          type="submit"
          disabled={busy || previews.length === 0}
          className="inline-flex items-center gap-2 rounded-full bg-[#1f5c3d] px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {busy ? <Spinner className="h-3.5 w-3.5" /> : null}
          {waitingForUploads ? `Yüklənir ${doneCount}/${previews.length}` : "Paylaş"}
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
      <div className="rounded-2xl bg-white px-6 py-12 text-center ring-1 ring-zinc-200/70">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className="mx-auto h-10 w-10 text-zinc-300">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5-9 9" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="mt-3 text-base font-semibold text-zinc-900">
          {canManage ? "Hələ paylaşım etməmisiniz" : "Hələ paylaşım yoxdur"}
        </p>
        <p className="mt-1 text-sm text-zinc-500">
          {canManage
            ? "Təsərrüfatdan ilk şəkil və ya videonu paylaşın."
            : "Bu fermer hələ heç bir paylaşım etməyib. Yeni paylaşımlar burada görünəcək."}
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

function useTabInUrl<T extends string>(initialTab: T) {
  const [tab, setTab] = useState<T>(initialTab);

  function selectTab(next: T) {
    setTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.replaceState(null, "", url.pathname + "?" + url.searchParams.toString());
  }

  return [tab, selectTab] as const;
}

export function FarmerProfileDashboard({
  farmer,
  profile,
  initialTab = "stats",
  products,
  orders,
  posts,
  followerCount,
  rating,
  certificates,
  sales,
  productCounts,
}: {
  farmer: Farmer;
  profile: Profile;
  initialTab?: FarmerProfileTab;
  products: FarmerProduct[];
  orders: FarmerOrderItem[];
  posts: FarmerBlogPost[];
  followerCount: number;
  rating: FarmerRatingSummary;
  certificates: FarmerCertificate[];
  sales: FarmerSalesStats;
  productCounts: FarmerProductCounts;
}) {
  const [tab, selectTab] = useTabInUrl<FarmerProfileTab>(initialTab);

  const tabs: { id: FarmerProfileTab; label: string }[] = [
    { id: "stats", label: "Statistika" },
    { id: "posts", label: "Paylaşımlar" },
    { id: "products", label: "Məhsullar" },
    { id: "orders", label: "Sifarişlər" },
    { id: "certificates", label: "Sertifikatlar" },
    { id: "about", label: "Redaktə" },
  ];

  const stats: FarmerProfileStats = {
    rating,
    productCount: products.filter((p) => p.status === "approved").length,
    postCount: posts.length,
    followerCount,
  };

  return (
    <div className="pb-16">
      <FarmerProfileHeader
        farmName={farmer.farm_name}
        avatarUrl={farmer.avatar_url}
        coverUrl={farmer.cover_url}
        locationText={farmer.location_text}
        verified={Boolean(farmer.verified_at)}
        stats={stats}
        coverHint={
          <button
            type="button"
            onClick={() => selectTab("about")}
            className="mt-1 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold text-white ring-1 ring-white/25 hover:bg-white/25"
          >
            Arxa plan şəkli əlavə et
          </button>
        }
        actions={
          <>
            <Link
              href={`/farmers/${farmer.id}`}
              className="inline-flex h-11 items-center rounded-full bg-white px-5 text-[15px] font-semibold text-zinc-800 ring-1 ring-zinc-300 transition hover:bg-zinc-50"
            >
              Profilə bax
            </Link>
            <ShareProfileButton farmerId={farmer.id} farmName={farmer.farm_name} />
          </>
        }
      />

      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <FarmerProfileTabs
          tabs={tabs}
          active={tab}
          onChange={(id) => selectTab(id as FarmerProfileTab)}
        />

        <div className="mt-6">
          <div className={tab === "stats" ? "block" : "hidden"}>
            <FarmerStatsDashboard
              sales={sales}
              rating={rating}
              products={productCounts}
              orders={orders}
              onViewOrders={() => selectTab("orders")}
            />
          </div>

          <div className={tab === "posts" ? "max-w-3xl space-y-5" : "hidden"}>
            <BlogComposer userId={profile.id} />
            <FarmerBlogFeed posts={posts} canManage />
          </div>

          <div className={tab === "products" ? "space-y-4" : "hidden"}>
            <div className="flex justify-end">
              <Link
                href="/farmer/products/new"
                className="inline-flex rounded-full bg-[#2f7a3c] px-4 py-2 text-sm font-semibold text-white hover:bg-[#276833]"
              >
                Yeni məhsul
              </Link>
            </div>
            <FarmerProductsList products={products} />
          </div>

          <div className={tab === "orders" ? "block" : "hidden"}>
            <FarmerOrdersList items={orders} />
          </div>

          <div className={tab === "certificates" ? "block" : "hidden"}>
            <CertificateManager userId={profile.id} certificates={certificates} />
          </div>

          <div className={tab === "about" ? "max-w-3xl" : "hidden"}>
            <ProfileAboutForm farmer={farmer} profile={profile} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PublicFarmerProfile({
  farmer,
  initialTab = "products",
  products,
  posts,
  followerCount,
  isFollowing,
  isAuthenticated,
  isOwner = false,
  rating,
  certificates,
}: {
  farmer: PublicFarmer;
  initialTab?: PublicFarmerProfileTab;
  products: ProductListItem[];
  posts: FarmerBlogPost[];
  followerCount: number;
  isFollowing: boolean;
  isAuthenticated: boolean;
  /** The farmer viewing their own page: no follow button, a link to the panel instead. */
  isOwner?: boolean;
  rating: FarmerRatingSummary;
  certificates: FarmerCertificate[];
}) {
  const [tab, selectTab] = useTabInUrl<PublicFarmerProfileTab>(initialTab);

  const tabs: { id: PublicFarmerProfileTab; label: string }[] = [
    { id: "products", label: "Məhsullar" },
    { id: "posts", label: "Paylaşımlar" },
    { id: "about", label: "Haqqında" },
    { id: "certificates", label: "Sertifikatlar" },
  ];

  const stats: FarmerProfileStats = {
    rating,
    productCount: farmer.productCount,
    postCount: posts.length,
    followerCount,
  };

  return (
    <div className="pb-16">
      <FarmerProfileHeader
        farmName={farmer.farm_name}
        avatarUrl={farmer.avatar_url}
        coverUrl={farmer.cover_url}
        locationText={farmer.location_text}
        verified={Boolean(farmer.verified_at)}
        stats={stats}
        actions={
          <>
            {isOwner ? (
              <Link
                href="/farmer"
                className="inline-flex h-11 items-center rounded-full bg-white px-5 text-[15px] font-semibold text-zinc-800 ring-1 ring-zinc-300 transition hover:bg-zinc-50"
              >
                Fermer paneli
              </Link>
            ) : (
              <FollowButton
                farmerId={farmer.id}
                initialFollowing={isFollowing}
                isAuthenticated={isAuthenticated}
              />
            )}
            <ShareProfileButton farmerId={farmer.id} farmName={farmer.farm_name} />
          </>
        }
      />

      <div className="mx-auto w-full max-w-6xl px-4 md:px-6">
        <FarmerProfileTabs
          tabs={tabs}
          active={tab}
          onChange={(id) => selectTab(id as PublicFarmerProfileTab)}
        />

        <div className="mt-6">
          <div className={tab === "products" ? "block" : "hidden"}>
            {products.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl bg-white px-6 py-12 text-center ring-1 ring-zinc-200/70">
                <p className="text-base font-semibold text-zinc-900">Satışda məhsul yoxdur</p>
                <p className="mt-1 text-sm text-zinc-500">
                  Bu fermerin hazırda satışda məhsulu yoxdur.
                </p>
              </div>
            )}
          </div>

          <div className={tab === "posts" ? "max-w-3xl" : "hidden"}>
            <FarmerBlogFeed posts={posts} />
          </div>

          <div className={tab === "about" ? "max-w-3xl" : "hidden"}>
            <div className="rounded-2xl bg-white p-5 ring-1 ring-zinc-200/70 sm:p-7">
              <h2 className="text-xl font-semibold text-zinc-900">Təsərrüfat haqqında</h2>
              {farmer.description ? (
                <p className="mt-3 text-[15px] leading-7 text-zinc-700 sm:text-base">
                  {farmer.description}
                </p>
              ) : (
                <p className="mt-3 text-sm text-zinc-500">
                  Bu təsərrüfat haqqında təsvir hələ əlavə olunmayıb.
                </p>
              )}
              <dl className="mt-6 grid gap-4 sm:grid-cols-3">
                <div>
                  <dt className="text-sm text-zinc-500">Region</dt>
                  <dd className="mt-1 font-semibold text-zinc-900">
                    {farmer.location_text ?? "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-zinc-500">Üzvlük</dt>
                  <dd className="mt-1 font-semibold text-zinc-900">
                    {memberSinceLabel(farmer.created_at)}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm text-zinc-500">Status</dt>
                  <dd className={`mt-1 font-semibold ${farmer.verified_at ? "text-[#23602f]" : "text-zinc-900"}`}>
                    {farmer.verified_at ? "Təsdiqlənmiş fermer" : "Fermer"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className={tab === "certificates" ? "block" : "hidden"}>
            <CertificateGrid certificates={certificates} />
          </div>
        </div>
      </div>
    </div>
  );
}
