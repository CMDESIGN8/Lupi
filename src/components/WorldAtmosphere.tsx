
import "./WorldAtmosphere.css";

export function WorldAtmosphere() {
  return (
    <div className="world-atmosphere" aria-hidden="true">
      <div className="world-atmosphere__beam world-atmosphere__beam--left" />
      <div className="world-atmosphere__beam world-atmosphere__beam--right" />
      <div className="world-atmosphere__beam world-atmosphere__beam--center" />
      <div className="world-atmosphere__fog" />
      <div className="world-atmosphere__grain" />
      <div className="world-atmosphere__vignette" />
    </div>
  );
}
