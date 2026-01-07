import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'asusu-ohafia-offline';
const DB_VERSION = 1;

interface OfflineDB {
  attempts: {
    key: string;
    value: {
      id: string;
      userId: string;
      assetId: string;
      lessonId?: string;
      mode: 'speak' | 'read' | 'write' | 'listen';
      score: number;
      metadata?: Record<string, unknown>;
      createdAt: string;
      synced: boolean;
    };
    indexes: { 'by-synced': boolean };
  };
  lessonPacks: {
    key: string;
    value: {
      id: string;
      data: unknown;
      downloadedAt: string;
    };
  };
  audioCache: {
    key: string;
    value: {
      id: string;
      blob: Blob;
      cachedAt: string;
    };
  };
}

let dbInstance: IDBPDatabase<OfflineDB> | null = null;

export async function getOfflineDB(): Promise<IDBPDatabase<OfflineDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<OfflineDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Attempts store for offline progress tracking
      if (!db.objectStoreNames.contains('attempts')) {
        const attemptStore = db.createObjectStore('attempts', { keyPath: 'id' });
        attemptStore.createIndex('by-synced', 'synced');
      }

      // Lesson packs for offline learning
      if (!db.objectStoreNames.contains('lessonPacks')) {
        db.createObjectStore('lessonPacks', { keyPath: 'id' });
      }

      // Audio cache for offline playback
      if (!db.objectStoreNames.contains('audioCache')) {
        db.createObjectStore('audioCache', { keyPath: 'id' });
      }
    },
  });

  return dbInstance;
}

// Queue an attempt for later sync
export async function queueAttempt(attempt: Omit<OfflineDB['attempts']['value'], 'synced'>) {
  const db = await getOfflineDB();
  await db.put('attempts', { ...attempt, synced: false });
}

// Get all unsynced attempts
export async function getUnsyncedAttempts() {
  const db = await getOfflineDB();
  const all = await db.getAll('attempts');
  return all.filter(a => !a.synced);
}

// Mark attempts as synced
export async function markAttemptsSynced(ids: string[]) {
  const db = await getOfflineDB();
  const tx = db.transaction('attempts', 'readwrite');
  for (const id of ids) {
    const attempt = await tx.store.get(id);
    if (attempt) {
      await tx.store.put({ ...attempt, synced: true });
    }
  }
  await tx.done;
}

// Save lesson pack for offline use
export async function saveLessonPack(id: string, data: unknown) {
  const db = await getOfflineDB();
  await db.put('lessonPacks', {
    id,
    data,
    downloadedAt: new Date().toISOString(),
  });
}

// Get lesson pack
export async function getLessonPack(id: string) {
  const db = await getOfflineDB();
  return db.get('lessonPacks', id);
}

// Cache audio for offline playback
export async function cacheAudio(id: string, blob: Blob) {
  const db = await getOfflineDB();
  await db.put('audioCache', {
    id,
    blob,
    cachedAt: new Date().toISOString(),
  });
}

// Get cached audio
export async function getCachedAudio(id: string) {
  const db = await getOfflineDB();
  const cached = await db.get('audioCache', id);
  return cached?.blob;
}

// Clear old cached data
export async function clearOldCache(maxAgeDays: number = 7) {
  const db = await getOfflineDB();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - maxAgeDays);
  const cutoffStr = cutoff.toISOString();

  // Clear old synced attempts
  const attempts = await db.getAll('attempts');
  const tx = db.transaction('attempts', 'readwrite');
  for (const attempt of attempts) {
    if (attempt.synced && attempt.createdAt < cutoffStr) {
      await tx.store.delete(attempt.id);
    }
  }
  await tx.done;
}
