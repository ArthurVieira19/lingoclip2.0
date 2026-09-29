"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <div className="glass flex size-14 items-center justify-center rounded-2xl text-destructive">
        <AlertTriangle aria-hidden className="size-6" />
      </div>
      <h1 className="mt-5 font-display text-xl font-semibold">Something went wrong</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        This is a local, browser-only app — your saved progress is untouched. Try again, or head back
        to the library.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button variant="outline" render={<Link href="/library" />} nativeButton={false}>
          Back to library
        </Button>
      </div>
    </div>
  );
}
