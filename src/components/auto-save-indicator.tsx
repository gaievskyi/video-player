import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"

type AutoSaveIndicatorProps = {
  saving: boolean
}

export const AutoSaveIndicator = ({ saving }: AutoSaveIndicatorProps) => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (saving) {
      setVisible(true)
    } else {
      const timer = setTimeout(() => setVisible(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [saving])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="fixed bottom-4 right-4 rounded-full bg-black/80 px-4 py-2 text-sm text-white backdrop-blur-sm"
        >
          {saving ? "Saving..." : "All changes saved"}
        </motion.div>
      )}
    </AnimatePresence>
  )
}