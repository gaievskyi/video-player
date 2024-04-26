import { useState, type ChangeEventHandler } from "react"

type VideoUploadProps = {}

export const VideoUpload = ({}: VideoUploadProps) => {
  const [source, setSource] = useState("")

  const handleFileChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    const file = event.target.files?.item(0)
    if (file instanceof File) {
      const url = URL.createObjectURL(file)
      setSource(url)
    }
  }

  return (
    <>
      <label
        htmlFor="dropzone-file"
        className="bg-card hover:bg-card/80 flex h-32 w-64 cursor-pointer flex-col items-center justify-center rounded-xl transition-colors"
      >
        <div className="flex flex-col items-center justify-center pb-6 pt-5">
          <svg
            className="mb-4 h-8 w-8 text-gray-500 dark:text-gray-400"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 20 16"
          >
            <path
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
            />
          </svg>
          <p className="mb-2 text-sm font-bold text-gray-500 dark:text-gray-400">
            Open video
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">.mov, .mp4</p>
        </div>
        <input
          id="dropzone-file"
          onChange={handleFileChange}
          type="file"
          accept=".mov,.mp4"
          className="hidden"
        />
      </label>
      {source && <video width="50%" controls src={source} />}
    </>
  )
}
