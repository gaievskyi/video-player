import { useFrames } from "./video-editor-context"

export const Frames = () => {
  const frames = useFrames()
  return frames.map((frame) => (
    <img
      draggable={false}
      key={frame.id}
      src={frame.src}
      alt="Frame"
      className="xs:max-w-[32px] pointer-events-none max-w-[23px] select-none object-cover first-of-type:rounded-l-xl last-of-type:rounded-r-xl"
    />
  ))
}
