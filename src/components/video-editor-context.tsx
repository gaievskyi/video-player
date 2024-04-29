import type { PropsWithChildren } from "react"
import { createContext, useContext } from "use-context-selector"
import { videoFileRegex } from "~/lib/utils"
import type { Frame } from "~/lib/video-to-frames"

export type VideoEditorContext = {
  fileName: string
  extension: string
  frames: Array<Frame>
}

export const VideoEditorContext = createContext<VideoEditorContext>({
  fileName: "",
  extension: "",
  frames: [],
})

export const useVideoEditorContext = () => useContext(VideoEditorContext)

type VideoEditorContextProviderProps = PropsWithChildren & {
  value: Omit<VideoEditorContext, "extension">
}

export const VideoEditorContextProvider = ({
  children,
  value,
}: VideoEditorContextProviderProps) => {
  const { fileName } = value
  const [extension] = fileName.match(videoFileRegex) ?? []
  if (!extension)
    throw new Error(
      "Filename prop must include extension (.mp4, .webm, or .ogg)",
    )
  return (
    <VideoEditorContext.Provider
      value={{
        ...value,
        extension,
      }}
    >
      {children}
    </VideoEditorContext.Provider>
  )
}
