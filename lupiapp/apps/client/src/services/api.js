const API_URL = "https://lupiback.onrender.com"; // URL de tu backend desplegado

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

export async function updateStat(characterId, statKey, newValue, availableSkillPoints) {
  const res = await fetch(`${API_URL}/characters/${characterId}/stat`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ statKey, newValue, available_skill_points: availableSkillPoints }),
  });
  return res.json();
}

export async function trainCharacter(characterId) {
  const res = await fetch(`${API_URL}/characters/${characterId}/train`, {
    method: "POST",
  });
  return res.json();
}

export const addSkillPoint = async (characterId, skillKey) => {
  const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/characters/${characterId}/stat`, {
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
};

export const trainCharacter = async (characterId) => {
  const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/characters/${characterId}/train`, {
    method: "POST",
  });

  if (!res.ok) throw new Error("Error entrenando personaje");
  return await res.json();
};

