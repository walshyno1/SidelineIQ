import { useState, useEffect } from 'react';
import { getLastBackupDate } from '../utils/backup';

const REMINDER_DISMISSED_KEY = 'gaa_stats_reminder_dismissed_until';
const REMINDER_DAYS = 14;

interface BackupReminderProps {
  matchCount: number;
  squadCount: number;
  onBackupClick: () => void;
}

export const BackupReminder = ({ matchCount, squadCount, onBackupClick }: BackupReminderProps) => {
  const [showBanner, setShowBanner] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Don't show if no data exists (no matches and no squads)
    if (matchCount === 0 && squadCount === 0) {
      setShowBanner(false);
      return;
    }

    // Check if reminder was dismissed recently
    const dismissedUntil = localStorage.getItem(REMINDER_DISMISSED_KEY);
    if (dismissedUntil) {
      const dismissedDate = new Date(dismissedUntil);
      if (dismissedDate > new Date()) {
        setShowBanner(false);
        return;
      }
    }

    // Check last backup date
    const lastBackup = getLastBackupDate();
    
    if (!lastBackup) {
      // Never backed up
      setMessage("You haven't backed up your data yet. Protect your data!");
      setShowBanner(true);
      return;
    }

    // Check if backup is older than 14 days
    const lastBackupDate = new Date(lastBackup);
    const daysSinceBackup = Math.floor(
      (Date.now() - lastBackupDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceBackup >= REMINDER_DAYS) {
      setMessage(`Your last backup was ${daysSinceBackup} days ago. Time to backup your data!`);
      setShowBanner(true);
    } else {
      setShowBanner(false);
    }
  }, [matchCount, squadCount]);

  const handleDismiss = () => {
    // Set reminder to not show for 14 days
    const dismissUntil = new Date();
    dismissUntil.setDate(dismissUntil.getDate() + REMINDER_DAYS);
    localStorage.setItem(REMINDER_DISMISSED_KEY, dismissUntil.toISOString());
    setShowBanner(false);
  };

  if (!showBanner) {
    return null;
  }

  return (
    <div className="bg-amber-600 text-white px-4 py-3 shadow-lg">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <svg 
            className="w-5 h-5 flex-shrink-0" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
            />
          </svg>
          <span className="text-sm font-medium">{message}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onBackupClick}
            className="bg-white text-amber-700 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-amber-50 transition-colors"
          >
            Backup Now
          </button>
          <button
            onClick={handleDismiss}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-amber-700 transition-colors"
            title="Remind me in 14 days"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};
