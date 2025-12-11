import type { Squad, AttendanceEvent } from '../types/attendance';
import { checkStorageSpace, estimateDataSize } from './storage';

const DB_NAME = 'gaa_attendance_db';
const DB_VERSION = 3; // Increment version to fix events store index
const SQUADS_STORE = 'squads';
const EVENTS_STORE = 'events';

// Open/create the database
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;
      
      console.log(`Upgrading database from version ${oldVersion} to ${DB_VERSION}`);
      
      // For any upgrade, ensure we have clean stores with proper indexes
      // Delete old stores if they exist
      if (db.objectStoreNames.contains('squad')) {
        db.deleteObjectStore('squad');
      }
      
      // For version 2 -> 3 upgrade, recreate events store with proper index
      if (oldVersion > 0 && oldVersion < 3) {
        if (db.objectStoreNames.contains(EVENTS_STORE)) {
          db.deleteObjectStore(EVENTS_STORE);
        }
      }
      
      // Create squads store (multiple squads)
      if (!db.objectStoreNames.contains(SQUADS_STORE)) {
        const store = db.createObjectStore(SQUADS_STORE, { keyPath: 'id' });
        store.createIndex('teamName', 'teamName', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
      
      // Create events store with squadId index
      if (!db.objectStoreNames.contains(EVENTS_STORE)) {
        const store = db.createObjectStore(EVENTS_STORE, { keyPath: 'id' });
        store.createIndex('squadId', 'squadId', { unique: false });
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      console.error('Failed to open database:', request.error);
      reject(request.error);
    };
  });
};

// Get all squads
export const getAllSquads = async (): Promise<Squad[]> => {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SQUADS_STORE, 'readonly');
    const store = transaction.objectStore(SQUADS_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      const squads = request.result as Squad[];
      // Sort by name alphabetically
      squads.sort((a, b) => a.teamName.localeCompare(b.teamName));
      resolve(squads);
    };
    request.onerror = () => reject(request.error);
    
    transaction.oncomplete = () => db.close();
  });
};

// Get a specific squad by ID
export const getSquadById = async (squadId: string): Promise<Squad | null> => {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SQUADS_STORE, 'readonly');
    const store = transaction.objectStore(SQUADS_STORE);
    const request = store.get(squadId);

    request.onsuccess = () => {
      resolve(request.result || null);
    };
    request.onerror = () => reject(request.error);
    
    transaction.oncomplete = () => db.close();
  });
};

// Save a squad (create or update)
export const saveSquad = async (squad: Squad): Promise<void> => {
  // Check storage space before saving
  const dataSize = estimateDataSize(squad);
  const storageCheck = await checkStorageSpace(dataSize);
  
  if (!storageCheck.canStore) {
    throw new Error(storageCheck.message);
  }

  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(SQUADS_STORE, 'readwrite');
    const store = transaction.objectStore(SQUADS_STORE);
    const request = store.put(squad);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    
    transaction.oncomplete = () => db.close();
  });
};

// Delete a squad and all its events
export const deleteSquad = async (squadId: string): Promise<void> => {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SQUADS_STORE, EVENTS_STORE], 'readwrite');
    
    // Delete all events for this squad first
    const eventsStore = transaction.objectStore(EVENTS_STORE);
    
    // Check if the index exists before using it
    if (eventsStore.indexNames.contains('squadId')) {
      const eventsIndex = eventsStore.index('squadId');
      const eventsRequest = eventsIndex.openCursor(IDBKeyRange.only(squadId));
      
      eventsRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
      
      eventsRequest.onerror = (e) => {
        console.error('Error deleting events:', e);
      };
    }
    
    // Delete the squad
    const squadsStore = transaction.objectStore(SQUADS_STORE);
    const deleteRequest = squadsStore.delete(squadId);
    
    deleteRequest.onerror = (e) => {
      console.error('Error deleting squad:', e);
    };
    
    transaction.oncomplete = () => {
      db.close();
      resolve();
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
};

// Get all events for a specific squad
export const getEventsBySquad = async (squadId: string): Promise<AttendanceEvent[]> => {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(EVENTS_STORE, 'readonly');
    const store = transaction.objectStore(EVENTS_STORE);
    
    // Check if squadId index exists
    if (store.indexNames.contains('squadId')) {
      const index = store.index('squadId');
      const request = index.getAll(squadId);

      request.onsuccess = () => {
        const events = request.result as AttendanceEvent[];
        // Sort by date descending (newest first)
        events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        resolve(events);
      };
      request.onerror = () => reject(request.error);
    } else {
      // Fallback: get all events and filter by squadId
      const request = store.getAll();
      
      request.onsuccess = () => {
        const allEvents = request.result as AttendanceEvent[];
        const events = allEvents.filter(e => e.squadId === squadId);
        events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        resolve(events);
      };
      request.onerror = () => reject(request.error);
    }
    
    transaction.oncomplete = () => db.close();
  });
};

// Save an attendance event
export const saveEvent = async (event: AttendanceEvent): Promise<void> => {
  // Check storage space before saving
  const dataSize = estimateDataSize(event);
  const storageCheck = await checkStorageSpace(dataSize);
  
  if (!storageCheck.canStore) {
    throw new Error(storageCheck.message);
  }

  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(EVENTS_STORE, 'readwrite');
    const store = transaction.objectStore(EVENTS_STORE);
    const request = store.put(event);

    request.onsuccess = () => {
      console.log('Event saved successfully:', event.id);
      resolve();
    };
    request.onerror = () => {
      console.error('Failed to save event:', request.error);
      reject(request.error);
    };
    
    transaction.oncomplete = () => db.close();
    transaction.onerror = () => {
      console.error('Transaction error saving event:', transaction.error);
    };
  });
};

// Delete an attendance event
export const deleteEvent = async (eventId: string): Promise<void> => {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(EVENTS_STORE, 'readwrite');
    const store = transaction.objectStore(EVENTS_STORE);
    const request = store.delete(eventId);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    
    transaction.oncomplete = () => db.close();
  });
};

// Check if IndexedDB is available
export const isAttendanceDBAvailable = (): boolean => {
  return typeof indexedDB !== 'undefined';
};

// Legacy function for backwards compatibility - get first squad
export const getSquad = async (): Promise<Squad | null> => {
  const squads = await getAllSquads();
  return squads.length > 0 ? squads[0] : null;
};

// Legacy function - get all events (for backwards compatibility)
export const getAllEvents = async (): Promise<AttendanceEvent[]> => {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(EVENTS_STORE, 'readonly');
    const store = transaction.objectStore(EVENTS_STORE);
    const request = store.getAll();

    request.onsuccess = () => {
      const events = request.result as AttendanceEvent[];
      events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      resolve(events);
    };
    request.onerror = () => reject(request.error);
    
    transaction.oncomplete = () => db.close();
  });
};
