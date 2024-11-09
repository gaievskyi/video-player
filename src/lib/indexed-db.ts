const DB_NAME = "video-editor"
const DB_VERSION = 4
const STORE_NAME = "uploaded-videos"

export type UploadedVideo = {
  id: string
  src: string
  filename: string
  videoBlob: Blob
  lastModified: number
  createdAt: string
}

export class IndexedDBService {
  private db: IDBDatabase | null = null
  private initPromise: Promise<void> | null = null

  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise

    this.initPromise = new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        if (db.objectStoreNames.contains(STORE_NAME)) {
          db.deleteObjectStore(STORE_NAME)
        }

        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" })
        store.createIndex("filename", "filename", { unique: true })
      }
    })

    return this.initPromise
  }

  async saveVideo(video: UploadedVideo): Promise<void> {
    if (!this.db) await this.init()

    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite")
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index("filename")

      const getRequest = index.get(video.filename)

      getRequest.onsuccess = () => {
        const existingVideo = getRequest.result
        if (existingVideo) {
          const deleteRequest = store.delete(existingVideo.id)
          deleteRequest.onsuccess = () => {
            const addRequest = store.add(video)
            addRequest.onerror = () => reject(addRequest.error)
            addRequest.onsuccess = () => resolve()
          }
          deleteRequest.onerror = () => reject(deleteRequest.error)
        } else {
          const addRequest = store.add(video)
          addRequest.onerror = () => reject(addRequest.error)
          addRequest.onsuccess = () => resolve()
        }
      }

      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  async getVideo(filename: string): Promise<UploadedVideo | null> {
    if (!this.db) await this.init()

    return new Promise<UploadedVideo | null>((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readonly")
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index("filename")
      const request = index.get(decodeURIComponent(filename))

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || null)
    })
  }

  async clearVideo(filename: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite")
      const store = transaction.objectStore(STORE_NAME)
      const index = store.index("filename")

      const getRequest = index.get(filename)

      getRequest.onsuccess = () => {
        const video = getRequest.result
        if (video) {
          const deleteRequest = store.delete(video.id)
          deleteRequest.onerror = () => reject(deleteRequest.error)
          deleteRequest.onsuccess = () => resolve()
        } else {
          resolve()
        }
      }

      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  async getAllVideos(): Promise<UploadedVideo[]> {
    if (!this.db) await this.init()

    return new Promise<UploadedVideo[]>((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readonly")
      const store = transaction.objectStore(STORE_NAME)
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || [])
    })
  }
}

export const dbService = new IndexedDBService()
