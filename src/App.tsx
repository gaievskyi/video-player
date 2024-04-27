import { VideoEditor } from "~/components/video-editor"

export const App = () => {
  return (
    <div className="relative flex min-h-[100svh] w-[100vw] flex-col items-center justify-center">
      <VideoEditor />
    </div>
  )
}
