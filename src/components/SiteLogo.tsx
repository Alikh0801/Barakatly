import Image from "next/image";
import { getSiteLogo } from "@/lib/content/queries";

/** The site logo the admin set on /admin/hero, or the bundled one. */
export async function SiteLogo({
  size,
  className,
  loading,
}: {
  size: number;
  className?: string;
  loading?: "eager" | "lazy";
}) {
  const src = await getSiteLogo();

  return (
    <Image
      src={src}
      alt="Barakatly"
      width={size}
      height={size}
      loading={loading}
      className={className}
    />
  );
}
