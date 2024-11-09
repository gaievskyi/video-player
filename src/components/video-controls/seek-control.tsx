type SeekControlProps  = {
  start: number
  onInput: React.FormEventHandler
  onMouseDown: React.MouseEventHandler
  onMouseUp: React.MouseEventHandler
  seekRef: React.RefObject<HTMLInputElement>
}

export const SeekControl = ({
  start,
  onInput,
  onMouseDown,
  onMouseUp,
  seekRef,
}: SeekControlProps) => {
  return (
    <input
      id="seek"
      min="0"
      max="100"
      step="0.01"
      defaultValue={start.toString()}
      type="range"
      ref={seekRef}
      onInput={onInput}
      onMouseDown={onMouseDown}
      onMouseUp={onMouseUp}
      className="seek absolute z-10"
    />
  )
}