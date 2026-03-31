import { supabase } from '../supabaseClient';

export const usersDB = {
  // Registrar nuevo usuario
  register: async ({ email, username, club, password }) => {
    // Verificar si el email ya existe
    const { data: existingEmail } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingEmail) {
      throw new Error('El email ya está registrado.');
    }

    // Verificar si el username ya existe
    const { data: existingUsername } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single();

    if (existingUsername) {
      throw new Error('El nombre de usuario ya existe.');
    }

    // Crear usuario (la contraseña se hasheará con auth de Supabase)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
          club,
        }
      }
    });

    if (authError) throw authError;

    // Crear perfil en la tabla users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          id: authData.user.id,
          email,
          username,
          club,
          points: 0,
          created_at: new Date().toISOString(),
        }
      ])
      .select()
      .single();

    if (userError) throw userError;

    return {
      token: authData.session?.access_token,
      user: { ...userData, password: undefined }
    };
  },

  // Iniciar sesión
  login: async ({ email, password }) => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) throw new Error('Email o contraseña incorrectos.');

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (userError) throw userError;

    return {
      token: authData.session.access_token,
      user: { ...userData, password: undefined }
    };
  },

  // Obtener sesión actual
  getSession: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return null;

    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error || !userData) return null;

    return { ...userData, password: undefined };
  },

  // Cerrar sesión
  logout: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Actualizar puntos del usuario
  updatePoints: async (userId, newPoints) => {
    const { data, error } = await supabase
      .from('users')
      .update({ points: newPoints })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};