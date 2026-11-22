import {
  Bot,
  Boxes,
  Gauge,
  Network,
  ShieldCheck,
  FileText,
} from "lucide-react";

import Logo from "@/components/ui/Logo";
import LandingNav from "@/components/landing/LandingNav";
import LandingCta from "@/components/landing/LandingCta";

const features = [
  {
    icon: Boxes,
    title: "Hands-on challenges",
    text: "Practice with realistic problems like URL shorteners, notification services and rate limiters, each with requirements and hints.",
  },
  {
    icon: Network,
    title: "Visual architecture canvas",
    text: "Drag API servers, databases, caches, queues and load balancers onto a canvas and connect them like on a whiteboard.",
  },
  {
    icon: ShieldCheck,
    title: "Rule-based validation",
    text: "A rule engine checks missing components, wrong connections, single points of failure and common design mistakes.",
  },
  {
    icon: Gauge,
    title: "Load simulation",
    text: "See how your design behaves under traffic and where the bottlenecks appear before they hit production.",
  },
  {
    icon: Bot,
    title: "AI mentor",
    text: "Get plain-language explanations of trade-offs and concrete suggestions to improve your design.",
  },
  {
    icon: FileText,
    title: "Score and report",
    text: "Finish with a report that lists detected problems, observations and an overall score you can improve on.",
  },
];

const steps = [
  { title: "Pick a challenge", text: "Choose a problem by difficulty and category." },
  { title: "Design it", text: "Build your architecture on the canvas." },
  { title: "Evaluate", text: "Run the checks and see exactly what to fix." },
  { title: "Improve", text: "Iterate with mentor feedback until it scores well." },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <LandingNav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute left-1/2 top-0 h-96 w-[48rem] -translate-x-1/2 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="relative mx-auto max-w-4xl px-6 pb-24 pt-24 text-center">
          <span className="inline-block rounded-full border border-gray-700 bg-gray-900 px-4 py-1.5 text-xs text-gray-400">
            Interactive system design learning platform
          </span>

          <h1 className="mt-6 text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
            Learn system design by{" "}
            <span className="text-blue-400">building it</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400">
            Design real architectures on a visual canvas, get them validated by
            a rule engine, stress-test them with simulated traffic, and learn
            from an AI mentor.
          </p>

          <LandingCta className="mt-10 justify-center" />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-20">
        <h2 className="text-center text-3xl font-bold">
          Everything you need to practice
        </h2>

        <p className="mx-auto mt-3 max-w-xl text-center text-gray-400">
          One workflow from problem statement to scored design.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="rounded-xl border border-gray-800 bg-gray-900 p-6 transition hover:border-gray-600"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
                <Icon size={22} />
              </div>

              <h3 className="mt-5 text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-400">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-20 border-y border-gray-800 bg-gray-900/40">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-center text-3xl font-bold">How it works</h2>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, index) => (
              <div key={step.title}>
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-700 bg-gray-900 font-semibold text-blue-400">
                  {index + 1}
                </div>

                <h3 className="mt-4 font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-gray-400">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h2 className="text-3xl font-bold">Ready to design your first system?</h2>

        <p className="mt-3 text-gray-400">
          Create a free account and start your first challenge in under a minute.
        </p>

        <LandingCta className="mt-8 justify-center" />
      </section>

      <footer className="border-t border-gray-800">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <Logo />
          <p className="text-sm text-gray-600">© 2026 ArchMentor AI. Major project.</p>
        </div>
      </footer>
    </div>
  );
}
