"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** A picked file plus the object URL its owner created for the preview. */
export type ReviewItem = { file: File; url: string };

/** Object URLs for freshly picked files; release with releaseReviewItems. */
export function toReviewItems(files: File[]): ReviewItem[] {
  return files.map((file) => ({ file, url: URL.createObjectURL(file) }));
}

export function releaseReviewItems(items: ReviewItem[] | null) {
  items?.forEach((item) => URL.revokeObjectURL(item.url));
}

/**
 * Full-size review of freshly picked files before anything is uploaded.
 * The farmer can step through them, drop any, then confirm — only the
 * confirmed files are handed back. Mounted only while open, so the list
 * starts from `items` each time.
 *
 * The caller creates and releases the object URLs (in its pick and close
 * handlers): created here in a memo and revoked in an effect cleanup, they
 * died in StrictMode's mount → cleanup → mount pass and every preview broke.
 */
export function FileReviewDialog({
  items,
  title,
  notice,
  onConfirm,
  onCancel,
}: {
  items: ReviewItem[];
  title: string;
  /** e.g. the over-limit message, shown above the preview. */
  notice?: string | null;
  onConfirm: (files: File[]) => void;
  onCancel: () => void;
}) {
  const [list, setList] = useState(items);
  const [active, setActive] = useState(0);
  const currentItem = list[Math.min(active, list.length - 1)];
  const current = currentItem?.file;
  const currentUrl = currentItem?.url;

  // Escape cancels; the page behind stays put while the dialog is open.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onCancel();
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [onCancel]);

  function remove(index: number) {
    const next = list.filter((_, i) => i !== index);
    setList(next);
    setActive((value) => Math.max(0, Math.min(value, next.length - 1)));
  }

  const isVideo = current?.type.startsWith("video/");

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="file-review-title"
      className="fixed inset-0 z-[100] flex items-end justify-center overscroll-contain bg-black/70 p-0 sm:items-center sm:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div className="flex max-h-[92dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4">
          <h2 id="file-review-title" className="text-lg font-semibold text-zinc-900">
            {title} ({list.length})
          </h2>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Bağla"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900"
          >
            <svg viewBox="0 0 20 20" fill="none" className="h-5 w-5" aria-hidden="true">
              <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {notice ? (
            <p className="mb-3 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
              {notice}
            </p>
          ) : null}

          {current ? (
            <>
              {/* object-contain: the preview shows the whole picture, never cropped. */}
              <div className="flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl bg-zinc-100">
                {isVideo ? (
                  <video
                    key={currentUrl}
                    src={currentUrl}
                    controls
                    playsInline
                    className="h-full w-full object-contain"
                  />
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentUrl}
                    alt={current.name}
                    className="h-full w-full object-contain"
                  />
                )}
              </div>
              <div className="mt-2 flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-medium text-zinc-800" title={current.name}>
                  {current.name}
                </span>
                <span className="shrink-0 text-zinc-500">{formatSize(current.size)}</span>
              </div>
            </>
          ) : (
            <p className="rounded-2xl bg-zinc-50 px-4 py-10 text-center text-sm text-zinc-500">
              Bütün fayllar çıxarıldı. Ləğv edib yenidən seçə bilərsiniz.
            </p>
          )}

          {list.length > 1 ? (
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {list.map(({ file, url }, index) => (
                <div key={url} className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setActive(index)}
                    aria-label={`${file.name} — bax`}
                    aria-current={file === current}
                    className={[
                      "block h-16 w-16 overflow-hidden rounded-xl bg-zinc-100 ring-2 transition",
                      file === current ? "ring-emerald-500" : "ring-transparent hover:ring-zinc-300",
                    ].join(" ")}
                  >
                    {file.type.startsWith("video/") ? (
                      <video src={url} muted className="h-full w-full object-cover" />
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={url} alt="" className="h-full w-full object-cover" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    aria-label={`${file.name} çıxar`}
                    className="absolute -right-1.5 -top-1.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white ring-2 ring-white"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : current ? (
            <button
              type="button"
              onClick={() => remove(0)}
              className="mt-3 text-sm font-medium text-rose-600 hover:underline"
            >
              Bu faylı çıxar
            </button>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-zinc-100 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-700 ring-1 ring-zinc-200 transition hover:bg-zinc-50"
          >
            Ləğv et
          </button>
          <button
            type="button"
            autoFocus
            disabled={list.length === 0}
            onClick={() => onConfirm(list.map((item) => item.file))}
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Təsdiqlə və yüklə ({list.length})
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
