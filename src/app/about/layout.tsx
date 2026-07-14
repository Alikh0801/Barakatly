import { PublicShell } from "@/components/layout/PublicShell";

export default function AboutLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <PublicShell>{children}</PublicShell>;
}
