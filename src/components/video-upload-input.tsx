import type { ComponentProps } from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { AttachFileIcon } from "~/components/icons/attach-file-icon"
import { TrashIcon } from "~/components/icons/trash-icon"
import type { UploadedVideo } from "~/lib/indexed-db"
import { videoService } from "~/lib/video-service"

const EXAMPLE_VIDEOS = {
  bunny: {
    id: "bunny",
    src: "/bunny.webm",
    filename: "bunny.webm",
    poster: "/rabbit.png",
  },
  earth: {
    id: "earth",
    src: "/earth.mp4",
    filename: "earth.mp4",
  },
  example: {
    id: "example",
    src: "/example.MOV",
    filename: "example.MOV",
  },
} as const

type VideoUploadInputProps = ComponentProps<"input"> & {
  onExampleClick: (filename: string) => void
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

export const VideoUploadInput = ({
  onChange,
  onExampleClick,
}: VideoUploadInputProps) => {
  const earthVideoRef = useRef<HTMLVideoElement>(null)
  const bunnyVideoRef = useRef<HTMLVideoElement>(null)
  const [uploadedVideos, setUploadedVideos] = useState<UploadedVideo[]>([])

  const loadUploadedVideos = async () => {
    try {
      const videos = await videoService.getAllVideos()
      setUploadedVideos(videos)
    } catch (error) {
      console.error("Failed to load uploaded videos:", error)
    }
  }

  useEffect(() => {
    loadUploadedVideos()
  }, [])

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    await onChange(event)
    // Refresh the list after upload
    await loadUploadedVideos()
  }

  const handleVideoHover = useCallback((filename: string) => {
    videoService.preloadVideo(filename).catch(console.error)
  }, [])

  const handleMouseLeave = (videoRef: React.RefObject<HTMLVideoElement>) => {
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
      videoRef.current.load()
    }
  }

  const handleMouseEnter = useCallback(
    (videoRef: React.RefObject<HTMLVideoElement>, filename?: string) => {
      if (videoRef.current) {
        videoRef.current.play()
      }
      if (filename) {
        handleVideoHover(filename)
      }
    },
    [handleVideoHover],
  )

  const handleDelete = async (e: React.MouseEvent, filename: string) => {
    e.preventDefault() // Prevent triggering the parent button click
    e.stopPropagation() // Prevent event bubbling

    try {
      await videoService.deleteVideo(filename)
      // Refresh the list after deletion
      await loadUploadedVideos()
    } catch (error) {
      console.error("Failed to delete video:", error)
    }
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <label
        htmlFor="dropzone-file"
        className="group flex h-48 w-80 flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#171717] bg-card transition-all hover:border-gray-400 hover:bg-card/80"
      >
        <div className="flex flex-col items-center justify-center px-6 text-center">
          <AttachFileIcon />
          <p className="mb-2 text-sm font-semibold text-gray-200">Open video</p>
          <p className="text-xs text-gray-400">
            Drag and drop or click to select
          </p>
          <p className="mt-1 text-xs text-gray-500">.mp4 or .webm</p>
        </div>
        <input
          id="dropzone-file"
          onChange={handleFileChange}
          type="file"
          accept=".mp4,.webm"
          className="hidden"
        />
      </label>

      <div className="flex flex-col items-center gap-3">
        <span className="text-sm text-gray-400">Try an example</span>
        <div className="flex gap-4">
          <button
            onClick={() => onExampleClick(EXAMPLE_VIDEOS.earth.filename)}
            onMouseEnter={() =>
              handleMouseEnter(earthVideoRef, EXAMPLE_VIDEOS.earth.filename)
            }
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
              <source src={EXAMPLE_VIDEOS.earth.src} type="video/mp4" />
            </video>
            <span className="absolute bottom-1 left-2 bg-black/50 text-xs font-medium mix-blend-difference drop-shadow-lg">
              Earth
            </span>
          </button>
          <button
            onClick={() => onExampleClick(EXAMPLE_VIDEOS.bunny.filename)}
            onMouseEnter={() =>
              handleMouseEnter(bunnyVideoRef, EXAMPLE_VIDEOS.bunny.filename)
            }
            onMouseLeave={() => handleMouseLeave(bunnyVideoRef)}
            className="hover:border-foreground group relative h-20 w-32 overflow-hidden rounded-lg border border-[#171717]"
          >
            <video
              ref={bunnyVideoRef}
              className="h-full w-full object-cover"
              muted
              loop
              playsInline
              poster={EXAMPLE_VIDEOS.bunny.poster}
            >
              <source src={EXAMPLE_VIDEOS.bunny.src} type="video/webm" />
            </video>
            <span className="absolute bottom-1 left-2 bg-black/50 text-xs font-medium mix-blend-difference drop-shadow-lg">
              Bunny
            </span>
          </button>
          <button
            onClick={() => onExampleClick(EXAMPLE_VIDEOS.example.filename)}
            className="hover:border-foreground group relative h-20 w-32 overflow-hidden rounded-lg border border-[#171717]"
          >
            <span>Example</span>
          </button>
        </div>
      </div>

      {uploadedVideos.length > 0 && (
        <div className="flex w-full max-w-2xl flex-col items-center gap-4">
          <span className="text-sm text-gray-400">Your uploads</span>
          <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3">
            {uploadedVideos.map((video) => (
              <div
                key={video.id}
                className="group relative aspect-video w-full overflow-hidden rounded-lg border border-[#171717] bg-black/20 transition-all hover:border-gray-500 hover:ring-1 hover:ring-gray-500"
              >
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onExampleClick(video.filename)}
                  onMouseEnter={() => handleVideoHover(video.filename)}
                  className="h-full w-full cursor-pointer"
                >
                  <video className="h-full w-full object-cover" muted playsInline>
                    <source src={video.src} type="video/mp4" />
                  </video>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-2">
                    <div className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-medium text-white">
                        {video.filename}
                      </span>
                      <span className="text-[10px] text-gray-300">
                        {new Date(video.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, video.filename)}
                      className="ml-2 rounded-full p-1.5 text-gray-300 opacity-0 transition-all hover:bg-white/10 hover:text-white group-hover:opacity-100"
                      title="Remove video"
                    >
                      <TrashIcon />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
