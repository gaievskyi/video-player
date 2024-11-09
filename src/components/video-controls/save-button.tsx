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
  const [error, setError] = useState<string | null>(null)
  const [isHovered, setIsHovered] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)

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

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
    >
      <LayoutGroup>
        <motion.button
          ref={buttonRef}
          layout
          onClick={handleSave}
          disabled={isSaving}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          className={`relative flex items-center gap-2 rounded-full bg-white/90 px-5 py-2.5 text-sm font-medium backdrop-blur-sm transition-shadow hover:shadow-lg disabled:opacity-50 ${
            isSaving ? "min-w-[140px]" : ""
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            className="absolute inset-0 rounded-full bg-black/5"
            initial={false}
            animate={{
              opacity: isHovered ? 1 : 0,
            }}
            transition={{ duration: 0.2 }}
          />

          <AnimatePresence mode="wait">
            {isSaving ? (
              <motion.div
                layout
                key="saving"
                className="flex w-full items-center justify-center gap-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <Spinner
                  className="size-6"
                  particleClassName="bg-black/40 dark:bg-black/40"
                />
                <motion.span layout className="text-black/70">
                  Processing
                </motion.span>
              </motion.div>
            ) : (
              <motion.div
                layout
                key="save"
                className="flex items-center gap-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
              >
                <motion.svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-black/70"
                  animate={{ y: isHovered ? 1 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <path
                    d="M21 15V16.2C21 17.8802 21 18.7202 20.673 19.362C20.3854 19.9265 19.9265 20.3854 19.362 20.673C18.7202 21 17.8802 21 16.2 21H7.8C6.11984 21 5.27976 21 4.63803 20.673C4.07354 20.3854 3.6146 19.9265 3.32698 19.362C3 18.7202 3 17.8802 3 16.2V15M17 10L12 15M12 15L7 10M12 15V3"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </motion.svg>
                <motion.span layout className="text-black/70">
                  Save
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
        <ErrorAlert error={error} buttonRef={buttonRef} />
      </LayoutGroup>
    </motion.div>
  )
}
