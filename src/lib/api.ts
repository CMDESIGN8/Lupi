import { supabase } from './supabaseClient';
import { POINTS_PER_TICKET } from './constants';
import { updateUserProgression } from '../utils/userProgression';
import { UnifiedCard, UserCard, Deck, Position, Category, calculateOVR } from '../types/cards';



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
   referral_count: number;
  created_at?: string;
  user_card_level: number;
  user_card_exp: number;
  user_card_rarity: 'bronze' | 'silver' | 'gold' | 'special';
  user_card_pace: number;
  user_card_dribbling: number;
  user_card_passing: number;
  user_card_defending: number;
  user_card_finishing: number;
  user_card_physical: number;
  total_daily_cards: number;
  total_battles_lifetime: number;
  total_wins_lifetime: number;
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

// Función para convertir perfil a carta
function profileToCard(profile: any): UnifiedCard {
    // Asegurarse de que la categoría sea 'socios' para todos los perfiles
    const category = profile.category === 'socios' ? 'socios' : (profile.category || 'socios');
    
    return {
        id: profile.id,
        name: profile.username,
        position: profile.position || 'ala',
        category: category, 
        overall_rating: calculateOVR({
            pace: profile.user_card_pace || 10,
            dribbling: profile.user_card_dribbling || 10,
            passing: profile.user_card_passing || 10,
            defending: profile.user_card_defending || 10,
            finishing: profile.user_card_finishing || 10,
            physical: profile.user_card_physical || 10,
        }),
        pace: profile.user_card_pace || 10,
        dribbling: profile.user_card_dribbling || 10,
        passing: profile.user_card_passing || 10,
        defending: profile.user_card_defending || 10,
        finishing: profile.user_card_finishing || 10,
        physical: profile.user_card_physical || 10,
        card_type: 'socio',
        profile_id: profile.id,
        total_wins_lifetime: profile.total_wins_lifetime || 0,
        total_battles_lifetime: profile.total_battles_lifetime || 0,
        is_real: true,
    };
}

// Función para convertir NPC a carta
function npcToCard(npc: any): UnifiedCard {
  return {
    id: npc.id,
    name: npc.name,
    position: npc.position,
    category: npc.category,
    overall_rating: npc.overall_rating,
    pace: npc.pace,
    dribbling: npc.dribbling,
    passing: npc.passing,
    defending: npc.defending,
    finishing: npc.finishing,
    physical: npc.physical,
    card_type: 'npc',
    can_be_replaced: npc.can_be_replaced,
    is_replaced: npc.is_replaced,
    replaces_profile_id: npc.replaces_profile_id,
    original_name: npc.original_name,
  };
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
submitTicket: async ({ ticketNumber }: { ticketNumber: string }): Promise<{ ticket: Ticket; newPoints: number; streakReward?: { points: number; message: string }; statUpgraded?: { stat: string; newValue: number; oldValue: number }; leveledUp?: boolean; newLevel?: number; }> => {
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
  try {
  await updateUserProgression(userId, { type: 'ticket' });
} catch (err) {
  console.error('Error updating progression:', err);
}

let progressionResult = null;
  try {
    const { updateUserProgression } = await import('../utils/userProgression');
    progressionResult = await updateUserProgression(userId, { type: 'ticket' });
    console.log('📈 Resultado de progresión:', progressionResult);
  } catch (err) {
    console.error('Error updating progression:', err);
  }
  
  // Obtener los stats actualizados del usuario
  const { data: updatedProfile } = await supabase
    .from('profiles')
    .select('user_card_pace, user_card_level, points')
    .eq('id', userId)
    .single();
  
  return {
    ticket: {
      id: ticket.id,
      ticketNumber: ticket.ticket_number,
      userId: ticket.user_id,
      club: ticket.club,
      status: ticket.status,
      createdAt: ticket.created_at
    },
    newPoints: updatedProfile?.points || newPoints,
    streakReward: streakReward || undefined,
    statUpgraded: progressionResult?.stat_upgraded ? {
      stat: progressionResult.stat_upgraded,
      newValue: progressionResult.new_stat_value,
      oldValue: progressionResult.old_stat_value
    } : undefined,
    leveledUp: progressionResult?.leveled_up || false,
    newLevel: progressionResult?.new_level
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
// Versión CORREGIDA - usa maybeSingle() en lugar de single()
isTicketValid: async (ticketNumber: string): Promise<boolean> => {
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  
  try {
    // Usar maybeSingle() en lugar de single()
    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('created_at')
      .eq('ticket_number', ticketNumber)
      .maybeSingle();  // ← Cambiado de .single() a .maybeSingle()
    
    if (error) {
      console.error('Error checking ticket:', error);
      return true; // Si hay error, asumir válido
    }
    
    if (!ticket) return true; // Ticket nuevo es válido
    
    const ticketDate = new Date(ticket.created_at);
    const isValid = ticketDate >= startOfWeek;
    
    console.log(`Ticket ${ticketNumber}: ${isValid ? 'válido' : 'inválido'}`);
    return isValid;
  } catch (error) {
    console.error('Exception checking ticket:', error);
    return true;
  }
},
getClubRanking: async (): Promise<{ club: string; points: number; memberCount: number }[]> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('club, points');
 
  if (error) throw error;
 
  // Agrupar por club en el frontend (sin necesitar una función RPC nueva)
  const clubMap = new Map<string, { points: number; memberCount: number }>();
 
  for (const profile of data || []) {
    const existing = clubMap.get(profile.club) || { points: 0, memberCount: 0 };
    clubMap.set(profile.club, {
      points: existing.points + (profile.points || 0),
      memberCount: existing.memberCount + 1,
    });
  }
 
  return Array.from(clubMap.entries())
    .map(([club, stats]) => ({ club, ...stats }))
    .sort((a, b) => b.points - a.points);
},
 
// Rival más cercano: el usuario con más puntos que está justo por encima del usuario actual
// Si el usuario ya es 1°, devuelve al que tiene menos ventaja por debajo
getRival: async (userId: string, userPoints: number): Promise<{
  rival: LeaderEntry;
  diff: number;
  isAhead: boolean; // true = rival está por encima (lo estamos persiguiendo)
} | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, club, points')
    .neq('id', userId)
    .order('points', { ascending: false })
    .limit(50); // suficiente para encontrar al rival cercano
 
  if (error || !data || data.length === 0) return null;
 
  // Buscar el que tiene menos puntos y está por ENCIMA
  const ahead = data.filter(p => p.points > userPoints);
  const behind = data.filter(p => p.points <= userPoints);
 
  if (ahead.length > 0) {
    // El rival más cercano que nos supera (el último de los que están por delante)
    const closest = ahead[ahead.length - 1];
    return {
      rival: closest,
      diff: closest.points - userPoints,
      isAhead: true,
    };
  }
 
  // Si somos 1°, el rival es el que está justo detrás
  if (behind.length > 0) {
    const closest = behind[0];
    return {
      rival: closest,
      diff: userPoints - closest.points,
      isAhead: false,
    };
  }
 
  return null;
},

// Obtener misiones completadas esta semana
getCompletedMissions: async (userId: string): Promise<string[]> => {
  const { data, error } = await supabase.rpc('get_completed_missions', {
    p_user_id: userId,
  });
  if (error) {
    console.error('Error fetching completed missions:', error);
    return [];
  }
  return (data || []).map((r: { mission_id: string }) => r.mission_id);
},
 
// Completar una misión y sumar puntos (llama al RPC atómico)
completeMission: async (
  userId: string,
  missionId: string,
  points: number
): Promise<{ success: boolean; newPoints?: number; pointsAwarded?: number }> => {
  const { data, error } = await supabase.rpc('complete_mission', {
    p_user_id: userId,
    p_mission_id: missionId,
    p_points: points,
  });
  if (error) {
    console.error('Error completing mission:', error);
    return { success: false };
  }
  return {
    success: data?.success ?? false,
    newPoints: data?.new_points,
    pointsAwarded: data?.points_awarded,
  };
},
 
// Obtener datos necesarios para evaluar misiones (shares de esta semana)
getWeeklyShareCount: async (userId: string): Promise<number> => {
  const startOfWeek = new Date();
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
 
  const { count, error } = await supabase
    .from('shares')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfWeek.toISOString());
 
  if (error) return 0;
  return count || 0;
},

getUnlockedAchievements: async (userId: string): Promise<string[]> => {
  const { data, error } = await supabase.rpc('get_unlocked_achievements', {
    p_user_id: userId,
  });
  if (error) { console.error('Error fetching achievements:', error); return []; }
  return (data || []).map((r: { achievement_id: string }) => r.achievement_id);
},
 
unlockAchievement: async (
  userId: string,
  achievementId: string
): Promise<{ success: boolean }> => {
  const { data, error } = await supabase.rpc('unlock_achievement', {
    p_user_id: userId,
    p_achievement_id: achievementId,
  });
  if (error) { console.error('Error unlocking achievement:', error); return { success: false }; }
  return { success: data?.success ?? false };
},
 
getCompletedMissionsCount: async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('missions_completed')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  if (error) return 0;
  return count || 0;
},

// Agregar a lib/api.ts dentro del objeto api
updateProgression: async (
  userId: string,
  action: {
    type: 'ticket' | 'daily_card' | 'battle_win' | 'battle_lose' | 
          'share' | 'referral' | 'mission' | 'album_percent';
    value?: number;
  }
): Promise<{ points_gained: number; exp_gained: number; new_points: number; new_level: number; leveled_up: boolean; new_rarity: string }> => {
  const { updateUserProgression } = await import('../utils/userProgression');
  return updateUserProgression(userId, action);
},

getUserCardStats: async (userId: string): Promise<any> => {
  const { getUserCardStats } = await import('../utils/userProgression');
  return getUserCardStats(userId);
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

// ============================================================
// TIPOS — agregar a api.ts
// ============================================================
 
export interface PlayerCard {
  id: string;
  name: string;
  position: 'arquero' | 'cierre' | 'ala' | 'pivot';
  category: string;
  photo_url: string | null;
  overall_rating: number;
  pace: number;
  dribbling: number;
  passing: number;
  defending: number;
  finishing: number;
  physical: number;
  rarity: 'bronze' | 'silver' | 'gold' | 'special';
}
 
export interface DailyRewardResult {
  already_claimed: boolean;
  card: PlayerCard | null;
  is_new_card: boolean;   // true si no la tenía antes
  message: string;
}
 
export interface MatchResult {
  match_id: string;
  user_score: number;
  opponent_score: number;
  won: boolean;
  experience_gained: number;
  events: MatchEvent[];    // goles y acciones narrativas
}
 
export interface MatchEvent {
  minute: number;
  team: 'user' | 'opponent';
  type: 'goal' | 'save' | 'miss';
  player_name: string;
  description: string;
}

// ============================================================
// HELPERS
// ============================================================
 
/** Calcula la rareza según el OVR */
export function getRarity(ovr: number): PlayerCard['rarity'] {
  if (ovr >= 85) return 'special';
  if (ovr >= 75) return 'gold';
  if (ovr >= 65) return 'silver';
  return 'bronze';
}
 
/** Calcula el OVR promedio de los 6 stats */
export function calcOVR(p: Pick<PlayerCard, 'pace' | 'dribbling' | 'passing' | 'defending' | 'finishing' | 'physical'>): number {
  return Math.round((p.pace + p.dribbling + p.passing + p.defending + p.finishing + p.physical) / 6);
}
 
/** Genera stats aleatorios dentro de un rango */
function randomStat(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
 
/** Genera stats base al azar para un jugador nuevo */
export function generateRandomStats(): Omit<PlayerCard, 'id' | 'name' | 'position' | 'category' | 'photo_url' | 'overall_rating' | 'rarity'> {
  const pace      = randomStat(40, 85);
  const dribbling = randomStat(40, 85);
  const passing   = randomStat(40, 85);
  const defending = randomStat(40, 85);
  const finishing = randomStat(40, 85);
  const physical  = randomStat(40, 85);
  return { pace, dribbling, passing, defending, finishing, physical };
}
 
// ============================================================
// FUNCIONES — agregar dentro del objeto `api` en api.ts
// ============================================================


export const cardApi = {
  // Obtener todas las cartas disponibles (NPCs no reemplazados + Socios)
  // ============================================================
// FUNCIONES MODIFICADAS PARA LA CATEGORÍA "SOCIOS"
// ============================================================

async getAllAvailableCards(userId: string): Promise<UnifiedCard[]> {
    // 1. Obtener NPCs no reemplazados (EXCLUYENDO la categoría 'socios')
    const { data: npcs } = await supabase
      .from('players')
      .select('*')
      .eq('can_be_replaced', true)
      .eq('is_replaced', false)
      .neq('category', 'socios');  // 👈 IMPORTANTE: Excluir socios de NPCs
    
    // 2. Obtener socios (todos los usuarios registrados, excluyendo al actual)
    //    Los socios NATURALMENTE tienen categoría 'socios' por el trigger
    const { data: socios } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', userId);
    
    const npcCards = (npcs || []).map(npcToCard);
    const socioCards = (socios || []).map(profileToCard);
    
    console.log(`📊 Cartas disponibles: ${npcCards.length} NPCs + ${socioCards.length} Socios = ${npcCards.length + socioCards.length} total`);
    
    return [...npcCards, ...socioCards];
},

// Obtener cartas del usuario (colección)
async getUserCards(userId: string): Promise<UserCard[]> {
    const { data, error } = await supabase
      .from('user_cards')
      .select(`
        *,
        npc:players!player_id (*),
        socio:profiles!socio_id (
          id,
          username,
          position,
          category,
          user_card_pace,
          user_card_dribbling,
          user_card_passing,
          user_card_defending,
          user_card_finishing,
          user_card_physical,
          total_wins_lifetime,
          total_battles_lifetime
        )
      `)
      .eq('user_id', userId);
    
    if (error) throw error;
    
    return (data || []).map(uc => {
      // Verificar que los datos existan antes de mapear
      if (uc.card_type === 'npc' && uc.npc) {
        return {
          ...uc,
          card: npcToCard(uc.npc),
        };
      } else if (uc.card_type === 'socio' && uc.socio) {
        return {
          ...uc,
          card: profileToCard(uc.socio),
        };
      }
      // Fallback si no hay datos
      return {
        ...uc,
        card: null,
      };
    }).filter(uc => uc.card !== null); // Filtrar cartas sin datos
},

// Obtener progreso del álbum
async getAlbumProgress(userId: string): Promise<{ owned: number; total: number }> {
    // Total de cartas posibles = NPCs no reemplazados (sin categoría socios) + Socios
    const { count: npcCount } = await supabase
      .from('players')
      .select('*', { count: 'exact', head: true })
      .eq('can_be_replaced', true)
      .eq('is_replaced', false)
      .neq('category', 'socios');  // 👈 Excluir socios de NPCs
    
    // Contar TODOS los socios (usuarios registrados)
    const { count: socioCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    const total = (npcCount || 0) + (socioCount || 0);
    
    // Cartas que el usuario ya tiene (tanto NPCs como Socios)
    const { count: owned } = await supabase
      .from('user_cards')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    console.log(`📊 Progreso álbum: ${owned || 0}/${total} cartas (${npcCount} NPCs + ${socioCount} Socios)`);
    
    return { owned: owned || 0, total };
},

// 👇 NUEVA FUNCIÓN: Obtener cartas por categoría específica
async getCardsByCategory(category: string): Promise<UnifiedCard[]> {
    if (category === 'socios') {
        // Para socios, obtener de profiles
        const { data: socios } = await supabase
            .from('profiles')
            .select('*');
        return (socios || []).map(profileToCard);
    } else {
        // Para categorías oficiales, obtener de players
        const { data: npcs } = await supabase
            .from('players')
            .select('*')
            .eq('category', category)
            .eq('can_be_replaced', true)
            .eq('is_replaced', false);
        return (npcs || []).map(npcToCard);
    }
},

// 👇 NUEVA FUNCIÓN: Obtener estadísticas del álbum por categoría
async getAlbumStatsByCategory(userId: string): Promise<{
    category: string;
    total: number;
    owned: number;
    progress: number;
}[]> {
    const categories = ['1era', '3ra', '4ta', '5ta', '6ta', '7ma', '8va', 'femenino', 'Promocionales', 'socios'];
    const stats = [];
    
    // Obtener todas las cartas del usuario
    const { data: userCards } = await supabase
        .from('user_cards')
        .select('player_id, socio_id, card_type')
        .eq('user_id', userId);
    
    const ownedIds = new Set();
    userCards?.forEach(card => {
        if (card.card_type === 'npc' && card.player_id) {
            ownedIds.add(card.player_id);
        } else if (card.card_type === 'socio' && card.socio_id) {
            ownedIds.add(card.socio_id);
        }
    });
    
    for (const cat of categories) {
        let total = 0;
        let owned = 0;
        
        if (cat === 'socios') {
            // Contar socios
            const { count } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true });
            total = count || 0;
            
            // Contar socios que el usuario tiene
            const { data: sociosOwned } = await supabase
                .from('user_cards')
                .select('socio_id')
                .eq('user_id', userId)
                .eq('card_type', 'socio')
                .not('socio_id', 'is', null);
            owned = sociosOwned?.length || 0;
        } else {
            // Contar NPCs por categoría
            const { count } = await supabase
                .from('players')
                .select('*', { count: 'exact', head: true })
                .eq('category', cat)
                .eq('can_be_replaced', true)
                .eq('is_replaced', false);
            total = count || 0;
            
            // Contar NPCs que el usuario tiene de esta categoría
            const { data: npcsOwned } = await supabase
                .from('user_cards')
                .select('player_id')
                .eq('user_id', userId)
                .eq('card_type', 'npc')
                .not('player_id', 'is', null);
            
            const npcIds = npcsOwned?.map(c => c.player_id) || [];
            if (npcIds.length > 0) {
                const { count: ownedCount } = await supabase
                    .from('players')
                    .select('*', { count: 'exact', head: true })
                    .in('id', npcIds)
                    .eq('category', cat);
                owned = ownedCount || 0;
            }
        }
        
        stats.push({
            category: cat,
            total,
            owned,
            progress: total > 0 ? (owned / total) * 100 : 0,
        });
    }
    
    return stats;
},

  // Abrir caja misteriosa
  async openDailyBox(userId: string): Promise<{ card: UnifiedCard | null; already_claimed: boolean }> {
    // Verificar si ya reclamó hoy
    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase
      .from('daily_rewards')
      .select('id')
      .eq('user_id', userId)
      .eq('reward_date', today)
      .single();
    
    if (existing) {
      return { card: null, already_claimed: true };
    }
    
    // Obtener IDs de cartas que el usuario ya tiene
    const { data: userCards } = await supabase
      .from('user_cards')
      .select('player_id, socio_id, card_type')
      .eq('user_id', userId);
    
    const ownedNpcIds = new Set(userCards?.filter(c => c.card_type === 'npc').map(c => c.player_id) || []);
    const ownedSocioIds = new Set(userCards?.filter(c => c.card_type === 'socio').map(c => c.socio_id) || []);
    
    // Obtener NPCs disponibles (no reemplazados y que no tenga)
    const { data: availableNpcs } = await supabase
      .from('players')
      .select('*')
      .eq('can_be_replaced', true)
      .eq('is_replaced', false);
    
    const filteredNpcs = (availableNpcs || []).filter(npc => !ownedNpcIds.has(npc.id));
    
    // Obtener socios disponibles (excluyendo al usuario y los que ya tiene)
    const { data: availableSocios } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', userId);
    
    const filteredSocios = (availableSocios || []).filter(socio => !ownedSocioIds.has(socio.id));
    
    // Combinar disponibles
    const availableCards: UnifiedCard[] = [
      ...filteredNpcs.map(npcToCard),
      ...filteredSocios.map(profileToCard)
    ];
    
    if (availableCards.length === 0) {
      return { card: null, already_claimed: false }; // Álbum completo
    }
    
    // Seleccionar carta aleatoria
    const randomCard = availableCards[Math.floor(Math.random() * availableCards.length)];
    
    // Guardar en user_cards
    const newCard = {
      user_id: userId,
      card_type: randomCard.card_type,
      ...(randomCard.card_type === 'npc' 
        ? { player_id: randomCard.id }
        : { socio_id: randomCard.id }),
      level: 1,
      experience: 0,
      obtained_at: new Date(),
    };
    
    await supabase.from('user_cards').insert(newCard);
    
    // Registrar en daily_rewards
    await supabase.from('daily_rewards').insert({
      user_id: userId,
      reward_date: today,
      claimed: true,
      claimed_at: new Date(),
    });
    
    return { card: randomCard, already_claimed: false };
  },

  // Verificar estado de la caja diaria
  async checkDailyBoxStatus(userId: string): Promise<{ claimed: boolean }> {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase
      .from('daily_rewards')
      .select('id')
      .eq('user_id', userId)
      .eq('reward_date', today)
      .single();
    
    return { claimed: !!data };
  },

  // Obtener mazo activo del usuario
  async getActiveDeck(userId: string): Promise<{ deck_id: string; cards: UserCard[] }> {
    const { data: deck } = await supabase
      .from('decks')
      .select('id')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();
    
    if (!deck) {
      // Crear mazo por defecto
      const { data: newDeck } = await supabase
        .from('decks')
        .insert({ user_id: userId, name: 'Mi Mazo', is_active: true })
        .select()
        .single();
      
      return { deck_id: newDeck.id, cards: [] };
    }
    
    const { data: deckCards } = await supabase
      .from('deck_cards')
      .select('user_card_id, position')
      .eq('deck_id', deck.id)
      .order('position');
    
    const userCards = await this.getUserCards(userId);
    const cardsInDeck = (deckCards || [])
      .map(dc => userCards.find(uc => uc.id === dc.user_card_id))
      .filter(Boolean)
      .map((uc, idx) => ({ ...uc!, position: idx + 1 }));
    
    return { deck_id: deck.id, cards: cardsInDeck };
  },

  // Actualizar carta en el mazo
  async updateDeckCard(deckId: string, position: number, userCardId: string): Promise<void> {
    await supabase
      .from('deck_cards')
      .upsert({
        deck_id: deckId,
        user_card_id: userCardId,
        position,
      });
  },
};