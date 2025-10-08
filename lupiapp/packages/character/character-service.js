// packages/character/src/character-service.js
import { supabase } from '../../database/supabase-client.js';

export class CharacterService {
  // Crear personaje
  static async createCharacter(userId, characterData) {
    const { nickname, skills } = characterData;
    
    // Validar puntos de skills
    const totalSkillPoints = Object.values(skills).reduce((sum, points) => sum + points, 0);
    const basePoints = 50 * Object.keys(skills).length; // 50 por cada skill
    const availablePoints = 10; // Puntos adicionales para asignar
    
    if (totalSkillPoints > basePoints + availablePoints) {
      throw new Error('Puntos de skill excedidos');
    }

    // Crear personaje
    const { data: character, error } = await supabase
      .from('characters')
      .insert([
        {
          user_id: userId,
          nickname: nickname,
          available_skill_points: 0, // Ya fueron asignados
          ...skills
        }
      ])
      .select()
      .single();

    if (error) throw error;

    // Crear wallet automáticamente
    const walletAddress = await this.createWallet(character.id, nickname);
    
    return { character, walletAddress };
  }

  // Crear wallet
  static async createWallet(characterId, nickname) {
    const walletAddress = `${nickname.toLowerCase()}.lupi`;
    
    const { data: wallet, error } = await supabase
      .from('wallets')
      .insert([
        {
          character_id: characterId,
          address: walletAddress,
          lupicoins: 100.00 // Lupicoins iniciales
        }
      ])
      .select()
      .single();

    if (error) throw error;
    
    return walletAddress;
  }

  // Obtener personaje por usuario
  static async getCharacterByUser(userId) {
    const { data, error } = await supabase
      .from('characters')
      .select('*, wallets(address, lupicoins)')
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    return data;
  }
}