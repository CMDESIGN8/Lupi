// src/services/api.js
const API_URL = "https://lupiback.onrender.com";

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

// Añade estas funciones faltantes:
export async function updateStat(characterId, statKey) {
  const res = await fetch(`${API_URL}/characters/${characterId}/stats`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stat: statKey }),
  });
  return res.json();
}

export async function trainCharacter(characterId) {
  const res = await fetch(`${API_URL}/characters/${characterId}/train`, {
    method: "POST",
  });
  return res.json();
}