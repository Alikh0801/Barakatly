import Link from "next/link";
import type { ComponentProps } from "react";

type NavLinkProps = ComponentProps<typeof Link>;

export function NavLink({ className = "", children, ...props }: NavLinkProps) {
  return (
    <Link prefetch className={className} {...props}>
      {children}
    </Link>
  );
}
