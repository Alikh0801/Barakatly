import { AccountSkeleton } from "@/components/skeletons";

export default function AccountLoading() {
  return (
    <div className="flex min-h-screen min-h-dvh flex-col bg-[#faf9f5]">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 md:px-6">
          <div className="h-8 w-32 animate-pulse rounded-md bg-zinc-200/80" />
          <div className="h-9 w-16 animate-pulse rounded-full bg-zinc-200/80" />
        </div>
      </header>
      <main>
        <AccountSkeleton />
      </main>
    </div>
  );
}
