import type { Match, TeamStats } from '../types/match';
import { calculateScore, calculateShootingAccuracy, calculateKickoutWinPercentage, calculateTotalScore } from '../utils/calculations';

interface HalfTimeSummaryProps {
  match: Match;
  onViewShotMap: () => void;
  onViewKickoutMap: () => void;
  onStartSecondHalf: () => void;
}

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

export const HalfTimeSummary = ({ match, onViewShotMap, onViewKickoutMap, onStartSecondHalf }: HalfTimeSummaryProps) => {
  const homeScore = calculateScore(match.homeStats);
  const awayScore = calculateScore(match.awayStats);

  // Determine who's leading
  const homeTotal = calculateTotalScore(match.homeStats);
  const awayTotal = calculateTotalScore(match.awayStats);
  
  let resultText = 'Level at Half Time';
  let resultColor = 'text-gray-400';
  if (homeTotal > awayTotal) {
    resultText = `${match.homeTeam} Leading`;
    resultColor = 'text-green-400';
  } else if (awayTotal > homeTotal) {
    resultText = `${match.awayTeam} Leading`;
    resultColor = 'text-blue-400';
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-amber-500 text-sm font-medium mb-2">⏱️ HALF TIME</div>
          <h1 className="text-2xl font-bold text-white mb-1">
            {match.homeTeam} vs {match.awayTeam}
          </h1>
          <p className={`text-lg font-medium ${resultColor}`}>{resultText}</p>
        </div>

        {/* Score */}
        <div className="bg-gray-800 rounded-lg p-6 mb-4">
          <div className="grid grid-cols-3 items-center">
            <div className="text-center">
              <div className="text-green-400 text-4xl font-bold">{homeScore}</div>
              <div className="text-green-400 text-sm mt-1">({homeTotal} pts)</div>
              <div className="text-gray-400 text-sm mt-1">{match.homeTeam}</div>
            </div>
            <div className="text-center text-gray-500 text-2xl">-</div>
            <div className="text-center">
              <div className="text-blue-400 text-4xl font-bold">{awayScore}</div>
              <div className="text-blue-400 text-sm mt-1">({awayTotal} pts)</div>
              <div className="text-gray-400 text-sm mt-1">{match.awayTeam}</div>
            </div>
          </div>
        </div>

        {/* First Half Stats */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <h2 className="text-white font-bold text-center mb-4">1st Half Stats</h2>
          <StatsPanel homeStats={match.homeStats} awayStats={match.awayStats} />
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={onStartSecondHalf}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-bold text-lg transition-colors flex items-center justify-center gap-2"
          >
            ▶️ Start 2nd Half
          </button>
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
        </div>
      </div>
    </div>
  );
};
