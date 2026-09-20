import { GameScreenLoader } from "@/components/game-screen-loader";

export default async function GamePage({
  params,
}: {
  params: Promise<{ songId: string }>;
}) {
  const { songId } = await params;
  return <GameScreenLoader songId={songId} />;
}
