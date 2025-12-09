import type { Match } from '../types/match';
import type { Squad, AttendanceEvent } from '../types/attendance';
import { getAllMatches, saveMatch, clearAllMatches } from './indexedDB';
import { getAllSquads, getAllEvents, saveSquad, saveEvent, deleteSquad } from './attendanceDB';

const BACKUP_VERSION = 1;
const LAST_BACKUP_KEY = 'gaa_stats_last_backup';

export interface BackupData {
  version: number;
  exportDate: string;
  appName: string;
  matchHistory: Match[];
  squads: Squad[];
  attendanceEvents: AttendanceEvent[];
}

export interface ImportResult {
  success: boolean;
  matchesImported: number;
  squadsImported: number;
  eventsImported: number;
  errors: string[];
}

// Get the last backup date
export const getLastBackupDate = (): string | null => {
  return localStorage.getItem(LAST_BACKUP_KEY);
};

// Set the last backup date
const setLastBackupDate = (): void => {
  localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());
};

// Export all data to a JSON file
export const exportAllData = async (): Promise<void> => {
  try {
    // Gather all data
    const [matchHistory, squads, attendanceEvents] = await Promise.all([
      getAllMatches(),
      getAllSquads(),
      getAllEvents(),
    ]);

    const backupData: BackupData = {
      version: BACKUP_VERSION,
      exportDate: new Date().toISOString(),
      appName: 'Sideline IQ',
      matchHistory,
      squads,
      attendanceEvents,
    };

    // Create and download file
    const data = JSON.stringify(backupData, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sideline-iq-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Track backup date
    setLastBackupDate();
  } catch (error) {
    console.error('Failed to export data:', error);
    throw new Error('Failed to export data');
  }
};

// Validate backup data structure
const validateBackupData = (data: unknown): data is BackupData => {
  if (typeof data !== 'object' || data === null) return false;
  
  const obj = data as Record<string, unknown>;
  
  // Check required fields
  if (typeof obj.version !== 'number') return false;
  if (!Array.isArray(obj.matchHistory)) return false;
  if (!Array.isArray(obj.squads)) return false;
  if (!Array.isArray(obj.attendanceEvents)) return false;
  
  return true;
};

// Import data from a JSON backup file
export const importAllData = async (
  file: File,
  options: { 
    mergeData?: boolean; // If true, adds to existing data. If false, replaces all data.
  } = { mergeData: true }
): Promise<ImportResult> => {
  const result: ImportResult = {
    success: false,
    matchesImported: 0,
    squadsImported: 0,
    eventsImported: 0,
    errors: [],
  };

  try {
    // Read and parse file
    const text = await file.text();
    let data: unknown;
    
    try {
      data = JSON.parse(text);
    } catch {
      result.errors.push('Invalid JSON file');
      return result;
    }

    // Validate structure
    if (!validateBackupData(data)) {
      result.errors.push('Invalid backup file format');
      return result;
    }

    // Check version compatibility
    if (data.version > BACKUP_VERSION) {
      result.errors.push(`Backup version ${data.version} is newer than supported version ${BACKUP_VERSION}`);
      return result;
    }

    // If not merging, clear existing data first
    if (!options.mergeData) {
      try {
        // Clear matches
        await clearAllMatches();
        
        // Clear squads (this also clears their events)
        const existingSquads = await getAllSquads();
        for (const squad of existingSquads) {
          await deleteSquad(squad.id);
        }
      } catch (err) {
        result.errors.push('Failed to clear existing data');
        console.error('Clear error:', err);
      }
    }

    // Import matches
    for (const match of data.matchHistory) {
      try {
        await saveMatch(match);
        result.matchesImported++;
      } catch (err) {
        result.errors.push(`Failed to import match: ${match.homeTeam} vs ${match.awayTeam}`);
        console.error('Match import error:', err);
      }
    }

    // Import squads
    for (const squad of data.squads) {
      try {
        await saveSquad(squad);
        result.squadsImported++;
      } catch (err) {
        result.errors.push(`Failed to import squad: ${squad.teamName}`);
        console.error('Squad import error:', err);
      }
    }

    // Import attendance events
    for (const event of data.attendanceEvents) {
      try {
        await saveEvent(event);
        result.eventsImported++;
      } catch (err) {
        result.errors.push(`Failed to import event: ${event.name}`);
        console.error('Event import error:', err);
      }
    }

    result.success = result.errors.length === 0;
    
    // Update backup date on successful import
    if (result.success) {
      setLastBackupDate();
    }

    return result;
  } catch (error) {
    result.errors.push('Failed to read backup file');
    console.error('Import error:', error);
    return result;
  }
};

// Get summary of current data for display
export const getDataSummary = async (): Promise<{
  matchCount: number;
  squadCount: number;
  eventCount: number;
}> => {
  try {
    const [matches, squads, events] = await Promise.all([
      getAllMatches(),
      getAllSquads(),
      getAllEvents(),
    ]);

    return {
      matchCount: matches.length,
      squadCount: squads.length,
      eventCount: events.length,
    };
  } catch (error) {
    console.error('Failed to get data summary:', error);
    return { matchCount: 0, squadCount: 0, eventCount: 0 };
  }
};
