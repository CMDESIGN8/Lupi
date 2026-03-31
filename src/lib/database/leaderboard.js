import { supabase } from '../supabaseClient';

export const leaderboardDB = {
  // Obtener top 10
  getLeaderboard: async () => {
    const { data, error } = await supabase
      .from('users')
      .select('id, username, club, points')
      .order('points', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data || [];
  },
};