import type { TeamStats } from '../types/match';

export const calculateScore = (stats: TeamStats): string => {
  // Display format: Goals - Points (where two-pointers count as 2 points each)
  const totalPoints = stats.point + (stats.two_point * 2);
  return `${stats.goal}-${totalPoints.toString().padStart(2, '0')}`;
};

export const calculateTotalScore = (stats: TeamStats): number => {
  // Goals = 3 points, Two-pointers = 2 points, Points = 1 point
  return stats.goal * 3 + stats.two_point * 2 + stats.point;
};

export const calculateShootingAccuracy = (stats: TeamStats): number => {
  const totalShots = stats.point + stats.two_point + stats.goal + stats.wide + stats.short + stats.saved;
  if (totalShots === 0) return 0;
  const scores = stats.point + stats.two_point + stats.goal;
  return Math.round((scores / totalShots) * 100);
};

export const calculateKickoutWinPercentage = (stats: TeamStats): number => {
  const totalKickouts = stats.kickout_won + stats.kickout_lost;
  if (totalKickouts === 0) return 0;
  return Math.round((stats.kickout_won / totalKickouts) * 100);
};

export const calculateKickoutLossPercentage = (stats: TeamStats): number => {
  const totalKickouts = stats.kickout_won + stats.kickout_lost;
  if (totalKickouts === 0) return 0;
  return Math.round((stats.kickout_lost / totalKickouts) * 100);
};

const HALF_DURATION_MINUTES = 30;

/**
 * Format a timestamp as match time (MM:SS) relative to half start time
 * Shows overtime as "30:00+1", "30:00+2" etc when elapsed time exceeds half duration
 * @param timestamp - The event timestamp
 * @param halfStartTime - The start time of the current half
 * @param isSecondHalf - Whether this is a second half event (adds 30 min offset)
 * @returns Formatted time string like "12:34", "30:00+2", or "52:15"
 */
export const formatMatchTime = (
  timestamp: number,
  halfStartTime: number | null,
  isSecondHalf: boolean = false
): string => {
  if (!halfStartTime) return '--:--';
  
  const elapsedMs = timestamp - halfStartTime;
  const elapsedSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;
  
  const halfOffset = isSecondHalf ? HALF_DURATION_MINUTES : 0;
  
  // Check if we're in overtime (past 30 mins of the half)
  if (elapsedMinutes >= HALF_DURATION_MINUTES) {
    const overtimeMinutes = elapsedMinutes - HALF_DURATION_MINUTES + 1;
    const baseTime = HALF_DURATION_MINUTES + halfOffset;
    return `${baseTime}:00+${overtimeMinutes}`;
  }
  
  const displayMinutes = elapsedMinutes + halfOffset;
  return `${displayMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};
