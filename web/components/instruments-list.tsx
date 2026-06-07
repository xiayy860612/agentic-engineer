"use client";

import { createClient } from "@/lib/supabase/client";
import {
  fetchInstruments,
  type Instrument,
} from "@/lib/biz-service/instruments";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function InstrumentsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-24 animate-pulse rounded-xl border bg-muted/50"
        />
      ))}
    </div>
  );
}

function InstrumentsContent({ instruments }: { instruments: Instrument[] }) {
  return (
    <div className="space-y-4">
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {instruments.map((instrument) => (
          <li key={instrument.id}>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{instrument.name}</CardTitle>
                <CardDescription>id: {instrument.id}</CardDescription>
              </CardHeader>
            </Card>
          </li>
        ))}
      </ul>

      {instruments.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No instruments yet</CardTitle>
            <CardDescription>
              The API returned an empty list. Seed the{" "}
              <code className="text-xs">instruments</code> table in Supabase
              (see <code className="text-xs">web/supabase/instruments.sql</code>
              ).
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      <details className="rounded-lg border bg-muted/30 p-4">
        <summary className="cursor-pointer text-sm font-medium">
          Raw JSON response
        </summary>
        <pre className="mt-3 overflow-x-auto text-xs">
          {JSON.stringify(instruments, null, 2)}
        </pre>
      </details>
    </div>
  );
}

export function InstrumentsList() {
  const router = useRouter();
  const [instruments, setInstruments] = useState<Instrument[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.replace("/auth/login");
        return;
      }

      if (cancelled) {
        return;
      }

      const result = await fetchInstruments(session.access_token);

      if (cancelled) {
        return;
      }

      if (!result.ok) {
        if (result.error.kind === "unauthorized") {
          router.replace("/auth/login");
          return;
        }
        setError(result.error.message);
        return;
      }

      setInstruments(result.data);
    }

    void load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only load
  }, []);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Could not load instruments</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Data is served by{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              biz-service
            </code>
            . In local development, start it on port 8001 and ensure{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">
              BIZ_DATABASE_URL
            </code>{" "}
            points at your Supabase Postgres.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (instruments === null) {
    return <InstrumentsSkeleton />;
  }

  return <InstrumentsContent instruments={instruments} />;
}
