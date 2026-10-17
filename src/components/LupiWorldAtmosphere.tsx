
import "../pages/GameHubLobby.css";

export function LupiWorldAtmosphere() {
  return (
    <div className="gh-world__atmosphere" aria-hidden="true">
      <div className="gh-world__mist gh-world__mist--1" />
      <div className="gh-world__mist gh-world__mist--2" />

      <div className="gh-world__spot gh-world__spot--1" />
      <div className="gh-world__spot gh-world__spot--2" />

      <div className="gh-world__grain" />
    </div>
  );
}
