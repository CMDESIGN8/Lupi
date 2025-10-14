import { supabase } from '../config/supabase.js';

export const getClubs = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;

    let query = supabase
      .from('clubs')
      .select(`
        *,
        owner_id,
        players!inner (id, username, level),
        club_missions (count)
      `, { count: 'exact' });

    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    const { data: clubs, error, count } = await query
      .range((page - 1) * limit, page * limit - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({
      clubs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createClub = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, description } = req.body;

    // Verificar si el usuario ya tiene un club
    const { data: existingClub } = await supabase
      .from('clubs')
      .select('id')
      .eq('owner_id', userId)
      .single();

    if (existingClub) {
      return res.status(400).json({ error: 'Ya eres dueño de un club' });
    }

    // Crear el club
    const { data: club, error } = await supabase
      .from('clubs')
      .insert([
        {
          name,
          description,
          owner_id: userId
        }
      ])
      .select(`
        *,
        players (username)
      `)
      .single();

    if (error) throw error;

    // Unir al usuario al club como owner
    await supabase
      .from('players')
      .update({ club_id: club.id })
      .eq('id', userId);

    res.json(club);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getClubDetails = async (req, res) => {
  try {
    const { clubId } = req.params;

    const { data: club, error } = await supabase
      .from('clubs')
      .select(`
        *,
        players (
          id,
          username,
          level,
          experience,
          position,
          sport,
          online_status
        ),
        club_missions (*),
        club_feed (
          *,
          user_id,
          players (username)
        )
      `)
      .eq('id', clubId)
      .single();

    if (error) throw error;

    res.json(club);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const joinClub = async (req, res) => {
  try {
    const userId = req.user.id;
    const { clubId } = req.params;

    // Verificar si el usuario ya está en un club
    const { data: player } = await supabase
      .from('players')
      .select('club_id')
      .eq('id', userId)
      .single();

    if (player.club_id) {
      return res.status(400).json({ error: 'Ya perteneces a un club' });
    }

    // Unir al usuario al club
    const { data, error } = await supabase
      .from('players')
      .update({ club_id: clubId })
      .eq('id', userId)
      .select(`
        *,
        clubs (*)
      `)
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const leaveClub = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('players')
      .update({ club_id: null })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Has abandonado el club', player: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getClubMembers = async (req, res) => {
  try {
    const { clubId } = req.params;

    const { data: members, error } = await supabase
      .from('players')
      .select(`
        id,
        username,
        level,
        experience,
        position,
        sport,
        online_status,
        last_online,
        player_stats (*)
      `)
      .eq('club_id', clubId)
      .order('level', { ascending: false });

    if (error) throw error;

    res.json(members);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createClubPost = async (req, res) => {
  try {
    const userId = req.user.id;
    const { clubId } = req.params;
    const { content, imageUrl } = req.body;

    // Verificar que el usuario pertenece al club
    const { data: player } = await supabase
      .from('players')
      .select('club_id')
      .eq('id', userId)
      .single();

    if (player.club_id !== parseInt(clubId)) {
      return res.status(403).json({ error: 'No perteneces a este club' });
    }

    const { data: post, error } = await supabase
      .from('club_feed')
      .insert([
        {
          user_id: userId,
          content,
          image_url: imageUrl,
          likes_count: 0,
          comments_count: 0
        }
      ])
      .select(`
        *,
        players (username)
      `)
      .single();

    if (error) throw error;

    res.json(post);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};