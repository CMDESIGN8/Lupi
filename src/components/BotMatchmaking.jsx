import React, { useState, useEffect } from "react";
import "../styles/BotMatchmaking.css";
import TrainingDashboard from "./TrainingDashboard";
import MatchResult from "./MatchResult";

const BotMatchmaking = ({ character, onMatchUpdate }) => {
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [selectedBot, setSelectedBot] = useState(null);
  const [matchHistory, setMatchHistory] = useState([]);
  const [matchResult, setMatchResult] = useState(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    fetchBots();
    if (character) {
      fetchMatchHistory();
    }
  }, [character]);

  // ✅ Control manual del resultado
  useEffect(() => {
    if (matchResult) {
      console.log("🔄 MatchResult actualizado, mostrando resultado...", matchResult);
      setShowResult(true);
    }
  }, [matchResult]);

  const fetchMatchHistory = async () => {
    try {
      const response = await fetch(`https://lupiback.onrender.com/bots/history/${character.id}`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      const data = await response.json();
      setMatchHistory(data.matches || []);
    } catch (error) {
      console.error("Error cargando historial:", error);
      setMatchHistory([]);
    }
  };

  const fetchBots = async () => {
    try {
      const response = await fetch(`https://lupiback.onrender.com/bots`);
      const data = await response.json();
      setBots(data.bots || []);
    } catch (error) {
      console.error("Error cargando bots:", error);
      setBots([]);
    }
  };

  const startBotMatch = async (bot) => {
    if (!character) return;
    
    setLoading(true);
    setSelectedBot(bot);
    
    try {
      // 1. Crear partida en backend
      const matchResponse = await fetch(`https://lupiback.onrender.com/bots/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId: character.id, botId: bot.id }),
      });

      const matchData = await matchResponse.json();

      if (!matchResponse.ok) {
        alert(matchData.error || "Error al iniciar partida");
        return;
      }

      if (!matchData.match?.id) {
        alert("No se pudo obtener el ID de la partida");
        return;
      }

      // 2. Iniciar simulación visual (pero NO generar estadísticas propias)
      setSimulating(true);
      
      // 3. Simular en backend para obtener resultado REAL
      console.log("📡 Simulando partida en backend...");
      const simulateResponse = await fetch(`https://lupiback.onrender.com/bots/${matchData.match.id}/simulate`, {
        method: "POST",
      });

      const simulateData = await simulateResponse.json();
      console.log("📦 Resultado REAL del backend:", simulateData);
      
      if (simulateResponse.ok) {
        // 4. Usar SOLO los datos del backend
        setMatchResult({
          ...simulateData,
          botName: bot.name,
          // Asegurar que simulation tenga los datos correctos
          simulation: {
            player1Score: simulateData.simulation?.player1Score || simulateData.match?.player1_score,
            player2Score: simulateData.simulation?.player2Score || simulateData.match?.player2_score,
            winnerId: simulateData.simulation?.winnerId || simulateData.match?.winner_id,
            // No usar estadísticas visuales, solo las del backend si existen
            userStats: simulateData.simulation?.userStats || null
          }
        });
        
        // 5. Actualizar datos
        fetchMatchHistory();
        if (onMatchUpdate) setTimeout(() => onMatchUpdate(), 1000);
        
      } else {
        console.error("❌ Error en simulación backend:", simulateData);
        alert("Error al simular partida");
      }
      
    } catch (error) {
      console.error("Error en partida contra bot:", error);
      alert("Error al jugar contra bot");
    } finally {
      setLoading(false);
      setSimulating(false);
    }
  };

  // ✅ MODIFICAR: La simulación visual solo muestra animación, NO genera resultado
  const handleMatchFinish = async (matchStats) => {
    console.log("🏁 Simulación visual terminada (solo animación)");
    // NO hacemos nada aquí porque el resultado ya viene del backend
    // Solo cerramos la simulación visual
    setSimulating(false);
  };

  const closeResult = () => {
    console.log("🔒 Cerrando resultado manualmente...");
    setShowResult(false);
    setMatchResult(null);
    setSelectedBot(null);
  };

  if (!character) {
    return (
      <div className="bot-matchmaking-container no-character">
        <div className="no-character-message">
          <h3>⚠️ PERSONAJE REQUERIDO</h3>
          <p>Necesitas crear un personaje para acceder al entrenamiento</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bot-matchmaking-container">
      {/* MOSTRAR TrainingDashboard SOLO SI NO HAY RESULTADO VISIBLE */}
      {!showResult && (
        <TrainingDashboard
          character={character}
          bots={bots}
          matchHistory={matchHistory}
          loading={loading}
          simulating={simulating}
          selectedBot={selectedBot}
          onStartMatch={startBotMatch}
          onMatchFinish={handleMatchFinish} // Solo para cerrar animación
          matchResult={matchResult}
          onCloseResult={closeResult}
        />
      )}
      
      {/* MOSTRAR MatchResult CON DATOS REALES DEL BACKEND */}
      {showResult && matchResult && (
        <MatchResult
          result={matchResult}
          character={character}
          onClose={closeResult}
          // NO pasar finalStats para evitar conflicto con datos backend
        />
      )}
    </div>
  );
};

export default BotMatchmaking;
