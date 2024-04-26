import { VideoUpload } from "~/components/video-upload"

export const App = () => {
  return (
    <div className="flex h-[100svh] w-[100vw] flex-col items-center justify-center gap-6">
      <VideoUpload />
    </div>
  )
}
