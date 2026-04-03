// src/components/RaffleStatus.tsx
import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export function RaffleStatus() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatus();
    // Actualizar cada 30 segundos
    const interval = setInterval(loadStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const data = await api.getRaffleStatus();
      setStatus(data);
    } catch (error) {
      console.error('Error loading raffle status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Cargando...</div>;

  const daysUntilRaffle = Math.ceil((status.nextRaffle.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="raffle-status" style={{
      background: 'linear-gradient(135deg, var(--surface), var(--surface2))',
      border: '1px solid var(--border)',
      borderRadius: 16,
      padding: 20,
      marginBottom: 20
    }}>
      <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, color: 'var(--accent)' }}>
        🎲 Sorteo Semanal
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>Período</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>
            {status.weekStart.toLocaleDateString()} - {status.weekEnd.toLocaleDateString()}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>Participantes</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>
            {status.totalTickets}
          </div>
        </div>
      </div>
      
      <div style={{
        background: 'rgba(24, 157, 245, 0.1)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16
      }}>
        <div style={{ fontSize: 12, color: 'var(--text2)' }}>Próximo sorteo</div>
        <div style={{ fontSize: 14, fontWeight: 600 }}>
          {status.nextRaffle.toLocaleDateString()} 
          <span style={{ fontSize: 12, color: 'var(--accent)', marginLeft: 8 }}>
            (en {daysUntilRaffle} días)
          </span>
        </div>
      </div>
      
      {status.winners.length > 0 && (
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--success)' }}>
            🏆 GANADORES DE ESTA SEMANA:
          </div>
          {status.winners.map((winner: any, idx: number) => (
            <div key={winner.id} style={{
              background: 'rgba(61, 255, 160, 0.1)',
              borderRadius: 8,
              padding: 8,
              marginBottom: 8,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>#{idx + 1} {winner.profiles?.username}</span>
              <span style={{ fontSize: 12, color: 'var(--success)' }}>
                Ticket: {winner.ticket_number}
              </span>
            </div>
          ))}
        </div>
      )}
      
      <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 12, textAlign: 'center' }}>
        ⏱️ Los tickets se validan automáticamente 5 minutos después de cargarlos
      </div>
    </div>
  );
}