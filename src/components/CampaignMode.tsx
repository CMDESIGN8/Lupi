// src/components/CampaignMode.tsx - VERSIÓN SUPERCAMPEONES ANIME
import { useState, useEffect } from 'react';
import { UserCard, Deck } from '../types/cards';
import { CardBattle } from './CardBattle';
import { LEAGUES } from '../data/campaignData';
import { League, BotConfig, CampaignProgress } from '../types/campaign';
import { supabase } from '../lib/supabaseClient';
import { getCardData, calcGroupValue } from '../utils/battleEngine';
import { LEAGUE_STORIES, MatchStory } from '../data/campaignStories';
import { CampaignMatch as CampaignMatchComponent } from './CampaignMatch';

interface CampaignModeProps {
  userCards: UserCard[];
  userDeck: Deck;
  userId: string;
  onBattleComplete: (updatedCards: UserCard[]) => void;
  onNavigateToDeck?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// FUENTE RUSSO ONE
// ─────────────────────────────────────────────────────────────────────────────
const RUSSO = "'Russo One', sans-serif";

if (typeof document !== 'undefined' && !document.getElementById('russo-one-font')) {
  const link = document.createElement('link');
  link.id = 'russo-one-font';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Russo+One&display=swap';
  document.head.appendChild(link);
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function calculateOverall(cards: UserCard[]): number {
  if (!cards.length) return 0;
  const total = cards.reduce((sum, card) => {
    const cardData = getCardData(card);
    return sum + (cardData.overall_rating || 50);
  }, 0);
  return Math.round(total / cards.length);
}

function calculateTeamStats(deckCards: UserCard[]) {
  if (!deckCards || deckCards.length === 0) {
    return { overall: 0, attack: 0, defense: 0, technique: 0, cardsCount: 0 };
  }
  const stats = deckCards.reduce(
    (acc, card) => {
      const cardData = getCardData(card);
      return {
        overall: acc.overall + cardData.overall_rating,
        attack: acc.attack + calcGroupValue(card, 'attack'),
        defense: acc.defense + calcGroupValue(card, 'defense'),
        technique: acc.technique + calcGroupValue(card, 'technique'),
      };
    },
    { overall: 0, attack: 0, defense: 0, technique: 0 }
  );
  const count = deckCards.length;
  return {
    overall: Math.round(stats.overall / count),
    attack: Math.round(stats.attack / count),
    defense: Math.round(stats.defense / count),
    technique: Math.round(stats.technique / count),
    cardsCount: count,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export function CampaignMode({
  userCards,
  userDeck,
  userId,
  onBattleComplete,
  onNavigateToDeck,
}: CampaignModeProps) {
  const [progress, setProgress] = useState<CampaignProgress | null>(null);
  const [isBattleActive, setIsBattleActive] = useState(false);
  const [selectedOpponent, setSelectedOpponent] = useState<BotConfig | null>(null);
  const [showRewards, setShowRewards] = useState(false);
  const [lastReward, setLastReward] = useState<{ type: string; value: string | number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentMatch, setCurrentMatch] = useState<{
    opponent: BotConfig;
    matchNumber: number;
    story: MatchStory;
  } | null>(null);
  const [matchProgress, setMatchProgress] = useState<Map<string, boolean>>(new Map());

  useEffect(() => {
    loadCampaignProgress();
    loadMatchProgress();
  }, [userId]);

  async function loadCampaignProgress() {
    setLoading(true);
    const { data } = await supabase
      .from('campaign_progress')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data) {
      setProgress({
        currentLeagueId: data.current_league_id,
        completedLeagueIds: data.completed_league_ids || [],
        starsEarned: data.stars_earned || 0,
        unlockedBadges: data.unlocked_badges || [],
        currentStreak: data.current_streak || 0,
        bestStreak: data.best_streak || 0,
      });
    } else {
      const initialProgress: CampaignProgress = {
        currentLeagueId: 'rookie',
        completedLeagueIds: [],
        starsEarned: 0,
        unlockedBadges: [],
        currentStreak: 0,
        bestStreak: 0,
      };
      setProgress(initialProgress);
      await supabase.from('campaign_progress').insert({
        user_id: userId,
        current_league_id: 'rookie',
        completed_league_ids: [],
        stars_earned: 0,
        unlocked_badges: [],
        current_streak: 0,
        best_streak: 0,
      });
    }
    setLoading(false);
  }

  async function loadMatchProgress() {
    const saved = localStorage.getItem(`campaign_matches_${userId}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setMatchProgress(new Map(parsed));
    }
  }

  async function saveMatchProgress(updated: Map<string, boolean>) {
    localStorage.setItem(`campaign_matches_${userId}`, JSON.stringify(Array.from(updated.entries())));
    setMatchProgress(updated);
  }

  async function saveCampaignProgress(updated: CampaignProgress) {
    await supabase
      .from('campaign_progress')
      .update({
        current_league_id: updated.currentLeagueId,
        completed_league_ids: updated.completedLeagueIds,
        stars_earned: updated.starsEarned,
        unlocked_badges: updated.unlockedBadges,
        current_streak: updated.currentStreak,
        best_streak: updated.bestStreak,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
    setProgress(updated);
  }

  const currentLeague = LEAGUES.find(l => l.id === progress?.currentLeagueId) || LEAGUES[0];
  const completedCount = progress?.completedLeagueIds.length || 0;
  const totalLeagues = LEAGUES.length;
  const overallRating = calculateOverall(userCards);
  const teamStats = calculateTeamStats(userDeck?.cards || []);

  function startMatch(opponent: BotConfig) {
    setSelectedOpponent(opponent);
    setIsBattleActive(true);
  }

  async function completeMatch(leagueId: string, matchIndex: number, won: boolean) {
    if (!won) return;
    const matchKey = `${leagueId}_${matchIndex}`;
    const newProgress = new Map(matchProgress);
    newProgress.set(matchKey, true);
    await saveMatchProgress(newProgress);

    const league = LEAGUES.find(l => l.id === leagueId);
    if (league) {
      const allMatchesCompleted = league.bots.every((_, idx) =>
        newProgress.get(`${leagueId}_${idx}`) === true
      );
      if (allMatchesCompleted && progress && !progress.completedLeagueIds.includes(leagueId)) {
        const newCompleted = [...progress.completedLeagueIds, leagueId];
        const nextLeagueIndex = LEAGUES.findIndex(l => l.id === leagueId) + 1;
        const nextLeague = nextLeagueIndex < LEAGUES.length ? LEAGUES[nextLeagueIndex].id : leagueId;
        const updatedProgress = {
          ...progress,
          completedLeagueIds: newCompleted,
          currentLeagueId: nextLeague,
          starsEarned: progress.starsEarned + 3,
          currentStreak: progress.currentStreak + 1,
          bestStreak: Math.max(progress.bestStreak, progress.currentStreak + 1),
        };
        await saveCampaignProgress(updatedProgress);
        setLastReward({ type: 'league_complete', value: league.rewardXp });
        setShowRewards(true);
        setTimeout(() => setShowRewards(false), 4000);
      }
    }
  }

  function handleBattleComplete(updatedCards: UserCard[]) {
    onBattleComplete(updatedCards);
    setIsBattleActive(false);
    if (selectedOpponent && currentMatch) {
      completeMatch(currentLeague.id, currentMatch.matchNumber - 1, true);
    }
    if (selectedOpponent) {
      setLastReward({ type: 'win', value: selectedOpponent.xpBase });
      setShowRewards(true);
      setTimeout(() => setShowRewards(false), 3000);
    }
    setSelectedOpponent(null);
    setCurrentMatch(null);
    loadCampaignProgress();
    loadMatchProgress();
  }

  function startMatchWithStory(league: League, matchIndex: number) {
    const opponent = league.bots[matchIndex];
    const stories = LEAGUE_STORIES[league.id as keyof typeof LEAGUE_STORIES];
    const story = stories?.[matchIndex] || {
      id: 'default',
      title: '¡PARTIDO IMPORTANTE!',
      intro: 'Llegó el momento de demostrar quién sos. El rival te espera. ¿Estás listo para la gloria?',
      opponentQuotes: {
        before: '"Que gane el mejor" - Capitán rival',
        after: 'Buen partido. Nos vemos en la revancha.',
      },
      cinematics: {},
      rivalSpecial: 'Juegan en equipo. Necesitás estar concentrado.',
      rewardMessage: '¡Gran victoria! Seguí así.',
    };
    setCurrentMatch({ opponent, matchNumber: matchIndex + 1, story });
  }

  // ── LOADING ──────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={s.loadingScreen}>
        <style>{keyframesAnime}</style>
        <div style={s.spinner} />
        <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: 16, fontFamily: RUSSO }}>
          Cargando tu aventura...
        </p>
      </div>
    );
  }

  // ── BATALLA ACTIVA ───────────────────────────────────────────
  if (isBattleActive && selectedOpponent) {
    const difficultyToLevel: Record<string, number> = { easy: 1, medium: 2, hard: 3 };
    const difficultyToColor: Record<string, string> = {
      easy: '#4ade80',
      medium: '#ffd700',
      hard: '#ff6b6b',
    };
    const forcedOpponent = {
      name: selectedOpponent.name,
      overall_rating: selectedOpponent.overall,
      category: selectedOpponent.difficulty,
      level: selectedOpponent.level ?? difficultyToLevel[selectedOpponent.difficulty],
      avatar: selectedOpponent.avatar,
      color: selectedOpponent.color ?? difficultyToColor[selectedOpponent.difficulty],
      xpBase: selectedOpponent.xpBase,
      reqWins: 0,
    };
    return (
      <CardBattle
        userCards={userCards}
        userDeck={userDeck}
        userId={userId}
        onBattleComplete={handleBattleComplete}
        onNavigateToDeck={onNavigateToDeck}
        forcedOpponent={forcedOpponent}
        isCampaignMode={true}
        onCampaignMatchComplete={(won, _bot) => {
          if (currentMatch) {
            completeMatch(currentLeague.id, currentMatch.matchNumber - 1, won);
          }
        }}
      />
    );
  }

  // ── PANTALLA DE HISTORIA / MATCH ─────────────────────────────
  if (currentMatch) {
    return (
      <CampaignMatchComponent
        opponent={currentMatch.opponent}
        matchNumber={currentMatch.matchNumber}
        totalMatches={3}
        leagueName={currentLeague.name}
        leagueIcon={currentLeague.icon}
        story={currentMatch.story}
        onStartMatch={() => startMatch(currentMatch.opponent)}
        onBack={() => setCurrentMatch(null)}
        userTeamStats={teamStats}
        userTeamName="MI EQUIPO"
        userAvatar="⚡"
      />
    );
  }

  // ── PANTALLA PRINCIPAL ESTILO ANIME ─────────────────────────
  return (
    <div style={s.container}>
      <style>{keyframesAnime}</style>

      {/* HEADER CON EFECTO FUEGO */}
      <div style={s.header}>
        <div style={s.titleGroup}>
          <div style={s.fireIcon}>⚡🔥⚡</div>
          <div>
            <h1 style={s.mainTitle}>¡MODO HISTORIA!</h1>
            <p style={s.mainSub}>⚽ El camino hacia la gloria ⚽</p>
          </div>
        </div>
        <div style={s.statsRow}>
          <div style={s.statBubbleAnime}>
            <span style={s.statIcon}>⭐</span>
            <span style={s.statValue}>{progress?.starsEarned || 0}</span>
            <span style={s.statLabel}>Poder Estrella</span>
          </div>
          <div style={s.statBubbleAnime}>
            <span style={s.statIcon}>🔥</span>
            <span style={s.statValue}>{progress?.currentStreak || 0}</span>
            <span style={s.statLabel}>Racha de Fuego</span>
          </div>
        </div>
      </div>

      {/* BARRA DE PODER GLOBAL */}
      <div style={s.powerBarContainer}>
        <div style={s.powerBarLabel}>
          <span>🏆 PODER DE CAMPEÓN</span>
          <span>{completedCount} / {totalLeagues} Ligas</span>
        </div>
        <div style={s.powerBarTrack}>
          <div style={{ ...s.powerBarFill, width: `${(completedCount / totalLeagues) * 100}%` }} />
          <div style={s.powerBarSpark} />
        </div>
      </div>

      {/* GUÍA DEL GUERRERO (CÓMO JUGAR) */}
      <div style={s.mangaGuide}>
        <div style={s.sectionTitleAnime}>📖 GUÍA DEL GUERRERO ⚔️</div>
        <div style={s.stepsRowAnime}>
          {[
            { step: '1', icon: '🎮', text: 'ELEGIR PARTIDO', desc: 'Toca el balón en llamas' },
            { step: '2', icon: '⚽', text: '¡GANAR!', desc: 'Derrota al rival con tu equipo' },
            { step: '3', icon: '🌟', text: 'CONSEGUIR ESTRELLAS', desc: 'Cada victoria te da poder' },
            { step: '4', icon: '🏆', text: '¡CAMPEÓN!', desc: 'Gana la liga y desbloquea la siguiente' },
          ].map((step, i, arr) => (
            <div key={step.step} style={s.stepCardAnime}>
              <div style={s.stepBadge}>{step.step}</div>
              <div style={s.stepIconAnime}>{step.icon}</div>
              <div style={s.stepTextAnime}>{step.text}</div>
              <div style={s.stepDescAnime}>{step.desc}</div>
              {i < arr.length - 1 && <div style={s.stepConnectorAnime}>⚡</div>}
            </div>
          ))}
        </div>
      </div>

      {/* MAPA DE LIGAS ESTILO VIDEOJUEGO */}
      <div style={s.worldMap}>
        {LEAGUES.map((league, idx) => {
          const isCompleted = progress?.completedLeagueIds.includes(league.id);
          const isCurrent = progress?.currentLeagueId === league.id;
          const isLocked = !isCompleted && !isCurrent && idx > (progress?.completedLeagueIds.length || 0);
          const meetsRequirement = overallRating >= league.requiredOverall;
          
          let cardStyle = { ...s.leagueCardAnime };
          if (isCompleted) cardStyle = { ...cardStyle, ...s.leagueCompletedAnime };
          if (isCurrent) cardStyle = { ...cardStyle, ...s.leagueCurrentAnime };
          if (isLocked) cardStyle = { ...cardStyle, ...s.leagueLockedAnime };
          
          return (
            <div key={league.id} style={s.leagueNode}>
              {idx > 0 && <div style={s.pathConnector} />}
              <div style={cardStyle}>
                <div style={s.leagueHeaderAnime}>
                  <div style={s.leagueIconAnime}>{league.icon}</div>
                  <div style={s.leagueNameAnime}>{league.name}</div>
                  {isCurrent && <div style={s.currentFlagAnime}>⚡ EN CURSO ⚡</div>}
                  {isCompleted && <div style={s.completedFlagAnime}>🏆 VENCIDA 🏆</div>}
                </div>
                
                <div style={s.leagueReqsAnime}>
                  {meetsRequirement ? (
                    <div style={s.reqMetAnime}>✅ REQUISITO OVR {league.requiredOverall} ✅</div>
                  ) : (
                    <div style={s.reqMissingAnime}>🔒 NECESITAS OVR {league.requiredOverall} 🔒</div>
                  )}
                </div>
                
                <div style={s.rewardsAnime}>
                  <div style={s.rewardChipAnime}>✨ +{league.rewardXp} EXPERIENCIA</div>
                  <div style={s.rewardChipAnime}>🪙 +{league.rewardPoints} PUNTOS</div>
                  {league.rewardTitle && <div style={s.rewardChipAnimeSpecial}>🏷️ {league.rewardTitle}</div>}
                </div>

                {/* SOLO SI ES LA LIGA ACTIVA: MOSTRAR PARTIDOS */}
                {isCurrent && (
                  <div style={s.matchesListAnime}>
                    <div style={s.matchesHeaderAnime}>
                      <span>⚔️ COMBATES DE LA LIGA ⚔️</span>
                      <span style={s.matchesHint}>¡Gana los 3 para el título!</span>
                    </div>
                    {league.bots.map((bot, matchIdx) => {
                      const isMatchCompleted = matchProgress.get(`${league.id}_${matchIdx}`) === true;
                      const previousCompleted = matchIdx === 0 ? true : matchProgress.get(`${league.id}_${matchIdx-1}`) === true;
                      const isUnlocked = previousCompleted || isMatchCompleted;
                      const isCurrentMatch = !isMatchCompleted && isUnlocked;
                      
                      let matchCardStyle = { ...s.matchCardAnime };
                      if (isCurrentMatch) matchCardStyle = { ...matchCardStyle, ...s.matchCurrentAnime };
                      if (isMatchCompleted) matchCardStyle = { ...matchCardStyle, ...s.matchCompletedAnime };
                      
                      const difficultyIcon = bot.difficulty === 'easy' ? '⭐' : bot.difficulty === 'medium' ? '⚡' : '🔥';
                      const difficultyName = bot.difficulty === 'easy' ? 'PRINCIPIANTE' : bot.difficulty === 'medium' ? 'DESAFÍO' : 'LEYENDA';
                      const difficultyColor = bot.difficulty === 'easy' ? '#4ade80' : bot.difficulty === 'medium' ? '#fbbf24' : '#ff4444';
                      
                      return (
                        <div key={matchIdx} style={matchCardStyle}>
                          <div style={s.matchNumberAnime}>{isMatchCompleted ? '🏆' : matchIdx+1}</div>
                          <div style={s.matchInfoAnime}>
                            <div style={s.opponentAnime}>
                              <span style={s.avatarAnime}>{bot.avatar}</span>
                              <div>
                                <div style={s.opponentNameAnime}>{bot.name}</div>
                                <div style={{...s.difficultyAnime, color: difficultyColor}}>{difficultyIcon} {difficultyName}</div>
                              </div>
                            </div>
                            <div style={s.rewardXpAnime}>+{bot.xpBase} XP</div>
                          </div>
                          {isCurrentMatch && !isMatchCompleted && (
                            <button style={s.playButtonAnime} onClick={() => startMatchWithStory(league, matchIdx)}>
                              ⚽ JUGAR ⚽
                            </button>
                          )}
                          {isMatchCompleted && <div style={s.victoryMarkAnime}>✨ VICTORIA ✨</div>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* REWARD POPUP ESTILO MANGA */}
      {showRewards && lastReward && (
        <div style={s.rewardPopupAnime}>
          <div style={s.rewardContentAnime}>
            <div style={s.rewardExplosionAnime}>💥</div>
            <div style={s.rewardTextAnime}>
              {lastReward.type === 'league_complete' ? '🏆 ¡LIGA CONQUISTADA! 🏆' : '🎉 ¡PARTIDAZO! 🎉'}
              <div style={s.rewardAmountAnime}>+{lastReward.value} {lastReward.type === 'league_complete' ? 'XP EXTRA' : 'XP'}</div>
            </div>
            <div style={s.rewardGlintAnime}>✨</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// KEYFRAMES ANIME
// ─────────────────────────────────────────────────────────────────────────────
const keyframesAnime = `
  @keyframes animePulse {
    0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.7); }
    70% { transform: scale(1.02); box-shadow: 0 0 0 10px rgba(255, 215, 0, 0); }
    100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
  }
  @keyframes fireText {
    0% { text-shadow: 0 0 2px #ff9900, 0 0 4px #ff5500; }
    100% { text-shadow: 0 0 8px #ff5500, 0 0 16px #ff0000; }
  }
  @keyframes sparkMove {
    0% { left: 0%; opacity: 1; }
    100% { left: 100%; opacity: 0; }
  }
  @keyframes floatReward {
    0% { transform: translateY(0px) scale(1); opacity: 0; }
    20% { transform: translateY(-20px) scale(1.2); opacity: 1; }
    80% { transform: translateY(-10px) scale(1); opacity: 1; }
    100% { transform: translateY(20px) scale(0.8); opacity: 0; }
  }
  @keyframes cmSpin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// ─────────────────────────────────────────────────────────────────────────────
// ESTILOS ANIME
// ─────────────────────────────────────────────────────────────────────────────
const s: Record<string, React.CSSProperties> = {
  // LOADING
  loadingScreen: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
    textAlign: 'center',
  },
  spinner: {
    width: 50,
    height: 50,
    border: '4px solid rgba(255,215,0,0.2)',
    borderTopColor: '#ffd700',
    borderRadius: '50%',
    animation: 'cmSpin 1s linear infinite',
  },

  // CONTENEDOR PRINCIPAL
  container: {
    background: 'radial-gradient(circle at 10% 20%, #0a0f2a, #03050b)',
    borderRadius: 48,
    padding: '24px 20px',
    border: '3px solid #ffd700',
    boxShadow: '0 20px 40px rgba(0,0,0,0.6), inset 0 1px 2px rgba(255,255,255,0.1)',
    fontFamily: RUSSO,
    color: '#fff',
  },
  
  // HEADER
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  titleGroup: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: 12 
  },
  fireIcon: { 
    fontSize: 36, 
    animation: 'fireText 1s infinite alternate' 
  },
  mainTitle: {
    fontSize: 32,
    margin: 0,
    background: 'linear-gradient(135deg, #ffd700, #ff6600)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    textShadow: '0 2px 5px rgba(0,0,0,0.3)',
  },
  mainSub: { 
    fontSize: 12, 
    color: '#ffcc88', 
    margin: 0 
  },
  statsRow: { 
    display: 'flex', 
    gap: 12 
  },
  statBubbleAnime: {
    background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(8px)',
    borderRadius: 50,
    padding: '6px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    border: '1px solid #ffd700',
    boxShadow: '0 0 8px rgba(255,215,0,0.3)',
  },
  statIcon: { 
    fontSize: 24 
  },
  statValue: { 
    fontSize: 28, 
    fontWeight: 'bold', 
    color: '#ffd700' 
  },
  statLabel: { 
    fontSize: 10, 
    color: '#ffcc88' 
  },
  
  // BARRA DE PODER
  powerBarContainer: { 
    marginBottom: 24 
  },
  powerBarLabel: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    fontSize: 12, 
    marginBottom: 6, 
    color: '#ffd700' 
  },
  powerBarTrack: { 
    height: 16, 
    background: '#222', 
    borderRadius: 20, 
    overflow: 'hidden', 
    position: 'relative', 
    border: '1px solid gold' 
  },
  powerBarFill: { 
    height: '100%', 
    background: 'linear-gradient(90deg, #ffaa00, #ff4400)', 
    width: '0%', 
    transition: 'width 0.5s' 
  },
  powerBarSpark: { 
    position: 'absolute', 
    top: 0, 
    width: 20, 
    height: '100%', 
    background: 'white', 
    opacity: 0.6, 
    filter: 'blur(4px)', 
    animation: 'sparkMove 2s infinite' 
  },
  
  // GUÍA MANGA
  mangaGuide: { 
    background: 'rgba(0,0,0,0.5)', 
    borderRadius: 32, 
    padding: 16, 
    marginBottom: 28, 
    border: '1px dashed #ffd700' 
  },
  sectionTitleAnime: { 
    fontSize: 18, 
    textAlign: 'center', 
    marginBottom: 16, 
    color: '#ffd700', 
    letterSpacing: 2 
  },
  stepsRowAnime: { 
    display: 'flex', 
    justifyContent: 'space-around', 
    flexWrap: 'wrap', 
    gap: 12, 
    position: 'relative' 
  },
  stepCardAnime: { 
    background: '#111a22', 
    borderRadius: 24, 
    padding: 12, 
    textAlign: 'center', 
    minWidth: 100, 
    flex: 1, 
    position: 'relative', 
    border: '1px solid #ffd70033' 
  },
  stepBadge: { 
    background: '#ffd700', 
    color: '#000', 
    width: 28, 
    height: 28, 
    borderRadius: '50%', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    margin: '0 auto 8px', 
    fontWeight: 'bold' 
  },
  stepIconAnime: { 
    fontSize: 32 
  },
  stepTextAnime: { 
    fontWeight: 'bold', 
    fontSize: 12, 
    marginTop: 8 
  },
  stepDescAnime: { 
    fontSize: 10, 
    color: '#aaa' 
  },
  stepConnectorAnime: { 
    position: 'absolute', 
    right: -16, 
    top: '40%', 
    fontSize: 16, 
    color: '#ffd700' 
  },
  
  // MAPA MUNDIAL
  worldMap: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: 24 
  },
  leagueNode: { 
    position: 'relative' 
  },
  pathConnector: { 
    width: 2, 
    height: 30, 
    background: '#ffd700', 
    margin: '0 auto', 
    boxShadow: '0 0 4px gold' 
  },
  leagueCardAnime: { 
    background: 'linear-gradient(145deg, #16212e, #0a1118)', 
    borderRadius: 32, 
    padding: 20, 
    border: '2px solid #2a3a48', 
    transition: 'all 0.2s' 
  },
  leagueCompletedAnime: { 
    borderColor: '#4ade80', 
    background: 'linear-gradient(145deg, #1a2e24, #0a1810)' 
  },
  leagueCurrentAnime: { 
    borderColor: '#ffd700', 
    boxShadow: '0 0 30px rgba(255,215,0,0.4)', 
    animation: 'animePulse 2s infinite' 
  },
  leagueLockedAnime: { 
    opacity: 0.5, 
    filter: 'grayscale(0.5)' 
  },
  leagueHeaderAnime: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: 16, 
    flexWrap: 'wrap', 
    marginBottom: 16 
  },
  leagueIconAnime: { 
    fontSize: 48 
  },
  leagueNameAnime: { 
    fontSize: 24, 
    fontWeight: 'bold' 
  },
  currentFlagAnime: { 
    background: '#ffd700', 
    color: '#000', 
    padding: '4px 12px', 
    borderRadius: 40, 
    fontSize: 10, 
    fontWeight: 'bold' 
  },
  completedFlagAnime: { 
    background: '#4ade80', 
    color: '#000', 
    padding: '4px 12px', 
    borderRadius: 40, 
    fontSize: 10, 
    fontWeight: 'bold' 
  },
  leagueReqsAnime: { 
    marginBottom: 12 
  },
  reqMetAnime: { 
    color: '#4ade80', 
    background: '#4ade8010', 
    padding: '4px 12px', 
    borderRadius: 20, 
    display: 'inline-block', 
    fontSize: 12 
  },
  reqMissingAnime: { 
    color: '#ff8888', 
    background: '#ff888810', 
    padding: '4px 12px', 
    borderRadius: 20, 
    display: 'inline-block', 
    fontSize: 12 
  },
  rewardsAnime: { 
    display: 'flex', 
    gap: 8, 
    flexWrap: 'wrap', 
    marginBottom: 20 
  },
  rewardChipAnime: { 
    background: '#00000050', 
    padding: '4px 12px', 
    borderRadius: 20, 
    fontSize: 11 
  },
  rewardChipAnimeSpecial: { 
    background: '#ffd70020', 
    border: '1px solid gold', 
    color: '#ffd700' 
  },
  
  // LISTA DE PARTIDOS
  matchesListAnime: { 
    marginTop: 16, 
    borderTop: '1px solid #ffd70030', 
    paddingTop: 16 
  },
  matchesHeaderAnime: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    fontSize: 12, 
    marginBottom: 12, 
    color: '#ffd700' 
  },
  matchesHint: { 
    fontSize: 10, 
    color: '#aaa' 
  },
  matchCardAnime: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: 12, 
    background: '#00000040', 
    borderRadius: 24, 
    padding: 12, 
    marginBottom: 12, 
    transition: 'all 0.2s' 
  },
  matchCurrentAnime: { 
    background: '#ffd70010', 
    border: '1px solid #ffd700', 
    boxShadow: '0 0 12px gold' 
  },
  matchCompletedAnime: { 
    opacity: 0.7 
  },
  matchNumberAnime: { 
    width: 40, 
    height: 40, 
    background: '#ffd70020', 
    borderRadius: '50%', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    fontWeight: 'bold' 
  },
  matchInfoAnime: { 
    flex: 1, 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center' 
  },
  opponentAnime: { 
    display: 'flex', 
    alignItems: 'center', 
    gap: 12 
  },
  avatarAnime: { 
    fontSize: 32 
  },
  opponentNameAnime: { 
    fontWeight: 'bold' 
  },
  difficultyAnime: { 
    fontSize: 10 
  },
  rewardXpAnime: { 
    color: '#ffd700', 
    fontSize: 12, 
    fontWeight: 'bold' 
  },
  playButtonAnime: { 
    background: 'linear-gradient(135deg, #ffaa00, #ff4400)', 
    border: 'none', 
    padding: '8px 24px', 
    borderRadius: 40, 
    fontWeight: 'bold', 
    color: 'white', 
    fontFamily: RUSSO, 
    cursor: 'pointer', 
    boxShadow: '0 4px 0 #882200', 
    transform: 'translateY(-2px)', 
    transition: '0.1s' 
  },
  victoryMarkAnime: { 
    fontSize: 12, 
    color: '#4ade80', 
    fontWeight: 'bold' 
  },
  
  // REWARD POPUP
  rewardPopupAnime: { 
    position: 'fixed', 
    bottom: '25%', 
    left: '50%', 
    transform: 'translateX(-50%)', 
    zIndex: 2000, 
    pointerEvents: 'none' 
  },
  rewardContentAnime: { 
    background: '#000000cc', 
    backdropFilter: 'blur(12px)', 
    border: '3px solid #ffd700', 
    borderRadius: 80, 
    padding: '16px 32px', 
    display: 'flex', 
    alignItems: 'center', 
    gap: 20, 
    animation: 'floatReward 2s ease-out forwards' 
  },
  rewardExplosionAnime: { 
    fontSize: 40 
  },
  rewardTextAnime: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    textAlign: 'center' 
  },
  rewardAmountAnime: { 
    fontSize: 28, 
    color: '#ffd700' 
  },
  rewardGlintAnime: { 
    fontSize: 32 
  },
};