import { useState } from 'react';

interface MatchSetupProps {
  onStartMatch: (homeTeam: string, awayTeam: string, date: string, trackShots: boolean, trackKickouts: boolean) => void;
  onBack: () => void;
}

export const MatchSetup = ({ onStartMatch, onBack }: MatchSetupProps) => {
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [trackShots, setTrackShots] = useState(true);
  const [trackKickouts, setTrackKickouts] = useState(true);
  const [matchDate, setMatchDate] = useState(() => {
    // Default to today's date in YYYY-MM-DD format
    return new Date().toISOString().split('T')[0];
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (homeTeam.trim() && awayTeam.trim() && matchDate) {
      onStartMatch(homeTeam.trim(), awayTeam.trim(), new Date(matchDate).toISOString(), trackShots, trackKickouts);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-xl p-8 w-full max-w-md shadow-xl">
        {/* Header with back button */}
        <div className="flex items-center mb-6">
          <button
            onClick={onBack}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Back
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-300 mb-2 font-medium">Match Date</label>
            <input
              type="date"
              value={matchDate}
              onChange={(e) => setMatchDate(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
              required
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2 font-medium">Home Team</label>
            <input
              type="text"
              value={homeTeam}
              onChange={(e) => setHomeTeam(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
              placeholder="Enter home team name"
              required
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-2 font-medium">Away Team</label>
            <input
              type="text"
              value={awayTeam}
              onChange={(e) => setAwayTeam(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
              placeholder="Enter away team name"
              required
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-gray-300 font-medium">Shot Map Tracking</label>
              <p className="text-gray-500 text-sm">Record shot locations on the pitch</p>
            </div>
            <button
              type="button"
              onClick={() => setTrackShots(!trackShots)}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                trackShots ? 'bg-green-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  trackShots ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-gray-300 font-medium">Kickout Map Tracking</label>
              <p className="text-gray-500 text-sm">Record kickout locations on the pitch</p>
            </div>
            <button
              type="button"
              onClick={() => setTrackKickouts(!trackKickouts)}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                trackKickouts ? 'bg-green-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  trackKickouts ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Start Match
          </button>
        </form>
      </div>
    </div>
  );
};
