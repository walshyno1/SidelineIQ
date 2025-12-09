import { useState, useMemo } from 'react';
import type { Match, TeamStats } from '../types/match';
import { calculateShootingAccuracy, calculateKickoutWinPercentage, calculateTotalScore, calculateScore } from '../utils/calculations';
import { KickoutHeatmap, type KickoutWithDate } from './KickoutHeatmap';
import { ShotHeatmap, type ShotWithDate } from './ShotHeatmap';

interface TeamAnalyticsProps {
  history: Match[];
  onClose: () => void;
}

interface TeamMatchData {
  match: Match;
  isHome: boolean;
  stats: TeamStats;
  opponentStats: TeamStats;
  opponent: string;
  won: boolean;
  drew: boolean;
  shootingAccuracy: number;
  kickoutWonPct: number;
  turnoversWon: number;
  turnoversLost: number;
}

interface TeamSummary {
  name: string;
  matches: TeamMatchData[];
  wins: number;
  draws: number;
  losses: number;
  winPct: number;
  avgShootingAccuracy: number;
  avgKickoutWonPct: number;
  avgTurnoversWon: number;
  avgTurnoversLost: number;
}

type TrendMetric = 'shooting' | 'kickout' | 'turnoversWon' | 'turnoversLost' | null;

const getTeamSummary = (teamName: string, history: Match[]): TeamSummary => {
  const matches: TeamMatchData[] = [];

  history.forEach(match => {
    const isHome = match.homeTeam === teamName;
    const isAway = match.awayTeam === teamName;
    
    if (!isHome && !isAway) return;

    const stats = isHome ? match.homeStats : match.awayStats;
    const opponentStats = isHome ? match.awayStats : match.homeStats;
    const opponent = isHome ? match.awayTeam : match.homeTeam;

    const teamTotal = calculateTotalScore(stats);
    const opponentTotal = calculateTotalScore(opponentStats);

    matches.push({
      match,
      isHome,
      stats,
      opponentStats,
      opponent,
      won: teamTotal > opponentTotal,
      drew: teamTotal === opponentTotal,
      shootingAccuracy: calculateShootingAccuracy(stats),
      kickoutWonPct: calculateKickoutWinPercentage(stats),
      turnoversWon: stats.turnover_won,
      turnoversLost: stats.turnover_lost,
    });
  });

  // Sort by date descending
  matches.sort((a, b) => new Date(b.match.date).getTime() - new Date(a.match.date).getTime());

  const wins = matches.filter(m => m.won).length;
  const draws = matches.filter(m => m.drew).length;
  const losses = matches.length - wins - draws;
  const winPct = matches.length > 0 ? Math.round(((wins + draws * 0.5) / matches.length) * 100) : 0;
  
  const avgShootingAccuracy = matches.length > 0 
    ? Math.round(matches.reduce((sum, m) => sum + m.shootingAccuracy, 0) / matches.length)
    : 0;
  
  const avgKickoutWonPct = matches.length > 0
    ? Math.round(matches.reduce((sum, m) => sum + m.kickoutWonPct, 0) / matches.length)
    : 0;

  const avgTurnoversWon = matches.length > 0
    ? Math.round((matches.reduce((sum, m) => sum + m.turnoversWon, 0) / matches.length) * 10) / 10
    : 0;

  const avgTurnoversLost = matches.length > 0
    ? Math.round((matches.reduce((sum, m) => sum + m.turnoversLost, 0) / matches.length) * 10) / 10
    : 0;

  return {
    name: teamName,
    matches,
    wins,
    draws,
    losses,
    winPct,
    avgShootingAccuracy,
    avgKickoutWonPct,
    avgTurnoversWon,
    avgTurnoversLost,
  };
};

const StatCard = ({ 
  label, 
  value, 
  subtext, 
  onTrendClick 
}: { 
  label: string; 
  value: string; 
  subtext: string;
  onTrendClick: () => void;
}) => (
  <div className="bg-gray-700 rounded-lg p-3 text-center">
    <div className="text-gray-300 text-xs mb-1">{label}</div>
    <div className="text-2xl font-bold text-white">{value}</div>
    <div className="text-gray-400 text-xs mb-2">{subtext}</div>
    <button
      onClick={onTrendClick}
      className="text-xs bg-gray-600 hover:bg-gray-500 text-white px-2 py-1 rounded transition-colors"
    >
      📈 Trend
    </button>
  </div>
);

const TrendModal = ({ 
  teamName, 
  metric, 
  matches, 
  onClose 
}: { 
  teamName: string;
  metric: TrendMetric;
  matches: TeamMatchData[];
  onClose: () => void;
}) => {
  const getTitle = () => {
    switch (metric) {
      case 'shooting': return 'Shooting Accuracy';
      case 'kickout': return 'Own Kickout Won %';
      case 'turnoversWon': return 'Turnovers Won';
      case 'turnoversLost': return 'Turnovers Lost';
      default: return '';
    }
  };
  const title = getTitle();

  // Check if this is a count metric (turnovers) vs percentage metric
  const isCountMetric = metric === 'turnoversWon' || metric === 'turnoversLost';
  
  // Sort by date ascending (oldest first) for chronological trend view
  const sortedMatches = [...matches].sort((a, b) => 
    new Date(a.match.date).getTime() - new Date(b.match.date).getTime()
  );

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const getValue = (m: TeamMatchData) => {
    if (metric === 'shooting') return m.shootingAccuracy;
    if (metric === 'kickout') return m.kickoutWonPct;
    if (metric === 'turnoversWon') return m.turnoversWon;
    if (metric === 'turnoversLost') return m.turnoversLost;
    return 0;
  };

  const getLabel = (m: TeamMatchData) => {
    if (metric === 'shooting') return `${m.shootingAccuracy}%`;
    if (metric === 'kickout') return `${m.kickoutWonPct}%`;
    if (metric === 'turnoversWon') return `${m.turnoversWon}`;
    if (metric === 'turnoversLost') return `${m.turnoversLost}`;
    return '';
  };

  const getPointColor = (m: TeamMatchData) => {
    const val = getValue(m);
    if (isCountMetric) {
      // For turnovers won: higher is better (green)
      // For turnovers lost: lower is better (inverted)
      if (metric === 'turnoversWon') {
        if (val >= 5) return '#22c55e';
        if (val >= 3) return '#f59e0b';
        return '#ef4444';
      } else {
        // turnovers lost - lower is better
        if (val <= 2) return '#22c55e';
        if (val <= 4) return '#f59e0b';
        return '#ef4444';
      }
    }
    // Percentage metrics
    if (val >= 60) return '#22c55e';
    if (val >= 40) return '#f59e0b';
    return '#ef4444';
  };

  // Get last 10 matches for chart
  const chartMatches = sortedMatches.slice(-10);
  const chartHeight = 100;
  const chartWidth = 300;
  const padding = { top: 10, right: 10, bottom: 20, left: 10 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  // Calculate max value for count metrics to scale properly
  const maxValue = isCountMetric 
    ? Math.max(...chartMatches.map(m => getValue(m)), 10) 
    : 100;

  // Generate SVG path for line chart
  const generatePath = () => {
    if (chartMatches.length < 2) return '';
    
    const points = chartMatches.map((m, i) => {
      const x = padding.left + (i / (chartMatches.length - 1)) * plotWidth;
      const y = padding.top + plotHeight - (getValue(m) / maxValue) * plotHeight;
      return { x, y, match: m };
    });

    const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    return pathD;
  };

  // Y-axis labels based on metric type
  const yLabels = isCountMetric 
    ? { top: `${maxValue}`, mid: `${Math.round(maxValue / 2)}`, bottom: '0' }
    : { top: '100%', mid: '50%', bottom: '0%' };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-4 border-b border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-white">{teamName}</h2>
            <p className="text-gray-300 text-sm">{title} Trend</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        {/* Line Chart */}
        <div className="p-4 border-b border-gray-700">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-32">
            {/* Grid lines */}
            <line x1={padding.left} y1={padding.top} x2={chartWidth - padding.right} y2={padding.top} stroke="#374151" strokeWidth="0.5" />
            <line x1={padding.left} y1={padding.top + plotHeight * 0.5} x2={chartWidth - padding.right} y2={padding.top + plotHeight * 0.5} stroke="#374151" strokeWidth="0.5" strokeDasharray="4" />
            <line x1={padding.left} y1={padding.top + plotHeight} x2={chartWidth - padding.right} y2={padding.top + plotHeight} stroke="#374151" strokeWidth="0.5" />
            
            {/* Y-axis labels */}
            <text x={padding.left - 2} y={padding.top + 3} fill="#6b7280" fontSize="8" textAnchor="end">{yLabels.top}</text>
            <text x={padding.left - 2} y={padding.top + plotHeight * 0.5 + 2} fill="#6b7280" fontSize="8" textAnchor="end">{yLabels.mid}</text>
            <text x={padding.left - 2} y={padding.top + plotHeight + 2} fill="#6b7280" fontSize="8" textAnchor="end">{yLabels.bottom}</text>

            {/* Line */}
            <path d={generatePath()} fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            
            {/* Data points */}
            {chartMatches.map((m, i) => {
              const x = padding.left + (chartMatches.length > 1 ? (i / (chartMatches.length - 1)) * plotWidth : plotWidth / 2);
              const y = padding.top + plotHeight - (getValue(m) / maxValue) * plotHeight;
              const dateObj = new Date(m.match.date);
              const dateLabel = `${dateObj.getDate()} ${dateObj.toLocaleDateString('en-GB', { month: 'short' })}`;
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r="5" fill={getPointColor(m)} stroke="#1f2937" strokeWidth="2" />
                  <title>{`${formatDate(m.match.date)} vs ${m.opponent}: ${getLabel(m)}`}</title>
                  {/* Date label */}
                  <text x={x} y={chartHeight - 5} fill="#6b7280" fontSize="7" textAnchor="middle">
                    {dateLabel}
                  </text>
                </g>
              );
            })}
          </svg>
          <p className="text-gray-400 text-xs text-center mt-1">
            {sortedMatches.length > 10 ? 'Last 10 matches · ' : ''}Oldest → Newest
          </p>
        </div>

        {/* Match List - chronological order (oldest first) */}
        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-2">
            {sortedMatches.map((m, i) => (
              <div key={i} className="flex items-center justify-between text-sm bg-gray-700 rounded p-2">
                <div className="flex-1">
                  <div className="text-gray-400 text-xs">{formatDate(m.match.date)}</div>
                  <div className="text-white">
                    {m.isHome ? 'vs' : '@'} {m.opponent}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-white font-medium">{getLabel(m)}</span>
                  <div className="text-gray-400 text-xs">
                    {calculateScore(m.stats)} - {calculateScore(m.opponentStats)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const TeamAnalytics = ({ history, onClose }: TeamAnalyticsProps) => {
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [trendMetric, setTrendMetric] = useState<TrendMetric>(null);
  const [showKickoutHeatmap, setShowKickoutHeatmap] = useState(false);
  const [showShotHeatmap, setShowShotHeatmap] = useState(false);

  // Get teams with minimum 3 games
  const eligibleTeams = useMemo(() => {
    const teamGameCounts = new Map<string, number>();
    history.forEach(match => {
      teamGameCounts.set(match.homeTeam, (teamGameCounts.get(match.homeTeam) || 0) + 1);
      teamGameCounts.set(match.awayTeam, (teamGameCounts.get(match.awayTeam) || 0) + 1);
    });
    return Array.from(teamGameCounts.entries())
      .filter(([_, count]) => count >= 3)
      .map(([team]) => team)
      .sort();
  }, [history]);

  // Get summary for selected team
  const teamSummary = useMemo(() => {
    if (!selectedTeam) return null;
    return getTeamSummary(selectedTeam, history);
  }, [selectedTeam, history]);

  // Get all kickouts for the selected team (aggregated from all matches)
  const teamKickouts = useMemo((): KickoutWithDate[] => {
    if (!selectedTeam) return [];
    
    const kickouts: KickoutWithDate[] = [];
    history.forEach(match => {
      if (!match.kickouts) return;
      
      const isHome = match.homeTeam === selectedTeam;
      const isAway = match.awayTeam === selectedTeam;
      
      if (!isHome && !isAway) return;
      
      // Get kickouts where this team was kicking
      const teamSide: 'home' | 'away' = isHome ? 'home' : 'away';
      const teamKickoutsInMatch = match.kickouts
        .filter(k => k.team === teamSide)
        .map(k => ({ ...k, matchDate: match.date }));
      kickouts.push(...teamKickoutsInMatch);
    });
    
    return kickouts;
  }, [selectedTeam, history]);

  // Get all shots for the selected team (aggregated from all matches)
  const teamShots = useMemo((): ShotWithDate[] => {
    if (!selectedTeam) return [];
    
    const shots: ShotWithDate[] = [];
    history.forEach(match => {
      if (!match.shots) return;
      
      const isHome = match.homeTeam === selectedTeam;
      const isAway = match.awayTeam === selectedTeam;
      
      if (!isHome && !isAway) return;
      
      // Get shots where this team was shooting
      const teamSide: 'home' | 'away' = isHome ? 'home' : 'away';
      const teamShotsInMatch = match.shots
        .filter(s => s.team === teamSide)
        .map(s => ({ ...s, matchDate: match.date }));
      shots.push(...teamShotsInMatch);
    });
    
    return shots;
  }, [selectedTeam, history]);

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 overflow-auto">
      <div className="max-w-lg mx-auto p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold text-white">📊 Team Analytics</h1>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        {history.length === 0 ? (
          <div className="text-center text-gray-300 py-12">
            <p className="text-lg mb-2">No match data yet</p>
            <p className="text-sm">Complete some matches to see team analytics</p>
          </div>
        ) : (
          <>
            {/* Team Selector */}
            <div className="mb-6">
              <label className="block text-gray-300 text-sm mb-2">Select Team</label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="">Choose a team...</option>
                {eligibleTeams.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>

            {/* Team Stats */}
            {teamSummary && (
              <div className="bg-gray-800 rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-white">{teamSummary.name}</h2>
                  <span className="text-gray-400 text-sm">
                    {teamSummary.matches.length} match{teamSummary.matches.length !== 1 ? 'es' : ''} · {teamSummary.wins}W {teamSummary.draws}D {teamSummary.losses}L
                  </span>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <StatCard
                    label="Shooting"
                    value={`${teamSummary.avgShootingAccuracy}%`}
                    subtext="Avg Accuracy"
                    onTrendClick={() => setTrendMetric('shooting')}
                  />
                  <StatCard
                    label="Kickouts"
                    value={`${teamSummary.avgKickoutWonPct}%`}
                    subtext="Own Won %"
                    onTrendClick={() => setTrendMetric('kickout')}
                  />
                  <StatCard
                    label="TO Won"
                    value={`${teamSummary.avgTurnoversWon}`}
                    subtext="Avg per game"
                    onTrendClick={() => setTrendMetric('turnoversWon')}
                  />
                  <StatCard
                    label="TO Lost"
                    value={`${teamSummary.avgTurnoversLost}`}
                    subtext="Avg per game"
                    onTrendClick={() => setTrendMetric('turnoversLost')}
                  />
                </div>

                {/* Kickout Heatmap Button */}
                {teamKickouts.length > 0 && (
                  <button
                    onClick={() => setShowKickoutHeatmap(true)}
                    className="w-full mt-4 bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    🎯 View Kickout Heatmap
                    <span className="text-teal-200 text-sm">({teamKickouts.length} kickouts)</span>
                  </button>
                )}

                {/* Shot Heatmap Button */}
                {teamShots.length > 0 && (
                  <button
                    onClick={() => setShowShotHeatmap(true)}
                    className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    🎯 View Shot Heatmap
                    <span className="text-blue-200 text-sm">({teamShots.length} shots)</span>
                  </button>
                )}
              </div>
            )}

            {/* Recent Matches for Selected Team */}
            {teamSummary && teamSummary.matches.length > 0 && (
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-gray-300 text-sm font-medium">Recent Matches</h3>
                  <span className="text-gray-400 text-xs">vs = Home · @ = Away</span>
                </div>
                
                {/* Table Header */}
                <div className="flex items-center text-xs text-gray-300 mb-2 px-2">
                  <div className="flex-1">Match</div>
                  <div className="w-14 text-center">Score</div>
                  <div className="w-12 text-center">Shot%</div>
                  <div className="w-12 text-center">KO%</div>
                  <div className="w-8 text-center"></div>
                </div>

                <div className="space-y-2">
                  {teamSummary.matches.slice(0, 5).map((m, i) => {
                    const date = new Date(m.match.date);
                    return (
                      <div key={i} className="flex items-center text-sm bg-gray-700 rounded p-2">
                        <div className="flex-1 min-w-0">
                          <span className="text-gray-400 text-xs">
                            {date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </span>
                          <span className="text-white ml-1 truncate">
                            {m.isHome ? 'vs' : '@'} {m.opponent}
                          </span>
                        </div>
                        <div className="w-14 text-center text-white font-mono text-xs">
                          {calculateScore(m.stats)} - {calculateScore(m.opponentStats)}
                        </div>
                        <div className="w-12 text-center text-gray-300 text-xs">
                          {m.shootingAccuracy}%
                        </div>
                        <div className="w-12 text-center text-gray-300 text-xs">
                          {m.kickoutWonPct}%
                        </div>
                        <div className="w-8 text-center">
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                            m.won ? 'bg-green-600 text-white' : m.drew ? 'bg-amber-600 text-white' : 'bg-red-600 text-white'
                          }`}>
                            {m.won ? 'W' : m.drew ? 'D' : 'L'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {teamSummary.matches.length > 5 && (
                  <p className="text-gray-400 text-xs text-center mt-2">
                    + {teamSummary.matches.length - 5} more matches
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Trend Modal */}
      {trendMetric && teamSummary && (
        <TrendModal
          teamName={teamSummary.name}
          metric={trendMetric}
          matches={teamSummary.matches}
          onClose={() => setTrendMetric(null)}
        />
      )}

      {/* Kickout Heatmap Modal */}
      {showKickoutHeatmap && selectedTeam && teamKickouts.length > 0 && (
        <KickoutHeatmap
          kickouts={teamKickouts}
          teamName={selectedTeam}
          onClose={() => setShowKickoutHeatmap(false)}
        />
      )}

      {/* Shot Heatmap Modal */}
      {showShotHeatmap && selectedTeam && teamShots.length > 0 && (
        <ShotHeatmap
          shots={teamShots}
          teamName={selectedTeam}
          onClose={() => setShowShotHeatmap(false)}
        />
      )}
    </div>
  );
};
