"use client"

import { motion } from "framer-motion"

const PARTICLES = 14

/**
 * One-shot radial burst for a finished song — the single celebratory moment
 * in the game loop. Plays once on mount; with reduced motion the global
 * MotionConfig drops the transforms and it collapses to a brief fade.
 */
export function CelebrationBurst() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {Array.from({ length: PARTICLES }, (_, i) => {
        const angle = (i / PARTICLES) * Math.PI * 2
        const distance = 70 + (i % 3) * 22
        const isLime = i % 2 === 0
        return (
          <motion.span
            key={i}
            className={isLime ? "absolute size-2 rounded-full bg-secondary" : "absolute size-1.5 rounded-full bg-primary"}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0.4 }}
            animate={{
              x: Math.cos(angle) * distance,
              y: Math.sin(angle) * distance,
              opacity: [0, 1, 0],
              scale: [0.4, 1, 0.6],
            }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 + (i % 4) * 0.02 }}
          />
        )
      })}
    </div>
  )
}
