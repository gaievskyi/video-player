import { AnimatePresence, motion } from "framer-motion"
import type { HTMLProps } from "react"
import { PlayButton } from "./play-button"
import { SeekIndicator } from "./seek-indicator"

type VideoContainerProps = {
  videoRef: React.RefObject<HTMLVideoElement>
  isPlaying: boolean
  isMuted: boolean
  seekDirection: "left" | "right" | null
  seekIncrement: number
  onVideoClick: () => void
  onPlayClick: (e: React.MouseEvent) => void
  onTimeUpdate: React.ReactEventHandler
  onLoadedMetadata: () => void
  src: string
  props: Omit<HTMLProps<HTMLVideoElement>, keyof VideoContainerProps>
}

export const VideoContainer = ({
  videoRef,
  isPlaying,
  isMuted,
  seekDirection,
  seekIncrement,
  onVideoClick,
  onPlayClick,
  onTimeUpdate,
  onLoadedMetadata,
  src,
  props,
}: VideoContainerProps) => {
  return (
    <div className="relative w-full">
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.5, type: "spring", bounce: 0.2 }}
          className="relative aspect-video w-full overflow-hidden rounded-[1.2rem] border border-[#171717] bg-black lg:rounded-[1.8rem]"
        >
          <video
            ref={videoRef}
            onClick={onVideoClick}
            onTimeUpdate={onTimeUpdate}
            onLoadedMetadata={onLoadedMetadata}
            className="absolute left-1/2 top-1/2 h-full w-full -translate-x-1/2 -translate-y-1/2 object-contain"
            playsInline
            autoPlay
            loop
            muted={isMuted}
            {...props}
          >
            <source src={src} />
            Your browser doesn't support <code>HTML5 video</code>
          </video>

          <AnimatePresence>
            {!isPlaying && <PlayButton onClick={onPlayClick} />}
          </AnimatePresence>

          <AnimatePresence>
            {seekDirection && (
              <SeekIndicator
                direction={seekDirection}
                seekIncrement={seekIncrement}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
