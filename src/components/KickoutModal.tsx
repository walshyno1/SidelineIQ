import { useState, useEffect } from 'react';
import type { Team, KickoutType } from '../types/match';
import { PitchCanvas } from './PitchCanvas';

interface KickoutModalProps {
  team: Team;
  kickoutType: KickoutType;
  teamName: string;
  onConfirm: (x: number, y: number) => void;
  onCancel: () => void;
}

export const KickoutModal = ({ team, kickoutType, teamName, onConfirm, onCancel }: KickoutModalProps) => {
  const [clickedLocation, setClickedLocation] = useState<{ x: number; y: number } | null>(null);
  const isWon = kickoutType === 'kickout_won';
  const borderColor = team === 'home' ? 'border-green-500' : 'border-blue-500';
  const bgColor = isWon ? 'bg-teal-900' : 'bg-gray-700';
  
  const kickoutLabel = isWon ? 'Own Kickout Won' : 'Own Kickout Lost';

  const handlePitchClick = (x: number, y: number) => {
    setClickedLocation({ x, y });
  };

  // Auto-confirm after 1 second when location is clicked
  useEffect(() => {
    if (clickedLocation) {
      const timer = setTimeout(() => {
        onConfirm(clickedLocation.x, clickedLocation.y);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [clickedLocation, onConfirm]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className={`bg-gray-800 rounded-lg p-4 max-w-lg w-full border-t-4 ${borderColor}`}>
        <div className="text-center mb-4">
          <h2 className="text-white text-xl font-bold">{teamName}</h2>
          <div className={`inline-block px-3 py-1 rounded mt-2 ${bgColor}`}>
            <span className="text-white font-medium">
              {isWon ? '✓' : '✗'} {kickoutLabel}
            </span>
          </div>
          <p className="text-gray-400 text-sm mt-2">
            Tap where the kickout landed
          </p>
        </div>
        
        <div className="flex justify-center mb-4">
          <PitchCanvas 
            onClick={handlePitchClick} 
            isScore={isWon} 
            clickedLocation={clickedLocation}
          />
        </div>
        
        {clickedLocation ? (
          <div className="text-center text-gray-400 text-sm py-2">
            Recording kickout location...
          </div>
        ) : (
          <button
            onClick={onCancel}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 rounded font-medium transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};
