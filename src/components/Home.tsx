import { useState } from 'react';

interface HomeProps {
  onNewMatch: () => void;
  onViewHistory: () => void;
  onViewAnalytics: () => void;
  onViewAttendance: () => void;
  onViewBackup: () => void;
  onContinueMatch: () => void;
  historyCount: number;
  hasActiveMatch: boolean;
  isLoadingHistory?: boolean;
  hasTeamWithMinGames?: boolean;
}

export const Home = ({ 
  onNewMatch, 
  onViewHistory, 
  onViewAnalytics,
  onViewAttendance,
  onViewBackup,
  onContinueMatch,
  historyCount,
  hasActiveMatch,
  isLoadingHistory = false,
  hasTeamWithMinGames = false,
}: HomeProps) => {
  const [showMinGamesAlert, setShowMinGamesAlert] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleAnalyticsClick = () => {
    setShowMenu(false);
    if (hasTeamWithMinGames) {
      onViewAnalytics();
    } else {
      setShowMinGamesAlert(true);
    }
  };

  const handleMenuItemClick = (action: () => void) => {
    setShowMenu(false);
    action();
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center p-4 relative">
      {/* Hamburger Menu Button */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="absolute top-4 left-4 p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors z-40"
        aria-label="Menu"
      >
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Slide-out Menu */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setShowMenu(false)}
          />
          
          {/* Menu Panel */}
          <div className="fixed top-0 left-0 h-full w-72 bg-gray-800 shadow-2xl z-50 transform transition-transform">
            {/* Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-lg font-bold text-white">Menu</h2>
              <button
                onClick={() => setShowMenu(false)}
                className="p-1 text-gray-400 hover:text-white rounded"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Menu Items */}
            <nav className="p-2">
              <button
                onClick={handleAnalyticsClick}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-200 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <span className="text-xl">📊</span>
                <span>Team Analytics</span>
              </button>
              
              <button
                onClick={() => handleMenuItemClick(onViewAttendance)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-200 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <span className="text-xl">📋</span>
                <span>Attendance Tracking</span>
              </button>
              
              <button
                onClick={() => handleMenuItemClick(onViewBackup)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left text-gray-200 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <span className="text-xl">💾</span>
                <span>Backup & Restore</span>
              </button>
            </nav>
          </div>
        </>
      )}

      {/* Minimum Games Alert Modal */}
      {showMinGamesAlert && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-xl p-6 max-w-sm w-full text-center shadow-2xl border border-gray-700">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-white mb-2">Not Enough Data</h3>
            <p className="text-gray-400 mb-6">
              Team Analytics requires at least 3 games recorded for a team. Keep tracking matches to unlock this feature!
            </p>
            <button
              onClick={() => setShowMinGamesAlert(false)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      <div className="w-full max-w-md text-center">
        {/* Logo/Title */}
        <div className="mb-12">
          <div className="text-6xl mb-4">🏐</div>
          <h1 className="text-4xl font-bold text-white mb-2">
            Sideline IQ
          </h1>
          <p className="text-gray-400">
            Track match statistics with ease
          </p>
        </div>

        {/* Main Actions */}
        <div className="space-y-4">
          {/* Continue Match - Only show if there is an active match */}
          {hasActiveMatch && (
            <button
              onClick={onContinueMatch}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-3"
            >
              <span className="text-2xl">▶️</span>
              <span className="text-lg">Continue Match</span>
            </button>
          )}

          {/* New Match */}
          <button
            onClick={onNewMatch}
            className={`w-full ${hasActiveMatch ? 'bg-gray-700 hover:bg-gray-600' : 'bg-green-600 hover:bg-green-700'} text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-3`}
          >
            <span className="text-2xl">➕</span>
            <span className="text-lg">New Match</span>
          </button>

          {/* Match History */}
          <button
            onClick={onViewHistory}
            className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 px-6 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg flex items-center justify-center gap-3"
          >
            <span className="text-2xl">📜</span>
            <div className="flex items-center gap-2">
              <span className="text-lg">Match History</span>
              {isLoadingHistory ? (
                <span className="text-sm text-gray-400">...</span>
              ) : historyCount > 0 && (
                <span className="bg-gray-600 text-sm px-2 py-0.5 rounded-full">
                  {historyCount}
                </span>
              )}
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="mt-12 text-gray-500 text-sm">
          <p>Track scores, shots, kickouts and more</p>
        </div>
      </div>
    </div>
  );
};
