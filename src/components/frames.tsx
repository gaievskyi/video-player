import { useFrames } from "./video-editor-context"

export const Frames = () => {
  const frames = useFrames()
  return frames.map((frame) => (
    <img
      draggable={false}
      key={frame.id}
      src={frame.src}
      alt="Frame"
      className="pointer-events-none max-w-[20px] select-none overflow-clip object-cover first-of-type:rounded-l-xl last-of-type:rounded-r-xl sm:max-w-[30px]"
    />
  ))
}
