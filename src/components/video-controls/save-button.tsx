import { AnimatePresence, LayoutGroup, motion } from "framer-motion"
import { useRef, useState } from "react"
import { ErrorAlert } from "~/components/error-alert"
import { Spinner } from "~/components/spinner"
import { checkCodecSupport } from "~/lib/codec-support"
import { VideoProcessor } from "~/lib/process-video"

interface SaveButtonProps {
  videoSrc: string
  startTime: number
  endTime: number
}

export const SaveButton = ({
  videoSrc,
  startTime,
  endTime,
}: SaveButtonProps) => {
  const [isSaving, setIsSaving] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isHovered, setIsHovered] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)
      setIsSuccess(false)

      const support = checkCodecSupport()
      if (!support.webm && !support.mp4) {
        throw new Error(
          "Your browser doesn't support video processing. Please try Chrome or Firefox.",
        )
      }

      const response = await fetch(videoSrc)
      const videoFile = await response.blob()

      const processor = new VideoProcessor(startTime, endTime)
      const trimmedVideo = await processor.trimVideo(videoFile)

      // Get original filename and extension
      const fileName = videoSrc.split("/").pop() || "video"
      const extension = fileName.split(".").pop()?.toLowerCase() || "mp4"
      const nameWithoutExt = fileName.split(".")[0]

      // Create download link
      const url = URL.createObjectURL(trimmedVideo)
      const a = document.createElement("a")
      a.href = url
      a.download = `${nameWithoutExt}-trimmed.${extension}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      setIsSuccess(true)
      // Reset success state after 2 seconds
      setTimeout(() => {
        setIsSuccess(false)
      }, 2000)
    } catch (error) {
      console.error("Error saving video:", error)
      setError(
        error instanceof Error
          ? error.message
          : "Failed to save video. Please try a different browser or video format.",
      )
    } finally {
      setIsSaving(false)
    }
  }

  const buttonColors = isSuccess
    ? "bg-emerald-500/90 hover:bg-emerald-500"
    : "bg-zinc-900/90 hover:bg-zinc-900"

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
    >
      <LayoutGroup>
        <motion.button
          ref={buttonRef}
          layout
          onClick={handleSave}
          disabled={isSaving}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          className={`group relative flex items-center gap-2.5 rounded-full border border-white/10 px-5 py-2.5 text-[13px] font-medium shadow-lg backdrop-blur-md transition-all duration-500 disabled:opacity-50 ${buttonColors} ${
            isSaving ? "min-w-[140px]" : "min-w-[110px]"
          }`}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-t from-white/[0.08] to-transparent"
            initial={false}
            animate={{
              opacity: isHovered ? 1 : 0,
            }}
            transition={{ duration: 0.3 }}
          />

          <AnimatePresence mode="wait">
            {isSaving ? (
              <motion.div
                layout
                key="saving"
                className="flex w-full items-center justify-center gap-2"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              >
                <Spinner
                  className="size-3.5"
                  particleClassName="bg-white"
                />
                <motion.span layout className="text-white tracking-wide">
                  Processing
                </motion.span>
              </motion.div>
            ) : isSuccess ? (
              <motion.div
                layout
                key="success"
                className="flex w-full items-center justify-center gap-2"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              >
                <motion.svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-white"
                  initial={{ scale: 0.5 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 12,
                    delay: 0.1
                  }}
                >
                  <path
                    d="M20 6L9 17L4 12"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </motion.svg>
                <motion.span layout className="text-white tracking-wide">
                  Exported
                </motion.span>
              </motion.div>
            ) : (
              <motion.div
                layout
                key="save-button"
                className="flex w-full items-center justify-center gap-2"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
              >
                <motion.svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-white transition-transform duration-300 group-hover:-translate-y-0.5"
                >
                  <path
                    d="M21 15V16.2C21 17.8802 21 18.7202 20.673 19.362C20.3854 19.9265 19.9265 20.3854 19.362 20.673C18.7202 21 17.8802 21 16.2 21H7.8C6.11984 21 5.27976 21 4.63803 20.673C4.07354 20.3854 3.6146 19.9265 3.32698 19.362C3 18.7202 3 17.8802 3 16.2V15M17 10L12 15M12 15L7 10M12 15V3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </motion.svg>
                <motion.span layout className="text-white tracking-wide">
                  Export
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            className="absolute inset-0 rounded-full ring-4 ring-white/20"
            initial={false}
            animate={{
              opacity: isHovered ? 1 : 0,
              scale: isHovered ? 1.05 : 1,
            }}
            transition={{ duration: 0.3 }}
          />
        </motion.button>
        <ErrorAlert error={error} buttonRef={buttonRef} />
      </LayoutGroup>
    </motion.div>
  )
}
