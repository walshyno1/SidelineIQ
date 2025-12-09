import type { TeamStats } from '../types/match';
import { calculateScore, calculateShootingAccuracy, calculateKickoutWinPercentage, calculateKickoutLossPercentage, calculateTotalScore } from '../utils/calculations';

interface LiveStatsProps {
  homeTeam: string;
  awayTeam: string;
  homeStats: TeamStats;
  awayStats: TeamStats;
  currentHalf: 1 | 2;
}

export const LiveStats = ({ homeTeam, awayTeam, homeStats, awayStats, currentHalf }: LiveStatsProps) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4 mb-4">
      <div className="text-center mb-2">
        <span className="text-gray-400 text-sm">
          {currentHalf === 1 ? '1st Half' : '2nd Half'}
        </span>
      </div>
      
      {/* Score Display */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-center flex-1">
          <div className="text-white font-bold text-lg truncate">{homeTeam}</div>
          <div className="text-4xl font-bold text-green-400">{calculateScore(homeStats)}</div>
          <div className="text-gray-400 text-sm">({calculateTotalScore(homeStats)} pts)</div>
        </div>
        <div className="text-gray-500 text-2xl px-4">vs</div>
        <div className="text-center flex-1">
          <div className="text-white font-bold text-lg truncate">{awayTeam}</div>
          <div className="text-4xl font-bold text-blue-400">{calculateScore(awayStats)}</div>
          <div className="text-gray-400 text-sm">({calculateTotalScore(awayStats)} pts)</div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-2 text-sm">
        <div className="text-center text-green-400">{calculateShootingAccuracy(homeStats)}%</div>
        <div className="text-center text-gray-400">Shooting Acc.</div>
        <div className="text-center text-blue-400">{calculateShootingAccuracy(awayStats)}%</div>

        <div className="text-center text-green-400">{calculateKickoutWinPercentage(homeStats)}% ({homeStats.kickout_won})</div>
        <div className="text-center text-gray-400">Own Kickouts Won</div>
        <div className="text-center text-blue-400">{calculateKickoutWinPercentage(awayStats)}% ({awayStats.kickout_won})</div>

        <div className="text-center text-green-400">{calculateKickoutLossPercentage(homeStats)}% ({homeStats.kickout_lost})</div>
        <div className="text-center text-gray-400">Own Kickouts Lost</div>
        <div className="text-center text-blue-400">{calculateKickoutLossPercentage(awayStats)}% ({awayStats.kickout_lost})</div>

        <div className="text-center text-green-400">{homeStats.turnover_won}</div>
        <div className="text-center text-gray-400">Turnovers Won</div>
        <div className="text-center text-blue-400">{awayStats.turnover_won}</div>

        <div className="text-center text-green-400">{homeStats.turnover_lost}</div>
        <div className="text-center text-gray-400">Turnovers Lost</div>
        <div className="text-center text-blue-400">{awayStats.turnover_lost}</div>
      </div>
    </div>
  );
};
