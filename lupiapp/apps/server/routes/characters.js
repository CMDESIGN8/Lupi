import express from "express";
import { supabase } from "../supabaseClient.js"; // tu cliente supabase central
const router = express.Router();

// Actualizar stat y skill points
router.put("/:id/stat", async (req, res) => {
  const { id } = req.params;
  const { statKey, newValue, available_skill_points } = req.body;

  const { data, error } = await supabase
    .from("characters")
    .update({
      [statKey]: newValue,
      available_skill_points
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Entrenar: +100 XP y +150 Lupicoins
router.post("/:id/train", async (req, res) => {
  const { id } = req.params;

  // Buscar personaje
  const { data: char, error: charError } = await supabase
    .from("characters")
    .select("id, experience, experience_to_next_level, level, user_id")
    .eq("id", id)
    .single();

  if (charError) return res.status(400).json({ error: charError.message });

  // Buscar wallet asociada
  const { data: wallet, error: walletError } = await supabase
    .from("wallets")
    .select("id, lupicoins")
    .eq("character_id", id)
    .single();

  if (walletError) return res.status(400).json({ error: walletError.message });

  // Actualizar XP
  const newExp = char.experience + 100;
  let newLevel = char.level;
  let expToNext = char.experience_to_next_level;
  let availableSkillPoints = 0;

  // Subir nivel si alcanzó
  if (newExp >= expToNext) {
    newLevel++;
    availableSkillPoints = 5; // bonus de skill points al subir nivel
  }

  // Update personaje
  const { data: updatedChar, error: updateError } = await supabase
    .from("characters")
    .update({
      experience: newExp,
      level: newLevel,
      available_skill_points: supabase.rpc("increment_skill_points", { points: availableSkillPoints })
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError) return res.status(400).json({ error: updateError.message });

  // Update wallet
  const { data: updatedWallet, error: walletUpdateError } = await supabase
    .from("wallets")
    .update({
      lupicoins: wallet.lupicoins + 150
    })
    .eq("id", wallet.id)
    .select()
    .single();

  if (walletUpdateError) return res.status(400).json({ error: walletUpdateError.message });

  res.json({ character: updatedChar, wallet: updatedWallet });
});

export default router;
