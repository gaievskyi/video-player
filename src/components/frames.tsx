import { useContextSelector } from "use-context-selector"
import { VideoEditorContext } from "./video-editor-context"

export const Frames = () => {
  const frames = useContextSelector(VideoEditorContext, (state) => state.frames)
  return frames.map((frame) => (
    <img
      draggable={false}
      key={frame.id}
      src={frame.src}
      alt="Frame"
      className="pointer-events-none max-w-[25px] select-none object-cover first-of-type:rounded-l-xl last-of-type:rounded-r-xl"
    />
  ))
}
