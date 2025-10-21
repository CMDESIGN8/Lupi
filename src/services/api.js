const API_URL = "https://lupiback.onrender.com"; // URL del backend desplegado

export const getBots = async () => {
  try {
    console.log('🔍 Fetching bots from:', `${API_URL}/bots`);
    const response = await fetch(`${API_URL}/bots`);
    
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
  const response = await fetch(`${API_URL}/match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ characterId, botId }),
  });
  if (!response.ok) throw new Error("Error al iniciar la partida");
  return await response.json();
};

export const finishMatch = async (matchId, finalScore) => {
  const response = await fetch(`${API_URL}/${matchId}/finish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(finalScore), // { player1Score, player2Score }
  });
  if (!response.ok) throw new Error("Error al finalizar la partida");
  return await response.json();
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
