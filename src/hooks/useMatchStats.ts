import { useState, useCallback } from 'react';
import type { Match, Team, EventType, Shot, ShotType, Action, Kickout, KickoutType } from '../types/match';
import { createNewMatch } from '../types/match';

const STORAGE_KEY = 'gaa_stats_match';

// Migrate old match data to include new fields
const migrateMatch = (data: Partial<Match>): Match | null => {
  if (!data || !data.id) return null;
  
  // Migrate stats to include two_point if missing
  const migrateStats = (stats: Partial<Match['homeStats']>) => ({
    ...stats,
    two_point: stats.two_point ?? 0,
  });
  
  return {
    ...data,
    actions: data.actions ?? [], // Add empty actions array if missing
    kickouts: data.kickouts ?? [], // Add empty kickouts array if missing
    homeStats: migrateStats(data.homeStats ?? {}),
    awayStats: migrateStats(data.awayStats ?? {}),
    currentHalf: data.currentHalf ?? 1, // Ensure currentHalf exists
    isFinished: data.isFinished ?? false, // Ensure isFinished exists
    trackShots: data.trackShots ?? true, // Default to true for existing matches
    trackKickouts: data.trackKickouts ?? true, // Default to true for existing matches
    firstHalfStartTime: data.firstHalfStartTime ?? null, // Migration for timing
    secondHalfStartTime: data.secondHalfStartTime ?? null,
    matchEndTime: data.matchEndTime ?? null,
  } as Match;
};

export const useMatchStats = () => {
  const [match, setMatch] = useState<Match | null>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved);
    return migrateMatch(parsed);
  });

  const saveMatch = useCallback((updatedMatch: Match) => {
    setMatch(updatedMatch);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedMatch));
  }, []);

  const startNewMatch = useCallback((homeTeam: string, awayTeam: string, date: string, trackShots: boolean = true, trackKickouts: boolean = true) => {
    const newMatch = createNewMatch(homeTeam, awayTeam, date, trackShots, trackKickouts);
    saveMatch(newMatch);
  }, [saveMatch]);

  const recordEvent = useCallback((team: Team, eventType: EventType) => {
    if (!match) return;
    
    const statsKey = team === 'home' ? 'homeStats' : 'awayStats';
    const action: Action = {
      id: crypto.randomUUID(),
      team,
      eventType,
      timestamp: Date.now(),
    };
    const updatedMatch = {
      ...match,
      actions: [...match.actions, action],
      [statsKey]: {
        ...match[statsKey],
        [eventType]: match[statsKey][eventType] + 1,
      },
    };
    saveMatch(updatedMatch);
  }, [match, saveMatch]);

  const recordShot = useCallback((team: Team, shotType: ShotType, x: number, y: number) => {
    if (!match) return;
    
    const isScore = shotType === 'point' || shotType === 'two_point' || shotType === 'goal';
    const shot: Shot = {
      id: crypto.randomUUID(),
      team,
      type: shotType,
      isScore,
      x,
      y,
      timestamp: Date.now(),
      half: match.currentHalf,
    };

    const action: Action = {
      id: crypto.randomUUID(),
      team,
      eventType: shotType,
      timestamp: Date.now(),
      shotId: shot.id,
    };

    const statsKey = team === 'home' ? 'homeStats' : 'awayStats';
    const updatedMatch = {
      ...match,
      shots: [...match.shots, shot],
      actions: [...match.actions, action],
      [statsKey]: {
        ...match[statsKey],
        [shotType]: match[statsKey][shotType as keyof typeof match.homeStats] + 1,
      },
    };
    saveMatch(updatedMatch);
  }, [match, saveMatch]);

  const recordKickout = useCallback((team: Team, kickoutType: KickoutType, x: number, y: number) => {
    if (!match) return;
    
    const won = kickoutType === 'kickout_won';
    const kickout: Kickout = {
      id: crypto.randomUUID(),
      team,
      type: kickoutType,
      won,
      x,
      y,
      timestamp: Date.now(),
      half: match.currentHalf,
    };

    const action: Action = {
      id: crypto.randomUUID(),
      team,
      eventType: kickoutType,
      timestamp: Date.now(),
      kickoutId: kickout.id,
    };

    const statsKey = team === 'home' ? 'homeStats' : 'awayStats';
    const updatedMatch = {
      ...match,
      kickouts: [...match.kickouts, kickout],
      actions: [...match.actions, action],
      [statsKey]: {
        ...match[statsKey],
        [kickoutType]: match[statsKey][kickoutType] + 1,
      },
    };
    saveMatch(updatedMatch);
  }, [match, saveMatch]);

  const saveHalfTime = useCallback(() => {
    if (!match) return;
    const updatedMatch = {
      ...match,
      currentHalf: 2 as const,
      halfTimeSnapshot: {
        home: { ...match.homeStats },
        away: { ...match.awayStats },
      },
      secondHalfStartTime: Date.now(),
    };
    saveMatch(updatedMatch);
  }, [match, saveMatch]);

  const saveFullTime = useCallback(() => {
    if (!match) return;
    const updatedMatch = {
      ...match,
      isFinished: true,
      matchEndTime: Date.now(),
    };
    saveMatch(updatedMatch);
  }, [match, saveMatch]);

  const clearMatch = useCallback(() => {
    setMatch(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const undoLastEvent = useCallback((team: Team, eventType: EventType) => {
    if (!match) return;
    
    const statsKey = team === 'home' ? 'homeStats' : 'awayStats';
    const currentValue = match[statsKey][eventType];
    if (currentValue <= 0) return;

    const isShotType = ['point', 'two_point', 'goal', 'wide', 'short', 'saved'].includes(eventType);
    const isKickoutType = ['kickout_won', 'kickout_lost'].includes(eventType);
    let updatedShots = match.shots;
    let updatedKickouts = match.kickouts;
    let updatedActions = match.actions;
    
    if (isShotType) {
      const shotIndex = [...match.shots].reverse().findIndex(
        s => s.team === team && s.type === eventType
      );
      if (shotIndex !== -1) {
        const actualIndex = match.shots.length - 1 - shotIndex;
        updatedShots = match.shots.filter((_, i) => i !== actualIndex);
      }
    }

    if (isKickoutType) {
      const kickoutIndex = [...match.kickouts].reverse().findIndex(
        k => k.team === team && k.type === eventType
      );
      if (kickoutIndex !== -1) {
        const actualIndex = match.kickouts.length - 1 - kickoutIndex;
        updatedKickouts = match.kickouts.filter((_, i) => i !== actualIndex);
      }
    }

    // Remove the corresponding action
    const actionIndex = [...match.actions].reverse().findIndex(
      a => a.team === team && a.eventType === eventType
    );
    if (actionIndex !== -1) {
      const actualIndex = match.actions.length - 1 - actionIndex;
      updatedActions = match.actions.filter((_, i) => i !== actualIndex);
    }

    const updatedMatch = {
      ...match,
      shots: updatedShots,
      kickouts: updatedKickouts,
      actions: updatedActions,
      [statsKey]: {
        ...match[statsKey],
        [eventType]: currentValue - 1,
      },
    };
    saveMatch(updatedMatch);
  }, [match, saveMatch]);

  const undoLastAction = useCallback(() => {
    if (!match || match.actions.length === 0) return null;
    
    const lastAction = match.actions[match.actions.length - 1];
    const { team, eventType, shotId } = lastAction;
    
    const statsKey = team === 'home' ? 'homeStats' : 'awayStats';
    const currentValue = match[statsKey][eventType];
    if (currentValue <= 0) return null;

    // Remove the shot if this action was a shot
    let updatedShots = match.shots;
    if (shotId) {
      updatedShots = match.shots.filter(s => s.id !== shotId);
    }

    // Remove the kickout if this action was a kickout
    let updatedKickouts = match.kickouts;
    if (lastAction.kickoutId) {
      updatedKickouts = match.kickouts.filter(k => k.id !== lastAction.kickoutId);
    }

    // Remove the last action
    const updatedActions = match.actions.slice(0, -1);

    const updatedMatch = {
      ...match,
      shots: updatedShots,
      kickouts: updatedKickouts,
      actions: updatedActions,
      [statsKey]: {
        ...match[statsKey],
        [eventType]: currentValue - 1,
      },
    };
    saveMatch(updatedMatch);
    
    return lastAction; // Return the undone action for UI feedback
  }, [match, saveMatch]);

  const getLastAction = useCallback(() => {
    if (!match || match.actions.length === 0) return null;
    return match.actions[match.actions.length - 1];
  }, [match]);

  return {
    match,
    startNewMatch,
    recordEvent,
    recordShot,
    recordKickout,
    saveHalfTime,
    saveFullTime,
    clearMatch,
    undoLastEvent,
    undoLastAction,
    getLastAction,
  };
};
