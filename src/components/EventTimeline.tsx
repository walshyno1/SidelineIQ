import { useState } from 'react';
import type { Match, EventType, Action } from '../types/match';
import { formatMatchTime } from '../utils/calculations';

interface EventTimelineProps {
  match: Match;
  onClose: () => void;
}

type FilterType = 'all' | 'shots' | 'kickouts' | 'turnovers';

// Event type labels and icons
const EVENT_CONFIG: Record<EventType, { label: string; icon: string; colorClass: string; category: FilterType }> = {
  point: { label: 'Point', icon: '⚪', colorClass: 'text-green-400', category: 'shots' },
  two_point: { label: '2-Point', icon: '⚪', colorClass: 'text-green-400', category: 'shots' },
  goal: { label: 'Goal', icon: '⚽', colorClass: 'text-yellow-400', category: 'shots' },
  wide: { label: 'Wide', icon: '❌', colorClass: 'text-red-400', category: 'shots' },
  short: { label: 'Short', icon: '⬇️', colorClass: 'text-orange-400', category: 'shots' },
  saved: { label: 'Saved', icon: '🧤', colorClass: 'text-blue-400', category: 'shots' },
  kickout_won: { label: 'Kickout Won', icon: '🏐', colorClass: 'text-green-400', category: 'kickouts' },
  kickout_lost: { label: 'Kickout Lost', icon: '🏐', colorClass: 'text-red-400', category: 'kickouts' },
  turnover_won: { label: 'Turnover Won', icon: '🔄', colorClass: 'text-green-400', category: 'turnovers' },
  turnover_lost: { label: 'Turnover Lost', icon: '🔄', colorClass: 'text-red-400', category: 'turnovers' },
};

const filterAction = (action: Action, filter: FilterType): boolean => {
  if (filter === 'all') return true;
  return EVENT_CONFIG[action.eventType].category === filter;
};

export const EventTimeline = ({ match, onClose }: EventTimelineProps) => {
  const [filter, setFilter] = useState<FilterType>('all');
  // Build timeline with milestones and actions
  const buildTimeline = () => {
    const events: Array<{ timestamp: number; content: React.ReactNode; isMilestone: boolean }> = [];
    
    // Add match start
    if (match.firstHalfStartTime) {
      events.push({
        timestamp: match.firstHalfStartTime,
        isMilestone: true,
        content: (
          <div className="flex items-center gap-2 text-white font-semibold">
            <span className="text-xl">🏁</span>
            <span>Match Start</span>
          </div>
        ),
      });
    }
    
    // Add first half actions (filtered)
    const firstHalfActions = match.actions.filter(a => {
      if (!match.secondHalfStartTime) return filterAction(a, filter);
      return a.timestamp < match.secondHalfStartTime && filterAction(a, filter);
    });
    
    firstHalfActions.forEach(action => {
      const config = EVENT_CONFIG[action.eventType];
      const teamName = action.team === 'home' ? match.homeTeam : match.awayTeam;
      const teamColor = action.team === 'home' ? 'text-green-300' : 'text-blue-300';
      
      events.push({
        timestamp: action.timestamp,
        isMilestone: false,
        content: (
          <div className="flex items-center gap-2">
            <span className="text-lg">{config.icon}</span>
            <span className={teamColor}>{teamName}</span>
            <span className={`${config.colorClass}`}>- {config.label}</span>
          </div>
        ),
      });
    });
    
    // Add half time
    if (match.secondHalfStartTime) {
      // Half time is just before second half starts (use secondHalfStartTime - 1ms)
      events.push({
        timestamp: match.secondHalfStartTime - 1,
        isMilestone: true,
        content: (
          <div className="flex items-center gap-2 text-amber-400 font-semibold">
            <span className="text-xl">⏸️</span>
            <span>Half Time</span>
          </div>
        ),
      });
      
      // Add second half start
      events.push({
        timestamp: match.secondHalfStartTime,
        isMilestone: true,
        content: (
          <div className="flex items-center gap-2 text-white font-semibold">
            <span className="text-xl">▶️</span>
            <span>Second Half Start</span>
          </div>
        ),
      });
      
      // Add second half actions (filtered)
      const secondHalfActions = match.actions.filter(a => 
        a.timestamp >= match.secondHalfStartTime! && filterAction(a, filter)
      );
      
      secondHalfActions.forEach(action => {
        const config = EVENT_CONFIG[action.eventType];
        const teamName = action.team === 'home' ? match.homeTeam : match.awayTeam;
        const teamColor = action.team === 'home' ? 'text-green-300' : 'text-blue-300';
        
        events.push({
          timestamp: action.timestamp,
          isMilestone: false,
          content: (
            <div className="flex items-center gap-2">
              <span className="text-lg">{config.icon}</span>
              <span className={teamColor}>{teamName}</span>
              <span className={`${config.colorClass}`}>- {config.label}</span>
            </div>
          ),
        });
      });
    }
    
    // Add full time
    if (match.matchEndTime) {
      events.push({
        timestamp: match.matchEndTime,
        isMilestone: true,
        content: (
          <div className="flex items-center gap-2 text-red-400 font-semibold">
            <span className="text-xl">🏆</span>
            <span>Full Time</span>
          </div>
        ),
      });
    }
    
    // Sort by timestamp
    events.sort((a, b) => a.timestamp - b.timestamp);
    
    return events;
  };
  
  const getMatchTimeForEvent = (timestamp: number): string => {
    if (!match.firstHalfStartTime) return '--:--';
    
    // Check if this is a second half event
    if (match.secondHalfStartTime && timestamp >= match.secondHalfStartTime) {
      return formatMatchTime(timestamp, match.secondHalfStartTime, true);
    }
    
    return formatMatchTime(timestamp, match.firstHalfStartTime, false);
  };
  
  const timeline = buildTimeline();

  const filterButtons: { value: FilterType; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'shots', label: 'Shots' },
    { value: 'kickouts', label: 'Kickouts' },
    { value: 'turnovers', label: 'Turnovers' },
  ];

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">📋 Match Timeline</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ×
          </button>
        </div>
        
        {/* Match Info */}
        <div className="px-4 py-2 bg-gray-700/50 text-center">
          <span className="text-green-400">{match.homeTeam}</span>
          <span className="text-gray-400 mx-2">vs</span>
          <span className="text-blue-400">{match.awayTeam}</span>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex border-b border-gray-700">
          {filterButtons.map((btn) => (
            <button
              key={btn.value}
              onClick={() => setFilter(btn.value)}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                filter === btn.value
                  ? 'text-purple-400 border-b-2 border-purple-400 bg-gray-700/30'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {btn.label}
            </button>
          ))}
        </div>
        
        {/* Timeline Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {timeline.length === 0 ? (
            <div className="text-gray-400 text-center py-8">
              No events recorded
            </div>
          ) : (
            <div className="space-y-2">
              {timeline.map((event, index) => (
                <div
                  key={index}
                  className={`flex items-center gap-3 p-2 rounded ${
                    event.isMilestone ? 'bg-gray-700/50' : 'bg-gray-800/50'
                  }`}
                >
                  <span className="text-gray-400 font-mono text-sm w-14 flex-shrink-0">
                    {getMatchTimeForEvent(event.timestamp)}
                  </span>
                  <div className="flex-1 text-sm">
                    {event.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="w-full bg-gray-600 hover:bg-gray-500 text-white py-2 rounded font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
