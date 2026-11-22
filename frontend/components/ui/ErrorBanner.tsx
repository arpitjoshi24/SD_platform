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
      className={`rounded-lg border border-red-800 bg-red-950/40 p-4 text-sm text-red-400 ${className}`}
    >
      {message}
    </div>
  );
}
