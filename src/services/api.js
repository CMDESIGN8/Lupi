const API_URL = "https://lupiback.onrender.com"

export const getBots = async () => {
  try {
    console.log('🔍 Fetching bots from:', `${API_URL}/bots`);
    const response = await fetch(`${API_URL}/bots`); // ✅ Correcto
    
    console.log('📊 Response status:', response.status);
    
    // Ver el contenido real de la respuesta
    const text = await response.text();
    console.log('📄 Raw response:', text.substring(0, 500));
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${text}`);
    }
    
    const data = JSON.parse(text);
    console.log('✅ Parsed data:', data);
    return data.bots || data;
    
  } catch (error) {
    console.error('❌ Error in getBots:', error);
    throw error;
  }
};

export const startMatch = async (characterId, botId) => {
  const response = await fetch(`${API_URL}/bots/match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ characterId, botId }),
  });
  if (!response.ok) throw new Error("Error al iniciar la partida");
  return await response.json();
};

export const finishMatch = async (matchId, finalScore) => {
  try {
    console.log("📤 Enviando finish match:", { matchId, finalScore });
    
    const response = await fetch(`${API_URL}/bots/${matchId}/finish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(finalScore),
    });
    
    console.log("📥 Respuesta recibida:", response.status);
    
    if (!response.ok) {
      // Intentar obtener más detalles del error
      const errorText = await response.text();
      console.error("❌ Error response:", errorText);
      throw new Error(`Error ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log("✅ Finish match exitoso:", result);
    return result;
    
  } catch (error) {
    console.error("❌ Error en finishMatch:", error);
    throw error;
  }
};

export async function getProfile(userId) {
  const res = await fetch(`${API_URL}/profiles?id=${userId}`);
  return res.json();
}

export async function getCharacter(userId) {
  const res = await fetch(`${API_URL}/characters/${userId}`);
  return res.json();
}

export async function createCharacter(userId, nickname) {
  const res = await fetch(`${API_URL}/characters`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, nickname }),
  });
  return res.json();
}

export async function getWallet(characterId) {
  const res = await fetch(`${API_URL}/wallets/${characterId}`);
  return res.json();
}

export async function updateStat(characterId, skillKey, newValue, availableSkillPoints) {
  const res = await fetch(`${API_URL}/characters/${characterId}/stat`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ skillKey }),
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Error al subir skill");
  }

  const data = await res.json();
  return data.character;
}

export async function trainCharacter(characterId) {
  const res = await fetch(`${API_URL}/characters/${characterId}/train`, {
    method: "POST",
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || "Error al entrenar personaje");
  }

  return res.json();
}

// CLUBES API FUNCTIONS
export const getClubs = async (page = 1, limit = 20, search = '') => {
  const response = await fetch(`${API_URL}/clubs?page=${page}&limit=${limit}&search=${search}`);
  if (!response.ok) throw new Error("Error al cargar clubes");
  return await response.json();
};

export const getClubDetails = async (clubId) => {
  const response = await fetch(`${API_URL}/clubs/${clubId}`);
  if (!response.ok) throw new Error("Error al cargar detalles del club");
  return await response.json();
};

export const getClubMembers = async (clubId) => {
  const response = await fetch(`${API_URL}/clubs/${clubId}/members`);
  if (!response.ok) throw new Error("Error al cargar miembros del club");
  return await response.json();
};

export const createClub = async (clubData) => {
  try {
    console.log('🎯 Enviando datos para crear club:', clubData);
    
    const response = await fetch(`${API_URL}/clubs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clubData),
    });

    console.log('📊 Response status:', response.status);
    
    if (!response.ok) {
      // Obtener el mensaje de error detallado
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Club creado exitosamente:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Error en createClub:', error);
    throw error;
  }
};

export const joinClub = async (clubId, characterId) => {
  const response = await fetch(`${API_URL}/clubs/${clubId}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ character_id: characterId }),
  });
  if (!response.ok) throw new Error("Error al unirse al club");
  return await response.json();
};

export const leaveClub = async (clubId, characterId) => {
  const response = await fetch(`${API_URL}/clubs/${clubId}/leave`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ character_id: characterId }),
  });
  if (!response.ok) throw new Error("Error al abandonar el club");
  return await response.json();
};

export const getClubRanking = async (clubId) => {
  const response = await fetch(`${API_URL}/clubs/${clubId}/ranking`);
  if (!response.ok) throw new Error("Error al cargar ranking del club");
  return await response.json();
};

// ===============================
// CLUB EVENTS API FUNCTIONS
// ===============================

export const createClubEvent = async (clubId, eventData) => {
  try {
    console.log('🎯 Enviando datos para crear evento:', { clubId, eventData });
    
    const response = await fetch(`${API_URL}/clubs/${clubId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData),
    });

    console.log('📊 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Evento creado exitosamente:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Error en createClubEvent:', error);
    throw error;
  }
};

export const getClubEvents = async (clubId) => {
  try {
    console.log('🔍 Obteniendo eventos del club (BASE DE DATOS):', clubId);
    
    const response = await fetch(`${API_URL}/clubs/${clubId}/events`);
    
    console.log('📊 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Eventos obtenidos de la base de datos:', result.events?.length || 0);
    return result;
    
  } catch (error) {
    console.error('❌ Error en getClubEvents:', error);
    // Fallback a datos vacíos si hay error
    return { success: true, events: [] };
  }
};

export const joinClubEvent = async (clubId, eventId, characterId) => {
  try {
    console.log('🎯 Uniéndose a evento (BASE DE DATOS):', { clubId, eventId, characterId });
    
    const response = await fetch(`${API_URL}/clubs/${clubId}/events/${eventId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ character_id: characterId }),
    });

    console.log('📊 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Unido a evento en base de datos:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Error en joinClubEvent:', error);
    throw error;
  }
};

export const deleteClubEvent = async (clubId, eventId, characterId) => {
  try {
    console.log('🗑️ Eliminando evento (BASE DE DATOS):', { clubId, eventId, characterId });
    
    const response = await fetch(`${API_URL}/clubs/${clubId}/events/${eventId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ character_id: characterId }),
    });

    console.log('📊 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Evento eliminado de base de datos:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Error en deleteClubEvent:', error);
    throw error;
  }
};
// AGREGAR ESTO AL FINAL DE LAS FUNCIONES DE EVENTOS en services/api.js

export const updateClubEvent = async (clubId, eventId, updates) => {
  try {
    console.log('🎯 Actualizando evento (BASE DE DATOS):', { clubId, eventId, updates });
    
    const response = await fetch(`${API_URL}/clubs/${clubId}/events/${eventId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    console.log('📊 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Evento actualizado en base de datos:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Error en updateClubEvent:', error);
    throw error;
  }
};

export const getClubEvent = async (clubId, eventId) => {
  try {
    console.log('🔍 Obteniendo evento específico (BASE DE DATOS):', { clubId, eventId });
    
    const response = await fetch(`${API_URL}/clubs/${clubId}/events/${eventId}`);
    
    console.log('📊 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Evento obtenido de la base de datos:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Error en getClubEvent:', error);
    throw error;
  }
};

export const promoteToAdmin = async (clubId, characterId, targetCharacterId) => {
  try {
    console.log('👑 Promoviendo a administrador:', { clubId, characterId, targetCharacterId });
    
    const response = await fetch(`${API_URL}/clubs/${clubId}/promote-to-admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        character_id: characterId, 
        target_character_id: targetCharacterId 
      }),
    });

    console.log('📊 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Miembro promovido a admin:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Error en promoteToAdmin:', error);
    throw error;
  }
};

export const demoteToMember = async (clubId, characterId, targetCharacterId) => {
  try {
    console.log('👥 Degradando a miembro:', { clubId, characterId, targetCharacterId });
    
    const response = await fetch(`${API_URL}/clubs/${clubId}/demote-to-member`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        character_id: characterId, 
        target_character_id: targetCharacterId 
      }),
    });

    console.log('📊 Response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Error response:', errorText);
      throw new Error(`Error ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Admin degradado a miembro:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Error en demoteToMember:', error);
    throw error;
  }
};
