import type { ProdeRound, Rank } from "../../services/prodeService";
export const kickoff = (r: ProdeRound) => Math.min(...r.matches.map(m=>Date.parse(m.starts_at)));
export function nextPlayable(rounds: ProdeRound[], now: number) {
 return rounds.filter(r=>r.published&&r.matches.length>0&&r.matches.every(m=>Date.parse(m.starts_at)>now&&m.home_score===null&&m.away_score===null)).sort((a,b)=>kickoff(a)-kickoff(b)||a.id.localeCompare(b.id))[0];
}
export function podiumGroups(rows: Rank[]) {
 if (!rows.some(r=>r.total_points>0)) return [];
 return [1,2,3].map(position=>({position,players:rows.filter(r=>r.position===position)})).filter(group=>group.players.length);
}
export function closingClock(deadline: number, now: number) {
 const seconds = Math.max(0,Math.ceil((deadline-now)/1000));
 return { days: Math.floor(seconds/86400), hours: Math.floor(seconds/3600)%24, minutes: Math.floor(seconds/60)%60, seconds: seconds%60, tone: seconds===0?"closed":seconds<=1800?"urgent":seconds<=10800?"soon":"normal" };
}
export function closingDate(deadline: number, now: number) {
 const options = { timeZone: "America/Argentina/Buenos_Aires" };
 const day = (time: number) => new Intl.DateTimeFormat("en-CA",{...options,year:"numeric",month:"2-digit",day:"2-digit"}).format(time);
 const date = day(deadline)===day(now)?"Hoy":new Intl.DateTimeFormat("es-AR",{...options,day:"2-digit",month:"2-digit"}).format(deadline);
 const time = new Intl.DateTimeFormat("es-AR",{...options,hour:"2-digit",minute:"2-digit",hour12:false}).format(deadline);
 return `${date}, ${time} · Hora Argentina`;
}
export const isFloresHome = (home: string) => /^flores\s+club$/i.test(home.trim());
export function isFloresHomeRound(round: ProdeRound) {
 return round.matches.length>0&&round.matches.every(m=>isFloresHome(m.home));
}
