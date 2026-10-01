import { Spinner } from "@/components/ui/Spinner";
import type { UploadStatus } from "@/lib/files/use-background-uploads";

/** Overlay for a thumbnail whose file is uploading in the background. */
export function UploadStatusBadge({ status }: { status: UploadStatus | undefined }) {
  if (status === "uploading") {
    return (
      <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-white/70 text-[11px] font-medium text-zinc-700">
        <Spinner className="h-4 w-4" />
        Yüklənir
      </span>
    );
  }
  if (status === "done") {
    return (
      <span
        className="absolute bottom-1 left-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[11px] font-bold text-white ring-2 ring-white"
        aria-label="Yükləndi"
        title="Yükləndi"
      >
        ✓
      </span>
    );
  }
  if (status === "error") {
    return (
      <span
        className="absolute bottom-1 left-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[11px] font-bold text-white ring-2 ring-white"
        aria-label="Yüklənmədi — yadda saxlayanda yenidən cəhd ediləcək"
        title="Yüklənmədi — yadda saxlayanda yenidən cəhd ediləcək"
      >
        !
      </span>
    );
  }
  return null;
}
