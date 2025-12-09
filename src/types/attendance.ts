export interface Player {
  id: string;
  name: string;
  number?: string;
  isActive: boolean; // false if player removed from squad but has historical data
}

export interface PlayerAttendance {
  playerId: string;
  present: boolean;
  injured: boolean;
}

export interface AttendanceEvent {
  id: string;
  squadId: string; // Link to the squad this event belongs to
  name: string;
  date: string;
  attendance: PlayerAttendance[];
  createdAt: number;
}

export interface Squad {
  id: string;
  teamName: string;
  players: Player[];
  createdAt: number;
  updatedAt: number;
}

export const createNewSquad = (teamName: string): Squad => ({
  id: crypto.randomUUID(),
  teamName,
  players: [],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

export const createNewPlayer = (name: string, number?: string): Player => ({
  id: crypto.randomUUID(),
  name,
  number,
  isActive: true,
});

export const createNewAttendanceEvent = (squadId: string, name: string, date: string, players: Player[]): AttendanceEvent => ({
  id: crypto.randomUUID(),
  squadId,
  name,
  date,
  attendance: players.filter(p => p.isActive).map(p => ({
    playerId: p.id,
    present: false,
    injured: false,
  })),
  createdAt: Date.now(),
});
