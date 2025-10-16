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
