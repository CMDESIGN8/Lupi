// src/components/AdminPanel.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface TicketToValidate {
  id: string;
  ticket_number: string;
  user_id: string;
  club: string;
  created_at: string;
  username: string;
}

export function AdminPanel() {
  const [pendingTickets, setPendingTickets] = useState<TicketToValidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingTickets();
  }, []);

  const loadPendingTickets = async () => {
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select(`
        *,
        profiles:user_id (username)
      `)
      .eq('status', 'pendiente')
      .order('created_at', { ascending: false });

    if (!error && tickets) {
      const formatted = tickets.map(t => ({
        ...t,
        username: t.profiles?.username || 'Usuario'
      }));
      setPendingTickets(formatted);
    }
    setLoading(false);
  };

  // src/components/AdminPanel.tsx
const validateTicket = async (ticketId: string, isValid: boolean) => {
  const { error } = await supabase.rpc('validate_ticket', {
    p_ticket_id: ticketId,
    p_is_valid: isValid
  });

  if (!error) {
    alert(isValid ? '✅ Entrada validada - Ahora participa en el sorteo' : '❌ Entrada marcada como inválida');
    loadPendingTickets();
  }
};


  if (loading) return <div>Cargando tickets pendientes...</div>;

  return (
    <div className="admin-panel">
      <h2>🎫 Validar Entradas Pendientes</h2>
      {pendingTickets.length === 0 ? (
        <p>✅ No hay entradas pendientes de validación</p>
      ) : (
        pendingTickets.map(ticket => (
          <div key={ticket.id} className="ticket-validation-item">
            <div>
              <strong>#{ticket.ticket_number}</strong>
              <div>Usuario: {ticket.username}</div>
              <div>Club: {ticket.club}</div>
              <div>Fecha: {new Date(ticket.created_at).toLocaleDateString()}</div>
            </div>
            // En el render, mostrar botones:
<div className="validation-buttons">
  <button onClick={() => validateTicket(ticket.id, true)}>
    ✅ Validar para sorteo
  </button>
  <button onClick={() => validateTicket(ticket.id, false)}>
    ❌ Rechazar entrada
  </button>
</div>
          </div>
        ))
      )}
    </div>
  );
}