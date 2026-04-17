import { UserCard } from '../types/cards'

export interface ChemistryLink {
  from: number
  to: number
  strength: 'strong' | 'medium' | 'weak'
  color: string
  reason: string
}

export interface ChemistryResult {
  links: ChemistryLink[]
  totalBonus: number
  suggestions: string[]
}
export interface ChemistrySuggestion {
  type: 'link' | 'team' | 'swap'
  description: string
  bonus: number
  action?: {
    cardIn?: UserCard
    cardOut?: UserCard
    position?: number
  }
}

const getData = (c: UserCard) => c.card || (c as any).player

export function calculateChemistry(deckCards: UserCard[]): ChemistryResult {
  const links: ChemistryLink[] = []
  let totalBonus = 0
  const suggestions: string[] = []

  for (let i = 0; i < deckCards.length; i++) {
    for (let j = i + 1; j < deckCards.length; j++) {

      const a = getData(deckCards[i])
      const b = getData(deckCards[j])

      if (!a || !b) continue

      let strength: ChemistryLink['strength'] = 'weak'
      let color = '#ef4444'
      let bonus = 0
      let reason = ''

      // 🟢 MISMA CATEGORÍA
      if (a.category === b.category) {
        strength = 'strong'
        color = '#22c55e'
        bonus = 4
        reason = 'Misma categoría'
      }

      // 🟡 UNO REAL
      else if (a.is_real || b.is_real) {
        strength = 'medium'
        color = '#facc15'
        bonus = 2
        reason = 'Jugador real'
      }

      // 🔵 SINERGIA POSICIONAL
      if (
        (a.position === 'pivot' && b.position === 'ala') ||
        (a.position === 'ala' && b.position === 'pivot')
      ) {
        bonus += 2
        color = '#34d399'
        reason = 'Conexión ofensiva'
      }

      totalBonus += bonus

      links.push({
        from: deckCards[i].position!,
        to: deckCards[j].position!,
        strength,
        color,
        reason
      })
    }
  }

  // 🧠 SUGERENCIAS
  if (totalBonus < 10) {
    suggestions.push('Usá más jugadores de la misma categoría')
  }

  if (!deckCards.some(c => getData(c)?.is_real)) {
    suggestions.push('Agregar jugadores reales mejora la química')
  }

  return { links, totalBonus, suggestions}
}
