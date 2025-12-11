import type { Team, EventType, ShotType, TeamStats } from '../types/match';

interface TeamPanelProps {
  team: Team;
  stats: TeamStats;
  onShotClick: (team: Team, shotType: ShotType) => void;
  onEventClick: (team: Team, eventType: EventType) => void;
}

const shotTypes: ShotType[] = ['goal', 'point', 'two_point', 'wide', 'short', 'saved'];
const shotLabels: Record<ShotType, string> = {
  goal: 'Goal',
  point: 'Point',
  two_point: '2 Point',
  wide: 'Wide',
  short: 'Short',
  saved: 'Saved',
};

const otherEventTypes: EventType[] = ['kickout_won', 'kickout_lost', 'turnover_won', 'turnover_lost'];
const otherEventLabels: Record<string, string> = {
  kickout_won: 'Own KO Won',
  kickout_lost: 'Own KO Lost',
  turnover_won: 'Turnover Won',
  turnover_lost: 'Turnover Lost',
};

export const TeamPanel = ({ team, stats, onShotClick, onEventClick }: TeamPanelProps) => {
  const borderColor = team === 'home' ? 'border-green-500' : 'border-blue-500';
  
  // Primary button colors (for shot types)
  const primaryBg = team === 'home' 
    ? 'bg-green-600 hover:bg-green-700' 
    : 'bg-blue-600 hover:bg-blue-700';
  
  // Secondary button colors (for other events - lighter shade)
  const secondaryBg = team === 'home' 
    ? 'bg-green-700/60 hover:bg-green-700/80' 
    : 'bg-blue-700/60 hover:bg-blue-700/80';

  return (
    <div className={`bg-gray-800 rounded-lg p-4 border-t-4 ${borderColor}`}>
      {/* Shot Buttons */}
      <div className="mb-4">
        <div className="grid grid-cols-3 gap-2">
          {shotTypes.map((type) => (
            <button
              key={type}
              onClick={() => onShotClick(team, type)}
              className={`${primaryBg} text-white py-4 px-3 rounded-lg text-base font-bold transition-colors active:scale-95`}
            >
              <div>{shotLabels[type]}</div>
              <div className="text-xl">{stats[type]}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Other Events */}
      <div>
        <div className="text-gray-400 text-sm mb-2 font-medium">Other Events</div>
        <div className="grid grid-cols-2 gap-2">
          {otherEventTypes.map((type) => (
            <button
              key={type}
              onClick={() => onEventClick(team, type)}
              className={`${secondaryBg} text-white py-4 px-3 rounded-lg text-base font-bold transition-colors active:scale-95`}
            >
              <div>{otherEventLabels[type]}</div>
              <div className="text-xl">{stats[type]}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
