"use client";

import { motion } from "framer-motion";

const BAR_COUNT = 5;

/** Decorative animated equalizer bars — a small musical flourish, not a data viz. */
export function SoundBars() {
  return (
    <div className="flex h-8 items-end gap-1.5" aria-hidden>
      {Array.from({ length: BAR_COUNT }).map((_, index) => (
        // scaleY instead of height: same look, no layout recalculation per frame.
        <motion.span
          key={index}
          className="h-8 w-1.5 origin-bottom rounded-full bg-gradient-to-t from-primary to-secondary"
          initial={{ scaleY: 0.2 }}
          animate={{ scaleY: [0.2, 0.9, 0.4, 0.75, 0.2] }}
          transition={{
            duration: 1.6,
            repeat: Infinity,
            ease: "easeInOut",
            delay: index * 0.15,
          }}
        />
      ))}
    </div>
  );
}
