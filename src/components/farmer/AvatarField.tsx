"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { Syne } from "next/font/google";

const displayFont = Syne({
  subsets: ["latin"],
  weight: ["600", "700"],
});

type CropMode = "crop" | "center";

const PREVIEW_SIZE = 240;
const OUTPUT_SIZE = 512;
const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

function FarmerAvatarPreview({
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

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Şəkil yüklənmədi."));
    image.src = src;
  });
}

function coverBaseScale(image: HTMLImageElement, size: number) {
  return Math.max(size / image.naturalWidth, size / image.naturalHeight);
}

async function exportAvatarBlob(
  image: HTMLImageElement,
  zoom: number,
  offsetX: number,
  offsetY: number
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas dəstəklənmir.");

  const scale = coverBaseScale(image, OUTPUT_SIZE) * zoom;
  const drawW = image.naturalWidth * scale;
  const drawH = image.naturalHeight * scale;
  const dx = OUTPUT_SIZE / 2 + offsetX * (OUTPUT_SIZE / PREVIEW_SIZE) - drawW / 2;
  const dy = OUTPUT_SIZE / 2 + offsetY * (OUTPUT_SIZE / PREVIEW_SIZE) - drawH / 2;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  ctx.drawImage(image, dx, dy, drawW, drawH);

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.92);
  });
  if (!blob) throw new Error("Şəkil hazırlanmadı.");
  return blob;
}

export function AvatarField({
  farmName,
  initialUrl,
}: {
  farmName: string;
  initialUrl: string | null;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pickInputRef = useRef<HTMLInputElement>(null);
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(
    null
  );
  const previewObjectUrlRef = useRef<string | null>(null);

  const [displayUrl, setDisplayUrl] = useState<string | null>(initialUrl);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [sourceName, setSourceName] = useState("avatar.jpg");
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [mode, setMode] = useState<CropMode>("center");
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [editorError, setEditorError] = useState<string | null>(null);

  function setPreviewUrl(next: string | null) {
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
      previewObjectUrlRef.current = null;
    }
    if (next && next.startsWith("blob:")) {
      previewObjectUrlRef.current = next;
    }
    setDisplayUrl(next);
  }

  useEffect(() => {
    if (!sourceUrl) {
      setImage(null);
      return;
    }
    let cancelled = false;
    loadImage(sourceUrl)
      .then((loaded) => {
        if (!cancelled) {
          setImage(loaded);
          setEditorError(null);
        }
      })
      .catch(() => {
        if (!cancelled) setEditorError("Şəkil oxunmadı. Başqa fayl seçin.");
      });
    return () => {
      cancelled = true;
    };
  }, [sourceUrl]);

  useEffect(() => {
    if (!image || !fileInputRef.current) return;
    let cancelled = false;

    const ox = mode === "center" ? 0 : offset.x;
    const oy = mode === "center" ? 0 : offset.y;

    exportAvatarBlob(image, zoom, ox, oy)
      .then((blob) => {
        if (cancelled || !fileInputRef.current) return;
        const file = new File([blob], sourceName.replace(/\.\w+$/, ".jpg"), {
          type: "image/jpeg",
        });
        const transfer = new DataTransfer();
        transfer.items.add(file);
        fileInputRef.current.files = transfer.files;
        setPreviewUrl(URL.createObjectURL(blob));
      })
      .catch(() => {
        if (!cancelled) setEditorError("Şəkil kəsilmədi.");
      });

    return () => {
      cancelled = true;
    };
  }, [image, zoom, offset.x, offset.y, mode, sourceName]);

  useEffect(() => {
    return () => {
      if (sourceUrl) URL.revokeObjectURL(sourceUrl);
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
      }
    };
  }, [sourceUrl]);

  function clearFileInput() {
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function startReplace() {
    pickInputRef.current?.click();
  }

  function removePhoto() {
    setRemoveAvatar(true);
    setPreviewUrl(null);
    setSourceUrl(null);
    setImage(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setMode("center");
    clearFileInput();
    if (pickInputRef.current) pickInputRef.current.value = "";
  }

  function cancelEditor() {
    setSourceUrl(null);
    setImage(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setMode("center");
    setEditorError(null);
    clearFileInput();
    if (pickInputRef.current) pickInputRef.current.value = "";
    if (!removeAvatar) {
      setPreviewUrl(initialUrl);
    }
  }

  function onPickFile(file: File | undefined) {
    if (!file) return;
    setRemoveAvatar(false);
    setSourceName(file.name || "avatar.jpg");
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setMode("center");
    setSourceUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(file);
    });
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (mode !== "crop") return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      x: event.clientX,
      y: event.clientY,
      ox: offset.x,
      oy: offset.y,
    };
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (mode !== "crop" || !dragRef.current) return;
    const dx = event.clientX - dragRef.current.x;
    const dy = event.clientY - dragRef.current.y;
    setOffset({
      x: dragRef.current.ox + dx,
      y: dragRef.current.oy + dy,
    });
  }

  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    if (dragRef.current) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragRef.current = null;
  }

  const previewOffset = mode === "center" ? { x: 0, y: 0 } : offset;
  const previewScale = image
    ? coverBaseScale(image, PREVIEW_SIZE) * zoom
    : 1;
  const canRemove = Boolean(displayUrl || (initialUrl && !removeAvatar));

  return (
    <div className="space-y-4">
      <input type="hidden" name="remove_avatar" value={removeAvatar ? "1" : "0"} />
      <input
        ref={fileInputRef}
        type="file"
        name="avatar"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
      />
      <input
        ref={pickInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        onChange={(event) => {
          onPickFile(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <FarmerAvatarPreview
          name={farmName}
          url={displayUrl}
          className="h-20 w-20 text-2xl ring-2 ring-zinc-100"
        />
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-medium text-zinc-700">Profil şəkli</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={startReplace}
              className="inline-flex rounded-full bg-[#1f5c3d] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#184a31]"
            >
              {displayUrl || sourceUrl ? "Yenilə" : "Əlavə et"}
            </button>
            {canRemove ? (
              <button
                type="button"
                onClick={removePhoto}
                className="inline-flex rounded-full px-4 py-2 text-sm font-semibold text-rose-700 ring-1 ring-rose-200 transition hover:bg-rose-50"
              >
                Sil
              </button>
            ) : null}
          </div>
          <p className="text-xs text-zinc-500">JPEG, PNG və ya WebP</p>
        </div>
      </div>

      {sourceUrl && image ? (
        <div className="rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3
              className={`${displayFont.className} text-base font-bold text-zinc-900`}
            >
              Şəkli düzəlt
            </h3>
            <div className="inline-flex rounded-full bg-white p-1 ring-1 ring-zinc-200">
              <button
                type="button"
                onClick={() => {
                  setMode("crop");
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  mode === "crop"
                    ? "bg-[#1f5c3d] text-white"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Kəs
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("center");
                  setOffset({ x: 0, y: 0 });
                }}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  mode === "center"
                    ? "bg-[#1f5c3d] text-white"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                Mərkəzləşdir
              </button>
            </div>
          </div>

          <p className="mt-2 text-xs text-zinc-500">
            {mode === "crop"
              ? "Şəkli sürükləyib kəsə bilərsiniz. Zoom ilə böyüdün."
              : "Şəkil avtomatik mərkəzə yerləşdirilir. Zoom ilə yaxınlaşdırın."}
          </p>

          <div className="mt-4 flex flex-col items-center gap-4">
            <div
              className={`relative overflow-hidden rounded-full bg-zinc-200 shadow-sm ring-2 ring-white ${
                mode === "crop"
                  ? "cursor-grab active:cursor-grabbing"
                  : "cursor-default"
              }`}
              style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={sourceUrl}
                alt=""
                draggable={false}
                className="pointer-events-none absolute left-1/2 top-1/2 max-w-none select-none"
                style={{
                  width: image.naturalWidth * previewScale,
                  height: image.naturalHeight * previewScale,
                  transform: `translate(calc(-50% + ${previewOffset.x}px), calc(-50% + ${previewOffset.y}px))`,
                }}
              />
            </div>

            <label className="flex w-full max-w-xs items-center gap-3 text-sm text-zinc-700">
              <span className="w-12 shrink-0 font-medium">Zoom</span>
              <input
                type="range"
                min={MIN_ZOOM}
                max={MAX_ZOOM}
                step={0.05}
                value={zoom}
                onChange={(event) => setZoom(Number(event.target.value))}
                className="w-full accent-[#1f5c3d]"
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setZoom(1);
                  setOffset({ x: 0, y: 0 });
                  setMode("center");
                }}
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200 hover:bg-white"
              >
                Sıfırla
              </button>
              <button
                type="button"
                onClick={cancelEditor}
                className="rounded-full px-3 py-1.5 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200 hover:bg-white"
              >
                Ləğv et
              </button>
            </div>
          </div>

          {editorError ? (
            <p className="mt-3 text-sm text-rose-700">{editorError}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
