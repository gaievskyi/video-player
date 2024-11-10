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
        "group relative flex h-full w-full items-center justify-center overflow-hidden rounded-none bg-black sm:rounded-2xl",
        isVertical
          ? [
              "h-[calc(100vh-8rem)] pb-8 sm:pb-0",
              "sm:aspect-video sm:h-auto"
            ]
          : "h-screen sm:aspect-video sm:h-auto"
      )}
    >
      <video
        ref={videoRef}
        className={clsx(
          "max-h-full transition-all duration-300",
          isVertical
            ? [
                "h-full w-auto max-w-full",
                fitMode
                  ? "sm:h-full sm:w-auto sm:object-contain"
                  : "sm:h-full sm:w-full sm:object-cover"
              ]
            : [
                "object-contain",
                "h-auto max-h-[100vh] w-full sm:h-full",
              ]
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
      <div className="absolute left-0 right-0 top-0 flex items-start justify-between py-4 px-1 sm:hidden">
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

      {/* Updated Fit/Fill toggle for vertical videos */}
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
                <path d="M7 4v16M17 4v16M3 8h18M3 16h18" />
              </svg>
              Original
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
                <path d="M3 8c0-1.1.9-2 2-2h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <path d="M8 4v16" />
                <path d="M16 4v16" />
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
