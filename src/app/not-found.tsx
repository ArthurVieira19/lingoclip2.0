import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <div className="glass flex size-14 items-center justify-center rounded-2xl text-primary">
        <Compass aria-hidden className="size-6" />
      </div>
      <h1 className="mt-5 font-display text-xl font-semibold">Page not found</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        That page doesn&apos;t exist — maybe a song link that&apos;s no longer in your library.
      </p>
      <Button className="mt-6" render={<Link href="/library" />} nativeButton={false}>
        Back to library
      </Button>
    </div>
  );
}
