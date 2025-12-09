import { useState, useCallback, useEffect } from 'react';
import type { Match } from '../types/match';
import {
  getAllMatches,
  saveMatch,
  deleteMatch as deleteMatchFromDB,
  saveMultipleMatches,
  isIndexedDBAvailable,
} from '../utils/indexedDB';

const LAST_BACKUP_KEY = 'gaa_stats_last_backup';

export const useMatchHistoryDB = () => {
  const [history, setHistory] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(() => {
    return localStorage.getItem(LAST_BACKUP_KEY);
  });

  // Load matches from IndexedDB on mount
  useEffect(() => {
    const loadMatches = async () => {
      if (!isIndexedDBAvailable()) {
        setError('IndexedDB is not available in this browser');
        setIsLoading(false);
        return;
      }

      try {
        const matches = await getAllMatches();
        setHistory(matches);
        setError(null);
      } catch (err) {
        console.error('Failed to load matches from IndexedDB:', err);
        setError('Failed to load match history');
      } finally {
        setIsLoading(false);
      }
    };

    loadMatches();
  }, []);

  // Add a match to history
  const addToHistory = useCallback(async (match: Match) => {
    if (!match.isFinished) return;

    try {
      await saveMatch(match);
      setHistory((prev) => {
        const exists = prev.some((m) => m.id === match.id);
        if (exists) {
          return prev.map((m) => (m.id === match.id ? match : m));
        }
        return [match, ...prev];
      });
      setError(null);
    } catch (err) {
      console.error('Failed to save match:', err);
      setError('Failed to save match');
    }
  }, []);

  // Delete a match from history
  const deleteFromHistory = useCallback(async (matchId: string) => {
    try {
      await deleteMatchFromDB(matchId);
      setHistory((prev) => prev.filter((m) => m.id !== matchId));
      setError(null);
    } catch (err) {
      console.error('Failed to delete match:', err);
      setError('Failed to delete match');
    }
  }, []);

  // Clear all history
  const clearHistory = useCallback(async () => {
    try {
      const { clearAllMatches } = await import('../utils/indexedDB');
      await clearAllMatches();
      setHistory([]);
      setError(null);
    } catch (err) {
      console.error('Failed to clear history:', err);
      setError('Failed to clear history');
    }
  }, []);

  // Export all matches as JSON file
  const exportHistory = useCallback(() => {
    const data = JSON.stringify(history, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sideline-iq-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Track backup date
    const now = new Date().toISOString();
    localStorage.setItem(LAST_BACKUP_KEY, now);
    setLastBackupDate(now);
  }, [history]);

  // Export single match as JSON file
  const exportMatch = useCallback((match: Match) => {
    const data = JSON.stringify(match, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = new Date(match.date).toISOString().split('T')[0];
    a.download = `${match.homeTeam}-vs-${match.awayTeam}-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    // Track backup date
    const now = new Date().toISOString();
    localStorage.setItem(LAST_BACKUP_KEY, now);
    setLastBackupDate(now);
  }, []);

  // Import matches from JSON file
  const importHistory = useCallback(async (file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);

          // Handle both single match and array of matches
          const matches: Match[] = Array.isArray(data) ? data : [data];

          // Validate matches
          const validMatches = matches.filter(
            (m) => m && m.id && m.homeTeam && m.awayTeam
          );

          if (validMatches.length === 0) {
            reject(new Error('No valid matches found in file'));
            return;
          }

          // Save to IndexedDB
          const addedCount = await saveMultipleMatches(validMatches);

          // Reload history from DB to get accurate state
          const updatedHistory = await getAllMatches();
          setHistory(updatedHistory);

          resolve(addedCount);
        } catch (err) {
          reject(new Error('Invalid file format'));
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, []);

  return {
    history,
    isLoading,
    error,
    lastBackupDate,
    addToHistory,
    deleteFromHistory,
    clearHistory,
    exportHistory,
    exportMatch,
    importHistory,
  };
};
