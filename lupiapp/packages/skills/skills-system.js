// packages/skills/src/skills-system.js
export const BASE_SKILLS = {
  PASO: 'pase',
  POTENCIA: 'potencia', 
  VELOCIDAD: 'velocidad',
  LIDERAZGO: 'liderazgo',
  TIRO: 'tiro',
  REGATE: 'regate',
  TECNICA: 'tecnica',
  ESTRATEGIA: 'estrategia',
  INTELIGENCIA: 'inteligencia',
  DEFENSA: 'defensa',
  RESISTENCIA: 'resistencia_base'
};

export class SkillsSystem {
  // Calcular experiencia necesaria para siguiente nivel
  static calculateExpForLevel(level) {
    return Math.floor(100 * Math.pow(1.2, level - 1));
  }

  // Ganar experiencia
  static gainExperience(character, expGained) {
    const newExp = character.experience + expGained;
    const expNeeded = this.calculateExpForLevel(character.level);
    
    let levelUp = false;
    let currentExp = newExp;
    let currentLevel = character.level;
    
    // Verificar subidas de nivel
    while (currentExp >= expNeeded) {
      currentExp -= expNeeded;
      currentLevel++;
      levelUp = true;
    }
    
    return {
      newLevel: currentLevel,
      newExp: currentExp,
      levelUp: levelUp,
      skillPointsGained: levelUp ? 1 : 0
    };
  }

  // Validar asignación de skills
  static validateSkillAssignment(currentSkills, newSkills, availablePoints) {
    let totalPointsUsed = 0;
    
    for (const [skill, value] of Object.entries(newSkills)) {
      if (!BASE_SKILLS[skill.toUpperCase()]) {
        throw new Error(`Skill ${skill} no válido`);
      }
      
      const currentValue = currentSkills[skill] || 50;
      totalPointsUsed += (value - currentValue);
    }
    
    if (totalPointsUsed > availablePoints) {
      throw new Error('No tienes suficientes puntos de skill');
    }
    
    return totalPointsUsed;
  }
}