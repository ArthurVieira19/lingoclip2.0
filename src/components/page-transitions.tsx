"use client"

import type { ReactNode } from "react"
import { AnimatePresence, motion, MotionConfig } from "framer-motion"
import { usePathname } from "next/navigation"

/**
 * Wraps every route in a crossfade and honors prefers-reduced-motion
 * app-wide (MotionConfig reducedMotion="user" makes every Framer Motion
 * animation in the tree collapse transforms to instant/opacity-only when
 * the OS setting is on — no per-component work needed).
 *
 * `initial={false}` skips the enter animation on first paint so the very
 * first page is visible immediately rather than waiting on JS to reveal it.
 */
export function PageTransitions({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  return (
    <MotionConfig reducedMotion="user">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </MotionConfig>
  )
}
