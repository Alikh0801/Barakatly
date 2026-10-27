/**
 * The title block at the top of a site page (Mağaza, Fermerlər, Səbət…), so
 * they all share one font, size and spacing. `action` sits on the right
 * from the small breakpoint up, under the text on phones.
 */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">{title}</h1>
        {description ? <p className="mt-2 text-sm text-zinc-500">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
