import Link from "next/link"
import { Music2 } from "lucide-react"
import type { ReactNode } from "react"

/** Shared frame for the login and sign-up pages. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="relative mx-auto flex min-h-svh max-w-md flex-col justify-center overflow-hidden px-4 py-10">
      <div aria-hidden className="glow-blob left-1/2 top-6 size-72 -translate-x-2/3 bg-primary/30" />

      <div className="glass relative rounded-2xl p-6 sm:p-8">
        <Link href="/login" className="mb-5 flex w-fit items-center gap-2 rounded-lg">
          <span aria-hidden className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <Music2 className="size-[1.125rem]" strokeWidth={2.5} />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight">
            Song<span className="text-primary">Gap</span>
          </span>
        </Link>

        <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>

        <div className="mt-6">{children}</div>
      </div>

      <p className="relative mt-5 text-center text-sm text-muted-foreground">{footer}</p>
    </div>
  )
}
