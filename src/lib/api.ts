import { supabase } from './supabaseClient';
import { POINTS_PER_TICKET } from './constants';

// Add missing RegisterData type
export interface RegisterData {
  email: string;
  username: string;
  club: string;
  password: string;
  referralCode?: string;
}

// Types
export interface AppUser {
  id: string;
  email: string;
  username: string;
  club: string;
  points: number;
  created_at?: string;
}

export interface Ticket {
  id: string;
  ticketNumber: string;
  userId: string;
  club: string;
  status: 'pendiente' | 'participando' | 'ganador' | 'invalido';
  createdAt: string;
}

export interface LeaderEntry {
  id: string;
  username: string;
  club: string;
  points: number;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'validation' | 'winner' | 'info' | 'alert';
  read: boolean;
  metadata: {
    ticket_id?: string;
    ticket_number?: string;
    club?: string;
  };
  created_at: string;
}

// Add type for ticket parameter
interface TicketFromDB {
  id: string;
  ticket_number: string;
  user_id: string;
  club: string;
  status: 'pendiente' | 'participando' | 'ganador' | 'invalido';
  created_at: string;
}

export const api = {
  register: async ({ email, username, club, password, referralCode }: RegisterData): Promise<AppUser> => {
    console.log('🔵 Iniciando registro con datos:', { email, username, club, referralCode });
    
    // 1. Verificar si el username existe
    const { data: existingUsername } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (existingUsername) {
      throw new Error('El nombre de usuario ya existe.');
    }

    // 2. Crear usuario en auth
    console.log('🟡 Creando usuario en auth...');
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { 
          username, 
          club
        }
      }
    });

    if (authError) {
      console.error('🔴 Error en auth:', authError);
      throw new Error(authError.message);
    }
    
    if (!authData.user) {
      throw new Error('Error creating user');
    }
    
    console.log('🟢 Usuario creado en auth:', authData.user.id);

    // 3. Esperar a que el trigger cree el perfil
    console.log('🟡 Esperando creación de perfil...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // 4. Obtener el perfil creado
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      console.error('🔴 Error obteniendo perfil:', profileError);
      throw new Error('Error al crear el perfil');
    }
    
    console.log('🟢 Perfil creado:', profileData);

    // 5. Procesar referido si existe
    if (referralCode && referralCode.trim() !== '') {
      console.log('🟡 Procesando referido con código:', referralCode.toUpperCase());
      
      try {
        const { data: referralResult, error: referralError } = await supabase
          .rpc('process_referral', {
            p_referred_id: authData.user.id,
            p_referral_code: referralCode.toUpperCase()
          });
        
        if (referralError) {
          console.error('🔴 Error en process_referral RPC:', referralError);
          console.error('Detalle del error:', JSON.stringify(referralError, null, 2));
        } else {
          console.log('🟢 Resultado del referido:', referralResult);
        }
      } catch (error) {
        console.error('🔴 Excepción en process_referral:', error);
      }
    } else {
      console.log('🟡 No hay código de referido para procesar');
    }

    // 6. Obtener el perfil actualizado
    const { data: updatedProfile, error: updatedError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (!updatedError && updatedProfile) {
      console.log('🟢 Perfil final:', updatedProfile);
      return updatedProfile;
    }

    return profileData;
  },

  // Login
  login: async ({ email, password }: { email: string; password: string }): Promise<AppUser> => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) throw new Error('Email o contraseña incorrectos.');

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) throw profileError;

    return profileData;
  },

  // Get current session
  getSession: async (): Promise<AppUser | null> => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) return null;

    const { data: profileData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (error || !profileData) return null;

    return profileData;
  },

  // Logout
  logout: async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Submit ticket
  submitTicket: async ({ ticketNumber }: { ticketNumber: string }): Promise<{ ticket: Ticket; newPoints: number }> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error('No session found');

    const userId = session.user.id;
    const clean = ticketNumber.trim().replace(/\s/g, "");
    
    if (!/^\d{6,12}$/.test(clean)) {
      throw new Error("El número de entrada debe tener entre 6 y 12 dígitos.");
    }

    // Calcular inicio de semana (domingo)
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Formatear fecha para Supabase (ISO string sin milisegundos)
    const startOfWeekISO = startOfWeek.toISOString().split('.')[0];

    // VERIFICACIÓN 1: ¿Ya cargó un ticket esta semana con el mismo número?
    const { data: weeklyTicket, error: weeklyError } = await supabase
      .from('tickets')
      .select('id')
      .eq('user_id', userId)
      .eq('ticket_number', clean)
      .gte('created_at', startOfWeekISO);

    if (weeklyError) {
      console.error('Error checking weekly ticket:', weeklyError);
    }

    if (weeklyTicket && weeklyTicket.length > 0) {
      throw new Error("Ya cargaste una entrada esta semana.");
    }

    // VERIFICACIÓN 2: ¿El número de ticket ya existe en el sistema?
    const { data: existingTicket, error: existingError } = await supabase
      .from('tickets')
      .select('id')
      .eq('ticket_number', clean);

    if (existingError) {
      console.error('Error checking existing ticket:', existingError);
    }

    if (existingTicket && existingTicket.length > 0) {
      throw new Error("Este número de entrada ya fue registrado.");
    }

    // Get user profile data
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('club, points')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error fetching profile:', profileError);
      throw new Error("Usuario no encontrado.");
    }

    // Create ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert({
        user_id: userId,
        ticket_number: clean,
        club: profileData.club,
        status: "pendiente"
      })
      .select()
      .single();

    if (ticketError) {
      console.error('Error creating ticket:', ticketError);
      throw new Error("Error al registrar la entrada.");
    }

    // Update user points
    const newPoints = (profileData.points || 0) + POINTS_PER_TICKET;
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({ points: newPoints })
      .eq('id', userId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating points:', updateError);
      throw new Error("Error al actualizar puntos.");
    }

    return {
      ticket: {
        id: ticket.id,
        ticketNumber: ticket.ticket_number,
        userId: ticket.user_id,
        club: ticket.club,
        status: ticket.status,
        createdAt: ticket.created_at
      },
      newPoints: updatedProfile.points
    };
  },

  // Get user tickets
  getUserTickets: async (userId: string): Promise<Ticket[]> => {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user tickets:', error);
      throw error;
    }

    return (data || []).map((ticket: TicketFromDB) => ({
      id: ticket.id,
      ticketNumber: ticket.ticket_number,
      userId: ticket.user_id,
      club: ticket.club,
      status: ticket.status,
      createdAt: ticket.created_at
    }));
  },

  // Get leaderboard
  getLeaderboard: async (): Promise<LeaderEntry[]> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, club, points')
      .order('points', { ascending: false })
      .limit(10);

    if (error) throw error;
    return data || [];
  },

  // Obtener notificaciones del usuario
  getNotifications: async (userId: string): Promise<Notification[]> => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  },

  // Marcar notificación como leída
  markNotificationAsRead: async (notificationId: string): Promise<void> => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) throw error;
  },

  // Marcar todas como leídas
  markAllNotificationsAsRead: async (userId: string): Promise<void> => {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) throw error;
  },

  // Obtener contador de no leídas
  getUnreadCount: async (userId: string): Promise<number> => {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) return 0;
    return count || 0;
  },

  // Verificar si puede compartir hoy
canShareToday: async (userId: string): Promise<{ canShare: boolean; nextShareDate?: string }> => {
  try {
    const { data, error } = await supabase
      .rpc('can_share_today', { p_user_id: userId });

    if (error) {
      console.error('Error in can_share_today RPC:', error);
      // Si hay error, asumir que puede compartir (fallback seguro)
      return { canShare: true };
    }

    return {
      canShare: data?.[0]?.can_share ?? true,
      nextShareDate: data?.[0]?.next_share_date
    };
  } catch (error) {
    console.error('Error checking share eligibility:', error);
    return { canShare: true };
  }
},

// Registrar compartido y sumar puntos
registerShare: async (userId: string, shareType: string = 'social'): Promise<{ success: boolean; newPoints: number; message: string }> => {
  try {
    const { data, error } = await supabase
      .rpc('register_share', {
        p_user_id: userId,
        p_share_type: shareType
      });

    if (error) {
      console.error('Error in register_share RPC:', error);
      throw new Error(error.message || 'Error al registrar el compartido');
    }

    if (!data || data.length === 0) {
      throw new Error('No se recibió respuesta del servidor');
    }

    return {
      success: data[0]?.success ?? false,
      newPoints: data[0]?.new_points ?? 0,
      message: data[0]?.message ?? 'Error al procesar'
    };
  } catch (error: any) {
    console.error('Error registering share:', error);
    throw new Error(error.message || 'Error al registrar el compartido');
  }
},

// Obtener estadísticas de compartidos
getShareStats: async (userId: string): Promise<{ totalShares: number; totalPointsFromShares: number }> => {
  try {
    const { data, error } = await supabase
      .from('shares')
      .select('points_awarded')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching share stats:', error);
      return { totalShares: 0, totalPointsFromShares: 0 };
    }

    const totalShares = data?.length || 0;
    const totalPointsFromShares = data?.reduce((sum, share) => sum + (share.points_awarded || 0), 0) || 0;

    return { totalShares, totalPointsFromShares };
  } catch (error) {
    console.error('Error getting share stats:', error);
    return { totalShares: 0, totalPointsFromShares: 0 };
  }
},

  // Suscribirse a notificaciones en tiempo real
  subscribeToNotifications: (userId: string, callback: (notification: Notification) => void) => {
    const subscription = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload: { new: Notification }) => {
          callback(payload.new);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }
};