import { InstrumentsList } from "@/components/instruments-list";
import { hasEnvVars } from "@/lib/utils";
import Link from "next/link";

export default function InstrumentsPage() {
  if (!hasEnvVars) {
    return (
      <section className="space-y-4">
        <h1 className="text-2xl font-semibold">Instruments</h1>
        <p className="text-muted-foreground">
          Configure{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            NEXT_PUBLIC_SUPABASE_URL
          </code>{" "}
          and{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
          </code>{" "}
          in <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.local</code>{" "}
          first. See{" "}
          <Link href="/" className="underline">
            home
          </Link>{" "}
          for setup steps.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Instruments</h1>
        <p className="text-muted-foreground mt-1">
          Requires sign-in. Sample data from{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            biz-service
          </code>{" "}
          via{" "}
          <code className="rounded bg-muted px-1 py-0.5 text-xs">
            GET /api/v1/instruments
          </code>
          .
        </p>
      </div>

      <InstrumentsList />
    </section>
  );
}
