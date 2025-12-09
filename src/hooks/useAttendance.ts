import { useState, useCallback, useEffect } from 'react';
import type { Squad, AttendanceEvent, Player } from '../types/attendance';
import { createNewSquad, createNewPlayer, createNewAttendanceEvent } from '../types/attendance';
import {
  getAllSquads,
  getSquadById,
  saveSquad as saveSquadToDB,
  deleteSquad as deleteSquadFromDB,
  getEventsBySquad,
  saveEvent as saveEventToDB,
  deleteEvent as deleteEventFromDB,
  isAttendanceDBAvailable,
} from '../utils/attendanceDB';

export const useAttendance = () => {
  const [squads, setSquads] = useState<Squad[]>([]);
  const [selectedSquad, setSelectedSquad] = useState<Squad | null>(null);
  const [events, setEvents] = useState<AttendanceEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load all squads on mount
  useEffect(() => {
    const loadSquads = async () => {
      if (!isAttendanceDBAvailable()) {
        setError('IndexedDB is not available in this browser');
        setIsLoading(false);
        return;
      }

      try {
        const loadedSquads = await getAllSquads();
        setSquads(loadedSquads);
        setError(null);
      } catch (err) {
        console.error('Failed to load squads:', err);
        setError('Failed to load squads');
      } finally {
        setIsLoading(false);
      }
    };

    loadSquads();
  }, []);

  // Load events when a squad is selected
  useEffect(() => {
    const loadEvents = async () => {
      if (!selectedSquad) {
        setEvents([]);
        return;
      }

      try {
        const loadedEvents = await getEventsBySquad(selectedSquad.id);
        setEvents(loadedEvents);
        setError(null);
      } catch (err) {
        console.error('Failed to load events:', err);
        setError('Failed to load events');
      }
    };

    loadEvents();
  }, [selectedSquad?.id]);

  // Select a squad
  const selectSquad = useCallback(async (squadId: string) => {
    try {
      const squad = await getSquadById(squadId);
      setSelectedSquad(squad);
      setError(null);
    } catch (err) {
      console.error('Failed to select squad:', err);
      setError('Failed to select squad');
    }
  }, []);

  // Clear selected squad (go back to team list)
  const clearSelectedSquad = useCallback(() => {
    setSelectedSquad(null);
    setEvents([]);
  }, []);

  // Refresh squads from database (useful after import)
  const refreshSquads = useCallback(async () => {
    try {
      const loadedSquads = await getAllSquads();
      setSquads(loadedSquads);
      setError(null);
    } catch (err) {
      console.error('Failed to refresh squads:', err);
      setError('Failed to refresh squads');
    }
  }, []);

  // Create a new squad
  const createSquad = useCallback(async (teamName: string) => {
    try {
      const newSquad = createNewSquad(teamName);
      await saveSquadToDB(newSquad);
      setSquads(prev => [...prev, newSquad].sort((a, b) => a.teamName.localeCompare(b.teamName)));
      setSelectedSquad(newSquad);
      setError(null);
      return newSquad;
    } catch (err) {
      console.error('Failed to create squad:', err);
      setError('Failed to create squad');
      throw err;
    }
  }, []);

  // Update squad (team name)
  const updateSquad = useCallback(async (updates: Partial<Squad>) => {
    if (!selectedSquad) return;
    
    try {
      const updatedSquad = { ...selectedSquad, ...updates, updatedAt: Date.now() };
      await saveSquadToDB(updatedSquad);
      setSelectedSquad(updatedSquad);
      setSquads(prev => prev.map(s => s.id === updatedSquad.id ? updatedSquad : s)
        .sort((a, b) => a.teamName.localeCompare(b.teamName)));
      setError(null);
    } catch (err) {
      console.error('Failed to update squad:', err);
      setError('Failed to update squad');
    }
  }, [selectedSquad]);

  // Rename a squad (can be called from team list without selecting)
  const renameSquad = useCallback(async (squadId: string, newName: string) => {
    try {
      const squad = await getSquadById(squadId);
      if (!squad) return;
      
      const updatedSquad = { ...squad, teamName: newName, updatedAt: Date.now() };
      await saveSquadToDB(updatedSquad);
      setSquads(prev => prev.map(s => s.id === squadId ? updatedSquad : s)
        .sort((a, b) => a.teamName.localeCompare(b.teamName)));
      if (selectedSquad?.id === squadId) {
        setSelectedSquad(updatedSquad);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to rename squad:', err);
      setError('Failed to rename squad');
    }
  }, [selectedSquad]);

  // Delete a squad and all its events
  const deleteSquad = useCallback(async (squadId: string) => {
    try {
      await deleteSquadFromDB(squadId);
      // Update local state to remove the deleted squad
      setSquads(prev => {
        const updated = prev.filter(s => s.id !== squadId);
        return updated;
      });
      // If we deleted the currently selected squad, clear selection
      if (selectedSquad?.id === squadId) {
        setSelectedSquad(null);
        setEvents([]);
      }
      setError(null);
    } catch (err) {
      console.error('Failed to delete squad:', err);
      setError('Failed to delete squad');
      throw err; // Re-throw so caller knows it failed
    }
  }, [selectedSquad]);

  // Add a player to the selected squad
  const addPlayer = useCallback(async (name: string, number?: string) => {
    if (!selectedSquad) return;
    
    try {
      const newPlayer = createNewPlayer(name, number);
      const updatedSquad = {
        ...selectedSquad,
        players: [...selectedSquad.players, newPlayer],
        updatedAt: Date.now(),
      };
      await saveSquadToDB(updatedSquad);
      setSelectedSquad(updatedSquad);
      setSquads(prev => prev.map(s => s.id === updatedSquad.id ? updatedSquad : s));
      setError(null);
      return newPlayer;
    } catch (err) {
      console.error('Failed to add player:', err);
      setError('Failed to add player');
    }
  }, [selectedSquad]);

  // Update a player
  const updatePlayer = useCallback(async (playerId: string, updates: Partial<Player>) => {
    if (!selectedSquad) return;
    
    try {
      const updatedSquad = {
        ...selectedSquad,
        players: selectedSquad.players.map(p => 
          p.id === playerId ? { ...p, ...updates } : p
        ),
        updatedAt: Date.now(),
      };
      await saveSquadToDB(updatedSquad);
      setSelectedSquad(updatedSquad);
      setSquads(prev => prev.map(s => s.id === updatedSquad.id ? updatedSquad : s));
      setError(null);
    } catch (err) {
      console.error('Failed to update player:', err);
      setError('Failed to update player');
    }
  }, [selectedSquad]);

  // Remove a player (sets isActive to false to preserve historical data)
  const removePlayer = useCallback(async (playerId: string) => {
    if (!selectedSquad) return;
    
    try {
      const updatedSquad = {
        ...selectedSquad,
        players: selectedSquad.players.map(p => 
          p.id === playerId ? { ...p, isActive: false } : p
        ),
        updatedAt: Date.now(),
      };
      await saveSquadToDB(updatedSquad);
      setSelectedSquad(updatedSquad);
      setSquads(prev => prev.map(s => s.id === updatedSquad.id ? updatedSquad : s));
      setError(null);
    } catch (err) {
      console.error('Failed to remove player:', err);
      setError('Failed to remove player');
    }
  }, [selectedSquad]);

  // Create a new attendance event
  const createEvent = useCallback(async (name: string, date: string) => {
    if (!selectedSquad) {
      console.error('Cannot create event: no squad selected');
      return;
    }
    
    try {
      console.log('Creating event:', { name, date, squadId: selectedSquad.id, playerCount: selectedSquad.players.length });
      const newEvent = createNewAttendanceEvent(selectedSquad.id, name, date, selectedSquad.players);
      console.log('Event created in memory:', newEvent);
      await saveEventToDB(newEvent);
      console.log('Event saved to DB');
      setEvents(prev => [newEvent, ...prev]);
      setError(null);
      return newEvent;
    } catch (err) {
      console.error('Failed to create event:', err);
      setError('Failed to create event');
    }
  }, [selectedSquad]);

  // Update an attendance event
  const updateEvent = useCallback(async (event: AttendanceEvent) => {
    try {
      await saveEventToDB(event);
      setEvents(prev => prev.map(e => e.id === event.id ? event : e));
      setError(null);
    } catch (err) {
      console.error('Failed to update event:', err);
      setError('Failed to update event');
    }
  }, []);

  // Delete an attendance event
  const deleteEvent = useCallback(async (eventId: string) => {
    try {
      await deleteEventFromDB(eventId);
      setEvents(prev => prev.filter(e => e.id !== eventId));
      setError(null);
    } catch (err) {
      console.error('Failed to delete event:', err);
      setError('Failed to delete event');
    }
  }, []);

  // Toggle player attendance
  const toggleAttendance = useCallback(async (eventId: string, playerId: string, field: 'present' | 'injured') => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const updatedEvent = {
      ...event,
      attendance: event.attendance.map(a => 
        a.playerId === playerId 
          ? { ...a, [field]: !a[field] }
          : a
      ),
    };

    await updateEvent(updatedEvent);
  }, [events, updateEvent]);

  // Save all attendance for an event (batch update)
  const saveEventAttendance = useCallback(async (eventId: string, attendance: typeof events[0]['attendance']) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    const updatedEvent = {
      ...event,
      attendance,
    };

    await updateEvent(updatedEvent);
  }, [events, updateEvent]);

  return {
    // State
    squads,
    selectedSquad,
    events,
    isLoading,
    error,
    // Squad selection
    selectSquad,
    clearSelectedSquad,
    refreshSquads,
    // Squad CRUD
    createSquad,
    updateSquad,
    renameSquad,
    deleteSquad,
    // Player CRUD
    addPlayer,
    updatePlayer,
    removePlayer,
    // Event CRUD
    createEvent,
    updateEvent,
    deleteEvent,
    toggleAttendance,
    saveEventAttendance,
  };
};
