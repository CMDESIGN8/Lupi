// src/hooks/useProgressiveStory.ts
import { useState, useEffect } from 'react';
import { BotConfig } from '../types/campaign';

interface StoryEvent {
  id: string;
  title: string;
  message: string;
  type: 'unlock_league' | 'special_match' | 'rival_appears' | 'achievement';
  triggered: boolean;
}

export function useProgressiveStory(userId: string) {
  const [unlockedEvents, setUnlockedEvents] = useState<StoryEvent[]>([]);
  const [currentRivalQuote, setCurrentRivalQuote] = useState<string | null>(null);
  const [showStoryNotification, setShowStoryNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');

  const checkStoryProgress = (
    wins: number, 
    currentLeague: string, 
    completedLeagues: string[],
    achievements: string[]
  ) => {
    const newEvents: StoryEvent[] = [];

    // Evento: Primera victoria
    if (wins === 1 && !unlockedEvents.find(e => e.id === 'first_win')) {
      newEvents.push({
        id: 'first_win',
        title: '🎉 ¡PRIMERA VICTORIA! 🎉',
        message: 'El estadio ruge tu nombre. El entrenador te da una palmada en la espalda. "Esto recién empieza, campeón"',
        type: 'achievement',
        triggered: false,
      });
    }

    // Evento: Racha de 3 victorias
    if (wins === 3 && !unlockedEvents.find(e => e.id === 'streak_3')) {
      newEvents.push({
        id: 'streak_3',
        title: '🔥 RACHA DE FUEGO 🔥',
        message: '¡Tres victorias consecutivas! Los diarios empiezan a hablar de ti. "La nueva promesa del fútbol"',
        type: 'achievement',
        triggered: false,
      });
    }

    // Evento: Desbloquear liga de Bronce
    if (completedLeagues.includes('rookie') && !unlockedEvents.find(e => e.id === 'unlock_bronze')) {
      newEvents.push({
        id: 'unlock_bronze',
        title: '🥉 ¡ASCENSO A BRONCE! 🥉',
        message: '¡Felicidades! Has ascendido a la Liga Bronce. Los rivales son más fuertes, pero tú también lo eres.',
        type: 'unlock_league',
        triggered: false,
      });
    }

    // Evento: Rival especial aparece
    if (wins === 5 && !unlockedEvents.find(e => e.id === 'rival_dragon')) {
      newEvents.push({
        id: 'rival_dragon',
        title: '🐉 ¡EL DRAGÓN HA APARECIDO! 🐉',
        message: 'Un nuevo rival acecha en las sombras. El "Dragón Escarlata" quiere probar tu valentía.',
        type: 'rival_appears',
        triggered: false,
      });
    }

    if (newEvents.length > 0) {
      setUnlockedEvents(prev => [...prev, ...newEvents]);
      const lastEvent = newEvents[newEvents.length - 1];
      showNotification(lastEvent.title, lastEvent.message);
    }
  };

  const showNotification = (title: string, message: string) => {
    setNotificationMessage(`${title}\n${message}`);
    setShowStoryNotification(true);
    setTimeout(() => setShowStoryNotification(false), 4000);
  };

  const triggerRivalQuote = (quote: string) => {
    setCurrentRivalQuote(quote);
    setTimeout(() => setCurrentRivalQuote(null), 3000);
  };

  return {
    unlockedEvents,
    currentRivalQuote,
    showStoryNotification,
    notificationMessage,
    checkStoryProgress,
    triggerRivalQuote,
    markEventTriggered: (eventId: string) => {
      setUnlockedEvents(prev => 
        prev.map(e => e.id === eventId ? { ...e, triggered: true } : e)
      );
    },
  };
}