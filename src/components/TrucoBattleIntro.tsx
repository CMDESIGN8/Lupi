import { useEffect, useRef, useState } from "react";
import { OwnedCardPortrait } from "./OwnedCardPortrait";
import { LupiStoryPose } from "./LupiStoryPose";
import "./TrucoBattleIntro.css";

type Props = {
  meId: string;
  myName: string;
  rivalName: string;
  botIndex: number;
  onDone: () => void;
};

/** Pantalla de entrada tipo batalla Pokémon. Dura ~2.4s y llama onDone sola. */
export function TrucoBattleIntro({ meId, myName, rivalName, onDone }: Props) {
  const [phase, setPhase] = useState<"enter" | "clash" | "exit">("enter");
  const done = useRef(false);

  useEffect(() => {
    const t1 = window.setTimeout(() => setPhase("clash"), 600);
    const t2 = window.setTimeout(() => setPhase("exit"), 1700);
    const t3 = window.setTimeout(() => { if (!done.current) { done.current = true; onDone(); } }, 2350);
    return () => { [t1, t2, t3].forEach(clearTimeout); };
  }, [onDone]);

  return (
    <div className={`truco-intro truco-intro--${phase}`} aria-hidden="true">
      <div className="truco-intro__speedlines" />
      <div className="truco-intro__flash" />

      <div className="truco-intro__fighters">
        <div className="truco-intro__fighter truco-intro__fighter--me">
          <div className="truco-intro__avatar">
            <OwnedCardPortrait userId={meId} />
          </div>
          <span className="truco-intro__name">{myName}</span>
        </div>

        <div className="truco-intro__center">
          <span className="truco-intro__vs">VS</span>
          <strong className="truco-intro__title">¡TRUCO!</strong>
        </div>

        <div className="truco-intro__fighter truco-intro__fighter--rival">
          <div className="truco-intro__avatar truco-intro__avatar--rival">
            <LupiStoryPose pose="determined" />
          </div>
          <span className="truco-intro__name">{rivalName}</span>
        </div>
      </div>

      <div className="truco-intro__deck" aria-hidden="true">
        {[...Array(5)].map((_, i) => (
          <span key={i} className="truco-intro__card" style={{ "--i": i } as React.CSSProperties} />
        ))}
      </div>
    </div>
  );
}
