import { useState, useCallback } from 'react';
import type { Match } from '../types/match';

const HISTORY_KEY = 'gaa_stats_history';

export const useMatchHistory = () => {
  const [history, setHistory] = useState<Match[]>(() => {
    const saved = localStorage.getItem(HISTORY_KEY);
    if (!saved) return [];
    try {
      return JSON.parse(saved);
    } catch {
      return [];
    }
  });

  const saveHistory = useCallback((matches: Match[]) => {
    setHistory(matches);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(matches));
  }, []);

  const addToHistory = useCallback((match: Match) => {
    // Only add finished matches, avoid duplicates
    if (!match.isFinished) return;
    const exists = history.some(m => m.id === match.id);
    if (exists) {
      // Update existing match
      const updated = history.map(m => m.id === match.id ? match : m);
      saveHistory(updated);
    } else {
      // Add new match
      saveHistory([match, ...history]);
    }
  }, [history, saveHistory]);

  const deleteFromHistory = useCallback((matchId: string) => {
    const updated = history.filter(m => m.id !== matchId);
    saveHistory(updated);
  }, [history, saveHistory]);

  const clearHistory = useCallback(() => {
    saveHistory([]);
  }, [saveHistory]);

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
  }, []);

  // Import matches from JSON file
  const importHistory = useCallback((file: File): Promise<number> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          
          // Handle both single match and array of matches
          const matches: Match[] = Array.isArray(data) ? data : [data];
          
          // Validate and merge
          const validMatches = matches.filter(m => m && m.id && m.homeTeam && m.awayTeam);
          
          // Merge with existing, avoiding duplicates
          const existingIds = new Set(history.map(m => m.id));
          const newMatches = validMatches.filter(m => !existingIds.has(m.id));
          
          if (newMatches.length > 0) {
            saveHistory([...newMatches, ...history]);
          }
          
          resolve(newMatches.length);
        } catch (err) {
          reject(new Error('Invalid file format'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, [history, saveHistory]);

  return {
    history,
    addToHistory,
    deleteFromHistory,
    clearHistory,
    exportHistory,
    exportMatch,
    importHistory,
  };
};
