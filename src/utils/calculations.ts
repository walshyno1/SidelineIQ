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
