const TESTIMONIALS = [
  {
    name: "Nigar Həsənli",
    location: "Bakı",
    quote:
      "Barakatly sayəsində məhsullar həmişə təravətli gəlir. Həqiqətən fərqi hiss edirsən.",
    initials: "NH",
  },
  {
    name: "Orxan Rəhimov",
    location: "Sumqayıt",
    quote:
      "Fermerdən birbaşa almaq çox rahatdır. Seçim çoxdur, çatdırılma isə vaxtında olur.",
    initials: "OR",
  },
  {
    name: "Rəna Əliyeva",
    location: "Gəncə",
    quote:
      "Keyfiyyətli məhsul, yaxşı qiymət və sürətli çatdırılma. Artıq həftəlik alışlarımı buradan edirəm.",
    initials: "RA",
  },
] as const;

function Stars() {
  return (
    <div className="flex items-center gap-1 text-amber-400" aria-label="5 / 5">
      <span aria-hidden="true">★</span>
      <span aria-hidden="true">★</span>
      <span aria-hidden="true">★</span>
      <span aria-hidden="true">★</span>
      <span aria-hidden="true">★</span>
    </div>
  );
}

export function WhatCustomersSaySection() {
  return (
    <section className="bg-[#faf9f5]">
      <div className="mx-auto w-full max-w-6xl px-4 py-14 md:px-6 md:py-16">
        <div className="text-center">
          <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Müştərilər nə deyir
          </h2>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200"
            >
              <Stars />
              <p className="mt-4 text-sm leading-6 text-zinc-700">
                “{t.quote}”
              </p>
              <div className="mt-5 flex items-center gap-3">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200">
                  {t.initials}
                </div>
                <div>
                  <div className="text-sm font-semibold text-zinc-900">
                    {t.name}
                  </div>
                  <div className="text-xs text-zinc-500">{t.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

