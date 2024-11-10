import clsx from "clsx"
import { AnimatePresence, motion } from "framer-motion"
import { useState, type ComponentProps } from "react"
import { PauseIcon } from "~/components/icons/pause-icon"
import { PlayIcon } from "~/components/icons/play-icon"
import { useVideoEditorContext } from "~/components/video-editor-context"
import { useRouter } from "~/lib/router"
import { formatTime } from "~/lib/utils"
import { SeekIndicator } from "./seek-indicator"
import { VolumeControl } from "./volume-control"

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
  duration: number
  props: Omit<ComponentProps<"video">, "ref">
  volume: number
  onVolumeChange: (volume: number) => void
  onMuteToggle: () => void
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
  duration,
  props,
  volume,
  onVolumeChange,
  onMuteToggle,
}: VideoContainerProps) => {
  const { navigate } = useRouter()
  const { filename } = useVideoEditorContext()
  const [aspectRatio, setAspectRatio] = useState<number>(16 / 9)
  const [isHovering, setIsHovering] = useState(false)
  const [fitMode, setFitMode] = useState(true)

  const handleLoadedMetadata = (e: React.SyntheticEvent) => {
    const video = e.currentTarget as HTMLVideoElement
    setAspectRatio(video.videoWidth / video.videoHeight)
    onLoadedMetadata()
  }

  const isVertical = aspectRatio < 1
  const [name, extension] = filename.split(".")

  return (
    <div
      onClick={onVideoClick}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={clsx(
        "group relative flex h-full w-full items-center justify-center overflow-hidden rounded-none bg-black sm:rounded-xl",
        isVertical ? ["sm:aspect-video sm:h-auto"] : ["aspect-video h-auto"],
      )}
    >
      <video
        ref={videoRef}
        className={clsx(
          "h-full w-full",
          isVertical
            ? [
                "object-contain",
                fitMode ? "sm:object-contain" : "sm:object-cover",
              ]
            : "object-contain",
        )}
        muted={isMuted}
        playsInline
        onTimeUpdate={onTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        src={src}
        {...props}
      />

      {/* Dark gradient overlays */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

      {/* Mobile header with meta info and close button */}
      <div className="absolute left-0 right-0 top-0 flex items-start justify-between p-4 sm:hidden">
        <div className="text-white">
          <h3 className="text-sm font-medium drop-shadow-lg">{name}</h3>
          <div className="flex items-center gap-1.5 text-xs text-white/80 drop-shadow-lg">
            <span>.{extension}</span>
            <span className="text-white/60">•</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            navigate("/")
          }}
          className="rounded-full bg-black/40 p-2 text-white backdrop-blur-sm transition-colors hover:bg-black/50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovering ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        className="pointer-events-none absolute inset-0 bg-black/20 sm:pointer-events-auto"
      />

      {/* Fit/Fill toggle for vertical videos on desktop */}
      {isVertical && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovering ? 1 : 0 }}
          transition={{ duration: 0.2 }}
          onClick={(e) => {
            e.stopPropagation()
            setFitMode(!fitMode)
          }}
          className="absolute bottom-4 left-4 hidden items-center gap-2 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/70 sm:flex"
        >
          {fitMode ? (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M9 3v18" />
                <path d="M15 3v18" />
              </svg>
              Fit
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M3 12h18" />
              </svg>
              Fill
            </>
          )}
        </motion.button>
      )}

      {/* Play/Pause button */}
      <AnimatePresence mode="wait">
        {isHovering && (
          <motion.button
            onClick={onPlayClick}
            className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm"
          >
            {isPlaying ? (
              <PauseIcon className="h-8 w-8" />
            ) : (
              <PlayIcon className="h-9 w-9 pt-1" />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Seek indicator */}
      <AnimatePresence>
        {seekDirection && (
          <SeekIndicator
            direction={seekDirection}
            seekIncrement={seekIncrement}
          />
        )}
      </AnimatePresence>

      {/* Volume Control */}
      <VolumeControl
        volume={volume}
        isMuted={isMuted}
        onVolumeChange={onVolumeChange}
        onMuteToggle={onMuteToggle}
      />
    </div>
  )
}
