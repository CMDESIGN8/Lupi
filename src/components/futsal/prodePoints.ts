import type { Match, Ticket } from "../../services/prodeService";
export function matchPoints(match: Match, pick: Ticket[string] | undefined) {
  if (!pick || !/^\d{1,2}$/.test(pick.home) || !/^\d{1,2}$/.test(pick.away)) return { kind: "missing", points: 0, label: "Sin pronóstico guardado" } as const;
  if (match.home_score === null || match.away_score === null) return { kind: "pending", points: 0, label: "Esperando resultado validado" } as const;
  const home = Number(pick.home), away = Number(pick.away);
  if (home === match.home_score && away === match.away_score) return { kind: "exact", points: 3, label: "¡Marcador exacto!" } as const;
  if (Math.sign(home - away) === Math.sign(match.home_score - match.away_score)) return { kind: "outcome", points: 1, label: home === away ? "Acertaste el empate" : "Acertaste el ganador" } as const;
  return { kind: "miss", points: 0, label: "Esta vez no sumaste" } as const;
}
export function roundPoints(matches: Match[], ticket: Ticket) {
  const results = matches.map(m => matchPoints(m, ticket[m.id]));
  return { points: results.reduce((sum, r) => sum + r.points, 0), exact: results.filter(r => r.kind === "exact").length, outcome: results.filter(r => r.kind === "outcome").length, pending: results.filter(r => r.kind === "pending").length, resolved: matches.filter(m => m.home_score !== null && m.away_score !== null).length };
}
