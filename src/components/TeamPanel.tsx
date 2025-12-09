import type { Team, EventType, ShotType, TeamStats } from '../types/match';

interface TeamPanelProps {
  team: Team;
  stats: TeamStats;
  onShotClick: (team: Team, shotType: ShotType) => void;
  onEventClick: (team: Team, eventType: EventType) => void;
}

const shotTypes: { type: ShotType; label: string; color: string }[] = [
  { type: 'goal', label: 'Goal', color: 'bg-yellow-600 hover:bg-yellow-700' },
  { type: 'point', label: 'Point', color: 'bg-green-600 hover:bg-green-700' },
  { type: 'two_point', label: '2 Point', color: 'bg-emerald-500 hover:bg-emerald-600' },
  { type: 'wide', label: 'Wide', color: 'bg-red-600 hover:bg-red-700' },
  { type: 'short', label: 'Short', color: 'bg-orange-600 hover:bg-orange-700' },
  { type: 'saved', label: 'Saved', color: 'bg-purple-600 hover:bg-purple-700' },
];

const otherEvents: { type: EventType; label: string; color: string }[] = [
  { type: 'kickout_won', label: 'KO Won', color: 'bg-teal-600 hover:bg-teal-700' },
  { type: 'kickout_lost', label: 'KO Lost', color: 'bg-gray-600 hover:bg-gray-700' },
  { type: 'turnover_won', label: 'TO Won', color: 'bg-indigo-600 hover:bg-indigo-700' },
  { type: 'turnover_lost', label: 'TO Lost', color: 'bg-gray-600 hover:bg-gray-700' },
];

export const TeamPanel = ({ team, stats, onShotClick, onEventClick }: TeamPanelProps) => {
  const borderColor = team === 'home' ? 'border-green-500' : 'border-blue-500';

  return (
    <div className={`bg-gray-800 rounded-lg p-4 border-t-4 ${borderColor}`}>
      {/* Shot Buttons */}
      <div className="mb-4">
        <div className="grid grid-cols-3 gap-2">
          {shotTypes.map(({ type, label, color }) => (
            <button
              key={type}
              onClick={() => onShotClick(team, type)}
              className={`${color} text-white py-4 px-3 rounded-lg text-base font-bold transition-colors active:scale-95`}
            >
              <div>{label}</div>
              <div className="text-xl">{stats[type]}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Other Events */}
      <div>
        <div className="text-gray-400 text-sm mb-2 font-medium">Other Events</div>
        <div className="grid grid-cols-2 gap-2">
          {otherEvents.map(({ type, label, color }) => (
            <button
              key={type}
              onClick={() => onEventClick(team, type)}
              className={`${color} text-white py-4 px-3 rounded-lg text-base font-bold transition-colors active:scale-95`}
            >
              <div>{label}</div>
              <div className="text-xl">{stats[type]}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
