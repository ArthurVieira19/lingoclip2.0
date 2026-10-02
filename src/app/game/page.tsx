"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { GameScreenLoader } from "@/components/game-screen-loader";

// The song comes from the query string (/game?id=...) because songs live in
// the database and the site is exported as static files, so there is no way
// to pre-render one page per song id.
function GameRoute() {
  const songId = useSearchParams().get("id") ?? "";
  return <GameScreenLoader songId={songId} />;
}

export default function GamePage() {
  return (
    <Suspense fallback={null}>
      <GameRoute />
    </Suspense>
  );
}
