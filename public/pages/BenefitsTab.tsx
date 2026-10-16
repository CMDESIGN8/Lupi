// src/pages/BenefitsTab.tsx
import { useEffect, useState } from "react";
import { AppUser} from "../lib/api";
import { supabase } from '../lib//supabaseClient';
import { useToastContext } from "../components/ToastProvider";


type Benefit = {
  id: string;
  title: string;
  description: string;
  cost: number;
  icon: string;
  available: boolean;
};

const FALLBACK_BENEFITS: Benefit[] = [
  { id: "pack", title: "Pack Extra", description: "Un sobre con 3 cartas random", cost: 100, icon: "🎁", available: true },
  { id: "streak", title: "Escudo de Racha", description: "Protege tu racha por 1 día", cost: 150, icon: "🛡️", available: true },
  { id: "xp", title: "Boost de XP", description: "+50 XP instantáneos", cost: 200, icon: "⚡", available: true },
  { id: "deck", title: "Slot de Mazo", description: "Desbloquea un mazo adicional", cost: 500, icon: "👕", available: false },
  { id: "cosmetic", title: "Skin de Carta", description: "Personalizá una carta", cost: 300, icon: "🎨", available: false },
  { id: "jackpot", title: "Entrada Dorada", description: "Doble chances en el sorteo semanal", cost: 400, icon: "🎟️", available: false },
];

export function BenefitsTab({
  user,
  onPointsUpdate,
}: {
  user: AppUser;
  onPointsUpdate: (p: number) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [benefits, setBenefits] = useState<Benefit[]>([]);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const { showToast } = useToastContext();


  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from("benefits")
          .select("id, title, description, cost, icon, available")
          .eq("active", true)
          .order("cost", { ascending: true });

        if (error || !data || data.length === 0) {
          if (!cancelled) setBenefits(FALLBACK_BENEFITS);
        } else {
          if (!cancelled) setBenefits(data as Benefit[]);
        }
      } catch {
        if (!cancelled) setBenefits(FALLBACK_BENEFITS);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  const handleRedeem = async (benefit: Benefit) => {
    if (user.points < benefit.cost || !benefit.available) return;
    setRedeeming(benefit.id);

    try {
      const { data, error } = await supabase.rpc("redeem_benefit", {
        benefit_id: benefit.id,
      });

      if (error) throw error;

      // data esperado: { newPoints, reward? }
      if (data?.newPoints !== undefined) {
        onPointsUpdate(data.newPoints);
      }

      // Feedback toast (alert mientras no haya sistema de toast global)
      showToast(`✅ Canjeaste "${benefit.title}". ¡Disfrutalo!`, "success");
    } catch (err: any) {
      console.error("Redeem error:", err);
      // Fallback: si no hay RPC, avisar al usuario honestamente.
      showToast("🚧 Este beneficio todavía no está disponible. ¡Pronto!", "info");
    } finally {
      setRedeeming(null);
    }
  };

  return (
    <div className="main-content">
      <div className="container">
        <section className="benefits-hero">
          <span className="benefits-kicker">LUPIAPP · RECOMPENSAS</span>
          <h1>Canjeá tus puntos.</h1>
          <p>Convertí tus LUPICOINS en mejoras, packs y ventajas.</p>
          <div className="benefits-balance">
            <span>⭐</span>
            <div>
              <strong>{user.points}</strong>
              <small>LUPICOINS DISPONIBLES</small>
            </div>
          </div>
        </section>

        {loading ? (
          <div className="empty-state">
            <div className="spinner" style={{ margin: "0 auto", borderTopColor: "var(--accent)", borderColor: "var(--border)" }} />
          </div>
        ) : benefits.length === 0 ? (
          <div className="empty-state fade-up">
            <div className="empty-icon">🎁</div>
            <div className="empty-text">Pronto vas a poder canjear tus puntos</div>
          </div>
        ) : (
          <>
            <div className="section-title fade-up">🎁 Beneficios</div>
            <div className="benefits-grid">
              {benefits.map((b) => {
                const canAfford = user.points >= b.cost;
                const disabled = !b.available || !canAfford || redeeming === b.id;
                return (
                  <div key={b.id} className={`benefit-card fade-up ${!b.available ? "disabled" : ""}`}>
                    <div className="benefit-icon">{b.icon}</div>
                    <div className="benefit-info">
                      <strong>{b.title}</strong>
                      <small>{b.description}</small>
                    </div>
                    <button
                      className="benefit-btn"
                      disabled={disabled}
                      onClick={() => handleRedeem(b)}
                    >
                      {redeeming === b.id
                        ? "..."
                        : !b.available
                        ? "PRÓXIMAMENTE"
                        : canAfford
                        ? `💰 ${b.cost}`
                        : `FALTAN ${b.cost - user.points}`}
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="benefits-footnote">Más beneficios se desbloquean al subir de nivel.</p>
          </>
        )}
      </div>
    </div>
  );
}