import { useState, useMemo } from 'react';
import type { Shot } from '../types/match';

// Shot with match date for filtering
export interface ShotWithDate extends Shot {
  matchDate: string;
}

interface ShotHeatmapProps {
  shots: ShotWithDate[];
  teamName: string;
  onClose: () => void;
}

type HeatmapView = 'scores' | 'misses' | 'all' | 'zones';
type DateRange = 'all' | 'last30' | 'last90' | 'thisYear' | 'custom';

// Get date range boundaries
const getDateRange = (range: DateRange, customStart?: string, customEnd?: string): { start: Date; end: Date } => {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
  
  switch (range) {
    case 'last30': {
      const start = new Date(now);
      start.setDate(start.getDate() - 30);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    case 'last90': {
      const start = new Date(now);
      start.setDate(start.getDate() - 90);
      start.setHours(0, 0, 0, 0);
      return { start, end };
    }
    case 'thisYear': {
      const start = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
      return { start, end };
    }
    case 'custom': {
      const start = customStart ? new Date(customStart) : new Date(0);
      const customEndDate = customEnd ? new Date(customEnd) : end;
      customEndDate.setHours(23, 59, 59);
      return { start, end: customEndDate };
    }
    default: // 'all'
      return { start: new Date(0), end };
  }
};

// Pitch markings for the heatmap
const PitchMarkings = () => (
  <>
    {/* Pitch outline */}
    <rect x="5" y="5" width="90" height="110" fill="none" stroke="white" strokeWidth="0.8" opacity="0.5" />
    
    {/* Goals - H shape */}
    <line x1="42" y1="0" x2="42" y2="5" stroke="white" strokeWidth="0.8" opacity="0.5" />
    <line x1="58" y1="0" x2="58" y2="5" stroke="white" strokeWidth="0.8" opacity="0.5" />
    <line x1="42" y1="3" x2="58" y2="3" stroke="white" strokeWidth="0.8" opacity="0.5" />
    
    {/* Small rectangle (goal area) */}
    <rect x="39" y="5" width="22" height="8" fill="none" stroke="white" strokeWidth="0.8" opacity="0.5" />
    
    {/* 14m line */}
    <line x1="5" y1="22" x2="95" y2="22" stroke="white" strokeWidth="0.8" opacity="0.5" />
    
    {/* Penalty area vertical lines */}
    <line x1="32" y1="5" x2="32" y2="22" stroke="white" strokeWidth="0.8" opacity="0.5" />
    <line x1="68" y1="5" x2="68" y2="22" stroke="white" strokeWidth="0.8" opacity="0.5" />
    
    {/* 20m line */}
    <line x1="5" y1="29" x2="95" y2="29" stroke="white" strokeWidth="0.8" opacity="0.5" />
    
    {/* 20m arc */}
    <path d="M 15 29 A 35 30 0 0 0 85 29" fill="none" stroke="white" strokeWidth="0.8" opacity="0.5" />
    
    {/* 13m arc */}
    <path d="M 30 29 A 20 18 0 0 0 70 29" fill="none" stroke="white" strokeWidth="0.8" opacity="0.5" />
    
    {/* 45m line */}
    <line x1="5" y1="70" x2="95" y2="70" stroke="white" strokeWidth="0.8" opacity="0.5" />
    
    {/* 65m line */}
    <line x1="5" y1="100" x2="95" y2="100" stroke="white" strokeWidth="0.8" strokeDasharray="3,2" opacity="0.5" />
  </>
);

// Grid configuration for heatmap
const GRID_COLS = 6;
const GRID_ROWS = 8;

interface ZoneData {
  total: number;
  scores: number;
  misses: number;
  accuracy: number;
}

// Calculate zone statistics
const calculateZoneStats = (shots: Shot[]): ZoneData[][] => {
  const zones: ZoneData[][] = Array(GRID_ROWS).fill(null).map(() =>
    Array(GRID_COLS).fill(null).map(() => ({ total: 0, scores: 0, misses: 0, accuracy: 0 }))
  );

  shots.forEach(shot => {
    const col = Math.min(Math.floor(shot.x / 100 * GRID_COLS), GRID_COLS - 1);
    const row = Math.min(Math.floor(shot.y / 100 * GRID_ROWS), GRID_ROWS - 1);
    
    zones[row][col].total++;
    if (shot.isScore) {
      zones[row][col].scores++;
    } else {
      zones[row][col].misses++;
    }
  });

  // Calculate accuracy
  zones.forEach(row => {
    row.forEach(zone => {
      zone.accuracy = zone.total > 0 ? Math.round((zone.scores / zone.total) * 100) : 0;
    });
  });

  return zones;
};

// Get intensity for heatmap (0-1)
const getIntensity = (count: number, maxCount: number): number => {
  if (maxCount === 0) return 0;
  return count / maxCount;
};

// Get color based on view type and intensity
const getHeatColor = (intensity: number, view: HeatmapView): string => {
  if (intensity === 0) return 'transparent';
  
  const alpha = 0.2 + (intensity * 0.6); // 0.2 to 0.8 opacity
  
  switch (view) {
    case 'scores':
      return `rgba(34, 197, 94, ${alpha})`; // Green
    case 'misses':
      return `rgba(239, 68, 68, ${alpha})`; // Red
    case 'all':
      return `rgba(59, 130, 246, ${alpha})`; // Blue
    default:
      return 'transparent';
  }
};

// Get zone color based on accuracy
const getZoneColor = (accuracy: number, total: number): string => {
  if (total === 0) return 'transparent';
  
  if (accuracy >= 70) return 'rgba(34, 197, 94, 0.6)'; // Green - high accuracy
  if (accuracy >= 50) return 'rgba(234, 179, 8, 0.6)'; // Yellow - medium
  if (accuracy >= 30) return 'rgba(249, 115, 22, 0.6)'; // Orange - below average
  return 'rgba(239, 68, 68, 0.6)'; // Red - low accuracy
};

export const ShotHeatmap = ({ shots, teamName, onClose }: ShotHeatmapProps) => {
  const [view, setView] = useState<HeatmapView>('all');
  const [showMarkers, setShowMarkers] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Filter shots by date range
  const dateFilteredShots = useMemo(() => {
    const { start, end } = getDateRange(dateRange, customStartDate, customEndDate);
    return shots.filter(s => {
      const matchDate = new Date(s.matchDate);
      return matchDate >= start && matchDate <= end;
    });
  }, [shots, dateRange, customStartDate, customEndDate]);

  // Filter shots based on view (scores/misses/all)
  const filteredShots = useMemo(() => {
    switch (view) {
      case 'scores':
        return dateFilteredShots.filter(s => s.isScore);
      case 'misses':
        return dateFilteredShots.filter(s => !s.isScore);
      default:
        return dateFilteredShots;
    }
  }, [dateFilteredShots, view]);

  // Calculate zone statistics based on date-filtered shots
  const zoneStats = useMemo(() => calculateZoneStats(dateFilteredShots), [dateFilteredShots]);

  // Find max count for intensity scaling
  const maxCount = useMemo(() => {
    let max = 0;
    zoneStats.forEach(row => {
      row.forEach(zone => {
        const count = view === 'scores' ? zone.scores : view === 'misses' ? zone.misses : zone.total;
        if (count > max) max = count;
      });
    });
    return max;
  }, [zoneStats, view]);

  // Summary stats based on date-filtered shots
  const stats = useMemo(() => {
    const scores = dateFilteredShots.filter(s => s.isScore).length;
    const misses = dateFilteredShots.filter(s => !s.isScore).length;
    const total = dateFilteredShots.length;
    const accuracy = total > 0 ? Math.round((scores / total) * 100) : 0;
    return { scores, misses, total, accuracy };
  }, [dateFilteredShots]);

  // Date range labels
  const dateRangeLabels: Record<DateRange, string> = {
    all: 'All Time',
    last30: 'Last 30 Days',
    last90: 'Last 90 Days',
    thisYear: 'This Year',
    custom: 'Custom Range',
  };

  const viewLabels: Record<HeatmapView, string> = {
    scores: 'Scores',
    misses: 'Misses',
    all: 'All Shots',
    zones: 'Accuracy Zones',
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 p-4 border-b border-gray-700 z-10">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-bold text-white">🎯 Shot Heatmap</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-2xl leading-none"
            >
              ✕
            </button>
          </div>
          <p className="text-gray-400 text-sm">{teamName} · {stats.total} shots</p>
        </div>

        {/* Summary Stats */}
        <div className="p-4 border-b border-gray-700">
          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-gray-700 rounded-lg p-2">
              <div className="text-blue-400 text-lg font-bold">{stats.total}</div>
              <div className="text-gray-400 text-xs">Total</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-2">
              <div className="text-green-400 text-lg font-bold">{stats.scores}</div>
              <div className="text-gray-400 text-xs">Scores</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-2">
              <div className="text-red-400 text-lg font-bold">{stats.misses}</div>
              <div className="text-gray-400 text-xs">Misses</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-2">
              <div className={`text-lg font-bold ${stats.accuracy >= 50 ? 'text-green-400' : 'text-red-400'}`}>
                {stats.accuracy}%
              </div>
              <div className="text-gray-400 text-xs">Accuracy</div>
            </div>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="p-4 border-b border-gray-700">
          <div className="text-gray-300 text-xs font-medium mb-2">📅 Date Range</div>
          <div className="flex flex-wrap gap-2 mb-2">
            {(['all', 'last30', 'last90', 'thisYear', 'custom'] as DateRange[]).map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {dateRangeLabels[range]}
              </button>
            ))}
          </div>
          {dateRange === 'custom' && (
            <div className="flex gap-2 mt-2">
              <div className="flex-1">
                <label className="text-gray-400 text-xs block mb-1">From</label>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="text-gray-400 text-xs block mb-1">To</label>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full bg-gray-700 text-white text-sm rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
          {dateRange !== 'all' && (
            <p className="text-gray-500 text-xs mt-2">
              Showing {stats.total} of {shots.length} shots
            </p>
          )}
        </div>

        {/* View Tabs */}
        <div className="flex border-b border-gray-700">
          {(['all', 'scores', 'misses', 'zones'] as HeatmapView[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                view === v
                  ? 'text-white border-b-2 border-blue-500 bg-gray-700/50'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {v === 'scores' && '✓ '}
              {v === 'misses' && '✗ '}
              {v === 'zones' && '📊 '}
              {viewLabels[v]}
            </button>
          ))}
        </div>

        {/* Heatmap */}
        <div className="p-4">
          <div className="relative bg-green-800 rounded-lg overflow-hidden" style={{ aspectRatio: '100/120' }}>
            {/* Pitch markings */}
            <svg viewBox="0 0 100 120" className="absolute inset-0 w-full h-full">
              <PitchMarkings />
            </svg>

            {/* Heatmap Grid */}
            <svg viewBox="0 0 100 120" className="absolute inset-0 w-full h-full">
              {view === 'zones' ? (
                // Zone view with accuracy colors
                zoneStats.map((row, rowIndex) =>
                  row.map((zone, colIndex) => (
                    <g key={`${rowIndex}-${colIndex}`}>
                      <rect
                        x={(colIndex * 100) / GRID_COLS}
                        y={(rowIndex * 120) / GRID_ROWS}
                        width={100 / GRID_COLS}
                        height={120 / GRID_ROWS}
                        fill={getZoneColor(zone.accuracy, zone.total)}
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth="0.2"
                      />
                      {zone.total > 0 && (
                        <>
                          <text
                            x={(colIndex * 100) / GRID_COLS + 100 / GRID_COLS / 2}
                            y={(rowIndex * 120) / GRID_ROWS + 120 / GRID_ROWS / 2 - 1.5}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="white"
                            fontSize="5"
                            fontWeight="bold"
                          >
                            {zone.accuracy}%
                          </text>
                          <text
                            x={(colIndex * 100) / GRID_COLS + 100 / GRID_COLS / 2}
                            y={(rowIndex * 120) / GRID_ROWS + 120 / GRID_ROWS / 2 + 4}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fill="rgba(255,255,255,0.7)"
                            fontSize="3"
                          >
                            ({zone.total})
                          </text>
                        </>
                      )}
                    </g>
                  ))
                )
              ) : (
                // Heatmap view
                zoneStats.map((row, rowIndex) =>
                  row.map((zone, colIndex) => {
                    const count = view === 'scores' ? zone.scores : view === 'misses' ? zone.misses : zone.total;
                    const intensity = getIntensity(count, maxCount);
                    return (
                      <rect
                        key={`${rowIndex}-${colIndex}`}
                        x={(colIndex * 100) / GRID_COLS}
                        y={(rowIndex * 120) / GRID_ROWS}
                        width={100 / GRID_COLS}
                        height={120 / GRID_ROWS}
                        fill={getHeatColor(intensity, view)}
                      />
                    );
                  })
                )
              )}
            </svg>

            {/* Individual Markers (optional) */}
            {showMarkers && view !== 'zones' && (
              <svg viewBox="0 0 100 120" className="absolute inset-0 w-full h-full pointer-events-none">
                {filteredShots.map(shot => (
                  <g key={shot.id}>
                    <circle
                      cx={shot.x}
                      cy={(shot.y / 100) * 120}
                      r="2"
                      fill={shot.isScore ? '#22c55e' : '#ef4444'}
                      stroke="white"
                      strokeWidth="0.4"
                    />
                  </g>
                ))}
              </svg>
            )}
          </div>

          {/* Toggle markers */}
          {view !== 'zones' && (
            <button
              onClick={() => setShowMarkers(!showMarkers)}
              className={`mt-3 w-full py-2 rounded-lg text-sm font-medium transition-colors ${
                showMarkers
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {showMarkers ? '🔴 Hide Individual Markers' : '⚪ Show Individual Markers'}
            </button>
          )}

          {/* Legend */}
          <div className="mt-4 p-3 bg-gray-700 rounded-lg">
            <div className="text-gray-300 text-xs font-medium mb-2">Legend</div>
            {view === 'zones' ? (
              <div className="grid grid-cols-4 gap-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(34, 197, 94, 0.6)' }}></div>
                  <span className="text-gray-300">≥70%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(234, 179, 8, 0.6)' }}></div>
                  <span className="text-gray-300">50-69%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(249, 115, 22, 0.6)' }}></div>
                  <span className="text-gray-300">30-49%</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.6)' }}></div>
                  <span className="text-gray-300">&lt;30%</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Low frequency</span>
                <div className="flex-1 mx-2 h-3 rounded" style={{
                  background: view === 'scores' 
                    ? 'linear-gradient(to right, rgba(34, 197, 94, 0.2), rgba(34, 197, 94, 0.8))'
                    : view === 'misses'
                    ? 'linear-gradient(to right, rgba(239, 68, 68, 0.2), rgba(239, 68, 68, 0.8))'
                    : 'linear-gradient(to right, rgba(59, 130, 246, 0.2), rgba(59, 130, 246, 0.8))'
                }}></div>
                <span className="text-gray-400">High frequency</span>
              </div>
            )}
          </div>
        </div>

        {/* Close Button */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={onClose}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3 rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
