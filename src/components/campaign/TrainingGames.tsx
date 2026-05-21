// src/components/campaign/TrainingGames.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Minijuegos de entrenamiento y selector
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export type TrainingStat = 'finishing' | 'dribbling' | 'defending' | 'passing' | 'physical';

export interface TrainingResult {
  stat: TrainingStat;
  grade: 'S' | 'A' | 'B' | 'C';
  delta: number;      // 1-8 según rendimiento
  xpBonus: number;    // 50-200 según calificación
  message: string;
}

export interface TrainingGameProps {
  gameId: string;
  stat: TrainingStat;
  onComplete: (result: TrainingResult) => void;
}

export interface TrainingGameSelectorProps {
  onSelectGame: (gameId: string) => void;
}

// ── Games Configuration ───────────────────────────────────────────────────────

interface GameConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  stat: TrainingStat;
}

const AVAILABLE_GAMES: GameConfig[] = [
  {
    id: 'shooting',
    name: 'REMATE AL ARCO',
    icon: '🎯',
    description: 'Apuntá y definí con precisión',
    color: '#FF4757',
    stat: 'finishing',
  },
  {
    id: 'dribbling',
    name: 'GAMBETA RÁPIDA',
    icon: '⚡',
    description: 'Eslabón y velocidad con el balón',
    color: '#00E5FF',
    stat: 'dribbling',
  },
  {
    id: 'defending',
    name: 'MURO DEFENSIVO',
    icon: '🛡️',
    description: 'Anticipación e interceptación',
    color: '#2ED573',
    stat: 'defending',
  },
  {
    id: 'passing',
    name: 'TIRO LIBRE',
    icon: '🌀',
    description: 'Precisión en los pases',
    color: '#A55FEF',
    stat: 'passing',
  },
  {
    id: 'physical',
    name: 'FÍSICO',
    icon: '💪',
    description: 'Potencia y resistencia',
    color: '#FFA502',
    stat: 'physical',
  },
];

// ── Game Selector ─────────────────────────────────────────────────────────────

export function TrainingGameSelector({ onSelectGame }: TrainingGameSelectorProps) {
  return (
    <div style={selectorStyles.container}>
      <div style={selectorStyles.grid}>
        {AVAILABLE_GAMES.map(game => (
          <button
            key={game.id}
            onClick={() => onSelectGame(game.id)}
            style={{
              ...selectorStyles.gameCard,
              borderColor: game.color,
              boxShadow: `0 0 10px ${game.color}40`,
            }}
          >
            <div style={selectorStyles.gameIcon}>{game.icon}</div>
            <div style={selectorStyles.gameName}>{game.name}</div>
            <div style={selectorStyles.gameDesc}>{game.description}</div>
            <div style={{ ...selectorStyles.statTag, background: `${game.color}20`, color: game.color }}>
              +{getStatBonus(game.stat)}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Training Game: SHOOTING (Remate al arco) ─────────────────────────────────

function ShootingGame({ onComplete, stat }: TrainingGameProps) {
  const [targets, setTargets] = useState<{ id: number; x: number; y: number; active: boolean }[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [gameActive, setGameActive] = useState(true);
  const [shots, setShots] = useState(0);
  const [hit, setHit] = useState(false);

  // Generar objetivos
  useEffect(() => {
    const newTargets = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      x: Math.random() * 80 + 10,
      y: Math.random() * 60 + 20,
      active: true,
    }));
    setTargets(newTargets);
  }, []);

  // Temporizador
  useEffect(() => {
    if (!gameActive) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameActive(false);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameActive]);

  const handleShot = (targetId: number) => {
    if (!gameActive) return;
    setShots(prev => prev + 1);
    setHit(true);
    setTimeout(() => setHit(false), 200);
    
    setTargets(prev => prev.map(t => 
      t.id === targetId && t.active 
        ? { ...t, active: false }
        : t
    ));
    setScore(prev => prev + 1);
    
    // Generar nuevo objetivo
    setTimeout(() => {
      setTargets(prev => [
        ...prev.filter(t => t.id !== targetId),
        {
          id: Date.now(),
          x: Math.random() * 80 + 10,
          y: Math.random() * 60 + 20,
          active: true,
        },
      ]);
    }, 300);
  };

  useEffect(() => {
    if (!gameActive && timeLeft === 0) {
      const accuracy = shots > 0 ? (score / shots) * 100 : 0;
      const result = calculateResult(score, accuracy, stat);
      onComplete(result);
    }
  }, [gameActive, score, shots, timeLeft]);

  return (
    <div style={gameStyles.container}>
      <div style={gameStyles.stats}>
        <div style={gameStyles.stat}>🎯 Aciertos: {score}</div>
        <div style={gameStyles.stat}>⏱️ {timeLeft}s</div>
        <div style={gameStyles.stat}>📊 Precisión: {shots > 0 ? Math.round((score / shots) * 100) : 0}%</div>
      </div>
      
      <div style={{ ...gameStyles.arena, background: 'radial-gradient(circle at center, #1a472a, #0a1a0f)' }}>
        {/* Marco simulando arco */}
        <div style={gameStyles.goalFrame}>
          <div style={gameStyles.goalNet}></div>
          {targets.filter(t => t.active).map(target => (
            <button
              key={target.id}
              onClick={() => handleShot(target.id)}
              style={{
                ...gameStyles.target,
                left: `${target.x}%`,
                top: `${target.y}%`,
                transform: hit ? 'scale(1.2)' : 'scale(1)',
              }}
            >
              🎯
            </button>
          ))}
        </div>
      </div>
      
      <div style={gameStyles.instructions}>
        Hacé click en los objetivos para anotar
      </div>
    </div>
  );
}

// ── Training Game: DRIBBLING (Gambeta rápida) ────────────────────────────────

function DribblingGame({ onComplete, stat }: TrainingGameProps) {
  const [cones, setCones] = useState<{ id: number; x: number; y: number }[]>([]);
  const [playerPos, setPlayerPos] = useState({ x: 10, y: 50 });
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [gameActive, setGameActive] = useState(true);
  const [combo, setCombo] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Generar conos
  useEffect(() => {
    const newCones = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 70 + 15,
      y: Math.random() * 80 + 10,
    }));
    setCones(newCones);
  }, []);

  // Temporizador
  useEffect(() => {
    if (!gameActive) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameActive(false);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameActive]);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!gameActive || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
      setPlayerPos({ x, y });
      
      // Check collision with cones
      const hitCone = cones.find(cone => 
        Math.hypot(cone.x - x, cone.y - y) < 5
      );
      
      if (hitCone) {
        setCones(prev => prev.filter(c => c.id !== hitCone.id));
        setScore(prev => prev + 10);
        setCombo(prev => prev + 1);
        
        // Generar nuevo cone
        setTimeout(() => {
          setCones(prev => [
            ...prev,
            {
              id: Date.now(),
              x: Math.random() * 70 + 15,
              y: Math.random() * 80 + 10,
            },
          ]);
        }, 500);
      }
    }
  };

  useEffect(() => {
    if (!gameActive && timeLeft === 0) {
      const result = calculateResult(score / 10, score / 80 * 100, stat);
      onComplete(result);
    }
  }, [gameActive, score, timeLeft]);

  return (
    <div style={gameStyles.container}>
      <div style={gameStyles.stats}>
        <div style={gameStyles.stat}>⚡ Conos: {cones.length}</div>
        <div style={gameStyles.stat}>⭐ Puntos: {score}</div>
        <div style={gameStyles.stat}>🔥 Combo: x{combo}</div>
        <div style={gameStyles.stat}>⏱️ {timeLeft}s</div>
      </div>
      
      <div
        ref={containerRef}
        onMouseMove={handleMove}
        style={{ ...gameStyles.arena, background: '#2d5a2c', cursor: 'none', position: 'relative' }}
      >
        {/* Cancha */}
        <div style={gameStyles.pitch}>
          {cones.map(cone => (
            <div
              key={cone.id}
              style={{
                ...gameStyles.cone,
                left: `${cone.x}%`,
                top: `${cone.y}%`,
              }}
            >
              🚧
            </div>
          ))}
          
          {/* Jugador */}
          <div
            style={{
              ...gameStyles.player,
              left: `${playerPos.x}%`,
              top: `${playerPos.y}%`,
            }}
          >
            ⚽
          </div>
        </div>
      </div>
      
      <div style={gameStyles.instructions}>
        Mové el mouse para esquivar los conos y ganar puntos
      </div>
    </div>
  );
}

// ── Training Game: DEFENDING (Muro defensivo) ─────────────────────────────────

function DefendingGame({ onComplete, stat }: TrainingGameProps) {
  const [attackers, setAttackers] = useState<{ id: number; x: number; y: number; active: boolean }[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(12);
  const [gameActive, setGameActive] = useState(true);
  const [interceptions, setInterceptions] = useState(0);

  useEffect(() => {
    // Generar atacantes periódicamente
    const interval = setInterval(() => {
      if (!gameActive) return;
      setAttackers(prev => [
        ...prev,
        {
          id: Date.now(),
          x: 90,
          y: Math.random() * 80 + 10,
          active: true,
        },
      ]);
    }, 1500);
    
    return () => clearInterval(interval);
  }, [gameActive]);

  // Mover atacantes
  useEffect(() => {
    if (!gameActive) return;
    const moveInterval = setInterval(() => {
      setAttackers(prev => 
        prev.map(a => ({
          ...a,
          x: a.x - 2,
        })).filter(a => a.x > 0 && a.active)
      );
    }, 100);
    return () => clearInterval(moveInterval);
  }, [gameActive]);

  // Temporizador
  useEffect(() => {
    if (!gameActive) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameActive(false);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameActive]);

  const handleIntercept = (attackerId: number) => {
    if (!gameActive) return;
    setAttackers(prev => prev.filter(a => a.id !== attackerId));
    setScore(prev => prev + 15);
    setInterceptions(prev => prev + 1);
  };

  useEffect(() => {
    if (!gameActive && timeLeft === 0) {
      const efficiency = (interceptions / (interceptions + attackers.length)) * 100;
      const result = calculateResult(interceptions, efficiency, stat);
      onComplete(result);
    }
  }, [gameActive, interceptions, score, timeLeft]);

  return (
    <div style={gameStyles.container}>
      <div style={gameStyles.stats}>
        <div style={gameStyles.stat}>🛡️ Intercepciones: {interceptions}</div>
        <div style={gameStyles.stat}>⭐ Puntos: {score}</div>
        <div style={gameStyles.stat}>⏱️ {timeLeft}s</div>
      </div>
      
      <div style={{ ...gameStyles.arena, background: '#1a3a2a', position: 'relative' }}>
        <div style={gameStyles.defensiveLine}>
          {attackers.map(attacker => (
            <button
              key={attacker.id}
              onClick={() => handleIntercept(attacker.id)}
              style={{
                ...gameStyles.attacker,
                left: `${attacker.x}%`,
                top: `${attacker.y}%`,
              }}
            >
              🏃
            </button>
          ))}
          
          {/* Defensor */}
          <div style={gameStyles.defender}>🛡️</div>
        </div>
      </div>
      
      <div style={gameStyles.instructions}>
        Hacé click en los atacantes para interceptarlos
      </div>
    </div>
  );
}

// ── Training Game: PASSING (Tiro libre/precisión) ────────────────────────────

function PassingGame({ onComplete, stat }: TrainingGameProps) {
  const [targets, setTargets] = useState<{ id: number; x: number; y: number; points: number }[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [gameActive, setGameActive] = useState(true);
  const [passes, setPasses] = useState(0);

  useEffect(() => {
    // Generar objetivos con diferentes puntos
    const newTargets = Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: Math.random() * 80 + 10,
      y: Math.random() * 80 + 10,
      points: Math.random() > 0.7 ? 30 : 10,
    }));
    setTargets(newTargets);
  }, []);

  useEffect(() => {
    if (!gameActive) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameActive(false);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameActive]);

  const handlePass = (targetId: number, points: number) => {
    if (!gameActive) return;
    setPasses(prev => prev + 1);
    setScore(prev => prev + points);
    
    setTargets(prev => prev.filter(t => t.id !== targetId));
    
    // Generar nuevo objetivo
    setTimeout(() => {
      setTargets(prev => [
        ...prev,
        {
          id: Date.now(),
          x: Math.random() * 80 + 10,
          y: Math.random() * 80 + 10,
          points: Math.random() > 0.7 ? 30 : 10,
        },
      ]);
    }, 400);
  };

  useEffect(() => {
    if (!gameActive && timeLeft === 0) {
      const accuracy = passes > 0 ? (targets.length === 0 ? 100 : (6 - targets.length) / 6 * 100) : 0;
      const result = calculateResult(score / 10, accuracy, stat);
      onComplete(result);
    }
  }, [gameActive, score, passes, timeLeft]);

  return (
    <div style={gameStyles.container}>
      <div style={gameStyles.stats}>
        <div style={gameStyles.stat}>🎯 Precisión: {passes}</div>
        <div style={gameStyles.stat}>⭐ Puntos: {score}</div>
        <div style={gameStyles.stat}>⏱️ {timeLeft}s</div>
      </div>
      
      <div style={{ ...gameStyles.arena, background: '#2a4a3a', position: 'relative' }}>
        <div style={gameStyles.passingField}>
          {targets.map(target => (
            <button
              key={target.id}
              onClick={() => handlePass(target.id, target.points)}
              style={{
                ...gameStyles.passTarget,
                left: `${target.x}%`,
                top: `${target.y}%`,
                background: target.points === 30 ? 'rgba(255, 215, 0, 0.3)' : 'rgba(0, 255, 135, 0.2)',
                borderColor: target.points === 30 ? '#FFD700' : '#00FF87',
              }}
            >
              🎯 {target.points}
            </button>
          ))}
          
          <div style={gameStyles.passer}>⚽</div>
        </div>
      </div>
      
      <div style={gameStyles.instructions}>
        Hacé click en los objetivos para completar pases precisos
      </div>
    </div>
  );
}

// ── Training Game: PHYSICAL (Entrenamiento físico) ───────────────────────────

function PhysicalGame({ onComplete, stat }: TrainingGameProps) {
  const [action, setAction] = useState<{ key: string; name: string } | null>(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [gameActive, setGameActive] = useState(true);
  const [reactions, setReactions] = useState(0);
  const [currentAction, setCurrentAction] = useState<{ key: string; name: string } | null>(null);

  const actions = [
    { key: 'ArrowUp', name: '⬆️ SALTAR' },
    { key: 'ArrowDown', name: '⬇️ AGACHARSE' },
    { key: 'ArrowLeft', name: '⬅️ ESQUIVAR' },
    { key: 'ArrowRight', name: '➡️ CORRER' },
    { key: ' ', name: '💪 FUERZA' },
  ];

  useEffect(() => {
    if (!gameActive) return;
    
    const interval = setInterval(() => {
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      setCurrentAction(randomAction);
      
      setTimeout(() => {
        setCurrentAction(null);
      }, 800);
    }, 1200);
    
    return () => clearInterval(interval);
  }, [gameActive]);

  useEffect(() => {
    if (!gameActive) return;
    
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!currentAction) return;
      
      const key = e.key === ' ' ? ' ' : e.key;
      if (key === currentAction.key) {
        setReactions(prev => prev + 1);
        setScore(prev => prev + 20);
        setCurrentAction(null);
        
        // Feedback visual
        const btn = document.getElementById('reaction-feedback');
        if (btn) {
          btn.style.transform = 'scale(1.1)';
          setTimeout(() => {
            if (btn) btn.style.transform = 'scale(1)';
          }, 200);
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentAction, gameActive]);

  useEffect(() => {
    if (!gameActive) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameActive(false);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [gameActive]);

  useEffect(() => {
    if (!gameActive && timeLeft === 0) {
      const result = calculateResult(reactions, (reactions / 15) * 100, stat);
      onComplete(result);
    }
  }, [gameActive, reactions, score, timeLeft]);

  return (
    <div style={gameStyles.container}>
      <div style={gameStyles.stats}>
        <div style={gameStyles.stat}>💪 Reacciones: {reactions}</div>
        <div style={gameStyles.stat}>⭐ Puntos: {score}</div>
        <div style={gameStyles.stat}>⏱️ {timeLeft}s</div>
      </div>
      
      <div style={{ ...gameStyles.arena, background: '#1a2a3a', textAlign: 'center', padding: 40 }}>
        <div id="reaction-feedback" style={gameStyles.reactionBox}>
          {currentAction ? (
            <div style={gameStyles.reactionAction}>
              <div style={gameStyles.reactionIcon}>
                {currentAction.name}
              </div>
              <div style={gameStyles.reactionHint}>
                Presioná: {currentAction.key === ' ' ? 'ESPACIO' : currentAction.key.toUpperCase()}
              </div>
            </div>
          ) : (
            <div style={gameStyles.reactionWait}>
              ⏳ Preparado...
            </div>
          )}
        </div>
      </div>
      
      <div style={gameStyles.instructions}>
        Reaccioná rápido a las acciones presionando la tecla correcta
      </div>
    </div>
  );
}

// ── Calculate Result ─────────────────────────────────────────────────────────

function calculateResult(score: number, accuracy: number, stat: TrainingStat): TrainingResult {
  // Basado en puntuación y precisión, determinar calificación y mejora
  let grade: 'S' | 'A' | 'B' | 'C';
  let delta: number;
  let xpBonus: number;
  let message: string;
  
  const performance = (score / 10) * (accuracy / 100);
  
  if (score >= 30 || accuracy >= 85 || performance >= 3) {
    grade = 'S';
    delta = 8;
    xpBonus = 200;
    message = '¡Perfecto! Mejoraste significativamente';
  } else if (score >= 20 || accuracy >= 70 || performance >= 2) {
    grade = 'A';
    delta = 5;
    xpBonus = 120;
    message = '¡Muy bien! Buen entrenamiento';
  } else if (score >= 10 || accuracy >= 50 || performance >= 1) {
    grade = 'B';
    delta = 3;
    xpBonus = 70;
    message = 'Bien, seguí practicando';
  } else {
    grade = 'C';
    delta = 1;
    xpBonus = 40;
    message = 'Necesitás más práctica';
  }
  
  return { stat, grade, delta, xpBonus, message };
}

function getStatBonus(stat: TrainingStat): string {
  const bonuses = {
    finishing: '+1-8',
    dribbling: '+1-8',
    defending: '+1-8',
    passing: '+1-8',
    physical: '+1-8',
  };
  return bonuses[stat];
}

// ── Main Game Router ─────────────────────────────────────────────────────────

export function TrainingGame({ gameId, stat, onComplete }: TrainingGameProps) {
  switch (gameId) {
    case 'shooting':
      return <ShootingGame gameId={gameId} stat={stat} onComplete={onComplete} />;
    case 'dribbling':
      return <DribblingGame gameId={gameId} stat={stat} onComplete={onComplete} />;
    case 'defending':
      return <DefendingGame gameId={gameId} stat={stat} onComplete={onComplete} />;
    case 'passing':
      return <PassingGame gameId={gameId} stat={stat} onComplete={onComplete} />;
    case 'physical':
      return <PhysicalGame gameId={gameId} stat={stat} onComplete={onComplete} />;
    default:
      return <div>Juego no encontrado</div>;
  }
}

// ── Styles ────────────────────────────────────────────────────────────────────

const selectorStyles: Record<string, React.CSSProperties> = {
  container: {
    padding: 10,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
    gap: 12,
  },
  gameCard: {
    background: 'rgba(0, 0, 0, 0.4)',
    border: '2px solid',
    borderRadius: 16,
    padding: 16,
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    fontFamily: 'inherit',
  },
  gameIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  gameName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  gameDesc: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.5)',
    marginBottom: 8,
  },
  statTag: {
    fontSize: 10,
    padding: '2px 8px',
    borderRadius: 12,
    display: 'inline-block',
  },
};

const gameStyles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  stats: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: 8,
    background: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
  },
  stat: {
    fontSize: 11,
    color: '#FFD700',
  },
  arena: {
    position: 'relative',
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    cursor: 'pointer',
  },
  instructions: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
    padding: 8,
  },
  goalFrame: {
    position: 'relative',
    width: '100%',
    height: '100%',
    background: 'radial-gradient(ellipse at center, rgba(0,100,0,0.3) 0%, rgba(0,0,0,0.5) 100%)',
  },
  goalNet: {
    position: 'absolute',
    inset: 0,
    backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 20px, transparent 20px, transparent 40px)',
  },
  target: {
    position: 'absolute',
    width: 40,
    height: 40,
    fontSize: 24,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    transition: 'transform 0.2s ease',
  },
  pitch: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  cone: {
    position: 'absolute',
    fontSize: 24,
    pointerEvents: 'none',
  },
  player: {
    position: 'absolute',
    fontSize: 32,
    transition: 'all 0.05s linear',
    pointerEvents: 'none',
    filter: 'drop-shadow(0 0 5px gold)',
  },
  defensiveLine: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  attacker: {
    position: 'absolute',
    fontSize: 28,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.1s linear',
  },
  defender: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: 48,
    filter: 'drop-shadow(0 0 5px gold)',
  },
  passingField: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  passTarget: {
    position: 'absolute',
    padding: '6px 12px',
    border: '2px solid',
    borderRadius: 20,
    background: 'rgba(0,0,0,0.5)',
    color: '#fff',
    fontSize: 12,
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  passer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    fontSize: 36,
  },
  reactionBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
    background: 'rgba(0,0,0,0.3)',
    borderRadius: 12,
    transition: 'transform 0.2s ease',
  },
  reactionAction: {
    textAlign: 'center',
  },
  reactionIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  reactionHint: {
    fontSize: 14,
    color: '#FFD700',
  },
  reactionWait: {
    fontSize: 24,
    color: 'rgba(255,255,255,0.3)',
  },
};