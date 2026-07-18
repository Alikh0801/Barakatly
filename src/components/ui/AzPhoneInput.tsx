"use client";

import { useState } from "react";
import { AZ_PREFIX, azPhoneLocalPart, normalizeAzPhone } from "@/lib/phone/az";

export function AzPhoneInput({
  id = "phone",
  name = "phone",
  defaultValue = "",
  required = true,
  label = "Telefon",
}: {
  id?: string;
  name?: string;
  defaultValue?: string;
  required?: boolean;
  label?: string;
}) {
  const [local, setLocal] = useState(() => azPhoneLocalPart(defaultValue));
  const combined = normalizeAzPhone(`${AZ_PREFIX}${local.replace(/\D/g, "")}`);

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-zinc-700">
        {label}
        {required ? " *" : ""}
      </label>
      <div className="mt-1 flex overflow-hidden rounded-xl border border-zinc-200 bg-white focus-within:ring-2 focus-within:ring-emerald-500">
        <span className="inline-flex shrink-0 items-center border-r border-zinc-200 bg-zinc-50 px-3 text-sm font-semibold text-zinc-700">
          {AZ_PREFIX}
        </span>
        <input
          id={id}
          type="tel"
          inputMode="numeric"
          required={required}
          value={local}
          onChange={(event) => {
            const next = event.target.value.replace(/[^\d\s]/g, "").slice(0, 14);
            setLocal(next);
          }}
          placeholder="50 123 45 67"
          autoComplete="tel-national"
          className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2.5 text-base text-zinc-900 outline-none"
        />
        <input type="hidden" name={name} value={combined} />
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        Məcburi ölkə kodu: {AZ_PREFIX}. Nümunə: {AZ_PREFIX}501234567
      </p>
    </div>
  );
}
