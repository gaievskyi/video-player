import { useVideoEditorContext } from "./video-editor-context"

export const VideoPreviewHeader = () => {
  const { extension, fileName } = useVideoEditorContext()
  const fileNameWithoutExtension = extension
    ? fileName.replace(extension, "")
    : fileName

  return (
    <div className="inline-flex text-center">
      <span className="max-w-[200px] truncate">{fileNameWithoutExtension}</span>
      <span>{extension}</span>
    </div>
  )
}
