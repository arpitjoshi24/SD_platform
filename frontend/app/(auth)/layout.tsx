import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

import GuestGuard from "@/components/auth/GuestGuard";
import Logo from "@/components/ui/Logo";
import FullPageLoader from "@/components/ui/FullPageLoader";

const highlights = [
  "Real-world system design challenges",
  "Drag-and-drop architecture canvas",
  "Instant rule-based design feedback",
  "Load simulation and AI mentoring",
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-gray-950 text-white lg:grid-cols-2">
      {/* Brand panel */}
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-gray-800 bg-gradient-to-br from-gray-900 via-gray-950 to-gray-950 p-12 lg:flex">
        <div className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

        <Logo size="lg" />

        <div className="relative">
          <h2 className="text-4xl font-bold leading-tight">
            Learn system design
            <br />
            by actually designing.
          </h2>

          <p className="mt-4 max-w-md text-gray-400">
            Build architectures on a visual canvas and get feedback the way a
            senior engineer would give it.
          </p>

          <ul className="mt-8 space-y-3">
            {highlights.map((item) => (
              <li key={item} className="flex items-center gap-3 text-gray-300">
                <CheckCircle2 size={18} className="shrink-0 text-blue-400" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-gray-600">© 2026 ArchMentor AI</p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col px-6 py-8 sm:px-12">
        <div className="flex items-center justify-between">
          <div className="lg:hidden">
            <Logo />
          </div>

          <Link
            href="/"
            className="ml-auto inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to home
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">
            <Suspense fallback={<FullPageLoader />}>
              <GuestGuard>{children}</GuestGuard>
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}
