"use client"

import { useEffect, useState } from "react"
import { WifiOff } from "lucide-react"
import { AnimatePresence, motion } from "framer-motion"

/** The video player and lyrics search both need a real connection — surface that plainly instead of letting things silently fail. */
export function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    setIsOffline(!navigator.onLine)

    const goOffline = () => setIsOffline(true)
    const goOnline = () => setIsOffline(false)

    window.addEventListener("offline", goOffline)
    window.addEventListener("online", goOnline)
    return () => {
      window.removeEventListener("offline", goOffline)
      window.removeEventListener("online", goOnline)
    }
  }, [])

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          role="status"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden bg-destructive/15 text-destructive"
        >
          <div className="mx-auto flex max-w-5xl items-center justify-center gap-2 px-4 py-2 text-sm font-medium">
            <WifiOff aria-hidden className="size-4" />
            You&apos;re offline — video playback and lyrics search need an internet connection.
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
