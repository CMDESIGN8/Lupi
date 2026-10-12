import { useState, type FormEvent } from "react";
import { api, type AppUser } from "../lib/api";
import { CLUBS } from "../lib/constants";
import { supabase } from "../lib/supabaseClient";
import "./Auth.css";
import "./PlayerOnboarding.css";
import { PlayerReveal } from "../components/PlayerReveal";

type Props = {
  onComplete: (user: AppUser) => void;
};

export function PlayerOnboarding({ onComplete }: Props) {
  const [username, setUsername] = useState("");
  const [club, setClub] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [referralApplied, setReferralApplied] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError("");

    try {
      const code = referralCode.trim();
      if (code && !referralApplied) {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData.user) {
          throw new Error("Tu sesión expiró. Volvé a iniciar sesión.");
        }

        const { data, error: referralError } = await supabase.rpc("process_referral", {
          p_referred_id: authData.user.id,
          p_referral_code: code,
        });

        if (referralError) {
          throw new Error("No pudimos verificar el código. Intentá nuevamente.");
        }
        if (!data || data.success !== true) {
          throw new Error(data?.message ?? "El código de invitación no es válido.");
        }
        setReferralApplied(true);
      }

      const user = await api.completeGoogleProfile({ username, club });
      onComplete(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No pudimos completar tu perfil.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-screen player-setup-screen">
      <div className="auth-stage" aria-hidden="true">
        <div className="auth-stage__scene" />
        <div className="auth-stage__shade" />
        <div className="auth-stage__spot auth-stage__spot--left" />
        <div className="auth-stage__spot auth-stage__spot--right" />
        <div className="player-setup-stadium-lights">
          <span className="player-setup-stadium-beam player-setup-stadium-beam--left" />
          <span className="player-setup-stadium-beam player-setup-stadium-beam--right" />
          <span className="player-setup-stadium-flare player-setup-stadium-flare--left" />
          <span className="player-setup-stadium-flare player-setup-stadium-flare--right" />
        </div>
        <div className="auth-stage__fog" />
        <div className="auth-stage__particles" />
        <div className="auth-stage__light-sweep" />
        <div className="auth-stage__vignette" />
        <div className="auth-stage__grain" />
      </div>

      <div className="player-setup-layout player-setup-layout--split">
        <div className="player-setup-left">
          <header className="player-setup-hero">
            <span className="player-setup-crown" aria-hidden="true">♛</span>
            <h1>CREÁ TU <em>JUGADOR</em></h1>
            <span className="player-setup-kicker">PLAYER SETUP · LUPI WORLD</span>
            <p>Tu historia empieza en la cancha.</p>
          </header>

          <PlayerReveal username={username} club={club} />
        </div>

        <section className="player-setup-panel" aria-label="Configuración del jugador">
          <div className="player-setup-console-header">
            <div className="player-setup-console-eyebrow"><span className="player-setup-online-dot" /> LUPI WORLD <span className="player-setup-console-separator">/</span> PLAYER SETUP</div>
            <div className="player-setup-console-heading">
              <div><h2>CONFIGURÁ TU <em>IDENTIDAD</em></h2><p>Elegí cómo te van a conocer en la cancha.</p></div>
              <span className="player-setup-console-level" aria-label="Paso 1 de 1">01<span>/01</span></span>
            </div>
            <div className="player-setup-console-progress"><span /></div>
          </div>
          {error && <div className="player-setup-error" role="alert">⚠️ {error}</div>}

          <form className="player-setup-form" onSubmit={handleSubmit}>
            <div className={`player-setup-field ${username.trim().length >= 3 ? "is-complete" : ""}`}>

              <span className="player-setup-field-icon" aria-hidden="true">🦊</span>
              <div className="player-setup-field-content">
                <label htmlFor="player-username"><span>01</span> NOMBRE DE JUGADOR <span className="player-setup-field-check" aria-hidden="true">✓</span></label>
                <input id="player-username" placeholder="Ej. CRACK10" value={username}
                  onChange={(e) => setUsername(e.target.value)} minLength={3} maxLength={30}
                  autoComplete="nickname" disabled={loading} required />
              </div>
            </div>

            <div className={`player-setup-field ${club ? "is-complete" : ""}`}>
              <span className="player-setup-field-icon" aria-hidden="true">🛡️</span>
              <div className="player-setup-field-content">
                <label htmlFor="player-club"><span>02</span> CLUB DE BARRIO <span className="player-setup-field-check" aria-hidden="true">✓</span></label>
                <select id="player-club" value={club} onChange={(e) => setClub(e.target.value)}
                  disabled={loading} required>
                  <option value="">Seleccioná tu club</option>
                  {CLUBS.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
            </div>

            <div className="player-setup-field">
              <span className="player-setup-field-icon" aria-hidden="true">🎁</span>
              <div className="player-setup-field-content">
                <label htmlFor="player-referral"><span>03</span> CÓDIGO DE INVITACIÓN <span className="player-setup-optional">OPCIONAL</span></label>
                <input id="player-referral" placeholder="Ej. LUPI72316D" value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  autoCapitalize="characters" autoComplete="off" maxLength={50}
                  disabled={loading || referralApplied} />
                <small>{referralApplied ? "✓ Bonificación por referido aplicada." : "Si tenés un código válido, ganás 25 puntos adicionales."}</small>
              </div>
            </div>

            <div className="player-setup-rewards" aria-label="Recompensas de registro">
              <div className="player-setup-rewards-heading"><span>✦ STARTER PACK</span><span>RECOMPENSAS INICIALES</span></div>
              <div className="player-setup-reward-row">
                <span className="player-setup-reward-icon player-setup-reward-icon--welcome" aria-hidden="true">★</span>
                <span>BIENVENIDA</span><strong>+50 <small>PUNTOS</small></strong>
              </div>
              <div className="player-setup-reward-row">
                <span className="player-setup-reward-icon player-setup-reward-icon--referral" aria-hidden="true">♟</span>
                <span>CON REFERIDO VÁLIDO</span><strong>+25 <small>PUNTOS</small></strong>
              </div>
              <div className="player-setup-reward-row player-setup-reward-row--total">
                <span className="player-setup-reward-icon player-setup-reward-icon--total" aria-hidden="true">♛</span>
                <span>TOTAL POSIBLE</span><strong>75 <small>PUNTOS</small></strong>
              </div>
            </div>

            <button className="player-setup-submit" type="submit" disabled={loading}>
              {loading ? "GUARDANDO TU JUGADOR..." : "ENTRAR A LUPI WORLD →"}
            </button>
            <p className="player-setup-footnote">Incluye 5 cartas iniciales y tu primer equipo.</p>
          </form>
        </section>
      </div>
    </main>
  );
}
