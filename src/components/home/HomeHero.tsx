// ============================================================
// HOME HERO - LUPI APP
// ============================================================

interface HomeHeroProps {
  title: string;
  subtitle: string;
  buttonText: string;
  image: string;
  onClick: () => void;
}

export function HomeHero({
  title,
  subtitle,
  buttonText,
  image,
  onClick
}: HomeHeroProps) {
  return (
    <>
      <style>{`
      
      /* =========================================================
         HOME HERO
      ========================================================= */

      .home-hero {
        position: relative;
        overflow: hidden;

        min-height: 260px;

        border-radius: 30px;

        padding: 26px;

        background:
          linear-gradient(
            180deg,
            rgba(10,15,30,.92) 0%,
            rgba(3,6,15,.98) 100%
          );

        border: 1px solid rgba(0,180,255,.18);

        box-shadow:
          0 10px 40px rgba(0,0,0,.45),
          inset 0 1px 0 rgba(255,255,255,.04);

        isolation: isolate;
      }

      /* Fondo imagen */
      .home-hero-image {
        position: absolute;
        inset: 0;

        width: 100%;
        height: 100%;

        object-fit: cover;

        opacity: .38;

        transform: scale(1.05);

        filter:
          saturate(1.1)
          contrast(1.05);

        pointer-events: none;
      }

      /* Overlay oscuro */
      .home-hero::after {
        content: "";

        position: absolute;
        inset: 0;

        background:
          linear-gradient(
            to top,
            rgba(0,0,0,.95) 5%,
            rgba(0,0,0,.45) 45%,
            rgba(0,0,0,.15) 100%
          );

        z-index: 1;
      }

      /* Glow azul */
      .home-hero::before {
        content: "";

        position: absolute;

        top: -120px;
        right: -80px;

        width: 260px;
        height: 260px;

        border-radius: 50%;

        background:
          radial-gradient(
            circle,
            rgba(0,180,255,.25) 0%,
            rgba(0,180,255,0) 70%
          );

        z-index: 0;
      }

      /* Contenido */
      .home-hero-content {
        position: relative;
        z-index: 3;

        display: flex;
        flex-direction: column;

        height: 100%;
      }

      /* Badge */
      .home-hero-badge {
        width: fit-content;

        display: flex;
        align-items: center;
        gap: 8px;

        padding: 8px 14px;

        border-radius: 999px;

        background:
          rgba(0,255,200,.12);

        border:
          1px solid rgba(0,255,200,.25);

        color: #57ffe0;

        font-size: 12px;
        font-weight: 900;

        letter-spacing: 1px;
        text-transform: uppercase;

        margin-bottom: 18px;

        backdrop-filter: blur(10px);
      }

      /* Título */
      .home-hero-title {
        font-size: 42px;

        line-height: .95;

        font-weight: 1000;

        color: white;

        text-transform: uppercase;

        letter-spacing: -1.5px;

        max-width: 260px;

        text-shadow:
          0 4px 20px rgba(0,0,0,.55);

        margin: 0;
      }

      /* Subtexto */
      .home-hero-subtitle {
        margin-top: 14px;

        max-width: 280px;

        color: rgba(255,255,255,.82);

        font-size: 15px;

        line-height: 1.45;

        font-weight: 500;
      }

      /* CTA */
      .home-hero-button {
        margin-top: 26px;

        width: fit-content;

        min-width: 190px;

        height: 58px;

        padding: 0 26px;

        border: none;

        border-radius: 18px;

        background:
          linear-gradient(
            180deg,
            #5ab5ff 0%,
            #006eff 100%
          );

        color: #111;

        font-size: 15px;
        font-weight: 1000;

        letter-spacing: 1px;

        text-transform: uppercase;

        cursor: pointer;

        transition:
          transform .15s ease,
          box-shadow .2s ease;

        box-shadow:
          0 10px 30px rgba(255,190,0,.35),
          inset 0 2px 0 rgba(255,255,255,.4);
      }

      .home-hero-button:hover {
        transform: translateY(-2px);

        box-shadow:
          0 14px 34px rgba(255,190,0,.42),
          inset 0 2px 0 rgba(255,255,255,.4);
      }

      .home-hero-button:active {
        transform: scale(.97);
      }

      /* Líneas decorativas */
      .home-hero-lines {
        position: absolute;

        bottom: -20px;
        left: -10%;

        width: 120%;
        height: 120px;

        background:
          repeating-linear-gradient(
            -12deg,
            rgba(255,255,255,.03),
            rgba(255,255,255,.03) 2px,
            transparent 2px,
            transparent 14px
          );

        opacity: .35;

        z-index: 2;

        pointer-events: none;
      }

      /* Responsive */
      @media (max-width: 480px) {

        .home-hero {
          min-height: 240px;

          padding: 22px;
        }

        .home-hero-title {
          font-size: 34px;

          max-width: 220px;
        }

        .home-hero-subtitle {
          font-size: 14px;

          max-width: 240px;
        }

        .home-hero-button {
          width: 100%;
        }
      }

      `}</style>

      <div className="home-hero">

        <img
          src={image}
          className="home-hero-image"
        />

        <div className="home-hero-lines" />

        <div className="home-hero-content">

          <div className="home-hero-badge">
            ⚽ MISIÓN ACTUAL
          </div>

          <h2 className="home-hero-title">
            {title}
          </h2>

          <p className="home-hero-subtitle">
            {subtitle}
          </p>

          <button
            onClick={onClick}
            className="home-hero-button"
          >
            {buttonText}
          </button>

        </div>
      </div>
    </>
  );
}