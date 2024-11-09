import { VideoEditor } from "~/components/video-editor"
import { Router } from "~/lib/router"

export const App = () => (
  <Router
    routes={[
      { path: "/", element: <VideoEditor /> },
      { path: "/videos/:id", element: <VideoEditor /> },
    ]}
  />
)
