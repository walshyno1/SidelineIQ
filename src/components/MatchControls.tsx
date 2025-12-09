import { useState } from 'react';
import { ConfirmModal } from './ConfirmModal';

interface MatchControlsProps {
  currentHalf: 1 | 2;
  isFinished: boolean;
  trackShots: boolean;
  trackKickouts: boolean;
  onHalfTime: () => void;
  onFullTime: () => void;
  onViewShotMap: () => void;
  onViewKickoutMap: () => void;
  onAbandonMatch: () => void;
}

type ConfirmType = 'halfTime' | 'fullTime' | 'abandon' | null;

export const MatchControls = ({
  currentHalf,
  isFinished,
  trackShots,
  trackKickouts,
  onHalfTime,
  onFullTime,
  onViewShotMap,
  onViewKickoutMap,
  onAbandonMatch,
}: MatchControlsProps) => {
  const [confirmType, setConfirmType] = useState<ConfirmType>(null);

  const handleConfirm = () => {
    if (confirmType === 'halfTime') {
      onHalfTime();
    } else if (confirmType === 'fullTime') {
      onFullTime();
    } else if (confirmType === 'abandon') {
      onAbandonMatch();
    }
    setConfirmType(null);
  };

  return (
    <div className="bg-gray-800 rounded-lg p-3 mt-4 space-y-2">
      {currentHalf === 1 && !isFinished && (
        <button
          onClick={() => setConfirmType('halfTime')}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white py-3 px-4 rounded font-medium transition-colors"
        >
          Half Time
        </button>
      )}
      {currentHalf === 2 && !isFinished && (
        <button
          onClick={() => setConfirmType('fullTime')}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded font-medium transition-colors"
        >
          Full Time
        </button>
      )}
      {trackShots && (
        <button
          onClick={onViewShotMap}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded font-medium transition-colors"
        >
          Shot Map
        </button>
      )}
      {trackKickouts && (
        <button
          onClick={onViewKickoutMap}
          className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded font-medium transition-colors"
        >
          Kickout Map
        </button>
      )}
      {!isFinished && (
        <button
          onClick={() => setConfirmType('abandon')}
          className="w-full bg-gray-700 hover:bg-gray-600 text-gray-300 py-2 px-4 rounded font-medium transition-colors"
        >
          Abandon Match
        </button>
      )}
      {isFinished && (
        <div className="text-center text-green-400 mt-2 font-bold">
          Match Finished
        </div>
      )}

      {/* Confirmation Modals */}
      {confirmType === 'halfTime' && (
        <ConfirmModal
          title="End First Half?"
          message="This will save all first half stats and show the half-time summary."
          confirmText="End Half"
          confirmColor="amber"
          onConfirm={handleConfirm}
          onCancel={() => setConfirmType(null)}
        />
      )}
      {confirmType === 'fullTime' && (
        <ConfirmModal
          title="End Match?"
          message="This will finalize all stats and end the match. This action cannot be undone."
          confirmText="End Match"
          confirmColor="red"
          onConfirm={handleConfirm}
          onCancel={() => setConfirmType(null)}
        />
      )}
      {confirmType === 'abandon' && (
        <ConfirmModal
          title="Abandon Match?"
          message="All stats from this match will be lost. This action cannot be undone."
          confirmText="Abandon"
          confirmColor="red"
          onConfirm={handleConfirm}
          onCancel={() => setConfirmType(null)}
        />
      )}
    </div>
  );
};
