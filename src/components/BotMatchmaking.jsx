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
      }, 5000);
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

      await simulateMatch(matchData.match.id, bot);
      
    } catch (error) {
      console.error("Error en partida contra bot:", error);
      alert("Error al jugar contra bot");
    } finally {
      setLoading(false);
      setSelectedBot(null);
    }
  };

  const simulateMatch = async (matchId, bot) => {
    setSimulating(true);
    
    try {
      const response = await fetch(`https://lupiback.onrender.com/bots/${matchId}/simulate`, {
        method: "POST",
      });

      const data = await response.json();
      
      if (response.ok) {
        setMatchResult({
          ...data,
          botName: bot.name
        });
        fetchMatchHistory();
        if (onMatchUpdate) setTimeout(() => onMatchUpdate(), 1000);
      } else {
        alert(data.error || "Error al simular partida");
      }
    } catch (error) {
      console.error("Error simulando partida:", error);
      alert("Error al simular partida");
    } finally {
      setSimulating(false);
    }
  };

  const closeResult = () => {
    setMatchResult(null);
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
      />
      
      {matchResult && (
        <MatchResult
          result={matchResult}
          character={character}
          onClose={closeResult}
        />
      )}
    </div>
  );
};

export default BotMatchmaking;
