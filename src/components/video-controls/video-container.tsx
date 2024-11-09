import { AnimatePresence, motion } from "framer-motion"
import type { ComponentProps } from "react"
import { PlayButton } from "./play-button"
import { SeekIndicator } from "./seek-indicator"

type VideoContainerProps = {
  videoRef: React.RefObject<HTMLVideoElement>
  isPlaying: boolean
  isMuted: boolean
  seekDirection: "left" | "right" | null
  seekIncrement: number
  onVideoClick: () => void
  onPlayClick: (e: React.MouseEvent<HTMLButtonElement>) => void
  onTimeUpdate: React.ReactEventHandler<HTMLVideoElement>
  onLoadedMetadata: () => void
  src: string
  props: Omit<ComponentProps<"video">, keyof VideoContainerProps>
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
    <div className="relative">
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.5, type: "spring", bounce: 0.2 }}
          className="relative"
        >
          <video
            ref={videoRef}
            onClick={onVideoClick}
            onTimeUpdate={onTimeUpdate}
            onLoadedMetadata={onLoadedMetadata}
            className="peer w-full cursor-pointer rounded-[1.2rem] border border-[#171717] lg:rounded-[1.8rem]"
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