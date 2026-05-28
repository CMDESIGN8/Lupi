// hooks/useActiveEvents.ts
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface EventData {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  reward_points: number;
  icon?: string;
}

export function useActiveEvents() {
  // ✅ Corregido: Tipar correctamente como EventData[]
  const [events, setEvents] = useState<EventData[]>([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const now = new Date().toISOString();
        
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .lte('start_date', now)
          .gte('end_date', now)
          .eq('is_active', true)
          .order('start_date', { ascending: true });

        if (error) {
          // Si la tabla no existe, solo loguear error y continuar
          console.warn('Events table not available yet:', error.message);
          setEvents([]);
          setCount(0);
        } else {
          setEvents(data || []);
          setCount(data?.length || 0);
        }
      } catch (err) {
        console.warn('Error fetching events:', err);
        setEvents([]);
        setCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  return { events, count, loading };
}