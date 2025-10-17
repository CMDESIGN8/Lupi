import React, { useState, useEffect, useRef } from "react";
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
  const [finalStats, setFinalStats] = useState(null); // ✅ NUEVO ESTADO

  useEffect(() => {
    fetchBots();
    if (character) {
      fetchMatchHistory();
    }
  }, [character]);

  useEffect(() => {
    if (matchResult) {
      const timer = setTimeout(() => {
        closeResult();
      }, 10000); // 10 segundos para ver resultados
      return () => clearTimeout(timer);
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
    setBots(data.bots || []); // ✅ Asegurar que sea array
  } catch (error) {
    console.error("Error cargando bots:", error);
    setBots([]); // ✅ En caso de error, establecer array vacío
  }
};

  const startBotMatch = async (bot) => {
    if (!character) return;
    
    setLoading(true);
    setSelectedBot(bot);
    
    try {
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

      // ✅ INICIAR SIMULACIÓN VISUAL (sin llamar al backend aún)
      setSimulating(true);
      
    } catch (error) {
      console.error("Error en partida contra bot:", error);
      alert("Error al jugar contra bot");
    } finally {
      setLoading(false);
      // No resetear selectedBot aquí para que TrainingDashboard pueda usarlo
    }
  };

  // ✅ NUEVA FUNCIÓN: Manejar finalización de simulación visual
  const handleMatchFinish = async (matchStats) => {
    console.log("🏁 Simulación visual terminada, guardando resultados...");
    
    // Guardar estadísticas para mostrar en MatchResult
    setFinalStats(matchStats);
    
    try {
      // Ahora llamar al backend para guardar el resultado real
      if (selectedBot) {
        const matchResponse = await fetch(`https://lupiback.onrender.com/bots/match`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            characterId: character.id, 
            botId: selectedBot.id 
          }),
        });

        const matchData = await matchResponse.json();

        if (matchResponse.ok && matchData.match?.id) {
          // Simular el partido en el backend para obtener recompensas
          const simulateResponse = await fetch(`https://lupiback.onrender.com/bots/${matchData.match.id}/simulate`, {
            method: "POST",
          });

          const simulateData = await simulateResponse.json();
          
          if (simulateResponse.ok) {
            setMatchResult({
              ...simulateData,
              botName: selectedBot.name,
              simulation: {
                ...simulateData.simulation,
                // ✅ Asegurar que tenemos las estadísticas de la simulación visual
                userStats: matchStats?.user,
                botStats: matchStats?.bot
              }
            });
            
            // Actualizar historial y datos del personaje
            fetchMatchHistory();
            if (onMatchUpdate) setTimeout(() => onMatchUpdate(), 1000);
          } else {
            console.error("Error en simulación backend:", simulateData);
            // Mostrar resultado igual con stats visuales
            setMatchResult({
              simulation: {
                player1Score: matchStats?.user?.goals || 0,
                player2Score: matchStats?.bot?.goals || 0,
                winnerId: (matchStats?.user?.goals || 0) > (matchStats?.bot?.goals || 0) ? character.id : selectedBot.id,
                userStats: matchStats?.user,
                botStats: matchStats?.bot
              },
              rewards: {
                exp: 50 + (matchStats?.user?.goals || 0) * 10,
                coins: 30 + (matchStats?.user?.goals || 0) * 5
              },
              botName: selectedBot.name,
              leveledUp: false
            });
          }
        }
      }
    } catch (error) {
      console.error("Error guardando resultado:", error);
      // Mostrar resultado con stats visuales aunque falle el backend
      setMatchResult({
        simulation: {
          player1Score: matchStats?.user?.goals || 0,
          player2Score: matchStats?.bot?.goals || 0,
          winnerId: (matchStats?.user?.goals || 0) > (matchStats?.bot?.goals || 0) ? character.id : selectedBot.id,
          userStats: matchStats?.user,
          botStats: matchStats?.bot
        },
        rewards: {
          exp: 50 + (matchStats?.user?.goals || 0) * 10,
          coins: 30 + (matchStats?.user?.goals || 0) * 5
        },
        botName: selectedBot?.name || 'RIVAL',
        leveledUp: false
      });
    } finally {
      setSimulating(false);
      setSelectedBot(null);
    }
  };

  const closeResult = () => {
    setMatchResult(null);
    setFinalStats(null);
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
      <TrainingDashboard
        character={character}
        bots={bots}
        matchHistory={matchHistory}
        loading={loading}
        simulating={simulating}
        selectedBot={selectedBot}
        onStartMatch={startBotMatch}
        onMatchFinish={handleMatchFinish}
        matchResult={matchResult}
        onCloseResult={closeResult}
        finalStats={finalStats}
      />
    </div>
  );
};

export default BotMatchmaking;
