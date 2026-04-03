import { supabase } from '../supabaseClient';
import { usersDB } from './users';
import { POINTS_PER_TICKET } from '../constants';

export const ticketsDB = {
  // Enviar un ticket
  submitTicket: async ({ userId, ticketNumber }) => {
    const clean = ticketNumber.trim().replace(/\s/g, "");
    
    if (!/^\d{6,12}$/.test(clean)) {
      throw new Error("El número de entrada debe tener entre 6 y 12 dígitos.");
    }

    // Verificar si ya envió un ticket esta semana
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const { data: weeklyTicket, error: weeklyError } = await supabase
      .from('tickets')
      .select('id')
      .eq('user_id', userId)
      .eq('ticket_number', clean)
      .gte('created_at', startOfWeek.toISOString())
      .single();

    if (weeklyTicket) {
      throw new Error("Ya cargaste una entrada esta semana.");
    }

    // Verificar si el ticket ya existe
    const { data: existingTicket } = await supabase
      .from('tickets')
      .select('id')
      .eq('ticket_number', clean)
      .single();

    if (existingTicket) {
      throw new Error("Este número de entrada ya fue registrado.");
    }

    // Obtener datos del usuario
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('club')
      .eq('id', userId)
      .single();

    if (userError) throw new Error("Usuario no encontrado.");

    // Crear ticket
    const { data: ticket, error: ticketError } = await supabase
      .from('tickets')
      .insert([
        {
          user_id: userId,
          ticket_number: clean,
          club: userData.club,
          status: "pendiente",
          created_at: new Date().toISOString(),
        }
      ])
      .select()
      .single();

    if (ticketError) throw ticketError;

    // Actualizar puntos del usuario
    const newPoints = (userData.points || 0) + POINTS_PER_TICKET;
    const updatedUser = await usersDB.updatePoints(userId, newPoints);

    return { ticket, newPoints: updatedUser.points };
  },

  // Obtener tickets de un usuario
  getUserTickets: async (userId) => {
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};