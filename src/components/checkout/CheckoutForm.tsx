"use client";

import { useRouter } from "next/navigation";
import {
  startTransition,
  useActionState,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { placeOrder, type PlaceOrderState } from "@/lib/checkout/actions";
import { DELIVERY_FEE, RECEIPT_MAX_LABEL } from "@/lib/checkout/constants";
import { uploadReceipt, validateReceiptFile } from "@/lib/checkout/upload-receipt";
import {
  AZ_PHONE_FORMAT_ERROR,
  isValidAzPhone,
  normalizeAzPhone,
} from "@/lib/phone/az";
import { formatPrice, formatUnit } from "@/lib/shop/format";
import type { CartLineItem } from "@/lib/cart/queries";
import { AzPhoneInput } from "@/components/ui/AzPhoneInput";
import { FileSelectField } from "@/components/ui/FileSelectField";
import { Spinner } from "@/components/ui/Spinner";
import type { Bank } from "@/types";

const initialState: PlaceOrderState = {};

/** Shows only the first and last groups of a hyphenated PAN, e.g. "1234 •••• •••• 5678". */
function maskPan(pan: string): string {
  const groups = pan.split("-").filter(Boolean);
  if (groups.length < 3) {
    const digits = pan.replace(/\D/g, "");
    if (digits.length <= 8) return pan;
    return `${digits.slice(0, 4)} •••• •••• ${digits.slice(-4)}`;
  }
  return groups
    .map((group, index) =>
      index === 0 || index === groups.length - 1
        ? group
        : "•".repeat(group.length),
    )
    .join(" ");
}

/** Full PAN in groups of four, e.g. "1234 5678 9012 3456". */
function formatPan(pan: string): string {
  const digits = pan.replace(/\D/g, "");
  return digits.match(/.{1,4}/g)?.join(" ") ?? pan;
}

function BankOption({
  bank,
  checked,
  onSelect,
}: {
  bank: Bank;
  checked: boolean;
  onSelect: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);

  async function handleCopy(event: React.MouseEvent) {
    event.preventDefault();
    try {
      await navigator.clipboard.writeText(bank.pan_number.replace(/\D/g, ""));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API unavailable — nothing safe to fall back to.
    }
  }

  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-zinc-200 p-4 transition has-checked:border-emerald-500 has-checked:bg-emerald-50/50">
      <input
        type="radio"
        name="bank_id"
        value={bank.id}
        checked={checked}
        onChange={onSelect}
        className="mt-1 h-4 w-4 border-zinc-300 text-emerald-600 focus:ring-emerald-500"
      />
      <div className="min-w-0 flex-1">
        <div className="font-medium text-zinc-900">{bank.name}</div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="font-mono text-sm tracking-wider text-zinc-700">
            {revealed ? formatPan(bank.pan_number) : maskPan(bank.pan_number)}
          </span>
          <button
            type="button"
            onClick={(event) => {
              // Inside the <label>: keep the click from selecting the bank.
              event.preventDefault();
              setRevealed((value) => !value);
            }}
            aria-pressed={revealed}
            className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-200"
          >
            {revealed ? "Kartı gizlət" : "Kartı göstər"}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-200"
          >
            {copied ? "Kopyalandı ✓" : "Kartı kopyala"}
          </button>
        </div>
      </div>
    </label>
  );
}

const FIELD_ERRORS = {
  phoneMissing: "Telefon nömrəsini daxil edin.",
  address: "Çatdırılma ünvanını daxil edin.",
  bank: "Bank seçin.",
};

export function CheckoutForm({
  banks,
  defaultPhone,
  items,
  userId,
}: {
  banks: Bank[];
  defaultPhone?: string | null;
  items: CartLineItem[];
  userId: string;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(placeOrder, initialState);

  // Every field is held in state and the action is dispatched by hand from
  // onSubmit. Passing the action to <form action> made React reset the form
  // after each failed attempt, wiping everything the customer had typed.
  const [phone, setPhone] = useState(() =>
    isValidAzPhone(defaultPhone ?? "") ? normalizeAzPhone(defaultPhone ?? "") : "",
  );
  const [address, setAddress] = useState("");
  const [bankId, setBankId] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [attempted, setAttempted] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  // An uploaded receipt is reused on retry while the same file stays picked.
  const uploaded = useRef<{ file: File; path: string } | null>(null);
  const contactSectionRef = useRef<HTMLElement>(null);
  const bankSectionRef = useRef<HTMLElement>(null);
  const receiptSectionRef = useRef<HTMLElement>(null);

  const errors = {
    phone: !phone
      ? FIELD_ERRORS.phoneMissing
      : isValidAzPhone(phone)
        ? null
        : AZ_PHONE_FORMAT_ERROR,
    address: address.trim() ? null : FIELD_ERRORS.address,
    bank: bankId ? null : FIELD_ERRORS.bank,
    receipt: validateReceiptFile(receipt),
  };
  // A missing value is only flagged after a submit attempt; a file that is
  // too big or the wrong type is flagged the moment it is picked.
  const receiptError =
    uploadError ?? (receipt || attempted ? errors.receipt : null);
  const busy = uploading || pending;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setAttempted(true);
    setUploadError(null);

    const firstInvalid = errors.phone || errors.address
      ? contactSectionRef
      : errors.bank
        ? bankSectionRef
        : errors.receipt
          ? receiptSectionRef
          : null;
    if (firstInvalid) {
      firstInvalid.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!receipt) return;

    let receiptPath =
      uploaded.current?.file === receipt ? uploaded.current.path : null;
    if (!receiptPath) {
      setUploading(true);
      const result = await uploadReceipt(receipt, userId);
      setUploading(false);
      if ("error" in result) {
        setUploadError(result.error);
        receiptSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
      }
      receiptPath = result.path;
      uploaded.current = { file: receipt, path: receiptPath };
    }

    const formData = new FormData();
    formData.set("contact_phone", phone);
    formData.set("delivery_address_text", address.trim());
    formData.set("bank_id", bankId);
    formData.set("receipt_path", receiptPath);
    startTransition(() => formAction(formData));
  }

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const total = subtotal + (items.length > 0 ? DELIVERY_FEE : 0);

  useEffect(() => {
    if (state.orderId) {
      router.replace(`/orders/${state.orderId}?success=1`);
    }
  }, [state.orderId, router]);

  if (items.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-zinc-200">
        <p className="text-lg font-medium text-zinc-900">Səbətiniz boşdur</p>
        <p className="mt-2 text-sm text-zinc-500">
          Ödənişə keçmək üçün əvvəlcə məhsul əlavə edin.
        </p>
      </div>
    );
  }

  if (banks.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-zinc-200">
        <p className="text-lg font-medium text-zinc-900">Bank siyahısı boşdur</p>
        <p className="mt-2 text-sm text-zinc-500">
          Supabase-də bank məlumatlarını yoxlayın.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="grid gap-8 lg:grid-cols-[1fr_360px]"
    >
      <div className="space-y-6">
        <section
          ref={contactSectionRef}
          className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200"
        >
          <h2 className="text-lg font-semibold text-zinc-900">
            Əlaqə və çatdırılma
          </h2>
          <div className="mt-4 space-y-4">
            <AzPhoneInput
              id="contact_phone"
              name="contact_phone"
              label="Telefon"
              required
              defaultValue={defaultPhone ?? ""}
              onValueChange={setPhone}
              error={attempted ? errors.phone : null}
            />
            <div>
              <label
                htmlFor="delivery_address_text"
                className="block text-sm font-medium text-zinc-700"
              >
                Çatdırılma ünvanı *
              </label>
              <textarea
                id="delivery_address_text"
                name="delivery_address_text"
                rows={3}
                required
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                aria-invalid={attempted && errors.address ? true : undefined}
                placeholder="Küçə, bina, mənzil..."
                className={[
                  "mt-1 w-full rounded-xl border bg-white px-3 py-2.5 text-base text-zinc-900 outline-none focus:ring-2",
                  attempted && errors.address
                    ? "border-rose-300 ring-rose-400"
                    : "border-zinc-200 ring-emerald-500",
                ].join(" ")}
              />
              {attempted && errors.address ? (
                <p className="mt-1.5 text-sm text-rose-600">{errors.address}</p>
              ) : null}
            </div>
          </div>
        </section>

        <section
          ref={bankSectionRef}
          className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200"
        >
          <h2 className="text-lg font-semibold text-zinc-900">Bank köçürməsi</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Aşağıdakı banklardan birinə köçürmə edin və çeki yükləyin.
          </p>
          <div className="mt-4 space-y-3">
            {banks.map((bank) => (
              <BankOption
                key={bank.id}
                bank={bank}
                checked={bankId === bank.id}
                onSelect={() => setBankId(bank.id)}
              />
            ))}
          </div>
          {attempted && errors.bank ? (
            <p className="mt-3 text-sm text-rose-600">{errors.bank}</p>
          ) : null}
        </section>

        <section
          ref={receiptSectionRef}
          className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200"
        >
          <h2 className="text-lg font-semibold text-zinc-900">Ödəniş çeki</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Bank köçürməsinin ekran görüntüsünü və ya PDF çekini yükləyin (max{" "}
            {RECEIPT_MAX_LABEL}).
          </p>
          <div className="mt-4">
            <FileSelectField
              name="receipt"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              error={receiptError}
              onFileChange={(file) => {
                setReceipt(file);
                setUploadError(null);
              }}
            />
          </div>
        </section>
      </div>

      <aside className="h-fit space-y-4">
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
          <h2 className="text-lg font-semibold text-zinc-900">Sifariş xülasəsi</h2>
          <div className="mt-4 space-y-3">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex items-start justify-between gap-3 text-sm"
              >
                <div className="min-w-0">
                  <div className="font-medium text-zinc-900">{item.title}</div>
                  <div className="text-xs text-zinc-500">
                    {item.quantity} × {formatPrice(item.price)}
                    {formatUnit(item.unitType)}
                  </div>
                </div>
                <div className="shrink-0 font-medium text-zinc-900">
                  {formatPrice(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 space-y-2 border-t border-zinc-200 pt-4 text-sm">
            <div className="flex justify-between text-zinc-700">
              <span>Məhsullar</span>
              <span className="font-medium text-zinc-900">
                {formatPrice(subtotal)}
              </span>
            </div>
            <div className="flex justify-between text-zinc-700">
              <span>Çatdırılma</span>
              <span className="font-medium text-zinc-900">
                {formatPrice(DELIVERY_FEE)}
              </span>
            </div>
            <div className="flex justify-between border-t border-zinc-200 pt-3 font-semibold text-zinc-900">
              <span>Cəmi</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          {attempted && Object.values(errors).some(Boolean) ? (
            <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
              Qırmızı ilə qeyd olunmuş xanaları düzəldin.
            </p>
          ) : null}

          {state.error ? (
            <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-rose-200">
              {state.error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={busy}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {busy ? (
              <>
                <Spinner className="h-4 w-4" />
                {uploading ? "Çek yüklənir..." : "Göndərilir..."}
              </>
            ) : (
              "Sifarişi təsdiqlə"
            )}
          </button>
        </div>
      </aside>
    </form>
  );
}
