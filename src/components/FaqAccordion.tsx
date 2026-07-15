"use client";

import { useId, useState } from "react";
import type { FaqItem } from "@/lib/content/defaults";

export function FaqAccordion({ items }: { items: FaqItem[] }) {
  const baseId = useId();
  const [openIdx, setOpenIdx] = useState<number>(0);

  return (
    <div className="space-y-3">
      {items.map((item, idx) => {
        const isOpen = idx === openIdx;
        const panelId = `${baseId}-panel-${idx}`;
        const buttonId = `${baseId}-button-${idx}`;
        return (
          <div
            key={`${item.question}-${idx}`}
            className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200"
          >
            <button
              id={buttonId}
              type="button"
              className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenIdx((cur) => (cur === idx ? -1 : idx))}
            >
              <span className="text-sm font-semibold text-zinc-900">
                {item.question}
              </span>
              <span aria-hidden="true" className="text-zinc-400 transition">
                {isOpen ? "˄" : "˅"}
              </span>
            </button>
            {isOpen ? (
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className="px-5 pb-5 text-sm leading-6 text-zinc-600"
              >
                {item.answer}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
