import Link from "next/link";
import { notFound } from "next/navigation";
import { FarmerBlogFeed } from "@/components/farmer/FarmerProfile";
import { ProductCard } from "@/components/shop/ProductCard";
import { VerifiedIcon } from "@/components/ui/VerifiedIcon";
import {
  getPublicFarmerBlogPosts,
  getPublicFarmerById,
  getPublicFarmerProducts,
} from "@/lib/farmers/queries";
import type { FarmerBlogPost } from "@/lib/farmer/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const farmer = await getPublicFarmerById(id);
  return {
    title: farmer
      ? `${farmer.farm_name} — BARAKATLY`
      : "Fermer — BARAKATLY",
    description: farmer?.description ?? "Təsdiqlənmiş fermer profili",
  };
}

export default async function FarmerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (id === "apply") {
    notFound();
  }

  const farmer = await getPublicFarmerById(id);
  if (!farmer) notFound();

  const [products, rawPosts] = await Promise.all([
    getPublicFarmerProducts(farmer.id),
    getPublicFarmerBlogPosts(farmer.id),
  ]);

  const posts = rawPosts.map(
    (post): FarmerBlogPost => ({
      id: post.id,
      farmer_id: farmer.id,
      caption: post.caption,
      created_at: post.created_at,
      updated_at: post.created_at,
      farmer_post_media: post.farmer_post_media.map((media) => ({
        id: media.id,
        post_id: post.id,
        media_type: media.media_type,
        url: media.url,
        sort_order: media.sort_order,
        created_at: post.created_at,
      })),
    })
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 md:px-6 md:py-14">
      <Link
        href="/farmers"
        prefetch
        className="text-sm font-medium text-emerald-700 hover:underline"
      >
        ← Fermerlərə qayıt
      </Link>

      <section className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start">
        {farmer.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={farmer.avatar_url}
            alt={farmer.farm_name}
            className="h-24 w-24 shrink-0 rounded-full object-cover ring-2 ring-emerald-100"
          />
        ) : (
          <div className="inline-flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-3xl font-semibold text-emerald-800">
            {farmer.farm_name.slice(0, 1).toUpperCase()}
          </div>
        )}

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
              {farmer.farm_name}
            </h1>
            {farmer.verified_at ? <VerifiedIcon className="h-6 w-6" /> : null}
          </div>

          {farmer.location_text ? (
            <p className="mt-2 text-sm text-zinc-600">{farmer.location_text}</p>
          ) : null}

          {farmer.description ? (
            <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-700">
              {farmer.description}
            </p>
          ) : (
            <p className="mt-4 text-sm text-zinc-600">
              Bu təsərrüfat haqqında əlavə təsvir hələ əlavə olunmayıb.
            </p>
          )}

          <p className="mt-4 text-sm text-zinc-600">
            {farmer.productCount} təsdiqlənmiş məhsul
          </p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
          Məhsullar
        </h2>

        {products.length > 0 ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <p className="mt-6 rounded-2xl bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-600 ring-1 ring-zinc-200">
            Bu fermerin hazırda satışda məhsulu yoxdur.
          </p>
        )}
      </section>

      <section className="mt-14">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-900">
          Blog
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          Təsərrüfatdan şəkillər və videolar
        </p>
        <div className="mt-6">
          {posts.length > 0 ? (
            <FarmerBlogFeed posts={posts} />
          ) : (
            <p className="rounded-2xl bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-600 ring-1 ring-zinc-200">
              Bu fermer hələ blog paylaşımı etməyib.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
