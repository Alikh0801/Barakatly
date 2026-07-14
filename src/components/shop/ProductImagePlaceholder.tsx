export function ProductImagePlaceholder({
  className = "h-44 w-full",
  label = "Şəkil yoxdur",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <div
      className={[
        "flex items-center justify-center bg-zinc-100 text-zinc-400",
        className,
      ].join(" ")}
      aria-label={label}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-10 w-10"
        aria-hidden="true"
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <circle cx="9" cy="10" r="1.5" />
        <path d="m4 16 5-4 4 3 3-2 4 3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
}
