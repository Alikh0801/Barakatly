"use client";

import { startTransition, useActionState, useState, type FormEvent } from "react";
import {
  addFarmerCertificate,
  deleteFarmerCertificate,
} from "@/lib/farmer/actions";
import { formatDate } from "@/lib/format/date";
import { uploadProfileFile } from "@/lib/farmer/upload-profile-file";
import { validateCertificateFile } from "@/lib/farmer/profile-files";
import { FileSelectField } from "@/components/ui/FileSelectField";
import { Spinner } from "@/components/ui/Spinner";
import type { FarmerCertificate } from "@/types";

type ActionResult = { error?: string; success?: string };
const initialState: ActionResult = {};

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true" className={className}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" strokeLinejoin="round" />
      <path d="M14 3v5h5M9 13h6M9 17h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CertificateCard({
  certificate,
  footer,
}: {
  certificate: FarmerCertificate;
  footer?: React.ReactNode;
}) {
  return (
    <article className="overflow-hidden rounded-2xl bg-white ring-1 ring-zinc-200/70">
      <a
        href={certificate.file_url}
        target="_blank"
        rel="noreferrer"
        data-static-hover
        className="block"
        aria-label={`${certificate.title} — faylı aç`}
      >
        <div className="flex aspect-[4/3] items-center justify-center bg-[#f1f3ee]">
          {certificate.file_type === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={certificate.file_url}
              alt=""
              loading="lazy"
              className="h-full w-full object-contain p-2"
            />
          ) : (
            <div className="flex flex-col items-center gap-2 text-[#2f7a3c]">
              <DocumentIcon className="h-12 w-12" />
              <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold ring-1 ring-zinc-200">
                PDF
              </span>
            </div>
          )}
        </div>
      </a>
      <div className="p-4">
        <h3 className="break-words text-[15px] font-semibold text-zinc-900">
          {certificate.title}
        </h3>
        <p className="mt-1 text-xs text-zinc-500">
          Əlavə edilib: {formatDate(certificate.created_at)}
        </p>
        {footer}
      </div>
    </article>
  );
}

function EmptyCertificates({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-white px-6 py-12 text-center ring-1 ring-zinc-200/70">
      <DocumentIcon className="mx-auto h-10 w-10 text-zinc-300" />
      <p className="mt-3 text-base font-semibold text-zinc-900">{title}</p>
      <p className="mt-1 text-sm text-zinc-500">{body}</p>
    </div>
  );
}

const GRID = "grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

/** Read-only list on the public profile. */
export function CertificateGrid({ certificates }: { certificates: FarmerCertificate[] }) {
  if (certificates.length === 0) {
    return (
      <EmptyCertificates
        title="Sertifikat əlavə olunmayıb"
        body="Bu fermer hələ heç bir sertifikat paylaşmayıb."
      />
    );
  }
  return (
    <div className={GRID}>
      {certificates.map((certificate) => (
        <CertificateCard key={certificate.id} certificate={certificate} />
      ))}
    </div>
  );
}

function DeleteCertificateButton({ id }: { id: string }) {
  const [state, action, pending] = useActionState(deleteFarmerCertificate, initialState);
  return (
    <form
      action={action}
      className="mt-3"
      onSubmit={(event) => {
        if (!window.confirm("Bu sertifikatı silmək istəyirsiniz?")) event.preventDefault();
      }}
    >
      <input type="hidden" name="certificate_id" value={id} />
      <button
        type="submit"
        disabled={pending}
        className="text-sm font-medium text-rose-700 hover:underline disabled:opacity-70"
      >
        {pending ? "Silinir..." : "Sil"}
      </button>
      {state.error ? <p className="mt-1 text-xs text-rose-600">{state.error}</p> : null}
    </form>
  );
}

function AddCertificateForm({ userId }: { userId: string }) {
  const [state, action, pending] = useActionState(addFarmerCertificate, initialState);
  const [uploading, setUploading] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [lastSuccess, setLastSuccess] = useState(state.success);
  const busy = uploading || pending;

  // Clear the form after a certificate is added; errors keep what was typed.
  if (state.success !== lastSuccess) {
    setLastSuccess(state.success);
    if (state.success) setFormKey((key) => key + 1);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const file = formData.get("file");
    formData.delete("file");
    setFileError(null);

    if (!(file instanceof File) || file.size === 0) {
      setFileError("Sertifikat faylını seçin.");
      return;
    }

    setUploading(true);
    const uploaded = await uploadProfileFile(file, userId, "certificates");
    setUploading(false);
    if ("error" in uploaded) {
      setFileError(uploaded.error);
      return;
    }

    formData.set("file_path", uploaded.path);
    startTransition(() => action(formData));
  }

  return (
    <form
      key={formKey}
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-zinc-200/70 sm:p-6"
    >
      <div>
        <h3 className="text-base font-semibold text-zinc-900">Yeni sertifikat</h3>
        <p className="mt-1 text-sm text-zinc-500">
          Orqanik, keyfiyyət və ya digər sertifikatlarınızı əlavə edin. Profilinizə daxil olan hər kəs görə biləcək.
        </p>
      </div>
      {state.error ? (
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{state.success}</p>
      ) : null}
      <label className="block space-y-1.5">
        <span className="text-sm font-medium text-zinc-700">Sertifikatın adı</span>
        <input
          name="title"
          required
          maxLength={120}
          placeholder="məs. Orqanik məhsul sertifikatı"
          className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-base text-zinc-900 sm:text-sm"
        />
      </label>
      <FileSelectField
        name="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        caption="Fayl"
        hint="Şəkil (JPEG, PNG, WebP) və ya PDF, maksimum 10 MB."
        error={fileError}
        onFileChange={(file) => setFileError(file ? validateCertificateFile(file) : null)}
      />
      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-full bg-[#2f7a3c] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#276833] disabled:opacity-70"
      >
        {busy ? <Spinner className="h-3.5 w-3.5" /> : null}
        {uploading ? "Fayl yüklənir..." : "Əlavə et"}
      </button>
    </form>
  );
}

/** The farmer's own panel: add new certificates and remove old ones. */
export function CertificateManager({
  userId,
  certificates,
}: {
  userId: string;
  certificates: FarmerCertificate[];
}) {
  return (
    <div className="space-y-5">
      <AddCertificateForm userId={userId} />
      {certificates.length === 0 ? (
        <EmptyCertificates
          title="Hələ sertifikat əlavə etməmisiniz"
          body="Əlavə etdiyiniz sertifikatlar profilinizdə burada görünəcək."
        />
      ) : (
        <div className={GRID}>
          {certificates.map((certificate) => (
            <CertificateCard
              key={certificate.id}
              certificate={certificate}
              footer={<DeleteCertificateButton id={certificate.id} />}
            />
          ))}
        </div>
      )}
    </div>
  );
}
