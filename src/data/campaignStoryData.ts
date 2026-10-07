// src/data/campaignStoryData.ts
import { CampaignDay, StoryChapter } from '../types/campaignStory';

export const CLUB_STORY: CampaignDay[] = [
  {
    day: 1,
    title: "🌅 EL COMIENZO DE UNA LEYENDA",
    storyChapters: [
      {
        id: 'chap_1_1',
        title: 'El Sueño del Barrio',
        description: 'Todo empezó en el potrero del barrio. Don José, el fundador del club, solía decir que este equipo nació de un sueño y mucha pelota.',
        order: 1,
        requiredDay: 1,
        isUnlocked: true,
        cinematics: {
          background: '🏘️',
          characterDialogues: [
            {
              character: 'Don José',
              avatar: '👴',
              text: '¡Mira este potrero! Un día de acá va a salir un crack... y ese vas a ser vos.',
              emotion: 'happy'
            },
            {
              character: 'Tú',
              avatar: '⚡',
              text: 'Voy a dar todo por esta camiseta, Don José. Se lo prometo.',
              emotion: 'determined'
            }
          ]
        }
      }
    ],
    dailyMissions: [
  {
    id: 'mission_day1_1',
    title: '⚽ EL DEBUT',
    description: 'Juega tu primer partido en la campaña',
    icon: '⚽',
    type: 'play_match',
    requirement: 1,
    currentProgress: 0,
    reward: {
      xp: 50,
      coins: 100
    },
    isCompleted: false,
    isClaimed: false
  },

  {
    id: 'mission_day1_2',
    title: '💬 CONOCÉ AL BARRIO',
    description: 'Enviá 2 mensajes en el lobby',
    icon: '💬',
    type: 'chat',
    requirement: 2,
    currentProgress: 0,
    reward: { xp: 40, points: 75 },
    isCompleted: false,
    isClaimed: false
  },

  {
    id: 'mission_day1_3',
    title: '⚔️ BUSCÁ UN RIVAL',
    description: 'Desafiá a otro jugador del lobby',
    icon: '⚔️',
    type: 'challenge',
    requirement: 1,
    currentProgress: 0,
    reward: { xp: 50, points: 100 },
    isCompleted: false,
    isClaimed: false
  },

  {
    id: 'mission_day1_4',
    title: '📸 COMPARTÍ EL SUEÑO',
    description: 'Comparte tu progreso en redes sociales',
    icon: '📱',
    type: 'social_share',
    requirement: 1,
    currentProgress: 0,
    reward: { xp: 30, points: 50 },
    isCompleted: false,
    isClaimed: false,
    storyTrigger: 'first_share'
  }
],
    requiredMatches: [], // Se llenarán con los bots de rookie
    isCompleted: false,
    canAdvance: false
  },
  {
    day: 2,
    title: "🏟️ EL PRIMER PARTIDO OFICIAL",
    storyChapters: [
      {
        id: 'chap_2_1',
        title: 'La Camiseta que Cambió Todo',
        description: 'El día que recibiste la camiseta titular, sentiste que el destino te llamaba.',
        order: 1,
        requiredDay: 2,
        isUnlocked: false,
        cinematics: {
          background: '🏟️',
          characterDialogues: [
            {
              character: 'Entrenador',
              avatar: '🧢',
              text: 'Hoy debutás como titular. El pueblo confía en vos. No los defraudes.',
              emotion: 'determined'
            }
          ]
        }
      }
    ],
    dailyMissions: [
      {
        id: 'mission_day2_1',
        title: '🎁 SOBRE MISTERIOSO',
        description: 'Abre un sobre del club (tienes uno gratis hoy)',
        icon: '📦',
        type: 'open_pack',
        requirement: 1,
        currentProgress: 0,
        reward: { xp: 75, coins: 150, itemId: 'mystery_pack' },
        isCompleted: false,
        isClaimed: false
      },
      {
        id: 'mission_day2_2',
        title: '⚔️ PRIMERA VICTORIA',
        description: 'Gana tu primer partido de la campaña',
        icon: '🏆',
        type: 'play_match',
        requirement: 1,
        currentProgress: 0,
        reward: { xp: 100, coins: 200 },
        isCompleted: false,
        isClaimed: false
      }
    ],
    requiredMatches: [],
    isCompleted: false,
    canAdvance: false
  },
  {
    day: 3,
    title: "🌟 LA PRUEBA DEL DRAGÓN",
    storyChapters: [
      {
        id: 'chap_3_1',
        title: 'El Rival Legendario',
        description: 'El Dragon FC, el equipo que nadie pudo vencer en 3 años. Hoy es tu turno.',
        order: 1,
        requiredDay: 3,
        isUnlocked: false,
        cinematics: {
          background: '🐉',
          characterDialogues: [
            {
              character: 'Aficionado',
              avatar: '👥',
              text: '¡Nadie les ha ganado! Pero creemos en vos, ¡dale campeón!',
              emotion: 'happy'
            }
          ]
        }
      }
    ],
    dailyMissions: [
      {
        id: 'mission_day3_1',
        title: '👀 MIRA EL PARTIDO',
        description: 'Mira un anuncio para apoyar al club (ganas energía)',
        icon: '📺',
        type: 'watch_ad',
        requirement: 1,
        currentProgress: 0,
        reward: { xp: 40, coins: 80 },
        isCompleted: false,
        isClaimed: false
      },
      {
        id: 'mission_day3_2',
        title: '⚡ ENTRENAMIENTO ESPECIAL',
        description: 'Completa el minijuego de entrenamiento',
        icon: '💪',
        type: 'complete_training',
        requirement: 1,
        currentProgress: 0,
        reward: { xp: 60, coins: 120 },
        isCompleted: false,
        isClaimed: false
      }
    ],
    requiredMatches: [],
    isCompleted: false,
    canAdvance: false,
    specialEvent: {
      title: '🔥 DESAFÍO DEL DRAGÓN 🔥',
      description: 'Si ganas hoy, desbloquearás una skin especial',
      trigger: 'dragon_event'
    }
  }
];