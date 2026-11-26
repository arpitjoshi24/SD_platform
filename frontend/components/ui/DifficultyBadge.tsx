const styles: Record<string, string> = {
  easy: "border-emerald-500/40 bg-emerald-950/30 text-emerald-400",
  medium: "border-amber-500/40 bg-amber-950/30 text-amber-400",
  hard: "border-rose-500/40 bg-rose-950/30 text-rose-400",
  beginner: "border-emerald-500/40 bg-emerald-950/30 text-emerald-400",
  intermediate: "border-cyan-500/40 bg-cyan-950/30 text-cyan-400",
  advanced: "border-violet-500/40 bg-violet-950/30 text-violet-400",
};

export default function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const key = difficulty.trim().toLowerCase();
  const formatted =
    key.charAt(0).toUpperCase() + key.slice(1);

  return (
    <span
      className={`inline-flex items-center rounded-[2px] border px-2.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider ${
        styles[key] ?? "border-[#2e3442] bg-[#14171f] text-gray-300"
      }`}
    >
      [{formatted}]
    </span>
  );
}