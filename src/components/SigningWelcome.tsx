import type { AppUser } from "../lib/api";
import "./SigningWelcome.css";

type Props = {
  user: AppUser;
  onContinue: () => void;
};

/** Presentación visual únicamente: no otorga recompensas ni modifica el perfil. */
export function SigningWelcome({ user, onContinue }: Props) {
  return (
    <div className="signing-welcome" role="dialog" aria-modal="true" aria-labelledby="signing-title">
      <div className="signing-welcome__light signing-welcome__light--left" aria-hidden="true" />
      <div className="signing-welcome__light signing-welcome__light--right" aria-hidden="true" />
      <div className="signing-welcome__card">
        <span className="signing-welcome__eyebrow">✦ LUPI WORLD · NUEVO FICHAJE ✦</span>
        <div className="signing-welcome__emblem" aria-hidden="true">♛</div>
        <h1 id="signing-title">¡FICHAJE <em>CONFIRMADO!</em></h1>
        <p className="signing-welcome__intro">Bienvenido a la cancha</p>
        <strong className="signing-welcome__name">{user.username || "JUGADOR"}</strong>
        <span className="signing-welcome__club">{user.club || "LUPI WORLD"}</span>
        <p className="signing-welcome__message">Tu historia empieza ahora. Tu próximo nivel te espera.</p>
        <button type="button" className="signing-welcome__button" onClick={onContinue} autoFocus>
          COMENZAR MI HISTORIA <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}
