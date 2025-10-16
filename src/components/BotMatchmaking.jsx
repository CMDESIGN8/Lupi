import React, { useState, useEffect } from "react";

// Los estilos se han movido aquí para resolver el error de importación.
const Styles = () => (
  <style>{`
    /* --- Estilos para el Modal de Resultado --- */
    .simulation-overlay.result-modal {
      cursor: pointer;
    }

    .simulation-content.result-content {
      background-color: #2c3e50;
      color: #ecf0f1;
      padding: 30px 40px;
      border-radius: 15px;
      text-align: center;
      border: 2px solid #3498db;
      max-width: 400px;
      cursor: default;
    }

    .result-content h2 {
      font-size: 2.2rem;
      margin-top: 0;
      margin-bottom: 10px;
      color: #5dade2;
      font-weight: 700;
    }

    .result-score {
      font-size: 3rem;
      font-weight: bold;
      margin: 10px 0;
      color: #fff;
    }

    .result-opponent {
      font-size: 1.2rem;
      color: #bdc3c7;
      margin-bottom: 25px;
    }

    .result-rewards {
      background-color: rgba(0, 0, 0, 0.2);
      padding: 15px;
      border-radius: 10px;
      margin-bottom: 25px;
    }

    .result-rewards h3 {
      margin: 0 0 10px;
      color: #f1c40f;
      font-size: 1.3rem;
    }

    .result-rewards p {
      margin: 5px 0;
      font-size: 1.1rem;
    }

    .error-message {
      color: #e74c3c;
      font-size: 1.1rem;
    }

    .close-modal-btn {
      background-color: #3498db;
      color: white;
      border: none;
      padding: 12px 25px;
      font-size: 1rem;
      font-weight: bold;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 0.3s ease;
      width: 100%;
    }

    .close-modal-btn:hover {
      background-color: #2980b9;
    }

    /* --- Estilos base --- */
    .bot-matchmaking {
      padding: 20px;
      font-family: 'Arial', sans-serif;
      max-width: 900px;
      margin: auto;
    }
    .bots-header {
      text-align: center;
      margin-bottom: 30px;
    }
    .bots-header h1 {
      font-size: 2rem;
    }
    .bots-subtitle {
      font-size: 1rem;
      color: #666;
    }
    .simulation-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
    }
    .simulation-content {
      text-align: center;
      color: white;
    }
    .simulation-spinner {
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top: 4px solid #fff;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .bots-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
    }
    .bot-card {
      background-color: #f9f9f9;
      border-radius: 10px;
      padding: 15px;
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      display: flex;
      flex-direction: column;
    }
    .bot-header {
      display: flex;
      align-items: center;
      margin-bottom: 15px;
    }
    .bot-avatar {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 2rem;
      margin-right: 15px;
    }
    .bot-name {
      margin: 0;
      font-size: 1.2rem;
    }
    .bot-meta {
      display: flex;
      gap: 10px;
      font-size: 0.8rem;
    }
    .bot-level {
      font-weight: bold;
    }
    .rewards-section {
      margin-top: auto;
      padding-top: 15px;
      border-top: 1px solid #eee;
    }
    .play-btn {
      padding: 10px 15px;
      border: none;
      border-radius: 5px;
      color: white;
      cursor: pointer;
      font-size: 1rem;
      margin-top: 15px;
      transition: transform 0.2s;
    }
    .play-btn:hover {
      transform: scale(1.05);
    }
    .play-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .no-character-message {
      text-align: center;
      padding: 20px;
      background-color: #fffbe6;
      border: 1px solid #ffe58f;
      border-radius: 5px;
      margin-top: 20px;
    }
  `}</style>
);


const BotMatchmaking = ({ character, onMatchUpdate }) => {
  const [bots, setBots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [selectedBot, setSelectedBot] = useState(null);
  
  // Estado para el modal de resultados
  const [matchResult, setMatchResult] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);


  useEffect(() => {
    fetchBots();
  }, []);

  const fetchBots = async () => {
    setLoading(true);
    try {
      const response = await fetch(`https://lupiback.onrender.com/bots`);
      const data = await response.json();
      setBots(data.bots || []);
    } catch (error) {
      console.error("Error cargando bots:", error);
    } finally {
      setLoading(false);
    }
  };

  const startBotMatch = async (bot) => {
    if (!character || simulating) return;
  
    setSimulating(true);
    setSelectedBot(bot);
  
    try {
      // 1️⃣ Crear partida contra bot
      const matchResponse = await fetch(`https://lupiback.onrender.com/bots/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          characterId: character.id, 
          botId: bot.id 
        }),
      });

      const matchData = await matchResponse.json();

      if (!matchResponse.ok || !matchData.match?.id) {
        console.error("❌ Error creando partida:", matchData);
        // Usaremos el modal para mostrar errores también
        setMatchResult({
            success: false,
            message: matchData.error || "Error al iniciar la partida.",
        });
        setIsModalOpen(true);
        return;
      }

      // 2️⃣ Simular partida
      // Añadimos un pequeño delay para que la UI se sienta más fluida
      setTimeout(() => {
          simulateMatch(matchData.match.id, bot);
      }, 1500); // 1.5 segundos de "simulación"
    
    } catch (error) {
      console.error("Error en el flujo de partida:", error);
      setMatchResult({
        success: false,
        message: "Error de conexión al jugar contra el bot.",
      });
      setIsModalOpen(true);
    }
  };

  const simulateMatch = async (matchId, bot) => {
    try {
      const response = await fetch(`https://lupiback.onrender.com/bots/${matchId}/simulate`, {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setMatchResult({
          success: true,
          ...data,
          botName: bot.name
        });
        setIsModalOpen(true);

        if (onMatchUpdate) {
          onMatchUpdate(); // Actualiza datos del personaje (exp, monedas)
        }
      } else {
        throw new Error(data.error || "Error desconocido al simular");
      }
    } catch (error) {
      console.error("Error simulando partida:", error);
      setMatchResult({
        success: false,
        message: error.message,
      });
      setIsModalOpen(true);
    } finally {
      setSimulating(false);
      setSelectedBot(null);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setMatchResult(null);
  }

  // --- Funciones de UI ---
  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return '#4cc9f0';
      case 'medium': return '#4361ee';
      case 'hard': return '#7209b7';
      default: return '#00bbf9';
    }
  };
  const getDifficultyText = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'FÁCIL';
      case 'medium': return 'MEDIO';
      case 'hard': return 'DIFÍCIL';
      default: return difficulty.toUpperCase();
    }
  };
  const getBotAvatar = (botLevel) => {
    if (botLevel <= 2) return "🥅";
    if (botLevel <= 4) return "⚽";
    if (botLevel <= 6) return "👟";
    if (botLevel <= 8) return "🔥";
    return "🏆";
  };

  return (
    <div className="bot-matchmaking">
      <Styles />
      {/* Modal de Simulación */}
      {simulating && (
        <div className="simulation-overlay">
          <div className="simulation-content">
            <div className="simulation-spinner"></div>
            <h3>SIMULANDO PARTIDA...</h3>
            <p>Contra {selectedBot?.name}</p>
          </div>
        </div>
      )}
      
      {/* Modal de Resultado */}
      {isModalOpen && matchResult && (
        <div className="simulation-overlay result-modal" onClick={closeModal}>
            <div className="simulation-content result-content" onClick={(e) => e.stopPropagation()}>
                {matchResult.success ? (
                    <>
                        <h2>{matchResult.message}</h2>
                        <p className="result-score">
                            {matchResult.simulation.player1Score} - {matchResult.simulation.player2Score}
                        </p>
                        <p className="result-opponent">Contra {matchResult.botName}</p>
                        <div className="result-rewards">
                            <h3>Recompensas Obtenidas:</h3>
                            <p>+ {matchResult.rewards.exp} EXP</p>
                            <p>+ {matchResult.rewards.coins} 🪙</p>
                        </div>
                    </>
                ) : (
                    <>
                        <h2>Error</h2>
                        <p className="error-message">{matchResult.message}</p>
                    </>
                )}
                <button onClick={closeModal} className="close-modal-btn">Cerrar</button>
            </div>
        </div>
      )}

      <div className="bots-header">
        <h1>🤖 ENTRENAMIENTO CONTRA BOTS</h1>
        <p className="bots-subtitle">
          Mejora tus habilidades y gana experiencia y lupicoins.
        </p>
      </div>

      <div className="bots-grid">
        {bots.map(bot => (
          <div key={bot.id} className="bot-card">
            <div className="bot-header">
              <div className="bot-avatar" style={{ background: `linear-gradient(135deg, ${getDifficultyColor(bot.difficulty)}, #7b2cbf)`}}>
                {getBotAvatar(bot.level)}
              </div>
              <div className="bot-info">
                <h3 className="bot-name">{bot.name}</h3>
                <div className="bot-meta">
                  <span className="bot-level">NIVEL {bot.level}</span>
                  <span className="bot-difficulty" style={{ color: getDifficultyColor(bot.difficulty) }}>
                    {getDifficultyText(bot.difficulty)}
                  </span>
        _Borrador guardado._           </div>
              </div>
            </div>

            <button
              className={`play-btn ${bot.difficulty}`}
              onClick={() => startBotMatch(bot)}
              disabled={loading || simulating || !character}
              style={{ background: `linear-gradient(135deg, ${getDifficultyColor(bot.difficulty)}, #7b2cbf)`}}
            >
              {simulating && selectedBot?.id === bot.id ? "EN PARTIDA..." : `⚽ JUGAR`}
            </button>
          </div>
        ))}
      </div>

      {!character && (
        <div className="no-character-message">
          <p>⚠️ Necesitas seleccionar un personaje para entrenar.</p>
        </div>
      )}
    </div>
  );
};

export default BotMatchmaking;
