import { supabase } from '../config/supabase.js';

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: player, error } = await supabase
      .from('players')
      .select(`
        *,
        player_stats (*),
        player_skills (*),
        player_avatars (
          *,
          avatars (*)
        ),
        clubs (*)
      `)
      .eq('id', userId)
      .single();

    if (error) throw error;

    res.json(player);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, position, sport } = req.body;

    const { data, error } = await supabase
      .from('players')
      .update({
        username,
        position,
        sport,
        last_online: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: stats, error } = await supabase
      .from('player_stats')
      .select('*')
      .eq('player_id', userId)
      .single();

    if (error) throw error;

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePlayerPosition = async (req, res) => {
  try {
    const userId = req.user.id;
    const { x, y, direction } = req.body;

    const { data, error } = await supabase
      .from('room_users')
      .upsert({
        user_id: userId,
        x,
        y,
        direction,
        last_activity: new Date().toISOString(),
        is_online: true
      })
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getOnlinePlayers = async (req, res) => {
  try {
    const { data: players, error } = await supabase
      .from('room_users')
      .select('*')
      .eq('is_online', true)
      .order('last_activity', { ascending: false });

    if (error) throw error;

    res.json(players);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};