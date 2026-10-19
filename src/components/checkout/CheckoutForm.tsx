"use client";

import Image from "next/image";
import Link from "next/link";
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
import {
  DELIVERY_FEE,
  DISTRICT_MAX,
  ORDER_NOTE_MAX,
  RECEIPT_MAX_LABEL,
  RECIPIENT_NAME_MAX,
  type SavedAddress,
} from "@/lib/checkout/constants";
import { AZ_REGIONS } from "@/lib/az/regions";
import type { AppliedPromo } from "@/lib/promo/constants";
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
  firstName: "Adı daxil edin.",
  lastName: "Soyadı daxil edin.",
  address: "Küçə, bina və mənzili daxil edin.",
  city: "Şəhəri seçin.",
  phoneMissing: "Telefon nömrəsini daxil edin.",
  bank: "Bank seçin.",
};

type Step = 1 | 2 | 3;

const STEPS: { id: Step; label: string }[] = [
  { id: 1, label: "Çatdırılma" },
  { id: 2, label: "Ödəniş" },
  { id: 3, label: "Təsdiq" },
];

type CheckoutDraft = {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  city?: string;
  district?: string;
  note?: string;
  bankId?: string;
};

const labelClass = "block text-[13px] font-medium text-[#8a4b2b]";
const cardClass = "rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200/80 sm:p-6";
const cardTitleClass = "text-base font-semibold text-zinc-900 sm:text-[17px]";

function inputClass(invalid: boolean) {
  return [
    "mt-1.5 w-full rounded-xl border bg-white px-3.5 py-2.5 text-base text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:ring-2 sm:text-[15px]",
    invalid
      ? "border-rose-300 focus:ring-rose-200"
      : "border-zinc-200 focus:border-emerald-500 focus:ring-emerald-500/20",
  ].join(" ");
}

function FieldError({ message }: { message: string | null | false }) {
  return message ? <p className="mt-1.5 text-sm text-rose-600">{message}</p> : null;
}

function splitName(fullName: string | null | undefined): [string, string] {
  const parts = (fullName ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return ["", ""];
  if (parts.length === 1) return [parts[0], ""];
  return [parts.slice(0, -1).join(" "), parts[parts.length - 1]];
}

function PinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true" className="h-4 w-4 shrink-0">
      <path d="M12 21s-7-7.2-7-12a7 7 0 1 1 14 0c0 4.8-7 12-7 12Z" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  );
}

function ArrowIcon({ back = false }: { back?: boolean }) {
  return (
    <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className="h-4 w-4">
      <path d={back ? "M16 10H4m5-5-5 5 5 5" : "M4 10h12m-5-5 5 5-5 5"} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Stepper({ step, onSelect }: { step: Step; onSelect: (step: Step) => void }) {
  return (
    <ol className="flex items-center">
      {STEPS.map((item, index) => {
        const done = item.id < step;
        const active = item.id === step;
        return (
          <li key={item.id} className={`flex items-center ${index < STEPS.length - 1 ? "flex-1" : ""}`}>
            <button
              type="button"
              // Only finished steps can be revisited from here.
              disabled={!done}
              onClick={() => onSelect(item.id)}
              aria-current={active ? "step" : undefined}
              data-static-hover
              className="flex shrink-0 items-center gap-2 disabled:cursor-default"
            >
              <span
                className={[
                  "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition",
                  done
                    ? "bg-emerald-600 text-white"
                    : active
                      ? "bg-white text-emerald-700 ring-2 ring-emerald-600"
                      : "bg-white text-zinc-400 ring-1 ring-zinc-300",
                ].join(" ")}
              >
                {done ? (
                  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true" className="h-4 w-4">
                    <path d="m5 10.5 3.2 3.2L15 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  item.id
                )}
              </span>
              <span className={`text-sm font-medium ${active || done ? "text-emerald-700" : "text-zinc-400"}`}>
                {item.label}
              </span>
            </button>
            {index < STEPS.length - 1 ? (
              <span className={`mx-3 h-px flex-1 ${done ? "bg-emerald-500" : "bg-zinc-200"}`} aria-hidden="true" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

export function CheckoutForm({
  banks,
  defaultPhone,
  defaultName,
  savedAddresses,
  items,
  userId,
  promo,
}: {
  banks: Bank[];
  defaultPhone?: string | null;
  /** The profile's full name, split into the name fields to start with. */
  defaultName?: string | null;
  savedAddresses: SavedAddress[];
  items: CartLineItem[];
  userId: string;
  /** The code applied in the cart; placeOrder() judges it again. */
  promo: AppliedPromo | null;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(placeOrder, initialState);
  const [step, setStep] = useState<Step>(1);

  // Every field is held in state and the action is dispatched by hand.
  // Passing the action to <form action> made React reset the form after
  // each failed attempt, wiping everything the customer had typed.
  const [initialFirst, initialLast] = splitName(defaultName);
  const [firstName, setFirstName] = useState(initialFirst);
  const [lastName, setLastName] = useState(initialLast);
  const [phone, setPhone] = useState(() =>
    isValidAzPhone(defaultPhone ?? "") ? normalizeAzPhone(defaultPhone ?? "") : "",
  );
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [note, setNote] = useState("");
  const [bankId, setBankId] = useState("");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [attempted, setAttempted] = useState<Record<Step, boolean>>({ 1: false, 2: false, 3: false });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  // AzPhoneInput only reads defaultValue on mount, so a phone set from
  // outside (a restored draft, a saved address) needs it remounted.
  const [phoneKey, setPhoneKey] = useState(0);
  const draftKey = `barakatly:checkout:${userId}`;
  // An uploaded receipt is reused on retry while the same file stays picked.
  const uploaded = useRef<{ file: File; path: string } | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const errors = {
    firstName: firstName.trim() ? null : FIELD_ERRORS.firstName,
    lastName: lastName.trim() ? null : FIELD_ERRORS.lastName,
    address: address.trim() ? null : FIELD_ERRORS.address,
    city: city ? null : FIELD_ERRORS.city,
    phone: !phone ? FIELD_ERRORS.phoneMissing : isValidAzPhone(phone) ? null : AZ_PHONE_FORMAT_ERROR,
    bank: bankId ? null : FIELD_ERRORS.bank,
    receipt: validateReceiptFile(receipt),
  };
  const deliveryValid = !errors.firstName && !errors.lastName && !errors.address && !errors.city && !errors.phone;
  const paymentValid = !errors.bank && !errors.receipt;
  // A missing file is only flagged after trying to continue; one too big
  // or of the wrong type is flagged the moment it is picked.
  const receiptError = uploadError ?? (receipt || attempted[2] ? errors.receipt : null);
  const busy = uploading || pending;
  const show = (s: Step) => attempted[s];

  function goTo(next: Step) {
    setStep(next);
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function continueFrom(current: Step) {
    setAttempted((value) => ({ ...value, [current]: true }));
    const valid = current === 1 ? deliveryValid : paymentValid;
    if (!valid) {
      // The first field with an error, so the customer sees what to fix.
      requestAnimationFrame(() => {
        const field = document.querySelector<HTMLElement>(`[data-step="${current}"] [aria-invalid="true"]`);
        field?.scrollIntoView({ behavior: "smooth", block: "center" });
        field?.focus({ preventScroll: true });
      });
      return;
    }
    goTo((current + 1) as Step);
  }

  function applySavedAddress(saved: SavedAddress) {
    if (saved.firstName) setFirstName(saved.firstName);
    if (saved.lastName) setLastName(saved.lastName);
    if (saved.phone && isValidAzPhone(saved.phone)) {
      setPhone(normalizeAzPhone(saved.phone));
      setPhoneKey((key) => key + 1);
    }
    setCity((AZ_REGIONS as readonly string[]).includes(saved.city) ? saved.city : "");
    setDistrict(saved.district);
    setAddress(saved.address);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (step !== 3) {
      continueFrom(step);
      return;
    }
    setUploadError(null);
    if (!deliveryValid) return goTo(1);
    if (!paymentValid || !receipt) return goTo(2);

    let receiptPath = uploaded.current?.file === receipt ? uploaded.current.path : null;
    if (!receiptPath) {
      setUploading(true);
      const result = await uploadReceipt(receipt, userId);
      setUploading(false);
      if ("error" in result) {
        setUploadError(result.error);
        goTo(2);
        return;
      }
      receiptPath = result.path;
      uploaded.current = { file: receipt, path: receiptPath };
    }

    const formData = new FormData();
    formData.set("first_name", firstName.trim());
    formData.set("last_name", lastName.trim());
    formData.set("contact_phone", phone);
    formData.set("city", city);
    formData.set("district", district.trim());
    formData.set("delivery_address_text", address.trim());
    formData.set("order_note", note.trim());
    formData.set("bank_id", bankId);
    formData.set("receipt_path", receiptPath);
    startTransition(() => formAction(formData));
  }

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const discount = promo && !promo.error ? Math.min(promo.discount, subtotal) : 0;
  const total = subtotal - discount + (items.length > 0 ? DELIVERY_FEE : 0);
  const bank = banks.find((item) => item.id === bankId);

  /* eslint-disable react-hooks/set-state-in-effect -- sessionStorage does not
     exist during SSR, so the draft can only be read once mounted; reading it
     in a lazy initializer would make the server and client markup disagree. */
  // A refresh drops all React state, so what the customer typed is mirrored
  // into sessionStorage and read back here. The receipt File is the one thing
  // that cannot come back: browsers forbid setting a file input's value.
  useEffect(() => {
    let draft: CheckoutDraft | null = null;
    try {
      const raw = sessionStorage.getItem(draftKey);
      if (raw) draft = JSON.parse(raw) as CheckoutDraft;
    } catch {
      // Blocked or corrupt storage — just start with an empty form.
    }
    if (draft) {
      if (draft.firstName) setFirstName(draft.firstName);
      if (draft.lastName) setLastName(draft.lastName);
      if (draft.phone) {
        setPhone(draft.phone);
        setPhoneKey((key) => key + 1);
      }
      if (draft.address) setAddress(draft.address);
      if (draft.city) setCity(draft.city);
      if (draft.district) setDistrict(draft.district);
      if (draft.note) setNote(draft.note);
      if (draft.bankId) setBankId(draft.bankId);
      if (draft.address || draft.city || draft.note || draft.bankId) setDraftRestored(true);
    }
    setDraftLoaded(true);
  }, [draftKey]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Only mirror after the draft was read, otherwise the empty first render
  // would overwrite it.
  useEffect(() => {
    if (!draftLoaded) return;
    try {
      const draft: CheckoutDraft = { firstName, lastName, phone, address, city, district, note, bankId };
      if (Object.values(draft).some(Boolean)) {
        sessionStorage.setItem(draftKey, JSON.stringify(draft));
      } else {
        sessionStorage.removeItem(draftKey);
      }
    } catch {
      // Storage full or blocked — the draft is a convenience, not a must.
    }
  }, [draftLoaded, draftKey, firstName, lastName, phone, address, city, district, note, bankId]);

  useEffect(() => {
    if (!state.orderId) return;
    try {
      sessionStorage.removeItem(draftKey);
    } catch {
      // Nothing to do — the order already went through.
    }
    router.replace(`/orders/${state.orderId}?success=1`);
  }, [state.orderId, router, draftKey]);

  // The text fields come back on their own, but a picked receipt cannot — warn
  // before a reload throws it away.
  useEffect(() => {
    if (!receipt) return;
    function warnBeforeUnload(event: BeforeUnloadEvent) {
      event.preventDefault();
    }
    window.addEventListener("beforeunload", warnBeforeUnload);
    return () => window.removeEventListener("beforeunload", warnBeforeUnload);
  }, [receipt]);

  if (items.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-zinc-200">
        <p className="text-lg font-medium text-zinc-900">Səbətiniz boşdur</p>
        <Link href="/shop" className="mt-4 inline-flex text-sm font-semibold text-emerald-700 hover:underline">
          Mağazaya keç
        </Link>
      </div>
    );
  }

  if (banks.length === 0) {
    return (
      <div className="rounded-3xl bg-white p-10 text-center shadow-sm ring-1 ring-zinc-200">
        <p className="text-lg font-medium text-zinc-900">Hazırda ödəniş qəbul olunmur</p>
      </div>
    );
  }

  const primaryButton =
    "inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#1f7a3a] px-5 text-[15px] font-semibold text-white shadow-sm transition hover:bg-[#19692f] disabled:cursor-not-allowed disabled:opacity-70";
  const secondaryButton =
    "inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 text-[15px] font-semibold text-zinc-700 ring-1 ring-zinc-200 transition hover:bg-zinc-50";

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div ref={topRef} className="scroll-mt-24">
        <Stepper step={step} onSelect={goTo} />
      </div>

      <div className="mt-8 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-8">
        <div className="min-w-0 space-y-5">
          {draftRestored && step === 1 ? (
            <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-emerald-200">
              Doldurduğunuz məlumatlar bərpa olundu.
            </p>
          ) : null}

          {/* Steps stay mounted while hidden, so a picked receipt survives
              going back and forth. */}
          <div data-step="1" className={step === 1 ? "space-y-5" : "hidden"}>
            <section className={cardClass}>
              <h2 className={cardTitleClass}>Çatdırılma ünvanı</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="first_name" className={labelClass}>Ad</label>
                  <input
                    id="first_name"
                    autoComplete="given-name"
                    maxLength={RECIPIENT_NAME_MAX}
                    value={firstName}
                    onChange={(event) => setFirstName(event.target.value)}
                    aria-invalid={show(1) && errors.firstName ? true : undefined}
                    placeholder="Aysel"
                    className={inputClass(Boolean(show(1) && errors.firstName))}
                  />
                  <FieldError message={show(1) && errors.firstName} />
                </div>
                <div>
                  <label htmlFor="last_name" className={labelClass}>Soyad</label>
                  <input
                    id="last_name"
                    autoComplete="family-name"
                    maxLength={RECIPIENT_NAME_MAX}
                    value={lastName}
                    onChange={(event) => setLastName(event.target.value)}
                    aria-invalid={show(1) && errors.lastName ? true : undefined}
                    placeholder="Məmmədova"
                    className={inputClass(Boolean(show(1) && errors.lastName))}
                  />
                  <FieldError message={show(1) && errors.lastName} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="delivery_address_text" className={labelClass}>Küçə ünvanı</label>
                  <input
                    id="delivery_address_text"
                    autoComplete="street-address"
                    maxLength={300}
                    value={address}
                    onChange={(event) => setAddress(event.target.value)}
                    aria-invalid={show(1) && errors.address ? true : undefined}
                    placeholder="Küçə, bina, mənzil"
                    className={inputClass(Boolean(show(1) && errors.address))}
                  />
                  <FieldError message={show(1) && errors.address} />
                </div>
                <div>
                  <label htmlFor="city" className={labelClass}>Şəhər</label>
                  <select
                    id="city"
                    value={city}
                    onChange={(event) => setCity(event.target.value)}
                    aria-invalid={show(1) && errors.city ? true : undefined}
                    className={`${inputClass(Boolean(show(1) && errors.city))} ${city ? "" : "text-zinc-400"}`}
                  >
                    <option value="">Şəhəri seçin</option>
                    {AZ_REGIONS.map((region) => (
                      <option key={region} value={region} className="text-zinc-900">
                        {region}
                      </option>
                    ))}
                  </select>
                  <FieldError message={show(1) && errors.city} />
                </div>
                <div>
                  <label htmlFor="district" className={labelClass}>Rayon / qəsəbə</label>
                  <input
                    id="district"
                    autoComplete="address-level3"
                    maxLength={DISTRICT_MAX}
                    value={district}
                    onChange={(event) => setDistrict(event.target.value)}
                    placeholder="Nəsimi"
                    className={inputClass(false)}
                  />
                </div>
                <div>
                  <AzPhoneInput
                    key={phoneKey}
                    id="contact_phone"
                    name="contact_phone"
                    label="Telefon"
                    labelClassName={labelClass}
                    required
                    defaultValue={phone || (defaultPhone ?? "")}
                    onValueChange={setPhone}
                    error={show(1) ? errors.phone : null}
                  />
                </div>
              </div>

              {savedAddresses.length > 0 ? (
                <div className="mt-6 border-t border-zinc-100 pt-5">
                  <p className="text-xs text-zinc-500">Və ya saxlanmış ünvanı seçin:</p>
                  <ul className="mt-3 space-y-2">
                    {savedAddresses.map((saved) => {
                      const selected =
                        saved.address === address && saved.city === city && saved.district === district;
                      return (
                        <li key={`${saved.city}|${saved.district}|${saved.address}`}>
                          <button
                            type="button"
                            onClick={() => applySavedAddress(saved)}
                            aria-pressed={selected}
                            data-static-hover
                            className={[
                              "flex w-full items-center gap-2.5 rounded-xl border px-3.5 py-3 text-left text-sm transition",
                              selected
                                ? "border-emerald-500 bg-emerald-50/60 text-emerald-900"
                                : "border-zinc-200 text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50",
                            ].join(" ")}
                          >
                            <span className={selected ? "text-emerald-600" : "text-zinc-400"}>
                              <PinIcon />
                            </span>
                            <span className="min-w-0 truncate">
                              <span className="font-medium">
                                {saved.city}
                                {saved.district ? ` — ${saved.district}` : ""}
                              </span>
                              <span className="text-zinc-500">, {saved.address}</span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </section>

            <section className={cardClass}>
              <h2 className={cardTitleClass}>Sifariş qeydi</h2>
              <textarea
                id="order_note"
                rows={4}
                maxLength={ORDER_NOTE_MAX}
                value={note}
                onChange={(event) => setNote(event.target.value)}
                placeholder="Fermer və ya kuryer üçün xüsusi qeyd..."
                aria-label="Sifariş qeydi"
                className={`${inputClass(false)} mt-4 resize-y`}
              />
              <p className="mt-1 text-right text-xs tabular-nums text-zinc-400">
                {note.length}/{ORDER_NOTE_MAX}
              </p>
            </section>

            <button type="submit" className={primaryButton}>
              Ödənişə keç
              <ArrowIcon />
            </button>
          </div>

          <div data-step="2" className={step === 2 ? "space-y-5" : "hidden"}>
            <section className={cardClass}>
              <h2 className={cardTitleClass}>Bank köçürməsi</h2>
              <p className="mt-1.5 text-sm text-zinc-500">
                Aşağıdakı kartlardan birinə {formatPrice(total)} köçürün və çeki yükləyin.
              </p>
              <div className="mt-4 space-y-3" aria-invalid={show(2) && errors.bank ? true : undefined} tabIndex={-1}>
                {banks.map((item) => (
                  <BankOption
                    key={item.id}
                    bank={item}
                    checked={bankId === item.id}
                    onSelect={() => setBankId(item.id)}
                  />
                ))}
              </div>
              <FieldError message={show(2) && errors.bank} />
            </section>

            <section className={cardClass}>
              <h2 className={cardTitleClass}>Ödəniş çeki</h2>
              <p className="mt-1.5 text-sm text-zinc-500">
                Köçürmənin ekran görüntüsü və ya PDF çeki, ən çox {RECEIPT_MAX_LABEL}.
              </p>
              <div className="mt-4" aria-invalid={receiptError ? true : undefined} tabIndex={-1}>
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

            <div className="flex gap-3">
              <button type="button" onClick={() => goTo(1)} className={secondaryButton}>
                <ArrowIcon back />
                Geri
              </button>
              <button type="submit" className={primaryButton}>
                Təsdiqə keç
                <ArrowIcon />
              </button>
            </div>
          </div>

          <div data-step="3" className={step === 3 ? "space-y-5" : "hidden"}>
            <section className={cardClass}>
              <div className="flex items-center justify-between gap-3">
                <h2 className={cardTitleClass}>Çatdırılma</h2>
                <button type="button" onClick={() => goTo(1)} className="text-sm font-semibold text-emerald-700 hover:underline">
                  Dəyiş
                </button>
              </div>
              <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-zinc-500">Alıcı</dt>
                  <dd className="mt-0.5 font-medium text-zinc-900">{firstName} {lastName}</dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Telefon</dt>
                  <dd className="mt-0.5 font-medium text-zinc-900">{phone}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-zinc-500">Ünvan</dt>
                  <dd className="mt-0.5 font-medium text-zinc-900">
                    {[city, district.trim(), address.trim()].filter(Boolean).join(", ")}
                  </dd>
                </div>
                {note.trim() ? (
                  <div className="sm:col-span-2">
                    <dt className="text-zinc-500">Qeyd</dt>
                    <dd className="mt-0.5 whitespace-pre-line text-zinc-800">{note.trim()}</dd>
                  </div>
                ) : null}
              </dl>
            </section>

            <section className={cardClass}>
              <div className="flex items-center justify-between gap-3">
                <h2 className={cardTitleClass}>Ödəniş</h2>
                <button type="button" onClick={() => goTo(2)} className="text-sm font-semibold text-emerald-700 hover:underline">
                  Dəyiş
                </button>
              </div>
              <dl className="mt-4 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-zinc-500">Bank</dt>
                  <dd className="mt-0.5 font-medium text-zinc-900">{bank?.name ?? "—"}</dd>
                </div>
                <div className="min-w-0">
                  <dt className="text-zinc-500">Çek</dt>
                  <dd className="mt-0.5 truncate font-medium text-zinc-900">{receipt?.name ?? "—"}</dd>
                </div>
              </dl>
            </section>

            {state.error ? (
              <p role="alert" className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-rose-200">
                {state.error}
              </p>
            ) : null}

            <div className="flex gap-3">
              <button type="button" onClick={() => goTo(2)} disabled={busy} className={secondaryButton}>
                <ArrowIcon back />
                Geri
              </button>
              <button type="submit" disabled={busy} className={primaryButton}>
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
          </div>
        </div>

        <aside className="h-fit lg:sticky lg:top-24">
          <div className={cardClass}>
            <h2 className={cardTitleClass}>Sifariş xülasəsi</h2>
            <ul className="mt-4 space-y-3">
              {items.map((item) => (
                <li key={item.productId} className="flex items-center gap-3">
                  <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-zinc-100 ring-1 ring-zinc-200/70">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt="" fill sizes="44px" className="object-cover" />
                    ) : null}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-zinc-900">{item.title}</span>
                    <span className="block text-xs text-zinc-500">
                      ×{item.quantity} · {formatPrice(item.price)}
                      {formatUnit(item.unitType)}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold text-zinc-900">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <dl className="mt-5 space-y-2 border-t border-zinc-100 pt-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-[#8a4b2b]">Məhsullar</dt>
                <dd className="text-zinc-900">{formatPrice(subtotal)}</dd>
              </div>
              {discount > 0 && promo ? (
                <div className="flex justify-between text-emerald-700">
                  <dt>
                    Promokod <span className="font-semibold">{promo.code}</span>
                  </dt>
                  <dd>−{formatPrice(discount)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between">
                <dt className="text-[#8a4b2b]">Çatdırılma</dt>
                <dd className="text-zinc-900">{formatPrice(DELIVERY_FEE)}</dd>
              </div>
              <div className="flex justify-between border-t border-zinc-100 pt-3 text-base font-semibold text-zinc-900">
                <dt>Cəmi</dt>
                <dd>{formatPrice(total)}</dd>
              </div>
            </dl>

            {promo?.error ? (
              <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
                <span className="font-semibold">{promo.code}</span> promokodu tətbiq olunmadı: {promo.error}{" "}
                <Link href="/cart" className="font-semibold underline">
                  Səbətdə dəyişin
                </Link>
                .
              </p>
            ) : null}
          </div>
        </aside>
      </div>
    </form>
  );
}
