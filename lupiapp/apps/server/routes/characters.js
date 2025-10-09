import express from "express";
import { supabase } from "../supabaseClient.js";

const router = express.Router();

// Entrenar: +100 XP y +150 Lupicoins
router.post("/:id/train", async (req, res) => {
  const { id } = req.params;

  try {
    // Buscar personaje
    const { data: char, error: charError } = await supabase
      .from("characters")
      .select("*")
      .eq("id", id)
      .single();

    if (charError || !char) {
      return res.status(400).json({ error: "Personaje no encontrado" });
    }

    // Buscar wallet asociada
    const { data: wallet, error: walletError } = await supabase
      .from("wallets")
      .select("*")
      .eq("character_id", id)
      .single();

    if (walletError || !wallet) {
      return res.status(400).json({ error: "Wallet no encontrada" });
    }

    // Calcular nueva experiencia
    let newExp = char.experience + 100;
    let newLevel = char.level;
    let newSkillPoints = char.available_skill_points || 0;

    if (newExp >= char.experience_to_next_level) {
      newLevel++;
      newSkillPoints += 5;
      newExp = newExp - char.experience_to_next_level; // rollover simple
    }

    // Actualizar personaje
    const { data: updatedChar, error: updateError } = await supabase
      .from("characters")
      .update({
        experience: newExp,
        level: newLevel,
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

    return res.json({ character: updatedChar, wallet: updatedWallet });
  } catch (err) {
    console.error("❌ Error en train:", err);
    return res.status(500).json({ error: "Error interno en entrenamiento" });
  }
});

export default router;
