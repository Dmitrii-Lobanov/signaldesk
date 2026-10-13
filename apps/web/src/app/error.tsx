"use client";

import { useEffect, useState } from "react";

export default function ErrorPage({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const [reference, setReference] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function report() {
      try {
        const response = await fetch("/api/client-errors", {
          method: "POST",
          signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) return;

        const result: unknown = await response.json();

        if (
          active &&
          typeof result === "object" &&
          result !== null &&
          "requestId" in result &&
          typeof result.requestId === "string" &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
            result.requestId,
          )
        ) {
          setReference(result.requestId);
        }
      } catch {
        // The recovery UI remains usable when reporting is unavailable.
      }
    }

    void report();

    return () => {
      active = false;
    };
  }, [error]);

  return (
    <main>
      <h1>Something went wrong</h1>
      <p role="alert">
        This page could not load. Try again.
        {reference ? ` Reference: ${reference}` : ""}
      </p>
      <button type="button" onClick={retry}>
        Try again
      </button>
    </main>
  );
}
