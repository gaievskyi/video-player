import { useQueryStates } from "nuqs"
import { useEffect, useRef, useState } from "react"
import { parseAsTime } from "~/lib/time-query-parser"
import { type Frame } from "~/lib/video-to-frames"
import { useFrames } from "./video-editor-context"

export const Frames = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [frames, setFrames] = useState<Frame[]>([])
  const videoFrames = useFrames()
  const [{ start, end }] = useQueryStates({
    start: parseAsTime.withDefault(0),
    end: parseAsTime.withDefault(0),
  })

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
  }, [frames.length])

  if (!frames.length) return null

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 flex h-full w-full overflow-hidden rounded-xl"
    >
      {frames.map((frame) => {
        const isInRange = Number(frame.id) >= start && Number(frame.id) <= end
        return (
          <div
            key={frame.id}
            className="relative h-full flex-1"
            style={{
              filter: isInRange ? "none" : "blur(2px)",
              transition: "filter 0.2s ease-in-out",
            }}
          >
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
