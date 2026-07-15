export function AdminPageShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full px-3 py-6 sm:px-4 sm:py-8 md:px-8 md:py-10">
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
            {description}
          </p>
        ) : null}
      </header>
      {children}
    </div>
  );
}
