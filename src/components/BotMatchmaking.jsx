import React, { useState, useEffect } from "react";
import "../styles/BotMatchmaking.css";

const BotMatchmaking = ({ character, onMatchUpdate }) => {
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [selectedBot, setSelectedBot] = useState(null);

  useEffect(() => fetchBots(), []);

  const fetchBots = async () => {
    try {
      const res = await fetch("https://lupiback.onrender.com/bots");
      const data = await res.json();
      setBots(data.bots || []);
    } catch (err) {
      console.error(err);
    }
  };

  const startBotMatch = async (bot) => {
    if (!character) return;
    setLoading(true);
    setSelectedBot(bot);

    try {
      const res = await fetch("https://lupiback.onrender.com/bots/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId: character.id, botId: bot.id }),
      });

      const data = await res.json();

      if (!res.ok || !data.match?.id) return alert(data.error || "Error al iniciar partida");

      // ✅ Simular usando el ID correcto del match
      await simulateMatch(data.match.id, bot);
    } catch (err) {
      console.error(err);
      alert("Error al jugar contra bot");
    } finally {
      setLoading(false);
      setSelectedBot(null);
    }
  };

  const simulateMatch = async (matchId, bot) => {
    setSimulating(true);
    try {
      const res = await fetch(`https://lupiback.onrender.com/bots/${matchId}/simulate`, { method: "POST" });
      const data = await res.json();

      if (res.ok) {
        const msg =
          data.simulation.winnerId === character.id
            ? `🎉 ¡GANASTE! ${data.simulation.player1Score}-${data.simulation.player2Score}\nContra ${bot.name}`
            : data.simulation.player1Score === data.simulation.player2Score
            ? `🤝 EMPATE ${data.simulation.player1Score}-${data.simulation.player2Score}\nContra ${bot.name}`
            : `😞 Perdiste ${data.simulation.player1Score}-${data.simulation.player2Score}\nContra ${bot.name}`;
        alert(msg);

        if (onMatchUpdate) setTimeout(() => onMatchUpdate(), 500);
      } else {
        alert(data.error || "Error al simular partida");
      }
    } catch (err) {
      console.error(err);
      alert("Error al simular partida");
    } finally {
      setSimulating(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case "easy": return "#4cc9f0";
      case "medium": return "#4361ee";
      case "hard": return "#7209b7";
      default: return "#00bbf9";
    }
  };

  return (
    <div className="bot-matchmaking">
      <h1>🤖 ENTRENAMIENTO CONTRA BOTS</h1>
      <div className="bots-grid">
        {bots.map((bot) => (
          <div key={bot.id} className="bot-card">
            <h3>{bot.name} - Nivel {bot.level}</h3>
            <button
              disabled={loading}
              style={{ background: getDifficultyColor(bot.difficulty) }}
              onClick={() => startBotMatch(bot)}
            >
              {loading && selectedBot?.id === bot.id ? "🔄 CARGANDO..." : `⚽ ENTRENAR CONTRA ${bot.name}`}
            </button>
          </div>
        ))}
      </div>
      {simulating && <div className="simulation-overlay">SIMULANDO...</div>}
    </div>
  );
};

export default BotMatchmaking;
