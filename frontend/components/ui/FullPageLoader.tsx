import Spinner from "@/components/ui/Spinner";

export default function FullPageLoader({
  label = "Loading...",
}: {
  label?: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 text-gray-400">
      <div className="flex items-center gap-3 text-sm">
        <Spinner size={20} />
        {label}
      </div>
    </div>
  );
}
