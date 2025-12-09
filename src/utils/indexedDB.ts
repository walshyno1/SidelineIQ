import type { Match } from '../types/match';

const DB_NAME = 'gaa_stats_db';
const DB_VERSION = 1;
const STORE_NAME = 'matches';

// Open/create the database
const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    // Called when database is first created or version changes
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create the matches store if it doesn't exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        
        // Create indexes for common queries
        store.createIndex('date', 'date', { unique: false });
        store.createIndex('homeTeam', 'homeTeam', { unique: false });
        store.createIndex('awayTeam', 'awayTeam', { unique: false });
        store.createIndex('isFinished', 'isFinished', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Get all matches from the database
export const getAllMatches = async (): Promise<Match[]> => {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      // Sort by date descending (newest first)
      const matches = request.result as Match[];
      matches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      resolve(matches);
    };
    request.onerror = () => reject(request.error);
    
    transaction.oncomplete = () => db.close();
  });
};

// Get a single match by ID
export const getMatchById = async (id: string): Promise<Match | undefined> => {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result as Match | undefined);
    request.onerror = () => reject(request.error);
    
    transaction.oncomplete = () => db.close();
  });
};

// Add or update a match
export const saveMatch = async (match: Match): Promise<void> => {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(match); // put() adds or updates

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    
    transaction.oncomplete = () => db.close();
  });
};

// Add multiple matches (for import)
export const saveMultipleMatches = async (matches: Match[]): Promise<number> => {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    let addedCount = 0;

    matches.forEach((match) => {
      const request = store.put(match);
      request.onsuccess = () => addedCount++;
    });

    transaction.oncomplete = () => {
      db.close();
      resolve(addedCount);
    };
    transaction.onerror = () => reject(transaction.error);
  });
};

// Delete a match by ID
export const deleteMatch = async (id: string): Promise<void> => {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    
    transaction.oncomplete = () => db.close();
  });
};

// Clear all matches
export const clearAllMatches = async (): Promise<void> => {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    
    transaction.oncomplete = () => db.close();
  });
};

// Get matches by team name (home or away)
export const getMatchesByTeam = async (teamName: string): Promise<Match[]> => {
  const allMatches = await getAllMatches();
  return allMatches.filter(
    (match) => 
      match.homeTeam.toLowerCase().includes(teamName.toLowerCase()) ||
      match.awayTeam.toLowerCase().includes(teamName.toLowerCase())
  );
};

// Get match count
export const getMatchCount = async (): Promise<number> => {
  const db = await openDB();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.count();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    
    transaction.oncomplete = () => db.close();
  });
};

// Check if IndexedDB is available
export const isIndexedDBAvailable = (): boolean => {
  return typeof indexedDB !== 'undefined';
};
