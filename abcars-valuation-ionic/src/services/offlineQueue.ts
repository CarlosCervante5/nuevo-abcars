import {
  OfflineQueueItem,
  OFFLINE_DB_NAME,
  OFFLINE_QUEUE_STORE,
  OFFLINE_BLOBS_STORE,
} from './offlineQueue.types';

const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(OFFLINE_QUEUE_STORE)) {
        db.createObjectStore(OFFLINE_QUEUE_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(OFFLINE_BLOBS_STORE)) {
        db.createObjectStore(OFFLINE_BLOBS_STORE, { keyPath: 'id' });
      }
    };
  });
}

function withStore<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> {
  return openDB().then((db) => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction([OFFLINE_QUEUE_STORE, OFFLINE_BLOBS_STORE], mode);
      const store = tx.objectStore(OFFLINE_QUEUE_STORE);
      const req = fn(store);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      tx.oncomplete = () => db.close();
    });
  });
}

export const offlineQueue = {
  /** Añadir ítem a la cola (payload puede incluir imageBase64 para upload_image). */
  async add(item: Omit<OfflineQueueItem, 'createdAt'>): Promise<void> {
    const full: OfflineQueueItem = {
      ...item,
      createdAt: Date.now(),
    };
    return openDB().then((db) => {
      return new Promise((resolve, reject) => {
        const tx = db.transaction(OFFLINE_QUEUE_STORE, 'readwrite');
        const store = tx.objectStore(OFFLINE_QUEUE_STORE);
        const req = store.add(full);
        req.onsuccess = () => {
          db.close();
          resolve();
        };
        req.onerror = () => reject(req.error);
      });
    });
  },

  /** Obtener todos los ítems ordenados por createdAt. */
  async getAll(): Promise<OfflineQueueItem[]> {
    return openDB().then((db) => {
      return new Promise((resolve, reject) => {
        const tx = db.transaction(OFFLINE_QUEUE_STORE, 'readonly');
        const store = tx.objectStore(OFFLINE_QUEUE_STORE);
        const req = store.getAll();
        req.onsuccess = () => {
          const items = (req.result as OfflineQueueItem[]).sort(
            (a, b) => a.createdAt - b.createdAt
          );
          db.close();
          resolve(items);
        };
        req.onerror = () => reject(req.error);
      });
    });
  },

  /** Eliminar ítem por id. */
  async remove(id: string): Promise<void> {
    return openDB().then((db) => {
      return new Promise((resolve, reject) => {
        const tx = db.transaction(OFFLINE_QUEUE_STORE, 'readwrite');
        const store = tx.objectStore(OFFLINE_QUEUE_STORE);
        const req = store.delete(id);
        req.onsuccess = () => {
          db.close();
          resolve();
        };
        req.onerror = () => reject(req.error);
      });
    });
  },

  /** Contar ítems pendientes. */
  async count(): Promise<number> {
    const items = await this.getAll();
    return items.length;
  },
};

/** Generar id único para ítems de la cola. */
export function generateQueueId(): string {
  return `q_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}
