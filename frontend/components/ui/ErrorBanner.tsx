export default function ErrorBanner({
  message,
  className = "",
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={`rounded-[2px] border border-rose-500/40 bg-rose-950/30 px-4 py-3 font-mono text-xs text-rose-300 ${className}`}
    >
      <span className="mr-2 font-semibold text-rose-400">[ERR]</span>
      {message}
    </div>
  );
}