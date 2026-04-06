import { useState, useEffect, useRef, useCallback } from "react";
import { api, AppUser } from "../lib/api";

export interface Achievement {
  id: string;
  emoji: string;
  title: string;
  description: string;
  rarity: "común" | "raro" | "épico";
  rarityColor: string;
  rarityGlow: string;
  check: (ctx: AchievementContext) => boolean;
}

export interface AchievementContext {
  user: AppUser;
  totalTickets: number;
  completedMissions: number;
  rank: number;
  jackpotWon: boolean;
}

const RARITY: Record<string, { color: string; glow: string; bg: string }> = {
  común: { color: "#8888aa", glow: "rgba(136,136,170,0.4)", bg: "rgba(136,136,170,0.08)" },
  raro:  { color: "#189df5", glow: "rgba(24,157,245,0.5)",  bg: "rgba(24,157,245,0.08)"  },
  épico: { color: "#f5c518", glow: "rgba(245,197,24,0.6)",  bg: "rgba(245,197,24,0.08)"  },
};

export const ACHIEVEMENTS: Achievement[] = [
  { id: "first_ticket", emoji: "🎟️", title: "Primera entrada",   description: "Cargaste tu primera entrada",         rarity: "común", rarityColor: RARITY.común.color, rarityGlow: RARITY.común.glow, check: ({ totalTickets }) => totalTickets >= 1 },
  { id: "tickets_10",   emoji: "🎫", title: "Coleccionista",      description: "Cargaste 10 entradas en total",        rarity: "común", rarityColor: RARITY.común.color, rarityGlow: RARITY.común.glow, check: ({ totalTickets }) => totalTickets >= 10 },
  { id: "tickets_30",   emoji: "📦", title: "De la cancha",       description: "Cargaste 30 entradas en total",        rarity: "raro",  rarityColor: RARITY.raro.color,  rarityGlow: RARITY.raro.glow,  check: ({ totalTickets }) => totalTickets >= 30 },
  { id: "points_100",   emoji: "🌟", title: "Centenario",         description: "Acumulaste 100 puntos",                rarity: "común", rarityColor: RARITY.común.color, rarityGlow: RARITY.común.glow, check: ({ user }) => user.points >= 100 },
  { id: "points_300",   emoji: "💫", title: "Imparable",          description: "Acumulaste 300 puntos",                rarity: "raro",  rarityColor: RARITY.raro.color,  rarityGlow: RARITY.raro.glow,  check: ({ user }) => user.points >= 300 },
  { id: "points_500",   emoji: "💎", title: "Élite",              description: "Acumulaste 500 puntos",                rarity: "épico", rarityColor: RARITY.épico.color, rarityGlow: RARITY.épico.glow, check: ({ user }) => user.points >= 500 },
  { id: "streak_3",     emoji: "🔥", title: "En racha",           description: "Racha de 3 semanas consecutivas",      rarity: "común", rarityColor: RARITY.común.color, rarityGlow: RARITY.común.glow, check: ({ user }) => (user.best_streak ?? 0) >= 3 },
  { id: "streak_5",     emoji: "⚡", title: "Encendido",          description: "Racha de 5 semanas consecutivas",      rarity: "raro",  rarityColor: RARITY.raro.color,  rarityGlow: RARITY.raro.glow,  check: ({ user }) => (user.best_streak ?? 0) >= 5 },
  { id: "streak_10",    emoji: "🏆", title: "Leyenda",            description: "Racha de 10 semanas consecutivas",     rarity: "épico", rarityColor: RARITY.épico.color, rarityGlow: RARITY.épico.glow, check: ({ user }) => (user.best_streak ?? 0) >= 10 },
  { id: "top5",         emoji: "🥇", title: "Top 5",              description: "Llegaste al Top 5 del ranking",        rarity: "raro",  rarityColor: RARITY.raro.color,  rarityGlow: RARITY.raro.glow,  check: ({ rank }) => rank > 0 && rank <= 5 },
  { id: "rank_1",       emoji: "👑", title: "Rey del ranking",    description: "Llegaste al puesto #1",                rarity: "épico", rarityColor: RARITY.épico.color, rarityGlow: RARITY.épico.glow, check: ({ rank }) => rank === 1 },
  { id: "referral_1",   emoji: "🤝", title: "Buen compañero",     description: "Invitaste a tu primer amigo",          rarity: "común", rarityColor: RARITY.común.color, rarityGlow: RARITY.común.glow, check: ({ user }) => (user.referral_count ?? 0) >= 1 },
  { id: "referral_3",   emoji: "🌐", title: "Embajador",          description: "Invitaste a 3 amigos",                 rarity: "raro",  rarityColor: RARITY.raro.color,  rarityGlow: RARITY.raro.glow,  check: ({ user }) => (user.referral_count ?? 0) >= 3 },
  { id: "missions_5",   emoji: "🎯", title: "Comprometido",       description: "Completaste 5 misiones semanales",     rarity: "común", rarityColor: RARITY.común.color, rarityGlow: RARITY.común.glow, check: ({ completedMissions }) => completedMissions >= 5 },
  { id: "missions_20",  emoji: "🏅", title: "Veterano",           description: "Completaste 20 misiones semanales",    rarity: "raro",  rarityColor: RARITY.raro.color,  rarityGlow: RARITY.raro.glow,  check: ({ completedMissions }) => completedMissions >= 20 },
  { id: "jackpot",      emoji: "🎰", title: "Suertudo",           description: "Sacaste el jackpot en la ruleta",      rarity: "épico", rarityColor: RARITY.épico.color, rarityGlow: RARITY.épico.glow, check: ({ jackpotWon }) => jackpotWon },
];

const TOAST_CSS = `
@keyframes ach-toast-in {
  from { transform: translate(-50%, 20px) scale(0.9); opacity: 0; }
  to   { transform: translate(-50%, 0) scale(1); opacity: 1; }
}
@keyframes ach-toast-out {
  to { transform: translate(-50%, -10px) scale(0.95); opacity: 0; }
}
.ach-toast {
  position: fixed; bottom: 90px; left: 50%;
  transform: translateX(-50%); z-index: 5000;
  background: #12121a; border-radius: 20px;
  padding: 14px 20px; display: flex; align-items: center; gap: 14px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  min-width: 280px; max-width: 90vw;
  animation: ach-toast-in 0.45s cubic-bezier(0.34,1.56,0.64,1);
}
.ach-toast.hide { animation: ach-toast-out 0.3s ease forwards; }
.ach-toast-icon {
  width: 48px; height: 48px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  font-size: 26px; flex-shrink: 0;
}
.ach-toast-sup { font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 2px; }
.ach-toast-title { font-family: var(--font-display, 'Bebas Neue', sans-serif); font-size: 18px; letter-spacing: 0.5px; color: #f0f0f8; margin-bottom: 1px; }
.ach-toast-desc { font-size: 12px; color: #8888aa; }
`;

export function AchievementToast({ achievement, onHide }: { achievement: Achievement; onHide: () => void }) {
  const [hiding, setHiding] = useState(false);
  const r = RARITY[achievement.rarity];

  useEffect(() => {
    const t1 = setTimeout(() => setHiding(true), 3800);
    const t2 = setTimeout(() => onHide(), 4200);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [onHide]);

  return (
    <>
      <style>{TOAST_CSS}</style>
      <div
        className={`ach-toast${hiding ? " hide" : ""}`}
        style={{ border: `1px solid ${r.color}44`, boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 24px ${r.glow}` }}
      >
        <div className="ach-toast-icon" style={{ background: r.bg, boxShadow: `0 0 16px ${r.glow}` }}>
          {achievement.emoji}
        </div>
        <div>
          <div className="ach-toast-sup" style={{ color: r.color }}>
            🏅 Logro desbloqueado · {achievement.rarity}
          </div>
          <div className="ach-toast-title">{achievement.title}</div>
          <div className="ach-toast-desc">{achievement.description}</div>
        </div>
      </div>
    </>
  );
}

// Add this component to Achievements.tsx
export function Achievements({ userId, user, rank }: { 
  userId: string; 
  user: AppUser;
  rank: number;
}) {
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAchievements = async () => {
      try {
        const unlocked = await api.getUnlockedAchievements(userId);
        setUnlockedAchievements(unlocked);
      } catch (error) {
        console.error('Error loading achievements:', error);
      } finally {
        setLoading(false);
      }
    };
    loadAchievements();
  }, [userId]);

  const earnedAchievements = ACHIEVEMENTS.filter(ach => 
    unlockedAchievements.includes(ach.id)
  );

  const totalAchievements = ACHIEVEMENTS.length;
  const progress = (earnedAchievements.length / totalAchievements) * 100;

  if (loading) {
    return (
      <div className="fade-up" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 20 }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner" style={{ margin: "0 auto", borderTopColor: "var(--accent)", borderColor: "var(--border)" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="fade-up" style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 20, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 20, letterSpacing: 1 }}>
          🏅 Logros
        </div>
        <div style={{ fontSize: 12, color: "var(--text2)" }}>
          {earnedAchievements.length}/{totalAchievements}
        </div>
      </div>
      
      {/* Progress bar */}
      <div style={{ 
        background: "rgba(255,255,255,0.1)", 
        borderRadius: 8, 
        height: 6, 
        marginBottom: 16,
        overflow: "hidden"
      }}>
        <div style={{ 
          width: `${progress}%`, 
          height: "100%", 
          background: "var(--accent)",
          transition: "width 0.3s ease"
        }} />
      </div>

      {/* Achievements grid */}
      <div style={{ display: "grid", gap: 12 }}>
        {ACHIEVEMENTS.map((ach) => {
          const isUnlocked = unlockedAchievements.includes(ach.id);
          const rarityInfo = RARITY[ach.rarity];
          
          return (
            <div
              key={ach.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 12,
                background: isUnlocked ? rarityInfo.bg : "rgba(255,255,255,0.03)",
                borderRadius: 12,
                opacity: isUnlocked ? 1 : 0.5,
                border: `1px solid ${isUnlocked ? rarityInfo.color + "44" : "var(--border)"}`,
                transition: "all 0.2s ease"
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background: isUnlocked ? rarityInfo.bg : "rgba(255,255,255,0.05)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 24,
                  filter: isUnlocked ? "none" : "grayscale(0.5)"
                }}
              >
                {ach.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ 
                  fontWeight: 700, 
                  fontSize: 14, 
                  color: isUnlocked ? rarityInfo.color : "var(--text2)",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 4
                }}>
                  {ach.title}
                  {isUnlocked && <span style={{ fontSize: 11 }}>✅</span>}
                </div>
                <div style={{ fontSize: 11, color: "var(--text2)" }}>
                  {ach.description}
                </div>
                {!isUnlocked && (
                  <div style={{ 
                    fontSize: 10, 
                    color: "var(--text2)", 
                    marginTop: 4,
                    display: "flex",
                    alignItems: "center",
                    gap: 4
                  }}>
                    <span>🔒</span> Bloqueado
                  </div>
                )}
              </div>
              <div style={{ 
                fontSize: 11, 
                color: rarityInfo.color,
                fontWeight: 600,
                textTransform: "uppercase"
              }}>
                {ach.rarity}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function useAchievements(user: AppUser) {
  const processingRef = useRef<Set<string>>(new Set());
  const [toastQueue, setToastQueue] = useState<Achievement[]>([]);

  const checkAndUnlock = useCallback(async (ctx: AchievementContext) => {
    const unlocked = await api.getUnlockedAchievements(user.id);
    const unlockedSet = new Set(unlocked);

    for (const ach of ACHIEVEMENTS) {
      if (unlockedSet.has(ach.id)) continue;
      if (processingRef.current.has(ach.id)) continue;
      if (!ach.check(ctx)) continue;

      processingRef.current.add(ach.id);
      const result = await api.unlockAchievement(user.id, ach.id);
      if (result.success) {
        setToastQueue((q) => [...q, ach]);
      }
      processingRef.current.delete(ach.id);
    }
  }, [user.id]);

  return { checkAndUnlock, toastQueue, setToastQueue };
}