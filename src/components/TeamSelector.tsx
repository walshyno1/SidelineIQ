import { useState } from 'react';
import type { Squad } from '../types/attendance';

interface TeamSelectorProps {
  squads: Squad[];
  isLoading: boolean;
  onSelectTeam: (squadId: string) => void;
  onCreateTeam: (teamName: string) => Promise<Squad | undefined>;
  onRenameTeam: (squadId: string, newName: string) => Promise<void>;
  onDeleteTeam: (squadId: string) => Promise<void>;
  onClose: () => void;
}

export const TeamSelector = ({
  squads,
  isLoading,
  onSelectTeam,
  onCreateTeam,
  onRenameTeam,
  onDeleteTeam,
  onClose,
}: TeamSelectorProps) => {
  const [showNewTeam, setShowNewTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [editTeamName, setEditTeamName] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    const squad = await onCreateTeam(newTeamName.trim());
    if (squad) {
      setShowNewTeam(false);
      setNewTeamName('');
      // Automatically go to the new team's attendance tracker
      onSelectTeam(squad.id);
    }
  };

  const handleStartEdit = (squad: Squad) => {
    setEditingTeamId(squad.id);
    setEditTeamName(squad.teamName);
    setConfirmDeleteId(null);
  };

  const handleSaveEdit = async (squadId: string) => {
    if (!editTeamName.trim()) return;
    await onRenameTeam(squadId, editTeamName.trim());
    setEditingTeamId(null);
  };

  const handleCancelEdit = () => {
    setEditingTeamId(null);
    setEditTeamName('');
  };

  const handleDeleteClick = (squadId: string) => {
    setConfirmDeleteId(squadId);
    setEditingTeamId(null);
  };

  const handleConfirmDelete = async (squadId: string) => {
    try {
      await onDeleteTeam(squadId);
      setConfirmDeleteId(null);
    } catch (err) {
      console.error('Failed to delete team:', err);
      setConfirmDeleteId(null);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDeleteId(null);
  };

  const getPlayerCount = (squad: Squad) => {
    return squad.players.filter(p => p.isActive).length;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400">Loading teams...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl"
          >
            ←
          </button>
          <h1 className="text-xl font-bold text-white">📋 Attendance Tracking</h1>
        </div>

        {/* Create New Team Button / Form */}
        {showNewTeam ? (
          <div className="bg-gray-800 rounded-lg p-4 mb-4">
            <h3 className="text-white font-medium mb-3">Create New Team</h3>
            <div className="space-y-3">
              <input
                type="text"
                value={newTeamName}
                onChange={(e) => setNewTeamName(e.target.value)}
                placeholder="Enter team name..."
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleCreateTeam()}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowNewTeam(false);
                    setNewTeamName('');
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTeam}
                  disabled={!newTeamName.trim()}
                  className={`flex-1 py-2 rounded-lg font-medium ${
                    newTeamName.trim()
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowNewTeam(true)}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-xl mb-4 flex items-center justify-center gap-3 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <span className="text-2xl">➕</span>
            <span className="text-lg">Create New Team</span>
          </button>
        )}

        {/* Teams List */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-gray-400 text-sm font-medium mb-3">
            Your Teams ({squads.length})
          </h3>

          {squads.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-3">👥</div>
              <p className="text-gray-400 mb-2">No teams created yet</p>
              <p className="text-gray-500 text-sm">
                Create a team to start tracking attendance
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {squads.map((squad) => {
                const isEditing = editingTeamId === squad.id;
                const isConfirmingDelete = confirmDeleteId === squad.id;

                return (
                  <div
                    key={squad.id}
                    className="bg-gray-700 rounded-lg overflow-hidden"
                  >
                    {isConfirmingDelete ? (
                      // Delete confirmation
                      <div className="p-4">
                        <p className="text-white mb-3">
                          Delete <strong>{squad.teamName}</strong> and all attendance records?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={handleCancelDelete}
                            className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-2 rounded-lg"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleConfirmDelete(squad.id)}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ) : isEditing ? (
                      // Edit mode
                      <div className="p-3">
                        <input
                          type="text"
                          value={editTeamName}
                          onChange={(e) => setEditTeamName(e.target.value)}
                          className="w-full bg-gray-600 border border-gray-500 text-white rounded-lg px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit(squad.id);
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleCancelEdit}
                            className="flex-1 bg-gray-600 hover:bg-gray-500 text-white py-1.5 rounded text-sm"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveEdit(squad.id)}
                            disabled={!editTeamName.trim()}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-1.5 rounded text-sm"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      // Normal view
                      <div className="flex items-center">
                        <button
                          onClick={() => onSelectTeam(squad.id)}
                          className="flex-1 p-4 text-left hover:bg-gray-650 transition-colors"
                        >
                          <div className="text-white font-medium">{squad.teamName}</div>
                          <div className="text-gray-400 text-sm">
                            {getPlayerCount(squad)} players
                          </div>
                        </button>
                        <div className="flex items-center pr-2">
                          <button
                            onClick={() => handleStartEdit(squad)}
                            className="text-gray-400 hover:text-white p-2"
                            title="Edit team name"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => handleDeleteClick(squad.id)}
                            className="text-gray-400 hover:text-red-400 p-2"
                            title="Delete team"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center text-gray-500 text-sm">
          <p>Select a team to track attendance or create a new team</p>
        </div>
      </div>
    </div>
  );
};
