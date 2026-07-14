import { PublicShell } from "@/components/layout/PublicShell";

export default function FarmersLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <PublicShell>{children}</PublicShell>;
}
