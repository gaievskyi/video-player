import { StrictMode } from "react"
import ReactDOM from "react-dom/client"
import { App } from "./app.tsx"
import "./index.css"
import { NuqsAdapter } from "nuqs/adapters/react"

const root = document.getElementById("root")

if (!root) {
  throw new Error("App is not attached to the #root element.")
}

ReactDOM.createRoot(root).render(
  <StrictMode>
    <NuqsAdapter>
      <App />
    </NuqsAdapter>
  </StrictMode>,
)
