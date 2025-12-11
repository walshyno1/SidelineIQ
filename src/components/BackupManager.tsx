import { useState, useEffect, useRef } from 'react';
import { 
  exportAllData, 
  importAllData, 
  getDataSummary, 
  getLastBackupDate,
  type ImportResult 
} from '../utils/backup';
import { exportLogs, getLogStats } from '../utils/logger';
import logger from '../utils/logger';

interface BackupManagerProps {
  onDataImported?: () => void;
}

export default function BackupManager({ onDataImported }: BackupManagerProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [dataSummary, setDataSummary] = useState({ matchCount: 0, squadCount: 0, eventCount: 0 });
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [showImportOptions, setShowImportOptions] = useState(false);
  const [mergeData, setMergeData] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load summary and last backup date
  useEffect(() => {
    loadSummary();
  }, []);

  const loadSummary = async () => {
    const summary = await getDataSummary();
    setDataSummary(summary);
    setLastBackup(getLastBackupDate());
  };

  const handleExport = async () => {
    setIsExporting(true);
    logger.info('BackupManager', 'Starting data export');
    try {
      await exportAllData();
      setLastBackup(getLastBackupDate());
      logger.info('BackupManager', 'Data export completed successfully');
    } catch (error) {
      logger.error('BackupManager', 'Export failed', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    setShowImportOptions(true);
    setImportResult(null);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setShowImportOptions(false);
    logger.info('BackupManager', 'Starting data import', { fileName: file.name, fileSize: file.size, mergeData });
    
    try {
      const result = await importAllData(file, { mergeData });
      setImportResult(result);
      logger.info('BackupManager', 'Import completed', result);
      
      if (result.success || result.matchesImported > 0 || result.squadsImported > 0) {
        await loadSummary();
        onDataImported?.();
      }
    } catch (error) {
      logger.error('BackupManager', 'Import failed', error);
      setImportResult({
        success: false,
        matchesImported: 0,
        squadsImported: 0,
        eventsImported: 0,
        errors: ['Failed to import data'],
      });
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('en-IE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
            d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
        Data Backup
      </h2>

      {/* Data Summary */}
      <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <h3 className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-2">Your Data</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {dataSummary.matchCount}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Matches</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {dataSummary.squadCount}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Squads</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {dataSummary.eventCount}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">Events</div>
          </div>
        </div>
      </div>

      {/* Last Backup */}
      {lastBackup && (
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Last backup: <span className="font-medium">{formatDate(lastBackup)}</span>
        </div>
      )}

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={isExporting || isImporting}
        className="w-full mb-3 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 
          text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
      >
        {isExporting ? (
          <>
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Exporting...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export All Data
          </>
        )}
      </button>

      {/* Import Button / Options */}
      {!showImportOptions ? (
        <button
          onClick={handleImportClick}
          disabled={isExporting || isImporting}
          className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 
            disabled:opacity-50 text-gray-700 dark:text-gray-200 font-semibold rounded-lg 
            transition-colors flex items-center justify-center gap-2"
        >
          {isImporting ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Importing...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import Data
            </>
          )}
        </button>
      ) : (
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="font-medium text-gray-800 dark:text-white mb-3">Import Options</h4>
          
          <label className="flex items-center gap-3 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={mergeData}
              onChange={(e) => setMergeData(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Merge with existing data
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {mergeData 
                  ? 'Adds imported data alongside your current data'
                  : 'Replaces all existing data with imported data'}
              </div>
            </div>
          </label>

          <div className="flex gap-2">
            <label className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white 
              font-semibold rounded-lg text-center cursor-pointer transition-colors">
              Choose File
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
            <button
              onClick={() => setShowImportOptions(false)}
              className="py-2 px-4 bg-gray-200 hover:bg-gray-300 dark:bg-gray-600 dark:hover:bg-gray-500 
                text-gray-700 dark:text-gray-200 font-semibold rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Import Result */}
      {importResult && (
        <div className={`mt-4 p-4 rounded-lg ${
          importResult.success 
            ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800' 
            : 'bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800'
        }`}>
          <h4 className={`font-medium mb-2 ${
            importResult.success 
              ? 'text-green-800 dark:text-green-200' 
              : 'text-yellow-800 dark:text-yellow-200'
          }`}>
            {importResult.success ? '✓ Import Complete' : '⚠ Import Completed with Issues'}
          </h4>
          
          <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
            <p>• {importResult.matchesImported} matches imported</p>
            <p>• {importResult.squadsImported} squads imported</p>
            <p>• {importResult.eventsImported} attendance events imported</p>
          </div>

          {importResult.errors.length > 0 && (
            <div className="mt-3 pt-3 border-t border-yellow-200 dark:border-yellow-700">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">Errors:</p>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 list-disc list-inside">
                {importResult.errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <button
            onClick={() => setImportResult(null)}
            className="mt-3 text-sm text-gray-600 dark:text-gray-400 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Debug Logs */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
        <button
          onClick={() => {
            logger.info('BackupManager', 'Exporting debug logs');
            exportLogs();
          }}
          className="w-full py-2 px-4 bg-gray-50 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 
            text-gray-600 dark:text-gray-300 text-sm font-medium rounded-lg 
            transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export Debug Logs ({getLogStats().total} entries)
        </button>
      </div>

      {/* Info */}
      <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
        Backups include match history, squads, and attendance records.
        <br />
        Export regularly to protect your data.
      </p>
    </div>
  );
}
