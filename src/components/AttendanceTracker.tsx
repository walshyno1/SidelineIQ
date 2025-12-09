import { useState, useMemo } from 'react';
import type { Squad, AttendanceEvent } from '../types/attendance';

interface PlayerStats {
  playerId: string;
  name: string;
  number?: string;
  eventsAttended: number;
  eventsInjured: number;
  totalEvents: number;
  attendancePercent: number;
}

interface AttendanceTrackerProps {
  squad: Squad;
  events: AttendanceEvent[];
  onCreateEvent: (name: string, date: string) => Promise<AttendanceEvent | undefined>;
  onDeleteEvent: (eventId: string) => Promise<void>;
  onSelectEvent: (event: AttendanceEvent) => void;
  onManageSquad: () => void;
  onClose: () => void;
}

export const AttendanceTracker = ({
  squad,
  events,
  onCreateEvent,
  onDeleteEvent,
  onSelectEvent,
  onManageSquad,
  onClose,
}: AttendanceTrackerProps) => {
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  
  const EVENTS_PER_PAGE = 20;

  // Pagination calculations
  const totalPages = Math.ceil(events.length / EVENTS_PER_PAGE);
  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * EVENTS_PER_PAGE;
    return events.slice(startIndex, startIndex + EVENTS_PER_PAGE);
  }, [events, currentPage]);

  // Reset to page 1 when events change significantly
  const prevEventsLength = events.length;
  if (currentPage > 1 && (currentPage - 1) * EVENTS_PER_PAGE >= prevEventsLength) {
    setCurrentPage(1);
  }

  // Calculate player attendance stats
  const playerStats = useMemo((): PlayerStats[] => {
    const activePlayers = squad.players.filter(p => p.isActive);
    
    return activePlayers.map(player => {
      let eventsAttended = 0;
      let eventsInjured = 0;
      let totalEvents = 0;

      events.forEach(event => {
        const attendance = event.attendance.find(a => a.playerId === player.id);
        if (attendance) {
          totalEvents++;
          if (attendance.present) eventsAttended++;
          if (attendance.injured) eventsInjured++;
        }
      });

      const attendancePercent = totalEvents > 0 
        ? Math.round((eventsAttended / totalEvents) * 100) 
        : 0;

      return {
        playerId: player.id,
        name: player.name,
        number: player.number,
        eventsAttended,
        eventsInjured,
        totalEvents,
        attendancePercent,
      };
    }).sort((a, b) => b.attendancePercent - a.attendancePercent);
  }, [squad.players, events]);

  const handleCreateEvent = async () => {
    if (!eventName.trim()) return;
    const event = await onCreateEvent(eventName.trim(), eventDate);
    if (event) {
      setShowNewEvent(false);
      setEventName('');
      onSelectEvent(event);
    }
  };

  const getAttendanceSummary = (event: AttendanceEvent) => {
    const present = event.attendance.filter(a => a.present).length;
    const injured = event.attendance.filter(a => a.injured).length;
    const total = event.attendance.length;
    return { present, injured, total };
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={showStats ? () => setShowStats(false) : onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ←
          </button>
          <div>
            <h1 className="text-xl font-bold text-white">
              {showStats ? '📊 Player Stats' : '📋 Attendance'}
            </h1>
            <p className="text-gray-400 text-sm">{squad.teamName}</p>
          </div>
        </div>

        {/* Action Buttons - More prominent */}
        {!showStats && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={onManageSquad}
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
            >
              <span className="text-2xl">👥</span>
              <div className="text-left">
                <div className="font-bold">Manage Squad</div>
                <div className="text-xs text-blue-200">{squad.players.filter(p => p.isActive).length} players</div>
              </div>
            </button>
            <button
              onClick={() => setShowStats(true)}
              disabled={events.length === 0}
              className={`py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all transform shadow-lg ${
                events.length === 0 
                  ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 text-white hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              <span className="text-2xl">📊</span>
              <div className="text-left">
                <div className="font-bold">Player Stats</div>
                <div className={`text-xs ${events.length === 0 ? 'text-gray-500' : 'text-purple-200'}`}>
                  {events.length} events
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Player Stats View */}
        {showStats ? (
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-gray-400 text-sm font-medium">
                Attendance by Player
              </h3>
              <span className="text-gray-500 text-xs">
                {events.length} events
              </span>
            </div>

            {playerStats.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No players in squad yet.
              </p>
            ) : (
              <div className="space-y-2">
                {playerStats.map((stats) => (
                  <div
                    key={stats.playerId}
                    className="bg-gray-700 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {stats.number && (
                          <span className="text-gray-500 text-sm">#{stats.number}</span>
                        )}
                        <span className="text-white font-medium">{stats.name}</span>
                      </div>
                      <span className={`text-lg font-bold ${
                        stats.attendancePercent >= 80 ? 'text-green-400' :
                        stats.attendancePercent >= 50 ? 'text-amber-400' :
                        'text-red-400'
                      }`}>
                        {stats.attendancePercent}%
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>✓ {stats.eventsAttended}/{stats.totalEvents} attended</span>
                      {stats.eventsInjured > 0 && (
                        <span className="text-amber-400">🤕 {stats.eventsInjured} injured</span>
                      )}
                    </div>
                    {/* Progress bar */}
                    <div className="mt-2 h-1.5 bg-gray-600 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          stats.attendancePercent >= 80 ? 'bg-green-500' :
                          stats.attendancePercent >= 50 ? 'bg-amber-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${stats.attendancePercent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Summary */}
            {playerStats.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-gray-700 rounded-lg p-2">
                    <div className="text-green-400 font-bold">
                      {playerStats.filter(p => p.attendancePercent >= 80).length}
                    </div>
                    <div className="text-gray-400 text-xs">80%+</div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-2">
                    <div className="text-amber-400 font-bold">
                      {playerStats.filter(p => p.attendancePercent >= 50 && p.attendancePercent < 80).length}
                    </div>
                    <div className="text-gray-400 text-xs">50-79%</div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-2">
                    <div className="text-red-400 font-bold">
                      {playerStats.filter(p => p.attendancePercent < 50).length}
                    </div>
                    <div className="text-gray-400 text-xs">&lt;50%</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <>
            {/* New Event Button / Form */}
            {showNewEvent ? (
              <div className="bg-gray-800 rounded-lg p-4 mb-4">
                <h3 className="text-white font-medium mb-3">New Event</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Event Name</label>
                    <input
                      type="text"
                      value={eventName}
                      onChange={(e) => setEventName(e.target.value)}
                      placeholder="e.g., Training, Match vs St. Mary's"
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-1">Date</label>
                    <input
                      type="date"
                      value={eventDate}
                      onChange={(e) => setEventDate(e.target.value)}
                      className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowNewEvent(false)}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateEvent}
                      disabled={!eventName.trim()}
                      className={`flex-1 py-2 rounded-lg font-medium ${
                        eventName.trim()
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Create
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowNewEvent(true)}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg mb-4 flex items-center justify-center gap-2"
              >
                <span className="text-xl">➕</span>
                <span>New Event</span>
              </button>
            )}

            {/* Events List */}
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-gray-400 text-sm font-medium mb-3">
                Events ({events.length})
              </h3>

              {events.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No events recorded yet. Create your first event to start tracking attendance.
                </p>
              ) : (
                <>
                  <div className="space-y-2">
                    {paginatedEvents.map((event) => {
                      const summary = getAttendanceSummary(event);
                      const isConfirmingDelete = confirmDeleteId === event.id;
                    
                    return (
                      <div
                        key={event.id}
                        className="bg-gray-700 rounded-lg p-3 hover:bg-gray-650 transition-colors"
                      >
                        {isConfirmingDelete ? (
                          // Delete confirmation
                          <div>
                            <p className="text-white mb-3">
                              Delete <strong>{event.name}</strong>?
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 rounded-lg text-sm"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => {
                                  onDeleteEvent(event.id);
                                  setConfirmDeleteId(null);
                                }}
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <button
                              onClick={() => onSelectEvent(event)}
                              className="flex-1 text-left"
                            >
                              <div className="text-white font-medium">{event.name}</div>
                              <div className="text-gray-400 text-sm">{formatDate(event.date)}</div>
                              <div className="flex items-center gap-3 mt-1 text-xs">
                                <span className="text-green-400">
                                  ✓ {summary.present}/{summary.total} present
                                </span>
                                {summary.injured > 0 && (
                                  <span className="text-amber-400">
                                    🤕 {summary.injured} injured
                                  </span>
                                )}
                              </div>
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(event.id)}
                              className="text-gray-400 hover:text-red-400 p-2"
                              title="Delete event"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  </div>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-700">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className={`px-3 py-1.5 rounded-lg text-sm ${
                          currentPage === 1
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-gray-700 hover:bg-gray-600 text-white'
                        }`}
                      >
                        ← Previous
                      </button>
                      <span className="text-gray-400 text-sm">
                        Page {currentPage} of {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1.5 rounded-lg text-sm ${
                          currentPage === totalPages
                            ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                            : 'bg-gray-700 hover:bg-gray-600 text-white'
                        }`}
                      >
                        Next →
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
