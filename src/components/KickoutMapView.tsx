import { useState } from 'react';
import type { Kickout, Team } from '../types/match';

interface KickoutMapViewProps {
  kickouts: Kickout[];
  homeTeam: string;
  awayTeam: string;
  onClose: () => void;
}

// Reusable half-pitch markings component
const PitchMarkings = () => (
  <>
    {/* Pitch background */}
    <rect x="0" y="0" width="100" height="120" fill="#228B22" />
    
    {/* Pitch outline */}
    <rect x="5" y="5" width="90" height="110" fill="none" stroke="white" strokeWidth="0.8" />
    
    {/* Goals - H shape */}
    <line x1="42" y1="0" x2="42" y2="5" stroke="white" strokeWidth="0.8" />
    <line x1="58" y1="0" x2="58" y2="5" stroke="white" strokeWidth="0.8" />
    <line x1="42" y1="3" x2="58" y2="3" stroke="white" strokeWidth="0.8" />
    
    {/* Small rectangle (goal area / 6 yard box) */}
    <rect x="39" y="5" width="22" height="8" fill="none" stroke="white" strokeWidth="0.8" />
    
    {/* 14m line - straight across */}
    <line x1="5" y1="22" x2="95" y2="22" stroke="white" strokeWidth="0.8" />
    
    {/* Penalty area vertical lines - from 14m line to endline */}
    <line x1="32" y1="5" x2="32" y2="22" stroke="white" strokeWidth="0.8" />
    <line x1="68" y1="5" x2="68" y2="22" stroke="white" strokeWidth="0.8" />
    
    {/* 20m line - straight across */}
    <line x1="5" y1="29" x2="95" y2="29" stroke="white" strokeWidth="0.8" />
    
    {/* Large D/arc (20m arc) - semicircle curving DOWN from 20m line */}
    <path
      d="M 15 29 A 35 30 0 0 0 85 29"
      fill="none"
      stroke="white"
      strokeWidth="0.8"
    />
    
    {/* Small D/arc (13m arc) - smaller semicircle curving DOWN */}
    <path
      d="M 30 29 A 20 18 0 0 0 70 29"
      fill="none"
      stroke="white"
      strokeWidth="0.8"
    />
    
    {/* 45m line - solid */}
    <line x1="5" y1="70" x2="95" y2="70" stroke="white" strokeWidth="0.8" />
    
    {/* 65m line - dashed */}
    <line x1="5" y1="100" x2="95" y2="100" stroke="white" strokeWidth="0.8" strokeDasharray="3,2" />
  </>
);

export const KickoutMapView = ({ kickouts, homeTeam, awayTeam, onClose }: KickoutMapViewProps) => {
  const [activeTeam, setActiveTeam] = useState<Team>('home');
  
  const homeKickouts = kickouts.filter(k => k.team === 'home');
  const awayKickouts = kickouts.filter(k => k.team === 'away');
  const currentKickouts = activeTeam === 'home' ? homeKickouts : awayKickouts;

  const renderKickouts = (teamKickouts: Kickout[], team: Team) => {
    const wonColor = team === 'home' ? '#2dd4bf' : '#60a5fa'; // teal for home, blue for away
    
    return teamKickouts.map(kickout => (
      <g key={kickout.id}>
        {kickout.won ? (
          <text
            x={kickout.x}
            y={kickout.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill={wonColor}
            fontSize="6"
            fontWeight="bold"
          >
            ✓
          </text>
        ) : (
          <text
            x={kickout.x}
            y={kickout.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="#ef4444"
            fontSize="6"
            fontWeight="bold"
          >
            ✗
          </text>
        )}
      </g>
    ));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg p-4 max-w-md w-full max-h-[90vh] overflow-auto">
        <h2 className="text-white text-xl font-bold text-center mb-4">Kickout Map</h2>
        
        {/* Team Tabs */}
        <div className="flex mb-4">
          <button
            onClick={() => setActiveTeam('home')}
            className={`flex-1 py-3 font-bold text-center transition-colors rounded-l-lg ${
              activeTeam === 'home'
                ? 'bg-green-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            {homeTeam}
          </button>
          <button
            onClick={() => setActiveTeam('away')}
            className={`flex-1 py-3 font-bold text-center transition-colors rounded-r-lg ${
              activeTeam === 'away'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            {awayTeam}
          </button>
        </div>

        {/* Single Team Kickout Map */}
        <div>
          <svg viewBox="0 0 100 120" className="w-full border border-gray-600 rounded">
            <PitchMarkings />
            {renderKickouts(currentKickouts, activeTeam)}
          </svg>
          <div className="text-gray-400 text-sm text-center mt-2">
            {currentKickouts.filter(k => k.won).length} won, {currentKickouts.filter(k => !k.won).length} lost
          </div>
        </div>

        <div className="flex justify-center gap-4 mt-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className={activeTeam === 'home' ? 'text-teal-400' : 'text-blue-400'}>✓</span>
            <span className="text-gray-400 text-sm">Won</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-400">✗</span>
            <span className="text-gray-400 text-sm">Lost</span>
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="w-full bg-gray-600 hover:bg-gray-700 text-white py-3 rounded font-medium transition-colors mt-4"
        >
          Close
        </button>
      </div>
    </div>
  );
};
