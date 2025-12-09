import { useState, useEffect } from 'react';
import type { Squad, AttendanceEvent, PlayerAttendance } from '../types/attendance';

interface AttendanceEventViewProps {
  squad: Squad;
  event: AttendanceEvent;
  onSaveAttendance: (eventId: string, attendance: PlayerAttendance[]) => Promise<void>;
  onBack: () => void;
}

export const AttendanceEventView = ({
  squad,
  event,
  onSaveAttendance,
  onBack,
}: AttendanceEventViewProps) => {
  // Local state for attendance - allows batch editing before save
  const [localAttendance, setLocalAttendance] = useState<PlayerAttendance[]>(event.attendance);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Sync with event prop if it changes externally
  useEffect(() => {
    setLocalAttendance(event.attendance);
    setHasChanges(false);
  }, [event.id]);

  const getPlayerName = (playerId: string): string => {
    const player = squad.players.find(p => p.id === playerId);
    return player ? player.name : 'Unknown Player';
  };

  const getPlayerNumber = (playerId: string): string | undefined => {
    const player = squad.players.find(p => p.id === playerId);
    return player?.number;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      year: 'numeric'
    });
  };

  const summary = {
    present: localAttendance.filter(a => a.present).length,
    absent: localAttendance.filter(a => !a.present && !a.injured).length,
    injured: localAttendance.filter(a => a.injured).length,
    total: localAttendance.length,
  };

  // Sort attendance: present first, then injured, then absent
  const sortedAttendance = [...localAttendance].sort((a, b) => {
    if (a.present && !b.present) return -1;
    if (!a.present && b.present) return 1;
    if (a.injured && !b.injured) return -1;
    if (!a.injured && b.injured) return 1;
    return getPlayerName(a.playerId).localeCompare(getPlayerName(b.playerId));
  });

  const handleToggle = (playerId: string, field: 'present' | 'injured') => {
    setLocalAttendance(prev => 
      prev.map(a => 
        a.playerId === playerId 
          ? { ...a, [field]: !a[field] }
          : a
      )
    );
    setHasChanges(true);
  };

  const handleMarkAllPresent = () => {
    setLocalAttendance(prev => 
      prev.map(a => ({ ...a, present: true }))
    );
    setHasChanges(true);
  };

  const handleClearAll = () => {
    setLocalAttendance(prev => 
      prev.map(a => ({ ...a, present: false, injured: false }))
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSaveAttendance(event.id, localAttendance);
      setHasChanges(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (hasChanges) {
      if (confirm('You have unsaved changes. Discard them?')) {
        onBack();
      }
    } else {
      onBack();
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={handleBack}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ←
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">{event.name}</h1>
            <p className="text-gray-400 text-sm">{formatDate(event.date)}</p>
            {hasChanges && (
              <span className="text-amber-400 text-xs">• Unsaved changes</span>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-400">{summary.present}</div>
              <div className="text-gray-400 text-xs">Present</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-amber-400">{summary.injured}</div>
              <div className="text-gray-400 text-xs">Injured</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-400">{summary.absent}</div>
              <div className="text-gray-400 text-xs">Absent</div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gray-800 rounded-lg p-3 mb-4 text-center">
          <p className="text-gray-400 text-sm">
            Tap <span className="text-green-400">✓ Present</span> or <span className="text-amber-400">🤕 Injured</span> to toggle
          </p>
        </div>

        {/* Player List */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="space-y-2">
            {sortedAttendance.map((attendance) => {
              const playerName = getPlayerName(attendance.playerId);
              const playerNumber = getPlayerNumber(attendance.playerId);
              
              return (
                <div
                  key={attendance.playerId}
                  className={`flex items-center justify-between rounded-lg p-3 ${
                    attendance.present 
                      ? 'bg-green-900/30 border border-green-800' 
                      : attendance.injured 
                        ? 'bg-amber-900/30 border border-amber-800'
                        : 'bg-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {playerNumber && (
                      <span className="bg-gray-600 text-gray-300 text-sm px-2 py-0.5 rounded min-w-[2rem] text-center">
                        #{playerNumber}
                      </span>
                    )}
                    <span className="text-white">{playerName}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Present Toggle */}
                    <button
                      onClick={() => handleToggle(attendance.playerId, 'present')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        attendance.present
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-600 text-gray-400 hover:bg-gray-500'
                      }`}
                    >
                      ✓ Present
                    </button>
                    
                    {/* Injured Toggle */}
                    <button
                      onClick={() => handleToggle(attendance.playerId, 'injured')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                        attendance.injured
                          ? 'bg-amber-600 text-white'
                          : 'bg-gray-600 text-gray-400 hover:bg-gray-500'
                      }`}
                    >
                      🤕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={handleMarkAllPresent}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm"
          >
            Mark All Present
          </button>
          <button
            onClick={handleClearAll}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg text-sm"
          >
            Clear All
          </button>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className={`mt-4 w-full py-3 rounded-lg font-semibold text-white transition-colors ${
            hasChanges && !isSaving
              ? 'bg-green-600 hover:bg-green-700'
              : 'bg-gray-600 cursor-not-allowed opacity-50'
          }`}
        >
          {isSaving ? 'Saving...' : hasChanges ? 'Save Attendance' : 'Saved ✓'}
        </button>
      </div>
    </div>
  );
};

