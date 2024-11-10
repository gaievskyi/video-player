export type SupportedFormat = "webm" | "mp4"

export function checkCodecSupport() {
  const types = {
    webm: "video/webm;codecs=vp8,opus",
    mp4: "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
  } as const

  return {
    webm: MediaRecorder.isTypeSupported(types.webm),
    mp4: MediaRecorder.isTypeSupported(types.mp4),
  }
}
