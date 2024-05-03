import React from "react"
import ReactDOM from "react-dom/client"
import { App } from "./app.tsx"
import "./index.css"

const root = document.getElementById("root")

if (!root) {
  throw new Error("App is not attached to the #root element.")
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
