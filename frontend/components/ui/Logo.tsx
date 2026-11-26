import Link from "next/link";
import { Network } from "lucide-react";

export default function Logo({
  href = "/",
  size = "md",
}: {
  href?: string;
  size?: "md" | "lg";
}) {
  return (
    <Link href={href} className="inline-flex items-center gap-2.5 group">
      <span
        className={`flex items-center justify-center rounded-[2px] border border-cyan-400/40 bg-cyan-500/10 text-cyan-400 transition group-hover:border-cyan-300 ${
          size === "lg" ? "h-10 w-10" : "h-8 w-8"
        }`}
      >
        <Network size={size === "lg" ? 20 : 16} />
      </span>

      <span
        className={`font-mono font-bold tracking-tight text-gray-100 ${
          size === "lg" ? "text-xl" : "text-sm"
        }`}
      >
        &lt;ARCH.<span className="text-cyan-400">MENTOR</span>_AI/&gt;
      </span>
    </Link>
  );
}