import { useEffect, useRef, useState } from "react"
import { type Frame } from "~/lib/video-to-frames"
import { useFrames } from "./video-editor-context"
import { cn } from "~/lib/utils"

export const Frames = ({ isDirty }: { isDirty: boolean }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [frames, setFrames] = useState<Frame[]>([])
  const videoFrames = useFrames()

  // Initialize frames when videoFrames change
  useEffect(() => {
    if (videoFrames && videoFrames.length > 0) {
      setFrames(videoFrames)
    }
  }, [videoFrames])

  useEffect(() => {
    if (!containerRef.current || !frames.length) return

    const updateFrameDimensions = (width: number) => {
      if (width === 0) return

      const aspectRatio = frames[0].height / frames[0].width
      const frameWidth = width / frames.length
      const frameHeight = frameWidth * aspectRatio

      setFrames((prevFrames) =>
        prevFrames.map((frame) => ({
          ...frame,
          width: frameWidth,
          height: frameHeight,
        })),
      )
    }

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        updateFrameDimensions(entry.contentRect.width)
      }
    })

    // Initial size calculation
    updateFrameDimensions(containerRef.current.clientWidth)

    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [frames])

  if (!frames.length) return null

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute inset-0 flex h-full w-full overflow-clip",
        !isDirty && "rounded-xl",
      )}
    >
      {frames.map((frame) => {
        return (
          <div key={frame.id} className="relative h-full flex-1">
            <img
              src={frame.src}
              alt={`Frame ${frame.id}`}
              width={frame.width}
              height={frame.height}
              className="h-full w-full object-cover"
              loading="lazy"
              decoding="async"
            />
          </div>
        )
      })}
    </div>
  )
}
