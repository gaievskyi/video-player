import React from "react"
import ReactDOM from "react-dom/client"
import "toolcool-range-slider"
import { App } from "./app2.tsx"
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
