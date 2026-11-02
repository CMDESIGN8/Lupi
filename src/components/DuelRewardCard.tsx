import { useEffect, useRef, useState } from "react";
import type { DuelRewardResult } from "../lib/duelRewards";
import { duelFx } from "../lib/duelFx";
import "./DuelRewardCard.css";

const CHEST: Record<string, string> = { comun: "COFRE COMÚN", raro: "COFRE RARO", epico: "COFRE ÉPICO" };

type Props = { reward: DuelRewardResult | null; error?: boolean; rivalName?: string; gameLabel?: string };

export function DuelRewardCard({ reward, error, rivalName, gameLabel }: Props) {
  const played = useRef(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!reward || reward.duplicate || played.current) return;
    played.current = true;
    duelFx.result(reward.result ?? "draw");
    if (reward.chest) { const tier = reward.chest; const t = window.setTimeout(() => duelFx.chest(tier), 650); return () => window.clearTimeout(t); }
  }, [reward]);

  if (error) return <p className="drc drc--soft" role="status">No pudimos confirmar la acreditación del premio.</p>;
  if (!reward) return <p className="drc drc--soft" role="status">Contando tu botín…</p>;
  if (reward.duplicate) return <p className="drc drc--soft" role="status">Premio de esta partida ya acreditado.</p>;

  if (reward.hardCapped) return <section className="drc drc--practice-complete" role="status" aria-label="Premios diarios completados">
    <span className="drc-practice-icon" aria-hidden="true">✓</span><div><small>MODO PRÁCTICA</small><h3>¡BOTÍN DIARIO COMPLETADO!</h3><div className="drc-practice-stamps" aria-hidden="true">{Array.from({length:6},(_,i)=><i key={i}>✓</i>)}</div><p>Ya recibiste tus 6 premios de hoy entre PPT y Preguntados.</p><strong>Podés seguir jugando. La XP y las monedas vuelven mañana.</strong><small className="drc-practice-reset">Reinicio: 00:00 · hora argentina</small></div>
  </section>;

  const win = reward.result === "win";
  const h2h = reward.h2h;
  const canShare = win && !reward.vsBot;
  const share = async () => {
    const streak = (reward.streak ?? 0) >= 2 ? ` 🔥 Racha de ${reward.streak}.` : "";
    const text = `🏆 ¡Le gané a ${rivalName || "un rival"}${gameLabel ? ` en ${gameLabel}` : ""} en Lupi World!${streak} ¿Me desafiás?`;
    try {
      if (navigator.share) await navigator.share({ text, url: window.location.origin });
      else { await navigator.clipboard.writeText(`${text} ${window.location.origin}`); setCopied(true); window.setTimeout(() => setCopied(false), 2000); }
    } catch { /* el usuario canceló */ }
  };

  return (
    <section className={`drc ${win ? "drc--win" : ""} ${reward.chest ? `drc--chest drc--${reward.chest}` : ""}`} aria-label="Premio del duelo" role="status">
      <small>{reward.vsBot ? "ENTRENAMIENTO" : "BOTÍN DEL DUELO"}</small>
      <div className="drc__row">
        <b className="drc__pill">+{reward.xp ?? 0} XP</b>
        <b className="drc__pill drc__pill--coin">+{reward.coins ?? 0} 🪙</b>
      </div>
      {reward.firstWin && <p className="drc__tag">⭐ PRIMERA VICTORIA DEL DÍA</p>}
      {!reward.vsBot && win && (reward.streak ?? 0) >= 2 && <p className="drc__tag">🔥 RACHA x{reward.streak}{reward.streak === reward.bestStreak ? " · ¡TU RÉCORD!" : ""}</p>}
      {reward.chest && <p className="drc__chest">🎁 {CHEST[reward.chest]} · monedas extra</p>}
      {h2h && <p className="drc__h2h">VS {(rivalName || "RIVAL").toUpperCase()} · <b>{h2h.wins}</b> ganadas · <b>{h2h.losses}</b> perdidas{h2h.draws ? ` · ${h2h.draws} empates` : ""}</p>}
      {reward.rivalCapped && <p className="drc__note">Ya jugaste mucho contra este rival hoy: el premio baja. ¡Probá con otro!</p>}
      {reward.hardCapped && <p className="drc__note">Completaste tus 6 premios de práctica de hoy. La práctica de habilidades tiene su propio límite de 5 partidas por juego.</p>}
      {reward.capped && !reward.hardCapped && !reward.rivalCapped && <p className="drc__note">Llegaste al tope diario: los premios bajan hasta mañana.</p>}
      {canShare && <button type="button" className="drc__share" onClick={() => void share()}>{copied ? "¡COPIADO!" : "↗ COMPARTIR VICTORIA"}</button>}
    </section>
  );
}
