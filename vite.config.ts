import { defineConfig } from 'vite'
import path from "path"
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    conditions: ["browser", "development", "production"],
    alias: {
      "~": path.resolve(new URL(".", import.meta.url).pathname, "./src/"),
    },
  },
})
