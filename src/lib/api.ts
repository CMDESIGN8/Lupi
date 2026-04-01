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
// api.ts - Actualizar la interfaz AppUser
export interface AppUser {
  id: string;
  email: string;
  username: string;
  club: string;
  points: number;
  streak: number;              // 🔥 Días consecutivos
  last_ticket_date: string | null;  // 📅 Última fecha
  best_streak: number;         // 🏆 Récord personal
  referral_code: string;
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
  // En api.ts, corregir submitTicket
submitTicket: async ({ ticketNumber }: { ticketNumber: string }): Promise<{ ticket: Ticket; newPoints: number; streakReward?: { points: number; message: string } }> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('No session found');

  const userId = session.user.id;
  const clean = ticketNumber.trim().replace(/\s/g, "");
  
  if (!/^\d{6,12}$/.test(clean)) {
    throw new Error("El número de entrada debe tener entre 6 y 12 dígitos.");
  }

  // Obtener el club del usuario
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('club, points')
    .eq('id', userId)
    .single();
    
  if (profileError) {
    console.error('Error getting profile:', profileError);
    throw new Error('Error al obtener perfil de usuario');
  }

  // Primero, verificar si el ticket ya existe y es válido
  const { data: existingTicket, error: checkError } = await supabase
    .from('tickets')
    .select('id, created_at, status')
    .eq('ticket_number', clean)
    .maybeSingle();
    
  if (checkError && checkError.code !== 'PGRST116') {
    console.error('Error checking existing ticket:', checkError);
  }
  
  // Si el ticket ya existe
  if (existingTicket) {
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const ticketDate = new Date(existingTicket.created_at);
    
    if (ticketDate >= startOfWeek) {
      throw new Error('Este número de entrada ya fue cargado esta semana.');
    } else {
      throw new Error('Este número de entrada ya fue utilizado en una semana anterior y ya no es válido.');
    }
  }

  // Insertar el ticket usando add_ticket RPC
  const { data: ticketId, error: addError } = await supabase.rpc('add_ticket', {
    p_user_id: userId,
    p_ticket_number: clean,
    p_club: profile.club
  });

  if (addError) {
    console.error('Error adding ticket:', addError);
    throw new Error(addError.message || 'Error al cargar la entrada');
  }
  
  if (!ticketId) {
    throw new Error('No se pudo crear el ticket');
  }

  // Verificar recompensas por racha (si tienes la función)
  let streakReward = null;
  try {
    const { data: rewardData, error: rewardError } = await supabase
      .rpc('check_streak_rewards', { p_user_id: userId });
    
    if (!rewardError && rewardData && rewardData.length > 0 && rewardData[0].reward_given) {
      streakReward = {
        points: rewardData[0].points_awarded,
        message: rewardData[0].message
      };
    }
  } catch (error) {
    console.error('Error checking streak rewards:', error);
  }

  // Obtener el ticket creado
  const { data: ticket, error: ticketError } = await supabase
    .from('tickets')
    .select('*')
    .eq('id', ticketId)
    .single();

  if (ticketError) {
    console.error('Error fetching created ticket:', ticketError);
    throw new Error('Error al obtener el ticket');
  }

  // Actualizar puntos del usuario
  const pointsToAdd = (streakReward?.points || 0) + 10;
  const newPoints = (profile.points || 0) + pointsToAdd;
  
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ points: newPoints })
    .eq('id', userId);
    
  if (updateError) {
    console.error('Error updating points:', updateError);
    throw new Error('Error al actualizar puntos');
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
    newPoints: newPoints,
    streakReward: streakReward || undefined
  };
},

// Función para obtener estado del sorteo
getRaffleStatus: async (): Promise<{
  weekStart: Date;
  weekEnd: Date;
  totalTickets: number;
  winners: any[];
  nextRaffle: Date;
}> => {
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(endOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  // Próximo sorteo (próximo lunes)
  const nextRaffle = new Date();
  const daysUntilMonday = (8 - nextRaffle.getDay()) % 7 || 7;
  nextRaffle.setDate(nextRaffle.getDate() + daysUntilMonday);
  nextRaffle.setHours(0, 0, 0, 0);
  
  // Contar tickets participantes
  const { count: totalTickets } = await supabase
    .from('tickets')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'participando')
    .gte('created_at', startOfWeek.toISOString());
  
  // Obtener ganadores de esta semana
  const { data: winners } = await supabase
    .from('tickets')
    .select('*, profiles(username, club)')
    .eq('status', 'ganador')
    .gte('created_at', startOfWeek.toISOString());
  
  return {
    weekStart: startOfWeek,
    weekEnd: endOfWeek,
    totalTickets: totalTickets || 0,
    winners: winners || [],
    nextRaffle: nextRaffle
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

// Obtener solo tickets de la semana actual (activos)
getCurrentWeekTickets: async (userId: string): Promise<Ticket[]> => {
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const { data, error } = await supabase
    .from('tickets')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', startOfWeek.toISOString())
    .in('status', ['participando', 'pendiente', 'ganador'])
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(ticket => ({
    id: ticket.id,
    ticketNumber: ticket.ticket_number,
    userId: ticket.user_id,
    club: ticket.club,
    status: ticket.status,
    createdAt: ticket.created_at
  }));
},

// Obtener historial de tickets (tickets antiguos que ya no sirven)
getTicketHistory: async (userId: string): Promise<Ticket[]> => {
  // Primero obtener de tickets_history
  const { data: historyData, error: historyError } = await supabase
    .from('tickets_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (historyError) {
    console.error('Error fetching ticket history:', historyError);
  }

  // También incluir tickets ganadores actuales que aún no se archivaron
  const { data: winnerTickets, error: winnerError } = await supabase
    .from('tickets')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'ganador')
    .order('created_at', { ascending: false });

  if (winnerError) {
    console.error('Error fetching winner tickets:', winnerError);
  }

  const history = (historyData || []).map(ticket => ({
    id: ticket.ticket_id || ticket.id,
    ticketNumber: ticket.ticket_number,
    userId: ticket.user_id,
    club: ticket.club,
    status: ticket.status,
    createdAt: ticket.created_at
  }));

  const winners = (winnerTickets || []).map(ticket => ({
    id: ticket.id,
    ticketNumber: ticket.ticket_number,
    userId: ticket.user_id,
    club: ticket.club,
    status: ticket.status,
    createdAt: ticket.created_at
  }));

  return [...winners, ...history];
},

// Obtener ganadores históricos
getWinnersHistory: async (limit: number = 10): Promise<any[]> => {
  const { data, error } = await supabase
    .from('winners_history')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
},

// Ejecutar limpieza semanal (se puede llamar manualmente desde admin)
runWeeklyCleanup: async (): Promise<void> => {
  const { error } = await supabase.rpc('weekly_cleanup');
  if (error) throw error;
},

// Verificar si un ticket es válido para la semana actual
isTicketValid: async (ticketNumber: string): Promise<boolean> => {
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select('created_at, status')
    .eq('ticket_number', ticketNumber)
    .single();
  
  if (error || !ticket) return true; // Ticket nuevo es válido
  
  const ticketDate = new Date(ticket.created_at);
  return ticketDate >= startOfWeek;
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