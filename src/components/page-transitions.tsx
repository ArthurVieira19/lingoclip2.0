"use client"

import { useRef, type ReactNode } from "react"
import { motion } from "framer-motion"
import { usePathname } from "next/navigation"

/**
 * Wraps every route in a short fade-in. Reduced motion is handled once for
 * the whole app by the MotionConfig in the root layout.
 *
 * Enter-only on purpose: an exit animation (AnimatePresence) keeps the old
 * route's subtree mounted while the App Router has already swapped in the
 * new one, which crashes React with "insertBefore ... not a child of this
 * node" on client-side navigations (seen after saving a song and pushing to
 * /game).
 *
 * The first page skips the animation so it is visible immediately rather
 * than waiting on JS to reveal it.
 */
export function PageTransitions({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const firstPathname = useRef(pathname)
  const isFirstPage = pathname === firstPathname.current

  return (
    <motion.div
      key={pathname}
      initial={isFirstPage ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  )
}
