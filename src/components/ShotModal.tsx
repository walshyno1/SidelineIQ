import { useState, useEffect } from 'react';
import type { Team, ShotType } from '../types/match';
import { PitchCanvas } from './PitchCanvas';

interface ShotModalProps {
  team: Team;
  shotType: ShotType;
  teamName: string;
  onConfirm: (x: number, y: number) => void;
  onCancel: () => void;
}

export const ShotModal = ({ team, shotType, teamName, onConfirm, onCancel }: ShotModalProps) => {
  const [clickedLocation, setClickedLocation] = useState<{ x: number; y: number } | null>(null);
  const isScore = shotType === 'point' || shotType === 'two_point' || shotType === 'goal';
  const borderColor = team === 'home' ? 'border-green-500' : 'border-blue-500';
  const bgColor = isScore ? 'bg-green-900' : 'bg-red-900';
  
  const shotLabel = {
    point: 'Point',
    two_point: 'Two Point',
    goal: 'Goal',
    wide: 'Wide',
    short: 'Dropped Short',
    saved: 'Shot Saved',
  }[shotType];

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
              {isScore ? '✓' : '✗'} {shotLabel}
            </span>
          </div>
        </div>
        
        <div className="flex justify-center mb-4">
          <PitchCanvas 
            onClick={handlePitchClick} 
            isScore={isScore} 
            clickedLocation={clickedLocation}
          />
        </div>
        
        {clickedLocation ? (
          <div className="text-center text-gray-400 text-sm py-2">
            Recording shot location...
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
