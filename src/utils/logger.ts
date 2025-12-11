// Logging utility with persistent storage for debugging

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  data?: unknown;
}

const LOG_STORAGE_KEY = 'gaa_stats_logs';
const MAX_LOG_ENTRIES = 200;

// Check if we're in development mode
const isDev = import.meta.env.DEV;

/**
 * Get all stored logs
 */
export const getLogs = (): LogEntry[] => {
  try {
    const stored = localStorage.getItem(LOG_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
};

/**
 * Save logs to storage
 */
const saveLogs = (logs: LogEntry[]): void => {
  try {
    // Keep only the most recent entries
    const trimmedLogs = logs.slice(-MAX_LOG_ENTRIES);
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(trimmedLogs));
  } catch (error) {
    // If storage fails, log to console only
    console.error('Failed to save logs:', error);
  }
};

/**
 * Add a log entry
 */
const addLog = (level: LogLevel, component: string, message: string, data?: unknown): void => {
  const entry: LogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    level,
    component,
    message,
    data: data !== undefined ? data : undefined,
  };

  // Always log to console in development
  const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
  if (isDev || level === 'error' || level === 'warn') {
    const prefix = `[${entry.timestamp}] [${level.toUpperCase()}] [${component}]`;
    if (data !== undefined) {
      console[consoleMethod](prefix, message, data);
    } else {
      console[consoleMethod](prefix, message);
    }
  }

  // Store log entry
  const logs = getLogs();
  logs.push(entry);
  saveLogs(logs);
};

/**
 * Clear all stored logs
 */
export const clearLogs = (): void => {
  localStorage.removeItem(LOG_STORAGE_KEY);
};

/**
 * Export logs as a downloadable JSON file
 */
export const exportLogs = (): void => {
  const logs = getLogs();
  const exportData = {
    exportDate: new Date().toISOString(),
    appName: 'Sideline IQ',
    logCount: logs.length,
    logs,
  };

  const data = JSON.stringify(exportData, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sideline-iq-logs-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Get log statistics
 */
export const getLogStats = (): { total: number; byLevel: Record<LogLevel, number> } => {
  const logs = getLogs();
  const byLevel: Record<LogLevel, number> = {
    debug: 0,
    info: 0,
    warn: 0,
    error: 0,
  };

  logs.forEach((log) => {
    byLevel[log.level]++;
  });

  return { total: logs.length, byLevel };
};

/**
 * Logger object with methods for each log level
 */
export const logger = {
  debug: (component: string, message: string, data?: unknown) => 
    addLog('debug', component, message, data),
  
  info: (component: string, message: string, data?: unknown) => 
    addLog('info', component, message, data),
  
  warn: (component: string, message: string, data?: unknown) => 
    addLog('warn', component, message, data),
  
  error: (component: string, message: string, data?: unknown) => 
    addLog('error', component, message, data),
};

export default logger;
