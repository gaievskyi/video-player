import type { ComponentProps } from "react"
import { useRef } from "react"

type VideoUploadInputProps = ComponentProps<"input"> & {
  onExampleClick: (src: string) => void
}

export const VideoUploadInput = ({
  onChange,
  onExampleClick,
}: VideoUploadInputProps) => {
  const earthVideoRef = useRef<HTMLVideoElement>(null)
  const bunnyVideoRef = useRef<HTMLVideoElement>(null)

  const handleMouseEnter = (videoRef: React.RefObject<HTMLVideoElement>) => {
    if (videoRef.current) {
      videoRef.current.play()
    }
  }

  const handleMouseLeave = (videoRef: React.RefObject<HTMLVideoElement>) => {
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
      videoRef.current.load()
    }
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <label
        htmlFor="dropzone-file"
        className="flex h-32 w-64 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#171717] bg-card transition-colors hover:bg-card/80"
      >
        <div className="flex flex-col items-center justify-center pb-6 pt-5">
          <svg
            className="mb-4 h-8 w-8"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 20 16"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
            />
          </svg>
          <p className="mb-1 text-sm font-bold">Open video</p>
          <p className="text-xs">.mp4, .webm, or .ogg</p>
        </div>
        <input
          id="dropzone-file"
          onChange={onChange}
          type="file"
          accept=".mp4,.webm,.ogg"
          className="hidden"
        />
      </label>

      <div className="flex flex-col items-center gap-2">
        <div className="flex gap-4">
          <button
            onClick={() => onExampleClick("/earth.mp4")}
            onMouseEnter={() => handleMouseEnter(earthVideoRef)}
            onMouseLeave={() => handleMouseLeave(earthVideoRef)}
            className="hover:border-foreground group relative h-20 w-32 overflow-hidden rounded-lg border border-[#171717]"
          >
            <video
              ref={earthVideoRef}
              className="h-full w-full object-cover"
              muted
              loop
              playsInline
            >
              <source src="/earth.mp4" type="video/mp4" />
            </video>
            <span className="absolute bottom-1 left-2 text-xs font-medium text-white drop-shadow-lg">
              Earth
            </span>
          </button>
          <button
            onClick={() => onExampleClick("/bunny.webm")}
            onMouseEnter={() => handleMouseEnter(bunnyVideoRef)}
            onMouseLeave={() => handleMouseLeave(bunnyVideoRef)}
            className="hover:border-foreground group relative h-20 w-32 overflow-hidden rounded-lg border border-[#171717]"
          >
            <video
              ref={bunnyVideoRef}
              className="h-full w-full object-cover"
              muted
              loop
              playsInline
              poster="/rabbit.png"
            >
              <source src="/bunny.webm" type="video/webm" />
            </video>
            <span className="absolute bottom-1 left-2 text-xs font-medium text-white drop-shadow-lg">
              Bunny
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
