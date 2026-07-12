"use client";

import { useId, useState } from "react";

type PasswordInputProps = {
  id?: string;
  name: string;
  label: string;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
};

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="h-4 w-4"
      >
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      </svg>
    );
  }

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      className="h-4 w-4"
    >
      <path d="M3 3l18 18" strokeLinecap="round" />
      <path d="M10.6 10.6A3 3 0 0 0 12 15a3 3 0 0 0 2.4-1.2" />
      <path d="M6.7 6.7C4.6 8.1 3 10.2 2 12c0 0 3.5 7 10 7 1.8 0 3.4-.5 4.8-1.3" />
      <path d="M9.9 4.2A10.7 10.7 0 0 1 12 4c6.5 0 10 7 10 7a17.7 17.7 0 0 1-2.1 3.3" />
    </svg>
  );
}

export function PasswordInput({
  id,
  name,
  label,
  placeholder = "••••••••",
  autoComplete = "current-password",
  required = true,
  minLength,
}: PasswordInputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-zinc-700">
        {label}
      </label>
      <div className="relative mt-1">
        <input
          id={inputId}
          name={name}
          type={visible ? "text" : "password"}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          className="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-3 pr-10 text-base text-zinc-900 outline-none ring-emerald-500 focus:ring-2 touch-manipulation"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 inline-flex w-10 items-center justify-center text-zinc-500 transition hover:text-zinc-700"
          aria-label={visible ? "Şifrəni gizlət" : "Şifrəni göstər"}
        >
          <EyeIcon open={visible} />
        </button>
      </div>
    </div>
  );
}
