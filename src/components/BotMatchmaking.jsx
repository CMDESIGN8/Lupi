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
  const [finalStats, setFinalStats] = useState(null);
  const [showResult, setShowResult] = useState(false); // ✅ NUEVO ESTADO para controlar visibilidad

  useEffect(() => {
    fetchBots();
    if (character) {
      fetchMatchHistory();
    }
  }, [character]);

  useEffect(() => {
    if (matchResult) {
      console.log("🔄 MatchResult actualizado, mostrando resultado...", matchResult);
      setShowResult(true);
      
      const timer = setTimeout(() => {
        closeResult();
      }, 10000);
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

      // ✅ INICIAR SIMULACIÓN VISUAL
      setSimulating(true);
      
    } catch (error) {
      console.error("Error en partida contra bot:", error);
      alert("Error al jugar contra bot");
    } finally {
      setLoading(false);
    }
  };

  // ✅ FUNCIÓN MEJORADA: Manejar finalización de simulación visual
  const handleMatchFinish = async (matchStats) => {
    console.log("🏁 Simulación visual terminada, guardando resultados...", matchStats);
    
    // Guardar estadísticas para mostrar en MatchResult
    setFinalStats(matchStats);
    
    try {
      // Llamar al backend para guardar el resultado real
      if (selectedBot) {
        console.log("📡 Enviando resultado al backend...");
        
        const matchResponse = await fetch(`https://lupiback.onrender.com/bots/match`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            characterId: character.id, 
            botId: selectedBot.id 
          }),
        });

        const matchData = await matchResponse.json();
        console.log("📦 Respuesta del backend (match):", matchData);

        if (matchResponse.ok && matchData.match?.id) {
          // Simular el partido en el backend para obtener recompensas
          const simulateResponse = await fetch(`https://lupiback.onrender.com/bots/${matchData.match.id}/simulate`, {
            method: "POST",
          });

          const simulateData = await simulateResponse.json();
          console.log("📦 Respuesta del backend (simulate):", simulateData);
          
          if (simulateResponse.ok) {
            // ✅ ESTABLECER RESULTADO CON DATOS DEL BACKEND
            setMatchResult({
              ...simulateData,
              botName: selectedBot.name,
              simulation: {
                ...simulateData.simulation,
                // Mantener las estadísticas visuales también
                userStats: matchStats?.user,
                botStats: matchStats?.bot
              }
            });
            
            // Actualizar historial y datos del personaje
            fetchMatchHistory();
            if (onMatchUpdate) setTimeout(() => onMatchUpdate(), 1000);
          } else {
            console.error("❌ Error en simulación backend:", simulateData);
            // ✅ CREAR RESULTADO CON STATS VISUALES
            createVisualResult(matchStats);
          }
        } else {
          console.error("❌ Error creando match en backend");
          // ✅ CREAR RESULTADO CON STATS VISUALES
          createVisualResult(matchStats);
        }
      } else {
        console.error("❌ No hay bot seleccionado");
        createVisualResult(matchStats);
      }
    } catch (error) {
      console.error("❌ Error guardando resultado:", error);
      // ✅ CREAR RESULTADO CON STATS VISUALES
      createVisualResult(matchStats);
    } finally {
      setSimulating(false);
      // No resetear selectedBot inmediatamente, esperar a que se muestre el resultado
    }
  };

  // ✅ NUEVA FUNCIÓN: Crear resultado basado en simulación visual
  const createVisualResult = (matchStats) => {
    const userGoals = matchStats?.user?.goals || 0;
    const botGoals = matchStats?.bot?.goals || 0;
    
    const visualResult = {
      simulation: {
        player1Score: userGoals,
        player2Score: botGoals,
        winnerId: userGoals > botGoals ? character.id : (userGoals === botGoals ? null : selectedBot?.id),
        userStats: matchStats?.user,
        botStats: matchStats?.bot
      },
      rewards: {
        exp: 50 + (userGoals * 10) + (userGoals > botGoals ? 50 : 0),
        coins: 30 + (userGoals * 5) + (userGoals > botGoals ? 25 : 0)
      },
      botName: selectedBot?.name || 'RIVAL',
      leveledUp: false
    };
    
    console.log("🎨 Creando resultado visual:", visualResult);
    setMatchResult(visualResult);
    
    // Actualizar historial localmente
    fetchMatchHistory();
    if (onMatchUpdate) setTimeout(() => onMatchUpdate(), 1000);
  };

  const closeResult = () => {
    console.log("🔒 Cerrando resultado...");
    setShowResult(false);
    setMatchResult(null);
    setFinalStats(null);
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
      {/* ✅ MOSTRAR TrainingDashboard SOLO SI NO HAY RESULTADO VISIBLE */}
      {!showResult && (
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
      )}
      
      {/* ✅ MOSTRAR MatchResult CUANDO HAY RESULTADO Y showResult ES TRUE */}
      {showResult && matchResult && (
        <MatchResult
          result={matchResult}
          character={character}
          onClose={closeResult}
          finalStats={finalStats}
        />
      )}
    </div>
  );
};

export default BotMatchmaking;
