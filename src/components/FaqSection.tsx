"use client";

import { useId, useState } from "react";

const FAQS = [
  {
    q: "Məhsullar nə qədər təzə olur?",
    a: "Məhsullar adətən yığıldıqdan sonra 24–48 saat ərzində çatdırılır. Bu, maksimum təravət və qida dəyərini qorumağa kömək edir.",
  },
  {
    q: "Bir neçə fermerdən eyni sifarişdə ala bilərəm?",
    a: "Bəli. Müxtəlif fermerlərin məhsullarını bir səbətdə toplaya bilərsiniz. Sistem sifarişi avtomatik qruplaşdırır və çatdırılmanı koordinasiya edir.",
  },
  {
    q: "Çatdırılma necə işləyir?",
    a: "Kuryer şəbəkəmiz məhsulları fermerlərdən götürür və qapınıza çatdırır. Sifarişinizi real vaxtda izləmək mümkün olacaq.",
  },
  {
    q: "Məhsulların orqanik olması necə təsdiqlənir?",
    a: "Orqanik məhsul iddia edən fermerlərin sertifikatlarını yoxlayırıq. Məhsullarda “Orqanik” nişanını görə bilərsiniz.",
  },
] as const;

export function FaqSection() {
  const baseId = useId();
  const [openIdx, setOpenIdx] = useState<number>(0);

  return (
    <section className="bg-[#faf9f5]">
      <div className="mx-auto w-full max-w-3xl px-4 py-14 md:px-6 md:py-16">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Tez-tez verilən suallar
          </h2>
        </div>

        <div className="mt-10 space-y-3">
          {FAQS.map((f, idx) => {
            const isOpen = idx === openIdx;
            const panelId = `${baseId}-panel-${idx}`;
            const buttonId = `${baseId}-button-${idx}`;
            return (
              <div
                key={f.q}
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
                    {f.q}
                  </span>
                  <span
                    aria-hidden="true"
                    className="text-zinc-400 transition"
                  >
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
                    {f.a}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

