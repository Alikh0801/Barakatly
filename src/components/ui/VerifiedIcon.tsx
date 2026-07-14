export function VerifiedIcon({
  className = "h-5 w-5",
}: {
  className?: string;
}) {
  return (
    <span
      role="img"
      aria-label="Təsdiqlənmiş"
      title="Təsdiqlənmiş"
      className={`inline-flex shrink-0 text-emerald-600 ${className}`}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="h-full w-full">
        <path d="M12 2.2 14.1 4l2.5-.5.9 2.4 2.4.9-.5 2.5L21.8 12l-2.2 2.1.5 2.5-2.4.9-.9 2.4-2.5-.5L12 21.8l-2.1-2.2-2.5.5-.9-2.4-2.4-.9.5-2.5L2.2 12l2.2-2.1-.5-2.5 2.4-.9.9-2.4 2.5.5L12 2.2Z" />
        <path
          d="M10.2 12.7 8.8 11.3l-1.3 1.3 2.7 2.7 4.8-4.8-1.3-1.3-3.5 3.5Z"
          fill="white"
        />
      </svg>
    </span>
  );
}
