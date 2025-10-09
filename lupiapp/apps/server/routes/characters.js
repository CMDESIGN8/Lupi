import express from "express";
import { supabase } from "../supabaseClient.js";

const router = express.Router();

// Calcular experiencia necesaria para un nivel dado
function xpForLevel(level) {
  // Fórmula exponencial ligera
  return Math.floor(100 * Math.pow(1.2, level - 1));
}

router.post("/:id/train", async (req, res) => {
  const { id } = req.params;

  try {
    const { data: char, error: charError } = await supabase
      .from("characters")
      .select("*")
      .eq("id", id)
      .single();

    if (charError || !char) {
      return res.status(400).json({ error: "Personaje no encontrado" });
    }

    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("*")
      .eq("character_id", id)
      .single();

    if (walletError || !wallet) {
      return res.status(400).json({ error: "Wallet no encontrada" });
    }

    let newExp = char.experience + 100;
    let newLevel = char.level;
    let newSkillPoints = char.available_skill_points || 0;
    let expNeeded = xpForLevel(newLevel);

    // Subir de nivel progresivamente si alcanza
    while (newExp >= expNeeded) {
      newExp -= expNeeded;       // rollover XP
      newLevel++;                // subir nivel
      newSkillPoints += 5;       // bonus
      expNeeded = xpForLevel(newLevel);
    }

    // Actualizar personaje
    const { data: updatedChar, error: updateError } = await supabase
      .from("characters")
      .update({
        experience: newExp,
        level: newLevel,
        experience_to_next_level: expNeeded,
        available_skill_points: newSkillPoints,
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    // Actualizar wallet
    const { data: updatedWallet, error: walletUpdateError } = await supabase
      .from("wallets")
      .update({
        lupicoins: wallet.lupicoins + 150,
      })
      .eq("id", wallet.id)
      .select()
      .single();

    if (walletUpdateError) {
      return res.status(400).json({ error: walletUpdateError.message });
    }

    return res.json({
      character: updatedChar,
      wallet: updatedWallet,
      leveledUp: newLevel > char.level, // 👍 para mostrar popup en frontend
    });
  } catch (err) {
    console.error("❌ Error en train:", err);
    return res.status(500).json({ error: "Error interno en entrenamiento" });
  }
});

export default router;
