import {
  Activity,
  Boxes,
  CheckSquare,
  FolderKanban,
  History,
  Network,
} from "lucide-react";

import Logo from "@/components/ui/Logo";
import LandingNav from "@/components/landing/LandingNav";
import LandingCta from "@/components/landing/LandingCta";

const capabilities = [
  {
    code: "MOD_01",
    icon: Boxes,
    accent: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
    title: "Versioned Challenges",
    text: "Work against immutable challenge specifications with clear architectural requirements, hints, and version tracking.",
  },
  {
    code: "MOD_02",
    icon: Network,
    accent: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    title: "Topology Canvas",
    text: "Compose load balancers, API servers, caches, queues, and databases on a dark React Flow telemetry grid.",
  },
  {
    code: "MOD_03",
    icon: CheckSquare,
    accent: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    title: "Rule Evaluation Engine",
    text: "Run transient or saved-attempt checks for missing components, invalid topology links, and single points of failure.",
  },
  {
    code: "MOD_04",
    icon: History,
    accent: "text-violet-400 border-violet-500/30 bg-violet-500/10",
    title: "Immutable Attempts",
    text: "Explicitly save versioned snapshots with score, grade, pass status, and rule metadata—reopen or inspect anytime.",
  },
  {
    code: "MOD_05",
    icon: FolderKanban,
    accent: "text-rose-400 border-rose-500/30 bg-rose-500/10",
    title: "Practice Sandboxes",
    text: "Spin up freeform practice projects and toggle configurable architecture rules tailored to your own scenarios.",
  },
  {
    code: "MOD_06",
    icon: Activity,
    accent: "text-cyan-400 border-cyan-500/30 bg-cyan-500/10",
    title: "Activity Telemetry",
    text: "Track saved attempts, completed challenges, score trends, and daily practice consistency across your profile.",
  },
];

const workflow = [
  {
    step: "01",
    accent: "text-cyan-400 border-cyan-500/40",
    title: "Select Spec or Sandbox",
    text: "Pick a guided system design challenge or create a rule-configurable practice project.",
  },
  {
    step: "02",
    accent: "text-emerald-400 border-emerald-500/40",
    title: "Wire the Architecture",
    text: "Place compute, storage, caching, queue, and load-balancing nodes and connect data paths.",
  },
  {
    step: "03",
    accent: "text-amber-400 border-amber-500/40",
    title: "Evaluate & Inspect",
    text: "Run deterministic rule checks, highlight offending nodes on the canvas, and fix bottlenecks.",
  },
  {
    step: "04",
    accent: "text-violet-400 border-violet-500/40",
    title: "Commit Attempt",
    text: "Save an immutable attempt snapshot to record your score, grade, and engineering progress.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-lab-grid text-gray-100">
      <LandingNav />

      {/* Hero Bento Header */}
      <section className="border-b border-[#1e222b]">
        <div className="mx-auto max-w-6xl px-6 pb-20 pt-16 sm:pt-20">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1e222b] pb-4 font-mono text-[10px] uppercase tracking-widest text-gray-500">
            <span className="text-emerald-400">[STATUS: ONLINE] // DETERMINISTIC_RULE_LAB</span>
            <span>SCHEMA_V1.0 // GRAPH_SNAPSHOT_TELEMETRY</span>
          </div>

          <div className="mt-10 grid items-end gap-8 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <h1 className="text-4xl font-bold uppercase leading-[1.08] tracking-tight text-white sm:text-6xl">
                SYSTEM DESIGN LAB.
                <br />
                <span className="text-spectrum">BUILT FOR PRECISION.</span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-7 text-gray-400">
                Architect distributed systems on a visual canvas, run rule-based
                evaluations, manage local drafts safely, and commit immutable
                attempt snapshots across challenges and practice sandboxes.
              </p>

              <LandingCta className="mt-8" />
            </div>

            {/* Right Telemetry Readout */}
            <div className="rounded-[2px] border border-[#1e222b] bg-[#0e1015] p-5 lg:col-span-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-cyan-400">
                [ARCHITECTURE_TELEMETRY]
              </p>
              <dl className="mt-4 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-[#1e222b] pb-2">
                  <dt className="text-gray-500">EVALUATION_MODE</dt>
                  <dd className="text-emerald-400">TRANSIENT + ATTEMPT</dd>
                </div>
                <div className="flex items-center justify-between border-b border-[#1e222b] pb-2">
                  <dt className="text-gray-500">DRAFT_PERSISTENCE</dt>
                  <dd className="text-cyan-400">LOCAL_STORAGE_V1</dd>
                </div>
                <div className="flex items-center justify-between border-b border-[#1e222b] pb-2">
                  <dt className="text-gray-500">ATTEMPT_LEDGER</dt>
                  <dd className="text-amber-400">IMMUTABLE_IDEMPOTENT</dd>
                </div>
                <div className="flex items-center justify-between">
                  <dt className="text-gray-500">WORKBENCH_MODES</dt>
                  <dd className="text-violet-400">CHALLENGE | PRACTICE</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities Grid */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[#1e222b] pb-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-cyan-400">
              [01 // CORE_SUBSYSTEMS]
            </p>
            <h2 className="mt-1 text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl">
              Platform Capabilities
            </h2>
          </div>
          <p className="font-mono text-xs text-gray-500">
            6 ACTIVE ENGINEERING MODULES
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {capabilities.map(({ code, icon: Icon, accent, title, text }) => (
            <div
              key={code}
              className="rounded-[2px] border border-[#1e222b] bg-[#0e1015] p-5 transition hover:border-cyan-400/50"
            >
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-[2px] border ${accent}`}
                >
                  <Icon size={18} />
                </div>
                <span className="font-mono text-[10px] tracking-widest text-gray-600">
                  [{code}]
                </span>
              </div>

              <h3 className="mt-4 font-mono text-sm font-semibold uppercase tracking-wider text-gray-100">
                {title}
              </h3>
              <p className="mt-2 text-xs leading-5 text-gray-400">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Workflow Strip */}
      <section
        id="how-it-works"
        className="scroll-mt-20 border-y border-[#1e222b] bg-[#0e1015]/80"
      >
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="border-b border-[#1e222b] pb-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-emerald-400">
              [02 // EXECUTION_PIPELINE]
            </p>
            <h2 className="mt-1 text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl">
              How It Works
            </h2>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {workflow.map((item) => (
              <div
                key={item.step}
                className="rounded-[2px] border border-[#1e222b] bg-[#090a0d] p-5"
              >
                <div
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-[2px] border bg-[#0e1015] font-mono text-xs font-bold ${item.accent}`}
                >
                  {item.step}
                </div>

                <h3 className="mt-4 font-mono text-sm font-semibold uppercase tracking-wider text-gray-100">
                  {item.title}
                </h3>
                <p className="mt-2 text-xs leading-5 text-gray-400">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-4xl px-6 py-20 text-center">
        <div className="rounded-[2px] border border-[#1e222b] bg-[#0e1015] p-8 sm:p-12">
          <p className="font-mono text-[10px] uppercase tracking-widest text-amber-400">
            [READY_TO_ARCHITECT]
          </p>
          <h2 className="mt-2 text-2xl font-bold uppercase tracking-tight text-white sm:text-3xl">
            Start Your Next Architecture Design
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-gray-400">
            Jump into guided challenges or configure custom rules in a practice
            sandbox and track every saved attempt.
          </p>
          <LandingCta className="mt-7 justify-center" />
        </div>
      </section>

      <footer className="border-t border-[#1e222b] bg-[#090a0d]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-6 sm:flex-row">
          <Logo />
          <p className="font-mono text-[11px] uppercase tracking-wider text-gray-600">
            © 2026 ARCHMENTOR AI // SYSTEMS ENGINEERING LAB
          </p>
        </div>
      </footer>
    </div>
  );
}