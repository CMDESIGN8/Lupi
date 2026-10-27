import floresCrest from "../../assets/flores-club.png";
export function ProdeTeam({ name }: { name: string }) {
 const flores = /^flores club$/i.test(name.trim());
 const initials = name.trim().split(/\s+/).slice(0,2).map(w=>w[0]).join("").toUpperCase();
 return <span className="pv-team">{flores?<img src={floresCrest} alt=""/>:<span className="pv-team-mark" aria-hidden="true">{initials}</span>}<strong>{name}</strong></span>;
}
