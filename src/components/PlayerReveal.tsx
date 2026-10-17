import "./PlayerReveal.css";

type PlayerRevealProps = {
  username: string;
  club: string;
};

/** Escena visual únicamente: no modifica el registro ni los puntos. */
export function PlayerReveal({ username, club }: PlayerRevealProps) {
  return (
    <section className="lupi-reveal" aria-label="Presentación de tu jugador">
      <div className="lupi-reveal__backlight" aria-hidden="true" />
      <div className="lupi-reveal__beam lupi-reveal__beam--left" aria-hidden="true" />
      <div className="lupi-reveal__beam lupi-reveal__beam--right" aria-hidden="true" />
      <div className="lupi-reveal__mist" aria-hidden="true" />
      <div className="lupi-reveal__stage">
        <div className="lupi-reveal__halo" aria-hidden="true" />
        {/* Mantené tu PNG actual. Cambiá esta ruta solo si el archivo tiene otro nombre. */}
        <img
          src="/images/lupi-player-reveal.png"
          alt="Avatar provisional de tu jugador"
          className="lupi-reveal__character"
          draggable={false}
        />
        <div className="lupi-reveal__platform-core" aria-hidden="true" />
      </div>
      <div className="lupi-reveal__identity" aria-live="polite" aria-atomic="true">
        <span>✦ PLAYER 001 · NUEVO FICHAJE</span>
        <strong>{username.trim() || "TU NOMBRE DE JUGADOR"}</strong>
        <small>{club || "ELEGÍ TU CLUB"}</small>
      </div>
    </section>
  );
}
