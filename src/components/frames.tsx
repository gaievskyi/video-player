import { useEffect, useRef, useState } from "react"
import { useFrames } from "./video-editor-context"
import { cn } from "~/lib/utils"

export const Frames = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoFrames = useFrames()
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>()

  useEffect(() => {
    if (!containerRef.current || !videoFrames.length) return

    const updateFrameDimensions = (containerWidth: number) => {
      if (containerWidth === 0) return

      const aspectRatio = videoFrames[0].height / videoFrames[0].width
      const frameWidth = containerWidth / videoFrames.length
      const frameHeight = frameWidth * aspectRatio

      setDimensions({ width: frameWidth, height: frameHeight })
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
  }, [videoFrames])

  if (!videoFrames.length) return null

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute inset-0 flex h-full w-full overflow-clip",
      )}
    >
      {videoFrames.map((frame) => {
        return (
          <div key={frame.id} className="relative h-full flex-1">
            <img
              src={frame.src}
              alt={`Frame ${frame.id}`}
              width={dimensions?.width}
              height={dimensions?.height}
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
