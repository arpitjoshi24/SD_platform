import Spinner from "@/components/ui/Spinner";

export default function FullPageLoader({
  label = "INITIALIZING_SESSION...",
}: {
  label?: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090a0d] text-gray-400">
      <div className="flex items-center gap-3 rounded-[2px] border border-[#1e222b] bg-[#0e1015] px-5 py-3.5 font-mono text-xs tracking-wider uppercase">
        <Spinner size={18} />
        <span>{label}</span>
      </div>
    </div>
  );
}