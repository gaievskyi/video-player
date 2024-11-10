import { useFrames } from "./video-editor-context"

export const Frames = () => {
  const frames = useFrames()

  return (
    <div className="relative flex w-full overflow-hidden">
      {/* Gradient overlays for iOS-like effect */}
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-8 bg-gradient-to-r from-black/20 to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-8 bg-gradient-to-l from-black/20 to-transparent" />

      {/* Frames container */}
      <div className="flex w-full">
        {frames.map((frame, index) => (
          <div key={frame.id} className="relative min-w-0 flex-1">
            <img
              draggable={false}
              src={frame.src}
              alt="Frame"
              className="h-full w-full select-none object-cover"
              style={{
                imageRendering: "crisp-edges",
              }}
            />
            {/* iOS-style elegant separator */}
            {index < frames.length - 1 && (
              <>
                {/* Main separator line */}
                <div
                  className="pointer-events-none absolute right-0 top-0 h-full w-[1px]"
                  style={{
                    background:
                      "linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.15) 20%, rgba(255,255,255,0.15) 80%, transparent 100%)",
                  }}
                />
                {/* Subtle shadow line */}
                <div
                  className="pointer-events-none absolute right-[1px] top-0 h-full w-[1px]"
                  style={{
                    background:
                      "linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.1) 20%, rgba(0,0,0,0.1) 80%, transparent 100%)",
                  }}
                />
              </>
            )}
            {/* Top and bottom subtle gradients */}
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, transparent 8%, transparent 92%, rgba(0,0,0,0.2) 100%)",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
