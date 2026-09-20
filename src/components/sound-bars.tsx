"use client";

import { motion } from "framer-motion";

const BAR_COUNT = 5;

/** Decorative animated equalizer bars — a small musical flourish, not a data viz. */
export function SoundBars() {
  return (
    <div className="flex h-8 items-end gap-1.5" aria-hidden>
      {Array.from({ length: BAR_COUNT }).map((_, index) => (
        <motion.span
          key={index}
          className="w-1.5 rounded-full bg-gradient-to-t from-primary to-secondary"
          initial={{ height: 6 }}
          animate={{ height: [6, 28, 12, 24, 6] }}
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
