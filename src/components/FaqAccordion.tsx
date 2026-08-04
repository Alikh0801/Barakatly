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
            className="rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200 transition-shadow hover:shadow-md"
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
              <span
                aria-hidden="true"
                className={[
                  "text-zinc-400 transition-transform duration-300 ease-out",
                  isOpen ? "rotate-180" : "rotate-0",
                ].join(" ")}
              >
                ˅
              </span>
            </button>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              aria-hidden={!isOpen}
              className={[
                "grid overflow-hidden transition-[grid-template-rows] duration-300 ease-out",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
              ].join(" ")}
            >
              <div className="min-h-0 overflow-hidden px-5 pb-5 text-sm leading-6 text-zinc-600">
                {item.answer}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
