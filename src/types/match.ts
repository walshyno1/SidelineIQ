export type Team = 'home' | 'away';
export type Half = 1 | 2;
export type ShotType = 'point' | 'two_point' | 'goal' | 'wide' | 'short' | 'saved';
export type KickoutType = 'kickout_won' | 'kickout_lost';
export type EventType = ShotType | KickoutType | 'turnover_won' | 'turnover_lost';

export interface Shot {
  id: string;
  team: Team;
  type: ShotType;
  isScore: boolean;
  x: number;
  y: number;
  timestamp: number;
  half: Half;
}

export interface Kickout {
  id: string;
  team: Team;
  type: KickoutType;
  won: boolean;
  x: number;
  y: number;
  timestamp: number;
  half: Half;
}

export interface Action {
  id: string;
  team: Team;
  eventType: EventType;
  timestamp: number;
  shotId?: string; // Reference to shot if this action was a shot
  kickoutId?: string; // Reference to kickout if this action was a kickout
}

export interface TeamStats {
  point: number;
  two_point: number;
  goal: number;
  wide: number;
  short: number;
  saved: number;
  kickout_won: number;
  kickout_lost: number;
  turnover_won: number;
  turnover_lost: number;
}

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  date: string;
  homeStats: TeamStats;
  awayStats: TeamStats;
  shots: Shot[];
  kickouts: Kickout[];
  actions: Action[];
  currentHalf: Half;
  halfTimeSnapshot: { home: TeamStats; away: TeamStats } | null;
  isFinished: boolean;
  trackShots: boolean;
  trackKickouts: boolean;
}

export const createEmptyStats = (): TeamStats => ({
  point: 0,
  two_point: 0,
  goal: 0,
  wide: 0,
  short: 0,
  saved: 0,
  kickout_won: 0,
  kickout_lost: 0,
  turnover_won: 0,
  turnover_lost: 0,
});

export const createNewMatch = (homeTeam: string, awayTeam: string, date: string, trackShots: boolean = true, trackKickouts: boolean = true): Match => ({
  id: crypto.randomUUID(),
  homeTeam,
  awayTeam,
  date,
  homeStats: createEmptyStats(),
  awayStats: createEmptyStats(),
  shots: [],
  kickouts: [],
  actions: [],
  currentHalf: 1,
  halfTimeSnapshot: null,
  isFinished: false,
  trackShots,
  trackKickouts,
});
