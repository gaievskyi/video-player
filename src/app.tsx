import { VideoEditor } from "~/components/video-editor"
import { Router } from "~/lib/router"
import { PWAUpdater } from "./components/pwa-updater"

export const App = () => {
  return (
    <>
      <Router
        routes={[
          {
            path: "/",
            element: <VideoEditor />,
          },
          {
            path: "/videos/:id",
            element: <VideoEditor />,
          },
        ]}
      />
      <PWAUpdater />
    </>
  )
}
