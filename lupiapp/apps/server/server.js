import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Conexión a Supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // usamos service role para full access en backend
);

// Rutas de prueba
app.get("/", (req, res) => {
  res.send("🐺 LupiApp Backend corriendo...");
});

// Listar perfiles
app.get("/profiles", async (req, res) => {
  const { data, error } = await supabase.from("profiles").select("*").limit(10);
  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Crear personaje
app.post("/characters", async (req, res) => {
  const { user_id, nickname } = req.body;

  const { data, error } = await supabase.from("characters").insert([
    {
      user_id,
      nickname,
    },
  ]).select().single();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Obtener personaje por user_id
app.get("/characters/:userId", async (req, res) => {
  const { userId } = req.params;
  const { data, error } = await supabase
    .from("characters")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

// Wallet por personaje
app.get("/wallets/:characterId", async (req, res) => {
  const { characterId } = req.params;
  const { data, error } = await supabase
    .from("wallets")
    .select("*")
    .eq("character_id", characterId)
    .maybeSingle();

  if (error) return res.status(400).json({ error: error.message });
  res.json(data);
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 LupiApp backend escuchando en http://localhost:${PORT}`);
});
