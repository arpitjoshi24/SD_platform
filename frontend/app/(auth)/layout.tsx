import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, Terminal } from "lucide-react";

import GuestGuard from "@/components/auth/GuestGuard";
import Logo from "@/components/ui/Logo";
import FullPageLoader from "@/components/ui/FullPageLoader";

const highlights = [
  { code: "01", text: "Version-locked system design challenges", accent: "text-cyan-400" },
  { code: "02", text: "Interactive React Flow topology canvas", accent: "text-emerald-400" },
  { code: "03", text: "Deterministic rule-engine evaluations & attempts", accent: "text-amber-400" },
  { code: "04", text: "Practice sandbox & activity telemetry", accent: "text-violet-400" },
];

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-lab-grid text-gray-100 lg:grid-cols-2">
      {/* Brand / Telemetry Panel */}
      <aside className="relative hidden flex-col justify-between overflow-hidden border-r border-[#1e222b] bg-[#090a0d] p-10 lg:flex xl:p-12">
        <div className="flex items-center justify-between border-b border-[#1e222b] pb-4 font-mono text-[10px] uppercase tracking-widest text-gray-500">
          <span className="text-emerald-400">[SYS_OK] // AUTH_GATEWAY: READY</span>
          <span>ARCHMENTOR_V1.0</span>
        </div>

        <Logo size="lg" />

        <div className="relative my-auto py-8">
          <p className="inline-flex items-center gap-2 rounded-[2px] border border-[#1e222b] bg-[#0e1015] px-3 py-1 font-mono text-[10px] uppercase tracking-widest text-cyan-400">
            <Terminal size={12} />
            SYSTEMS ENGINEERING LABORATORY
          </p>

          <h2 className="mt-5 text-3xl font-bold uppercase leading-tight tracking-tight text-white xl:text-4xl">
            ARCHITECT WITH RIGOR.
            <br />
            <span className="text-spectrum">VALIDATE WITH PRECISION.</span>
          </h2>

          <p className="mt-4 max-w-md text-sm leading-6 text-gray-400">
            Design distributed topologies, test against deterministic rules, and
            save immutable attempts across challenges and practice sandboxes.
          </p>

          <ul className="mt-8 space-y-2.5">
            {highlights.map((item) => (
              <li
                key={item.code}
                className="flex items-center gap-3 rounded-[2px] border border-[#1e222b] bg-[#0e1015] px-3.5 py-2.5 font-mono text-xs text-gray-300"
              >
                <span className={`font-semibold ${item.accent}`}>
                  [{item.code}]
                </span>
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between border-t border-[#1e222b] pt-4 font-mono text-[10px] uppercase tracking-wider text-gray-600">
          <span>© 2026 ARCHMENTOR AI</span>
          <span>[ROLE_ENFORCED_SESSION]</span>
        </div>
      </aside>

      {/* Form Panel */}
      <main className="flex flex-col px-6 py-7 sm:px-12">
        <div className="flex items-center justify-between">
          <div className="lg:hidden">
            <Logo />
          </div>

          <Link
            href="/"
            className="ml-auto inline-flex items-center gap-2 rounded-[2px] border border-[#1e222b] bg-[#0e1015] px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-gray-400 transition hover:border-cyan-400/50 hover:text-white"
          >
            <ArrowLeft size={14} />
            <span>Back to Lab</span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-8">
          <div className="w-full max-w-md rounded-[2px] border border-[#1e222b] bg-[#0e1015] p-6 sm:p-8">
            <Suspense fallback={<FullPageLoader label="LOADING_AUTH..." />}>
              <GuestGuard>{children}</GuestGuard>
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}