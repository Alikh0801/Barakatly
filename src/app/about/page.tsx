import Link from "next/link";
import type { Metadata } from "next";
import { getAboutContent } from "@/lib/content/queries";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getAboutContent();
  return {
    title: "Haqqımızda — BARAKATLY",
    description: content.body.slice(0, 160),
  };
}

export default async function AboutPage() {
  const content = await getAboutContent();
  const { items } = content;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-14">
      <section>
        <p className="text-sm font-medium text-emerald-700">Barakatly</p>
        <h1 className="mt-2 max-w-3xl text-3xl font-semibold tracking-tight text-zinc-900 md:text-4xl">
          {content.title}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-600">
          {content.body}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
          >
            Mağazaya bax
          </Link>
          <Link
            href="/farmers"
            className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-50"
          >
            Fermerlərimiz
          </Link>
        </div>
      </section>

      <section
        id="mission"
        className="scroll-mt-24 mt-16 border-t border-zinc-200 pt-12"
      >
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
          {items.missionTitle}
        </h2>
        <p className="mt-3 max-w-3xl text-base leading-7 text-zinc-600">
          {items.missionBody}
        </p>
      </section>

      <section className="mt-14 grid gap-8 md:grid-cols-3">
        {items.values.map((item) => (
          <div key={item.title}>
            <h3 className="text-base font-semibold text-zinc-900">
              {item.title}
            </h3>
            <p className="mt-2 text-sm leading-6 text-zinc-600">{item.text}</p>
          </div>
        ))}
      </section>

      <section className="mt-16 border-t border-zinc-200 pt-12">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-900">
          {items.farmerTitle}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-600">
          {items.farmerBody}
        </p>
        <Link
          href="/farmers/apply"
          className="mt-6 inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500"
        >
          Satışa başla
        </Link>
      </section>
    </div>
  );
}
