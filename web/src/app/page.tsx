import { Button } from "@/components/ui/button";

const features = [
  {
    title: "Agentic AI",
    description:
      "Build autonomous agents that can reason, plan, and execute complex tasks with minimal supervision.",
    icon: "🤖",
  },
  {
    title: "Tool Integration",
    description:
      "Seamlessly connect to external APIs, databases, and services through a unified tool interface.",
    icon: "🔧",
  },
  {
    title: "Observability",
    description:
      "Monitor agent behavior, trace decisions, and debug issues with built-in logging and metrics.",
    icon: "📊",
  },
  {
    title: "Scalable Architecture",
    description:
      "Deploy agents at scale with support for concurrent execution, rate limiting, and fault tolerance.",
    icon: "⚡",
  },
  {
    title: "Security First",
    description:
      "Protect sensitive data with end-to-end encryption, access controls, and audit trails.",
    icon: "🔒",
  },
  {
    title: "Developer Experience",
    description:
      "Ship faster with TypeScript-first SDKs, comprehensive docs, and reactive debugging tools.",
    icon: "✨",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-background to-muted/30 py-24 text-center">
        <div className="container px-4 md:px-6">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Agentic Engineer
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            A platform for building, deploying, and orchestrating autonomous AI
            agents. Ship intelligent applications with confidence.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button size="lg" render={<a href="/docs" />} nativeButton={false} className="cursor-pointer">
              Get Started
            </Button>
            <Button size="lg" variant="outline" render={<a href="/docs" />} nativeButton={false} className="cursor-pointer">
              Read the Docs
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid — responsive: 1 col mobile, 2 col tablet, 3 col PC */}
      <section className="container flex-1 px-4 py-16 md:px-6">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Built for production
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Everything you need to build and scale agentic applications.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col gap-3 rounded-xl border border-border bg-card p-6 text-card-foreground"
            >
              <span className="text-3xl">{feature.icon}</span>
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
