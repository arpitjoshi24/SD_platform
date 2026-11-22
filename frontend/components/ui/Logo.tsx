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
    <Link href={href} className="inline-flex items-center gap-2.5">
      <span
        className={`flex items-center justify-center rounded-lg bg-white text-black ${
          size === "lg" ? "h-10 w-10" : "h-8 w-8"
        }`}
      >
        <Network size={size === "lg" ? 22 : 18} />
      </span>

      <span
        className={`font-bold tracking-tight text-white ${
          size === "lg" ? "text-2xl" : "text-lg"
        }`}
      >
        ArchMentor<span className="text-blue-400"> AI</span>
      </span>
    </Link>
  );
}
