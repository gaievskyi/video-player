const DB_NAME = "video-editor"
const DB_VERSION = 1
const STORE_NAME = "editor-state"

export type EditorState = {
  src: string
  filename: string
  videoBlob?: Blob
  lastModified: number
}

export class IndexedDBService {
  private db: IDBDatabase | null = null

  async init(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME)
        }
      }
    })
  }

  async saveState(state: EditorState): Promise<void> {
    if (!this.db) await this.init()

    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite")
      const store = transaction.objectStore(STORE_NAME)
      const request = store.put(state, "currentState")

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async getState(): Promise<EditorState | null> {
    if (!this.db) await this.init()

    return new Promise<EditorState | null>((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readonly")
      const store = transaction.objectStore(STORE_NAME)
      const request = store.get("currentState")

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || null)
    })
  }

  async clearState(): Promise<void> {
    if (!this.db) await this.init()

    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], "readwrite")
      const store = transaction.objectStore(STORE_NAME)
      const request = store.delete("currentState")

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }
}

export const dbService = new IndexedDBService()
