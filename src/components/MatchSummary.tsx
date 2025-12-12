import { useState } from 'react';
import type { Match, TeamStats } from '../types/match';
import { calculateScore, calculateShootingAccuracy, calculateKickoutWinPercentage, calculateTotalScore } from '../utils/calculations';
import { createEmptyStats } from '../types/match';
import { EventTimeline } from './EventTimeline';

interface MatchSummaryProps {
  match: Match;
  onViewShotMap: () => void;
  onViewKickoutMap: () => void;
  onNewMatch: () => void;
  onHome?: () => void;
  isViewingHistory?: boolean;
}

type StatsView = 'overall' | 'first' | 'second';

const StatRow = ({ 
  label, 
  homeValue, 
  awayValue, 
  highlight = false 
}: { 
  label: string; 
  homeValue: string | number; 
  awayValue: string | number;
  highlight?: boolean;
}) => (
  <div className={`grid grid-cols-3 py-2 ${highlight ? 'bg-gray-700' : ''}`}>
    <div className="text-green-400 text-center font-medium">{homeValue}</div>
    <div className="text-gray-300 text-center text-sm">{label}</div>
    <div className="text-blue-400 text-center font-medium">{awayValue}</div>
  </div>
);

const calculateTotalShots = (stats: TeamStats): number => {
  return stats.point + stats.two_point + stats.goal + stats.wide + stats.short + stats.saved;
};

// Calculate second half stats by subtracting first half from total
const calculateSecondHalfStats = (total: TeamStats, firstHalf: TeamStats): TeamStats => ({
  point: total.point - firstHalf.point,
  two_point: total.two_point - firstHalf.two_point,
  goal: total.goal - firstHalf.goal,
  wide: total.wide - firstHalf.wide,
  short: total.short - firstHalf.short,
  saved: total.saved - firstHalf.saved,
  kickout_won: total.kickout_won - firstHalf.kickout_won,
  kickout_lost: total.kickout_lost - firstHalf.kickout_lost,
  turnover_won: total.turnover_won - firstHalf.turnover_won,
  turnover_lost: total.turnover_lost - firstHalf.turnover_lost,
});

const StatsPanel = ({ homeStats, awayStats }: { homeStats: TeamStats; awayStats: TeamStats }) => {
  const homeAccuracy = calculateShootingAccuracy(homeStats);
  const awayAccuracy = calculateShootingAccuracy(awayStats);
  const homeKickoutWin = calculateKickoutWinPercentage(homeStats);
  const awayKickoutWin = calculateKickoutWinPercentage(awayStats);
  const homeTotalShots = calculateTotalShots(homeStats);
  const awayTotalShots = calculateTotalShots(awayStats);

  return (
    <>
      <StatRow label="Total Shots" homeValue={homeTotalShots} awayValue={awayTotalShots} />
      <StatRow label="Goals" homeValue={homeStats.goal} awayValue={awayStats.goal} highlight />
      <StatRow label="Points" homeValue={homeStats.point} awayValue={awayStats.point} />
      <StatRow label="2 Pointers" homeValue={homeStats.two_point} awayValue={awayStats.two_point} />
      <StatRow label="Wides" homeValue={homeStats.wide} awayValue={awayStats.wide} highlight />
      <StatRow label="Dropped Short" homeValue={homeStats.short} awayValue={awayStats.short} />
      <StatRow label="Shots Saved" homeValue={homeStats.saved} awayValue={awayStats.saved} />
      <StatRow 
        label="Shooting Accuracy" 
        homeValue={`${homeAccuracy}%`} 
        awayValue={`${awayAccuracy}%`} 
        highlight 
      />
      
      <div className="border-t border-gray-700 mt-2 pt-2">
        <StatRow 
          label="Own Kickouts Won" 
          homeValue={`${homeStats.kickout_won} (${homeKickoutWin}%)`} 
          awayValue={`${awayStats.kickout_won} (${awayKickoutWin}%)`} 
        />
        <StatRow 
          label="Own Kickouts Lost" 
          homeValue={homeStats.kickout_lost} 
          awayValue={awayStats.kickout_lost} 
          highlight
        />
        <StatRow 
          label="Turnovers Won" 
          homeValue={homeStats.turnover_won} 
          awayValue={awayStats.turnover_won} 
        />
        <StatRow 
          label="Turnovers Lost" 
          homeValue={homeStats.turnover_lost} 
          awayValue={awayStats.turnover_lost} 
          highlight
        />
      </div>
    </>
  );
};

export const MatchSummary = ({ match, onViewShotMap, onViewKickoutMap, onNewMatch, onHome, isViewingHistory = false }: MatchSummaryProps) => {
  const [statsView, setStatsView] = useState<StatsView>('overall');
  const [showTimeline, setShowTimeline] = useState(false);

  const homeScore = calculateScore(match.homeStats);
  const awayScore = calculateScore(match.awayStats);

  // Determine winner
  const homeTotal = match.homeStats.goal * 3 + match.homeStats.point + match.homeStats.two_point * 2;
  const awayTotal = match.awayStats.goal * 3 + match.awayStats.point + match.awayStats.two_point * 2;
  
  let resultText = 'Draw';
  let resultColor = 'text-gray-400';
  if (homeTotal > awayTotal) {
    resultText = `${match.homeTeam} Win`;
    resultColor = 'text-green-400';
  } else if (awayTotal > homeTotal) {
    resultText = `${match.awayTeam} Win`;
    resultColor = 'text-blue-400';
  }

  // Calculate stats for each half
  const firstHalfHome = match.halfTimeSnapshot?.home ?? createEmptyStats();
  const firstHalfAway = match.halfTimeSnapshot?.away ?? createEmptyStats();
  const secondHalfHome = match.halfTimeSnapshot 
    ? calculateSecondHalfStats(match.homeStats, match.halfTimeSnapshot.home)
    : match.homeStats;
  const secondHalfAway = match.halfTimeSnapshot
    ? calculateSecondHalfStats(match.awayStats, match.halfTimeSnapshot.away)
    : match.awayStats;

  // Get current stats based on selected view
  const getCurrentStats = () => {
    switch (statsView) {
      case 'first':
        return { home: firstHalfHome, away: firstHalfAway };
      case 'second':
        return { home: secondHalfHome, away: secondHalfAway };
      default:
        return { home: match.homeStats, away: match.awayStats };
    }
  };

  const currentStats = getCurrentStats();

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-white mb-2">Full Time</h1>
          <p className={`text-lg font-semibold ${resultColor}`}>{resultText}</p>
        </div>

        {/* Score */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <div className="grid grid-cols-3 items-center">
            <div className="text-center">
              <div className="text-green-400 font-bold text-lg">{match.homeTeam}</div>
              <div className="text-white text-3xl font-bold mt-2">{homeScore}</div>
              <div className="text-gray-400 text-sm">({calculateTotalScore(match.homeStats)} pts)</div>
            </div>
            <div className="text-center text-gray-500 text-2xl">vs</div>
            <div className="text-center">
              <div className="text-blue-400 font-bold text-lg">{match.awayTeam}</div>
              <div className="text-white text-3xl font-bold mt-2">{awayScore}</div>
              <div className="text-gray-400 text-sm">({calculateTotalScore(match.awayStats)} pts)</div>
            </div>
          </div>
        </div>

        {/* Half Time Score */}
        {match.halfTimeSnapshot && (
          <div className="bg-gray-800 rounded-lg p-3 mb-4">
            <div className="text-center text-gray-400 text-sm mb-2">Half Time</div>
            <div className="grid grid-cols-3 items-center">
              <div className="text-green-400 text-center font-medium">
                {calculateScore(match.halfTimeSnapshot.home)}
              </div>
              <div className="text-gray-500 text-center">-</div>
              <div className="text-blue-400 text-center font-medium">
                {calculateScore(match.halfTimeSnapshot.away)}
              </div>
            </div>
          </div>
        )}

        {/* Stats Breakdown */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          {/* Stats View Tabs */}
          <div className="flex mb-4 border-b border-gray-700">
            <button
              onClick={() => setStatsView('overall')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                statsView === 'overall'
                  ? 'text-white border-b-2 border-green-500'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Overall
            </button>
            <button
              onClick={() => setStatsView('first')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                statsView === 'first'
                  ? 'text-white border-b-2 border-green-500'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              1st Half
            </button>
            <button
              onClick={() => setStatsView('second')}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                statsView === 'second'
                  ? 'text-white border-b-2 border-green-500'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              2nd Half
            </button>
          </div>

          {/* Score for selected period */}
          <div className="grid grid-cols-3 items-center mb-4 pb-3 border-b border-gray-700">
            <div className="text-green-400 text-center font-bold text-xl">
              {calculateScore(currentStats.home)}
            </div>
            <div className="text-gray-400 text-center text-sm">
              {statsView === 'overall' ? 'Full Time' : statsView === 'first' ? '1st Half' : '2nd Half'}
            </div>
            <div className="text-blue-400 text-center font-bold text-xl">
              {calculateScore(currentStats.away)}
            </div>
          </div>
          
          <StatsPanel homeStats={currentStats.home} awayStats={currentStats.away} />
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {match.trackShots && (
            <button
              onClick={onViewShotMap}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium transition-colors"
            >
              View Shot Map
            </button>
          )}
          {match.trackKickouts && (
            <button
              onClick={onViewKickoutMap}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-lg font-medium transition-colors"
            >
              View Kickout Map
            </button>
          )}
          <button
            onClick={() => setShowTimeline(true)}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition-colors"
          >
            📋 View Timeline
          </button>
          {isViewingHistory && (
            <button
              onClick={onNewMatch}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors"
            >
              ← Back to History
            </button>
          )}
          {onHome && !isViewingHistory && (
            <button
              onClick={onHome}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 rounded-lg font-medium transition-colors"
            >
              🏠 Home
            </button>
          )}
        </div>
      </div>

      {/* Timeline Modal */}
      {showTimeline && (
        <EventTimeline match={match} onClose={() => setShowTimeline(false)} />
      )}
    </div>
  );
};
