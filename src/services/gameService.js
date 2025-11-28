import { supabase } from '../lib/supabaseClient'; // Asegúrate de que esta ruta sea correcta

export const gameService = {
  // ========== WALLET METHODS ==========
  
  // Obtener wallet del personaje
  async getWallet(characterId) {
    try {
      console.log('🔍 Buscando wallet para character_id:', characterId);
      
      // Validar UUID
      if (!characterId || !this.isValidUUID(characterId)) {
        console.error('❌ character_id inválido:', characterId);
        return this.createDefaultWalletResponse(characterId);
      }
      
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('character_id', characterId)
        .single();
      
      if (error) {
        console.error('❌ Error en getWallet:', error);
        if (error.code === 'PGRST116') { // No encontrado
          return this.createDefaultWalletResponse(characterId);
        }
        return this.createDefaultWalletResponse(characterId);
      }
      
      console.log('✅ Wallet encontrada:', data);
      return data;
    } catch (error) {
      console.error('❌ Error crítico en getWallet:', error);
      return this.createDefaultWalletResponse(characterId);
    }
  },

  // Actualizar lupicoins
  async updateLupicoins(characterId, amount) {
    try {
      console.log('💰 Actualizando lupicoins:', { characterId, amount });
      
      // Primero verificar si la wallet existe
      const existingWallet = await this.getWallet(characterId);
      
      const { data, error } = await supabase
        .from('wallets')
        .update({ 
          lupicoins: amount,
          updated_at: new Date().toISOString()
        })
        .eq('character_id', characterId)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Error en updateLupicoins:', error);
        return null;
      }
      
      console.log('✅ Lupicoins actualizados:', data);
      return data;
    } catch (error) {
      console.error('❌ Error crítico en updateLupicoins:', error);
      return null;
    }
  },

  // Agregar lupicoins (método conveniente)
  async addLupicoins(characterId, amount, reason = 'Recompensa') {
    try {
      const wallet = await this.getWallet(characterId);
      if (!wallet) return false;
      
      const newAmount = (wallet.lupicoins || 0) + amount;
      return await this.updateLupicoins(characterId, newAmount);
    } catch (error) {
      console.error('❌ Error agregando lupicoins:', error);
      return false;
    }
  },

  // ========== CHARACTER & PROGRESS METHODS ==========

  // Guardar progreso del juego
  async saveProgress(characterId, x, y, location) {
    try {
      console.log('💾 Guardando progreso:', { characterId, x, y, location });
      
      const { error } = await supabase
        .from('characters')
        .update({
          position_x: x,
          position_y: y,
          current_location: location,
          updated_at: new Date().toISOString()
        })
        .eq('id', characterId);
      
      if (error) {
        console.error('❌ Error en saveProgress:', error);
        return false;
      }
      
      console.log('✅ Progreso guardado correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error crítico en saveProgress:', error);
      return false;
    }
  },

  // Obtener character por ID
  async getCharacter(characterId) {
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('id', characterId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching character:', error);
      return null;
    }
  },

  // Obtener character por user_id
async getCharacterByUserId(userId) {
  try {
    const { data, error } = await supabase
      .from('characters')
      // CAMBIO CLAVE AQUÍ: Seleccionar todas las columnas (*) y el nombre del club (clubs(name))
      .select('*, clubs(name)') 
      .eq('user_id', userId)
      .single();
    
    if (error) throw error;
    
    // La respuesta 'data' ahora incluirá un objeto 'clubs' anidado:
    // { ..., club_id: 'uuid-del-club', clubs: { name: 'Nombre del Club' } }
    return data;
  } catch (error) {
    console.error('Error fetching character by user_id:', error);
    return null;
  }
},

  // ========== CLUB METHODS ==========

// Obtener detalles del club (VERSIÓN SEGURA)
async getClubDetails(clubId) {
  if (!clubId) {
    console.log('⚠️ No hay club_id proporcionado');
    return null;
  }
  
  try {
    console.log('🏆 Buscando club con id:', clubId);
    
    const { data, error } = await supabase
      .rpc('get_club_basic_info', { club_id: clubId });
    
    if (error) {
      console.error('❌ Error en getClubDetails RPC:', error);
      return null;
    }
    
    if (!data) {
      console.log('⚠️ Club no encontrado via RPC');
      return null;
    }
    
    console.log('✅ Club encontrado via RPC:', data.name);
    return data;
    
  } catch (error) {
    console.error('❌ Error crítico en getClubDetails RPC:', error);
    return null;
  }
},


// NUEVO: Obtener información completa del club con miembros
async getClubWithDetails(clubId, characterId) {
  if (!clubId) return null;
  
  try {
    console.log('🏆 Buscando detalles completos del club:', clubId);
    
    // Obtener información básica del club
    const clubData = await this.getClubDetails(clubId);
    if (!clubData) return null;
    
    // Obtener miembros del club
    const members = await this.getClubMembers(clubId);
    
    // Obtener rol del usuario en el club
    const userRole = await this.getUserClubRole(characterId, clubId);
    
    // Obtener misiones del club
    const missions = await this.getClubMissions(clubId);
    
    return {
      ...clubData,
      members: members || [],
      userRole: userRole || 'member',
      activeMissions: missions || [],
      memberCount: members?.length || 0
    };
  } catch (error) {
    console.error('❌ Error en getClubWithDetails:', error);
    return null;
  }
},

// Obtener rol del usuario en el club
async getUserClubRole(characterId, clubId) {
  try {
    const { data, error } = await supabase
      .from('club_members')
      .select('role')
      .eq('character_id', characterId)
      .eq('club_id', clubId)
      .single();
    
    if (error) return 'member'; // Rol por defecto
    
    return data?.role || 'member';
  } catch (error) {
    console.error('Error getting user club role:', error);
    return 'member';
  }
},

// Obtener misiones del club
async getClubMissions(clubId) {
  try {
    const { data, error } = await supabase
      .from('club_missions')
      .select('*')
      .eq('club_id', clubId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });
    
    if (error) return [];
    
    return data || [];
  } catch (error) {
    console.error('Error getting club missions:', error);
    return [];
  }
},

  // Obtener miembros del club
  async getClubMembers(clubId) {
    try {
      const { data, error } = await supabase
        .from('club_members')
        .select(`
          *,
          characters (*)
        `)
        .eq('club_id', clubId);
      
      if (error) {
        console.error('❌ Error en getClubMembers:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('❌ Error crítico en getClubMembers:', error);
      return [];
    }
  },

  // ========== INVENTORY & ITEMS ==========

  // Obtener items del usuario
  async getUserItems(userId) {
    try {
      const { data, error } = await supabase
        .from('user_items')
        .select(`
          *,
          items (*)
        `)
        .eq('user_id', userId);
      
      if (error) {
        console.error('❌ Error en getUserItems:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('❌ Error crítico en getUserItems:', error);
      return [];
    }
  },

  // Agregar item al usuario
  async addUserItem(userId, itemId, quantity = 1) {
    try {
      const { data, error } = await supabase
        .from('user_items')
        .upsert({
          user_id: userId,
          item_id: itemId,
          quantity: quantity,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error adding user item:', error);
      return false;
    }
  },

  // ========== RANKING & LEADERBOARD ==========

  // Obtener ranking de jugadores
  async getTopPlayers(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('characters')
        .select(`
          *,
          wallets (lupicoins)
        `)
        .order('level', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('❌ Error en getTopPlayers:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('❌ Error crítico en getTopPlayers:', error);
      return [];
    }
  },

  // Obtener ranking por lupicoins
  async getTopPlayersByCoins(limit = 10) {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select(`
          lupicoins,
          characters (*)
        `)
        .order('lupicoins', { ascending: false })
        .limit(limit);
      
      if (error) {
        console.error('❌ Error en getTopPlayersByCoins:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('❌ Error crítico en getTopPlayersByCoins:', error);
      return [];
    }
  },

  // ========== MATCHES & STATS ==========

  // Crear nuevo partido
  async createMatch(player1Id, player2Id, matchType = 'quick') {
    try {
      const { data, error } = await supabase
        .from('matches')
        .insert([
          {
            player1_id: player1Id,
            player2_id: player2Id,
            match_type: matchType,
            status: 'active',
            started_at: new Date().toISOString()
          }
        ])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating match:', error);
      return null;
    }
  },

  // Finalizar partido
  async finishMatch(matchId, winnerId, player1Score, player2Score, rewards = {}) {
    try {
      const { data, error } = await supabase
        .from('matches')
        .update({
          winner_id: winnerId,
          player1_score: player1Score,
          player2_score: player2Score,
          status: 'finished',
          finished_at: new Date().toISOString(),
          rewards_exp: rewards.exp || 0,
          rewards_coins: rewards.coins || 0
        })
        .eq('id', matchId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error finishing match:', error);
      return null;
    }
  },

  // Obtener estadísticas de partido
  async getMatchStats(matchId) {
    try {
      const { data, error } = await supabase
        .from('match_stats')
        .select(`
          *,
          characters (*)
        `)
        .eq('match_id', matchId);
      
      if (error) {
        console.error('❌ Error en getMatchStats:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('❌ Error crítico en getMatchStats:', error);
      return [];
    }
  },

  // ========== MISSIONS & EVENTS ==========

  // Obtener misiones activas
  async getActiveMissions() {
    try {
      const { data, error } = await supabase
        .from('missions')
        .select('*')
        .eq('is_active', true);
      
      if (error) {
        console.error('❌ Error en getActiveMissions:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('❌ Error crítico en getActiveMissions:', error);
      return [];
    }
  },

  // Obtener progreso de misiones del jugador
  async getMissionProgress(characterId) {
    try {
      const { data, error } = await supabase
        .from('mission_progress')
        .select(`
          *,
          missions (*)
        `)
        .eq('character_id', characterId);
      
      if (error) {
        console.error('❌ Error en getMissionProgress:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('❌ Error crítico en getMissionProgress:', error);
      return [];
    }
  },

  // Actualizar progreso de misión
  async updateMissionProgress(characterId, missionId, progress) {
    try {
      const { data, error } = await supabase
        .from('mission_progress')
        .upsert({
          character_id: characterId,
          mission_id: missionId,
          current_progress: progress,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating mission progress:', error);
      return null;
    }
  },

  // ========== UTILITY METHODS ==========

  // Helper para validar UUID
  isValidUUID(uuid) {
    if (!uuid) return false;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  },

  // Crear respuesta de wallet por defecto (NO insertar en BD)
  createDefaultWalletResponse(characterId) {
    return { 
      lupicoins: 0, 
      character_id: characterId,
      address: 'default-' + characterId 
    };
  },

  // Verificar conexión con Supabase
  async testConnection() {
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      return { success: true, message: 'Conexión a Supabase exitosa' };
    } catch (error) {
      console.error('❌ Error de conexión con Supabase:', error);
      return { success: false, message: 'Error de conexión con Supabase' };
    }
  },

  // Obtener estadísticas del juego
  async getGameStats() {
    try {
      const [charactersCount, walletsCount, matchesCount] = await Promise.all([
        supabase.from('characters').select('*', { count: 'exact', head: true }),
        supabase.from('wallets').select('*', { count: 'exact', head: true }),
        supabase.from('matches').select('*', { count: 'exact', head: true })
      ]);

      return {
        characters: charactersCount.count || 0,
        wallets: walletsCount.count || 0,
        matches: matchesCount.count || 0,
        totalLupicoins: await this.getTotalLupicoins()
      };
    } catch (error) {
      console.error('Error getting game stats:', error);
      return { characters: 0, wallets: 0, matches: 0, totalLupicoins: 0 };
    }
  },

  // Obtener total de lupicoins en el juego
  async getTotalLupicoins() {
    try {
      const { data, error } = await supabase
        .from('wallets')
        .select('lupicoins');
      
      if (error) throw error;
      
      return data.reduce((total, wallet) => total + (wallet.lupicoins || 0), 0);
    } catch (error) {
      console.error('Error getting total lupicoins:', error);
      return 0;
    }
  }
};