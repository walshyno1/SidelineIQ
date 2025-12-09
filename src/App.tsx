import { useState, useMemo } from 'react';
import { useMatchStats } from './hooks/useMatchStats';
import { useMatchHistoryDB } from './hooks/useMatchHistoryDB';
import { useAttendance } from './hooks/useAttendance';
import { Home } from './components/Home';
import { MatchSetup } from './components/MatchSetup';
import { TeamPanel } from './components/TeamPanel';
import { LiveStats } from './components/LiveStats';
import { MatchControls } from './components/MatchControls';
import { ShotModal } from './components/ShotModal';
import { ShotMapView } from './components/ShotMapView';
import { KickoutModal } from './components/KickoutModal';
import { KickoutMapView } from './components/KickoutMapView';
import { MatchSummary } from './components/MatchSummary';
import { HalfTimeSummary } from './components/HalfTimeSummary';
import { MatchHistory } from './components/MatchHistory';
import { TeamAnalytics } from './components/TeamAnalytics';
import { TeamSelector } from './components/TeamSelector';
import { SquadSetup } from './components/SquadSetup';
import { AttendanceTracker } from './components/AttendanceTracker';
import { AttendanceEventView } from './components/AttendanceEventView';
import BackupManager from './components/BackupManager';
import type { Team, ShotType, EventType, Match, KickoutType } from './types/match';
import type { AttendanceEvent } from './types/attendance';

const EVENT_LABELS: Record<EventType, string> = {
  point: 'Point',
  two_point: '2 Point',
  goal: 'Goal',
  wide: 'Wide',
  short: 'Short',
  saved: 'Saved',
  kickout_won: 'Own Kickout Won',
  kickout_lost: 'Own Kickout Lost',
  turnover_won: 'Turnover Won',
  turnover_lost: 'Turnover Lost',
};

function App() {
  const {
    match,
    startNewMatch,
    recordEvent,
    recordShot,
    recordKickout,
    saveHalfTime,
    saveFullTime,
    clearMatch,
    undoLastAction,
    getLastAction,
  } = useMatchStats();

  const { history, isLoading, addToHistory, deleteFromHistory } = useMatchHistoryDB();

  const [shotModal, setShotModal] = useState<{ team: Team; shotType: ShotType } | null>(null);
  const [showShotMap, setShowShotMap] = useState(false);
  const [kickoutModal, setKickoutModal] = useState<{ team: Team; kickoutType: KickoutType } | null>(null);
  const [showKickoutMap, setShowKickoutMap] = useState(false);
  const [activeTeam, setActiveTeam] = useState<Team>('home');
  const [showHistory, setShowHistory] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAttendance, setShowAttendance] = useState(false);
  const [showSquadSetup, setShowSquadSetup] = useState(false);
  const [showBackup, setShowBackup] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AttendanceEvent | null>(null);
  const [viewingMatch, setViewingMatch] = useState<Match | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [showHome, setShowHome] = useState(true); // Start at home screen
  const [showHalfTimeSummary, setShowHalfTimeSummary] = useState(false);

  // Attendance tracking
  const attendance = useAttendance();

  // Wrapper to create team and then show squad setup for adding players
  const handleCreateTeamAndSetup = async (teamName: string) => {
    const squad = await attendance.createSquad(teamName);
    if (squad) {
      setShowSquadSetup(true); // Immediately show squad setup to add players
    }
    return squad;
  };

  // Check if any team has at least 3 games recorded
  const hasTeamWithMinGames = useMemo(() => {
    const teamGameCounts = new Map<string, number>();
    history.forEach(m => {
      const homeLower = m.homeTeam.toLowerCase();
      const awayLower = m.awayTeam.toLowerCase();
      teamGameCounts.set(homeLower, (teamGameCounts.get(homeLower) || 0) + 1);
      teamGameCounts.set(awayLower, (teamGameCounts.get(awayLower) || 0) + 1);
    });
    return Array.from(teamGameCounts.values()).some(count => count >= 3);
  }, [history]);

  const handleShotClick = (team: Team, shotType: ShotType) => {
    // If shot tracking is disabled, record as event only (no location)
    if (match && !match.trackShots) {
      recordEvent(team, shotType);
      return;
    }
    setShotModal({ team, shotType });
  };

  const handleShotConfirm = (x: number, y: number) => {
    if (shotModal) {
      recordShot(shotModal.team, shotModal.shotType, x, y);
      setShotModal(null);
    }
  };

  const handleEventClick = (team: Team, eventType: EventType) => {
    // Check if this is a kickout event and kickout tracking is enabled
    if ((eventType === 'kickout_won' || eventType === 'kickout_lost') && match?.trackKickouts) {
      setKickoutModal({ team, kickoutType: eventType });
      return;
    }
    recordEvent(team, eventType);
  };

  const handleKickoutConfirm = (x: number, y: number) => {
    if (kickoutModal) {
      recordKickout(kickoutModal.team, kickoutModal.kickoutType, x, y);
      setKickoutModal(null);
    }
  };

  const handleNewMatch = () => {
    if (confirm('Are you sure you want to start a new match? Current match data will be lost.')) {
      // Save finished match to history before clearing
      if (match?.isFinished) {
        addToHistory(match);
      }
      clearMatch();
      setViewingMatch(null);
      setShowHome(true);
      setShowSetup(false);
    }
  };

  const handleViewHistory = () => {
    setShowHistory(true);
  };

  const handleCloseHistory = () => {
    setShowHistory(false);
    setShowHome(true);
  };

  const handleViewMatch = (matchToView: Match) => {
    setViewingMatch(matchToView);
    setShowHistory(false);
  };

  const handleBackFromViewing = () => {
    setViewingMatch(null);
    setShowHistory(true);
  };

  const handleHalfTime = () => {
    saveHalfTime();
    setShowHalfTimeSummary(true);
  };

  const handleStartSecondHalf = () => {
    setShowHalfTimeSummary(false);
  };

  const handleFullTime = () => {
    saveFullTime();
    // The match will be saved to history when user starts new match
    // We need to save immediately since the match state will update
    if (match) {
      addToHistory({ ...match, isFinished: true });
    }
  };

  // Show half time summary
  if (showHalfTimeSummary && match && match.currentHalf === 2) {
    return (
      <>
        <HalfTimeSummary
          match={{
            ...match,
            // Use the half time snapshot for first half stats
            homeStats: match.halfTimeSnapshot?.home ?? match.homeStats,
            awayStats: match.halfTimeSnapshot?.away ?? match.awayStats,
          }}
          onViewShotMap={() => setShowShotMap(true)}
          onViewKickoutMap={() => setShowKickoutMap(true)}
          onStartSecondHalf={handleStartSecondHalf}
        />
        {showShotMap && (
          <ShotMapView
            shots={match.shots.filter(s => s.half === 1)}
            homeTeam={match.homeTeam}
            awayTeam={match.awayTeam}
            onClose={() => setShowShotMap(false)}
          />
        )}
        {showKickoutMap && (
          <KickoutMapView
            kickouts={match.kickouts.filter(k => k.half === 1)}
            homeTeam={match.homeTeam}
            awayTeam={match.awayTeam}
            onClose={() => setShowKickoutMap(false)}
          />
        )}
      </>
    );
  }

  // Show team analytics view
  if (showAnalytics) {
    return (
      <TeamAnalytics
        history={history}
        onClose={() => setShowAnalytics(false)}
      />
    );
  }

  // Show backup manager view
  if (showBackup) {
    return (
      <div className="min-h-screen bg-gray-900 p-4">
        <div className="max-w-md mx-auto">
          <button
            onClick={() => setShowBackup(false)}
            className="mb-4 text-gray-400 hover:text-white flex items-center gap-2"
          >
            <span>←</span>
            <span>Back</span>
          </button>
          <BackupManager 
            onDataImported={() => {
              // Refresh data after import
              attendance.refreshSquads();
            }} 
          />
        </div>
      </div>
    );
  }

  // Show attendance tracking view
  if (showAttendance) {
    // Show team selector if no squad is selected
    if (!attendance.selectedSquad) {
      return (
        <TeamSelector
          squads={attendance.squads}
          isLoading={attendance.isLoading}
          onSelectTeam={attendance.selectSquad}
          onCreateTeam={handleCreateTeamAndSetup}
          onRenameTeam={attendance.renameSquad}
          onDeleteTeam={attendance.deleteSquad}
          onClose={() => setShowAttendance(false)}
        />
      );
    }

    // Show squad setup if user requested it
    if (showSquadSetup) {
      return (
        <SquadSetup
          squad={attendance.selectedSquad}
          onCreateSquad={attendance.createSquad}
          onUpdateSquad={attendance.updateSquad}
          onAddPlayer={attendance.addPlayer}
          onUpdatePlayer={attendance.updatePlayer}
          onRemovePlayer={attendance.removePlayer}
          onBack={() => setShowSquadSetup(false)}
          onComplete={() => setShowSquadSetup(false)}
        />
      );
    }

    // Show individual event view
    if (selectedEvent) {
      // Get the latest event data from the events array
      const currentEvent = attendance.events.find((e: AttendanceEvent) => e.id === selectedEvent.id);
      if (currentEvent) {
        return (
          <AttendanceEventView
            squad={attendance.selectedSquad}
            event={currentEvent}
            onSaveAttendance={attendance.saveEventAttendance}
            onBack={() => setSelectedEvent(null)}
          />
        );
      }
    }

    // Show attendance tracker
    return (
      <AttendanceTracker
        squad={attendance.selectedSquad}
        events={attendance.events}
        onCreateEvent={attendance.createEvent}
        onDeleteEvent={attendance.deleteEvent}
        onSelectEvent={(event: AttendanceEvent) => setSelectedEvent(event)}
        onManageSquad={() => setShowSquadSetup(true)}
        onClose={() => attendance.clearSelectedSquad()}
      />
    );
  }

  // Show match history view
  if (showHistory && !viewingMatch) {
    return (
      <MatchHistory
        history={history}
        onDeleteMatch={deleteFromHistory}
        onSelectMatch={handleViewMatch}
        onClose={handleCloseHistory}
      />
    );
  }

  // Show viewing a past match
  if (viewingMatch) {
    return (
      <>
        <MatchSummary
          match={viewingMatch}
          onViewShotMap={() => setShowShotMap(true)}
          onViewKickoutMap={() => setShowKickoutMap(true)}
          onNewMatch={handleBackFromViewing}
          isViewingHistory={true}
        />
        {showShotMap && (
          <ShotMapView
            shots={viewingMatch.shots}
            homeTeam={viewingMatch.homeTeam}
            awayTeam={viewingMatch.awayTeam}
            onClose={() => setShowShotMap(false)}
          />
        )}
        {showKickoutMap && (
          <KickoutMapView
            kickouts={viewingMatch.kickouts}
            homeTeam={viewingMatch.homeTeam}
            awayTeam={viewingMatch.awayTeam}
            onClose={() => setShowKickoutMap(false)}
          />
        )}
      </>
    );
  }

  // Show Home screen when requested
  if (showHome || !match) {
    // Show setup form
    if (showSetup) {
      return (
        <MatchSetup 
          onStartMatch={(home, away, date, trackShots, trackKickouts) => {
            startNewMatch(home, away, date, trackShots, trackKickouts);
            setActiveTeam('home');
            setShowSetup(false);
            setShowHome(false);
          }} 
          onBack={() => setShowSetup(false)}
        />
      );
    }

    // Show home screen
    return (
      <Home
        onNewMatch={() => setShowSetup(true)}
        onViewHistory={handleViewHistory}
        onViewAnalytics={() => setShowAnalytics(true)}
        onViewAttendance={() => setShowAttendance(true)}
        onViewBackup={() => setShowBackup(true)}
        onContinueMatch={() => setShowHome(false)}
        historyCount={history.length}
        hasActiveMatch={!!match && !match.isFinished}
        isLoadingHistory={isLoading}
        hasTeamWithMinGames={hasTeamWithMinGames}
      />
    );
  }

  // Show Match Summary when match is finished
  if (match.isFinished) {
    return (
      <>
        <MatchSummary
          match={match}
          onViewShotMap={() => setShowShotMap(true)}
          onViewKickoutMap={() => setShowKickoutMap(true)}
          onNewMatch={handleNewMatch}
          onHome={() => setShowHome(true)}
        />
        {showShotMap && (
          <ShotMapView
            shots={match.shots}
            homeTeam={match.homeTeam}
            awayTeam={match.awayTeam}
            onClose={() => setShowShotMap(false)}
          />
        )}
        {showKickoutMap && (
          <KickoutMapView
            kickouts={match.kickouts}
            homeTeam={match.homeTeam}
            awayTeam={match.awayTeam}
            onClose={() => setShowKickoutMap(false)}
          />
        )}
      </>
    );
  }

  // Show Half Time Summary
  if (showHalfTimeSummary) {
    return (
      <>
        <HalfTimeSummary
          match={match}
          onViewShotMap={() => setShowShotMap(true)}
          onViewKickoutMap={() => setShowKickoutMap(true)}
          onStartSecondHalf={handleStartSecondHalf}
        />
        {showShotMap && (
          <ShotMapView
            shots={match.shots}
            homeTeam={match.homeTeam}
            awayTeam={match.awayTeam}
            onClose={() => setShowShotMap(false)}
          />
        )}
        {showKickoutMap && (
          <KickoutMapView
            kickouts={match.kickouts}
            homeTeam={match.homeTeam}
            awayTeam={match.awayTeam}
            onClose={() => setShowKickoutMap(false)}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-2 max-w-md mx-auto">
      {/* Home Button */}
      <button
        onClick={() => setShowHome(true)}
        className="mb-2 text-gray-400 hover:text-white transition-colors flex items-center gap-1"
      >
        <span>🏠</span>
        <span className="text-sm">Home</span>
      </button>

      <LiveStats
        homeTeam={match.homeTeam}
        awayTeam={match.awayTeam}
        homeStats={match.homeStats}
        awayStats={match.awayStats}
        currentHalf={match.currentHalf}
      />

      {/* Team Tabs */}
      <div className="flex mb-2">
        <button
          onClick={() => setActiveTeam('home')}
          className={`flex-1 py-3 font-bold text-center transition-colors rounded-l-lg ${
            activeTeam === 'home'
              ? 'bg-green-600 text-white'
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          }`}
        >
          {match.homeTeam}
        </button>
        <button
          onClick={() => setActiveTeam('away')}
          className={`flex-1 py-3 font-bold text-center transition-colors rounded-r-lg ${
            activeTeam === 'away'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
          }`}
        >
          {match.awayTeam}
        </button>
      </div>

      {/* Single Team Panel */}
      <TeamPanel
        team={activeTeam}
        stats={activeTeam === 'home' ? match.homeStats : match.awayStats}
        onShotClick={handleShotClick}
        onEventClick={handleEventClick}
      />

      {/* Undo Last Action Button */}
      {getLastAction() && (
        <button
          onClick={() => undoLastAction()}
          className="w-full mt-2 mb-2 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <span>↩</span>
          <span>
            Undo: {getLastAction()?.team === 'home' ? match.homeTeam : match.awayTeam} - {EVENT_LABELS[getLastAction()!.eventType]}
          </span>
        </button>
      )}

      <MatchControls
        currentHalf={match.currentHalf}
        isFinished={match.isFinished}
        trackShots={match.trackShots}
        trackKickouts={match.trackKickouts}
        onHalfTime={handleHalfTime}
        onFullTime={handleFullTime}
        onViewShotMap={() => setShowShotMap(true)}
        onViewKickoutMap={() => setShowKickoutMap(true)}
        onAbandonMatch={() => {
          clearMatch();
          setShowHome(true);
        }}
      />

      {shotModal && (
        <ShotModal
          team={shotModal.team}
          shotType={shotModal.shotType}
          teamName={shotModal.team === 'home' ? match.homeTeam : match.awayTeam}
          onConfirm={handleShotConfirm}
          onCancel={() => setShotModal(null)}
        />
      )}

      {showShotMap && (
        <ShotMapView
          shots={match.shots}
          homeTeam={match.homeTeam}
          awayTeam={match.awayTeam}
          onClose={() => setShowShotMap(false)}
        />
      )}

      {kickoutModal && (
        <KickoutModal
          team={kickoutModal.team}
          kickoutType={kickoutModal.kickoutType}
          teamName={kickoutModal.team === 'home' ? match.homeTeam : match.awayTeam}
          onConfirm={handleKickoutConfirm}
          onCancel={() => setKickoutModal(null)}
        />
      )}

      {showKickoutMap && (
        <KickoutMapView
          kickouts={match.kickouts}
          homeTeam={match.homeTeam}
          awayTeam={match.awayTeam}
          onClose={() => setShowKickoutMap(false)}
        />
      )}
    </div>
  );
}

export default App;
