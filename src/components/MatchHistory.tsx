import { useState } from 'react';
import type { Match } from '../types/match';
import { calculateScore, calculateTotalScore } from '../utils/calculations';
import { ConfirmModal } from './ConfirmModal';

interface MatchHistoryProps {
  history: Match[];
  onSelectMatch: (match: Match) => void;
  onDeleteMatch: (matchId: string) => void;
  onClose: () => void;
}

const MATCHES_PER_PAGE = 20;

export const MatchHistory = ({
  history,
  onSelectMatch,
  onDeleteMatch,
  onClose,
}: MatchHistoryProps) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteMatchId, setDeleteMatchId] = useState<string | null>(null);

  const totalPages = Math.ceil(history.length / MATCHES_PER_PAGE);
  const startIndex = (currentPage - 1) * MATCHES_PER_PAGE;
  const paginatedHistory = history.slice(startIndex, startIndex + MATCHES_PER_PAGE);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
    });
  };

  const getWinnerClass = (match: Match) => {
    const homeTotal = calculateTotalScore(match.homeStats);
    const awayTotal = calculateTotalScore(match.awayStats);
    if (homeTotal > awayTotal) return 'home';
    if (awayTotal > homeTotal) return 'away';
    return 'draw';
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-50 overflow-auto">
      <div className="max-w-lg mx-auto p-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold text-white">Match History</h1>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Match List */}
        {history.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <p className="text-lg mb-2">No matches saved yet</p>
            <p className="text-sm">Completed matches will appear here</p>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-1 text-xs text-gray-400 px-2 py-1 border-b border-gray-700 mb-1">
              <div className="col-span-2">Date</div>
              <div className="col-span-4">Match</div>
              <div className="col-span-3 text-center">Score</div>
              <div className="col-span-3 text-right">Actions</div>
            </div>

            {/* Table Rows */}
            <div className="space-y-1">
              {paginatedHistory.map((match) => {
                const winner = getWinnerClass(match);
                const homeScore = calculateScore(match.homeStats);
                const awayScore = calculateScore(match.awayStats);
                
                return (
                  <div
                    key={match.id}
                    className="grid grid-cols-12 gap-1 items-center bg-gray-800 rounded px-2 py-2 text-sm hover:bg-gray-750"
                  >
                    {/* Date */}
                    <div className="col-span-2 text-gray-400 text-xs">
                      {formatDate(match.date)}
                    </div>
                    
                    {/* Teams */}
                    <div 
                      className="col-span-4 cursor-pointer truncate"
                      onClick={() => onSelectMatch(match)}
                    >
                      <span className={winner === 'home' ? 'text-green-400 font-medium' : 'text-gray-300'}>
                        {match.homeTeam}
                      </span>
                      <span className="text-gray-500 mx-1">v</span>
                      <span className={winner === 'away' ? 'text-blue-400 font-medium' : 'text-gray-300'}>
                        {match.awayTeam}
                      </span>
                    </div>

                    {/* Score */}
                    <div 
                      className="col-span-3 text-center cursor-pointer font-mono"
                      onClick={() => onSelectMatch(match)}
                    >
                      <span className={winner === 'home' ? 'text-green-400' : 'text-gray-300'}>{homeScore}</span>
                      <span className="text-gray-500 mx-1">-</span>
                      <span className={winner === 'away' ? 'text-blue-400' : 'text-gray-300'}>{awayScore}</span>
                    </div>

                    {/* Actions */}
                    <div className="col-span-3 flex justify-end gap-1">
                      <button
                        onClick={() => onSelectMatch(match)}
                        className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-xs transition-colors"
                        title="View"
                      >
                        👁
                      </button>
                      <button
                        onClick={() => setDeleteMatchId(match.id)}
                        className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors"
                        title="Delete"
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-4 pt-4 border-t border-gray-700">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-1 rounded text-sm ${
                    currentPage === 1
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-600 hover:bg-gray-500 text-white'
                  }`}
                >
                  ← Prev
                </button>
                <span className="text-gray-400 text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-1 rounded text-sm ${
                    currentPage === totalPages
                      ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-600 hover:bg-gray-500 text-white'
                  }`}
                >
                  Next →
                </button>
              </div>
            )}

            {/* Match count */}
            <div className="text-center text-gray-500 text-xs mt-2">
              {history.length} match{history.length !== 1 ? 'es' : ''} total
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteMatchId && (
        <ConfirmModal
          title="Delete Match?"
          message="This match will be permanently removed from your history."
          confirmText="Delete"
          confirmColor="red"
          onConfirm={() => {
            onDeleteMatch(deleteMatchId);
            setDeleteMatchId(null);
          }}
          onCancel={() => setDeleteMatchId(null)}
        />
      )}
    </div>
  );
};
