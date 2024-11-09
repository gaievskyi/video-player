import type { PropsWithChildren } from "react"
import {
  createContext,
  useContext,
  useContextSelector,
} from "use-context-selector"
import type { Frame } from "~/lib/video-to-frames"

export type VideoEditorContext = {
  frames: Array
  src: string
  onReset: () => void
}

export const VideoEditorContext = createContext<VideoEditorContext>({
  frames: [],
  src: "",
  onReset: () => {},
})

export const useVideoEditorContext = () => useContext(VideoEditorContext)
export const useFrames = () =>
  useContextSelector(VideoEditorContext, (state) => state.frames)

type VideoEditorContextProviderProps = PropsWithChildren & {
  value: VideoEditorContext
}

export const VideoEditorContextProvider = ({
  children,
  value,
}: VideoEditorContextProviderProps) => {
  return (
    <VideoEditorContext.Provider
      value={{
        ...value,
      }}
    >
      {children}
    </VideoEditorContext.Provider>
  )
}
