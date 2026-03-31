import { usersDB } from './users';
import { ticketsDB } from './tickets';
import { leaderboardDB } from './leaderboard';

export const db = {
  ...usersDB,
  ...ticketsDB,
  ...leaderboardDB,
};