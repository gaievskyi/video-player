import { AnimatePresence, motion } from "framer-motion"
import type { RefObject } from "react"
import { createPortal } from "react-dom"

type ErrorAlertProps = {
  error: string | null
  buttonRef: RefObject<HTMLElement>
}

export function ErrorAlert({ error, buttonRef }: ErrorAlertProps) {
  return createPortal(
    <AnimatePresence>
      {error && buttonRef.current && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.9 }}
          style={{
            position: "fixed",
            top: `${buttonRef.current.getBoundingClientRect().bottom + 16}px`,
            left: `${buttonRef.current.getBoundingClientRect().left}px`,
          }}
          className="z-[9999] mr-20 flex min-w-[200px] translate-x-0 whitespace-normal rounded-lg bg-white px-4 py-2 text-sm font-medium text-red-500 shadow-lg backdrop-blur-sm before:absolute before:-top-2 before:left-8 before:h-4 before:w-4 before:rotate-45 before:bg-white before:content-['']"
        >
          {error}
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
