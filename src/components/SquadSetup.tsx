import { useState, useEffect } from 'react';
import type { Squad, Player } from '../types/attendance';

interface SquadSetupProps {
  squad: Squad | null;
  onCreateSquad: (teamName: string) => Promise<Squad | undefined>;
  onUpdateSquad: (updates: Partial<Squad>) => Promise<void>;
  onAddPlayer: (name: string, number?: string) => Promise<Player | undefined>;
  onUpdatePlayer: (playerId: string, updates: Partial<Player>) => Promise<void>;
  onRemovePlayer: (playerId: string) => Promise<void>;
  onBack: () => void;
  onComplete: () => void;
}

export const SquadSetup = ({
  squad,
  onCreateSquad,
  onUpdateSquad,
  onAddPlayer,
  onUpdatePlayer,
  onRemovePlayer,
  onBack,
  onComplete,
}: SquadSetupProps) => {
  const [teamName, setTeamName] = useState(squad?.teamName || '');
  const [newPlayerName, setNewPlayerName] = useState('');
  const [newPlayerNumber, setNewPlayerNumber] = useState('');
  const [editingPlayer, setEditingPlayer] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editNumber, setEditNumber] = useState('');
  const [isCreating, setIsCreating] = useState(!squad);

  // Sync isCreating state with squad prop
  useEffect(() => {
    if (squad) {
      setIsCreating(false);
    }
  }, [squad]);

  const handleCreateSquad = async () => {
    if (!teamName.trim()) return;
    await onCreateSquad(teamName.trim());
    setIsCreating(false);
  };

  const handleUpdateTeamName = async () => {
    if (!teamName.trim() || teamName === squad?.teamName) return;
    await onUpdateSquad({ teamName: teamName.trim() });
  };

  const handleAddPlayer = async () => {
    if (!newPlayerName.trim()) return;
    await onAddPlayer(newPlayerName.trim(), newPlayerNumber.trim() || undefined);
    setNewPlayerName('');
    setNewPlayerNumber('');
  };

  const handleStartEdit = (player: Player) => {
    setEditingPlayer(player.id);
    setEditName(player.name);
    setEditNumber(player.number || '');
  };

  const handleSaveEdit = async (playerId: string) => {
    if (!editName.trim()) return;
    await onUpdatePlayer(playerId, { 
      name: editName.trim(), 
      number: editNumber.trim() || undefined 
    });
    setEditingPlayer(null);
  };

  const handleRemovePlayer = async (playerId: string) => {
    await onRemovePlayer(playerId);
  };

  const activePlayers = squad?.players.filter(p => p.isActive) || [];

  // Initial team creation screen
  if (isCreating) {
    return (
      <div className="min-h-screen bg-gray-900 p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <button
              onClick={onBack}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ←
            </button>
            <h1 className="text-xl font-bold text-white">Set Up Squad</h1>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-center mb-6">
              <div className="text-4xl mb-3">👥</div>
              <h2 className="text-lg font-bold text-white mb-2">Create Your Squad</h2>
              <p className="text-gray-400 text-sm">
                Enter your team name to get started with attendance tracking
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-2">Team Name</label>
                <input
                  type="text"
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g., St. Patrick's GAA"
                  className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                  autoFocus
                />
              </div>

              <button
                onClick={handleCreateSquad}
                disabled={!teamName.trim()}
                className={`w-full py-3 rounded-lg font-bold transition-colors ${
                  teamName.trim()
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                Create Squad
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Squad management screen
  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              className="text-gray-400 hover:text-white text-2xl"
            >
              ←
            </button>
            <h1 className="text-xl font-bold text-white">Manage Squad</h1>
          </div>
          <button
            onClick={onComplete}
            disabled={activePlayers.length === 0}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activePlayers.length > 0
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            Done
          </button>
        </div>

        {/* Team Name */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <label className="block text-gray-400 text-sm mb-2">Team Name</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="flex-1 bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            {teamName !== squad?.teamName && (
              <button
                onClick={handleUpdateTeamName}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
              >
                Save
              </button>
            )}
          </div>
        </div>

        {/* Add Player */}
        <div className="bg-gray-800 rounded-lg p-4 mb-4">
          <h3 className="text-gray-400 text-sm font-medium mb-3">Add Player</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              placeholder="Player name"
              className="flex-1 bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="text"
              value={newPlayerNumber}
              onChange={(e) => setNewPlayerNumber(e.target.value)}
              placeholder="#"
              className="w-16 bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-center focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={handleAddPlayer}
              disabled={!newPlayerName.trim()}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                newPlayerName.trim()
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
            >
              Add
            </button>
          </div>
        </div>

        {/* Player List */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-gray-400 text-sm font-medium">Squad ({activePlayers.length})</h3>
          </div>

          {activePlayers.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No players added yet. Add players above to build your squad.
            </p>
          ) : (
            <div className="space-y-2">
              {activePlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between bg-gray-700 rounded-lg p-3"
                >
                  {editingPlayer === player.id ? (
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 bg-gray-600 border border-gray-500 text-white rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <input
                        type="text"
                        value={editNumber}
                        onChange={(e) => setEditNumber(e.target.value)}
                        placeholder="#"
                        className="w-12 bg-gray-600 border border-gray-500 text-white rounded px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <button
                        onClick={() => handleSaveEdit(player.id)}
                        className="text-green-400 hover:text-green-300 px-2"
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => setEditingPlayer(null)}
                        className="text-gray-400 hover:text-white px-2"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        {player.number && (
                          <span className="bg-gray-600 text-gray-300 text-sm px-2 py-0.5 rounded">
                            #{player.number}
                          </span>
                        )}
                        <span className="text-white">{player.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleStartEdit(player)}
                          className="text-gray-400 hover:text-white p-1"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleRemovePlayer(player.id)}
                          className="text-gray-400 hover:text-red-400 p-1"
                          title="Remove"
                        >
                          🗑️
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
