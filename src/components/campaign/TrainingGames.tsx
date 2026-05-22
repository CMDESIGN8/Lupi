// src/components/campaign/TrainingGames.tsx
// ─────────────────────────────────────────────────────────────────────────────
// Minijuegos de entrenamiento y selector - VERSIÓN CORREGIDA
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export type TrainingStat = 'finishing' | 'dribbling' | 'defending' | 'passing' | 'physical' | 'pace';

export interface TrainingResult {
  stat: TrainingStat;
  grade: 'S' | 'A' | 'B' | 'C';
  delta: number;
  xpBonus: number;
  message: string;
}

export interface TrainingGameProps {
  gameId: string;
  stat: TrainingStat;
  onComplete: (result: TrainingResult) => void;
  isDevMode?: boolean;
}

export interface TrainingGameSelectorProps {
  onSelectGame: (gameId: string) => void;
}

const RUSSO = "'Russo One', sans-serif";

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
  { 
    id: 'pace', 
    name: 'RITMO', 
    icon: '🏃‍♂️', 
    description: '🏃‍♂️ Hacé click rápido para correr más que el rival',
    color: '#FF6B6B', 
    stat: 'pace',
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

// ── Calculate Result ─────────────────────────────────────────────────────────

function calculateResult(score: number, accuracy: number, stat: TrainingStat): TrainingResult {
  let grade: 'S' | 'A' | 'B' | 'C';
  let delta: number;
  let xpBonus: number;
  let message: string;
  
  const performance = (score / 10) * (accuracy / 100);
  
  if (score >= 30 || accuracy >= 85 || performance >= 3) {
    grade = 'S';
    delta = 8;
    xpBonus = 200;
    message = '🎉 ¡PERFECTO! ¡Sos un campeón! 🎉';
  } else if (score >= 20 || accuracy >= 70 || performance >= 2) {
    grade = 'A';
    delta = 5;
    xpBonus = 120;
    message = '⭐ ¡Muy bien! Seguí así ⭐';
  } else if (score >= 10 || accuracy >= 50 || performance >= 1) {
    grade = 'B';
    delta = 3;
    xpBonus = 70;
    message = '👍 Bien! Un poco más de práctica 👍';
  } else {
    grade = 'C';
    delta = 1;
    xpBonus = 40;
    message = '📈 Necesitás más práctica. ¡Vos podés! 📈';
  }
  
  return { stat, grade, delta, xpBonus, message };
}

function getStatBonus(stat: TrainingStat): string {
  const bonuses: Record<TrainingStat, string> = { 
    finishing: '+1-8', 
    dribbling: '+1-8', 
    defending: '+1-8', 
    passing: '+1-8', 
    physical: '+1-8',
    pace: '+1-8',
  };
  return bonuses[stat];
}

// ── Training Game: PACE (Carrera de velocidad) ───────────────────────────────

// ── Training Game: PACE (Carrera de velocidad) ───────────────────────────────

function PaceGame({ onComplete, stat, isDevMode }: TrainingGameProps) {
  const [position, setPosition] = useState(0);
  const [opponentPosition, setOpponentPosition] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [gameActive, setGameActive] = useState(true);
  const [clicks, setClicks] = useState(0);
  const [reactionTime, setReactionTime] = useState<number[]>([]);
  const [lastClickTime, setLastClickTime] = useState<number>(Date.now());
  const [showStart, setShowStart] = useState(true);
  const [countdown, setCountdown] = useState(3);

  console.log('🏃‍♂️ PaceGame - stat recibido:', stat);

  if (isDevMode) {
    return (
      <div style={gameStyles.devContainer}>
        <div style={gameStyles.devIcon}>🏃‍♂️</div>
        <div style={gameStyles.devTitle}>MODO DESARROLLADOR</div>
        <div style={gameStyles.devText}>Simulando entrenamiento de {stat}</div>
        <button 
          onClick={() => {
            const mockResult = calculateResult(40, 95, stat);
            console.log('🎮 Mock result:', mockResult);
            onComplete(mockResult);
          }} 
          style={gameStyles.devButton}
        >
          ⚡ SIMULAR RESULTADO PERFECTO (S)
        </button>
        <button 
          onClick={() => {
            const mockResult = calculateResult(20, 70, stat);
            onComplete(mockResult);
          }} 
          style={gameStyles.devButtonSecondary}
        >
          🏃 SIMULAR RESULTADO NORMAL (A)
        </button>
      </div>
    );
  }

  // Countdown inicial
  useEffect(() => {
    if (showStart) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setShowStart(false);
            setLastClickTime(Date.now());
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [showStart]);

  // Temporizador del juego
  useEffect(() => {
    if (!gameActive || showStart) return;
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
  }, [gameActive, showStart]);

  // Movimiento del oponente (automático)
  useEffect(() => {
    if (!gameActive || showStart) return;
    const opponentInterval = setInterval(() => {
      setOpponentPosition(prev => {
        const increment = Math.random() * 4 + 2;
        const newPos = Math.min(100, prev + increment);
        if (newPos >= 100) {
          setGameActive(false);
          clearInterval(opponentInterval);
        }
        return newPos;
      });
    }, 500);
    return () => clearInterval(opponentInterval);
  }, [gameActive, showStart]);

  // Manejar clicks para correr
  const handleClick = () => {
    if (!gameActive || showStart) return;
    
    const now = Date.now();
    const reaction = now - lastClickTime;
    setReactionTime(prev => [...prev, reaction]);
    setLastClickTime(now);
    setClicks(prev => prev + 1);
    
    const increment = Math.min(8, 300 / Math.max(1, reaction));
    const newPosition = Math.min(100, position + increment);
    setPosition(newPosition);
    
    const pointsGained = Math.floor(100 / Math.max(1, reaction) * 10);
    setScore(prev => prev + Math.min(30, pointsGained));
    
    if (newPosition >= 100) {
      setGameActive(false);
    }
  };

  // Calcular resultado al finalizar
  useEffect(() => {
    if (!gameActive && !showStart && (timeLeft === 0 || position >= 100 || opponentPosition >= 100)) {
      const avgReaction = reactionTime.length > 0 
        ? reactionTime.reduce((a, b) => a + b, 0) / reactionTime.length 
        : 1000;
      const reactionScore = Math.max(0, Math.min(100, 100 - (avgReaction / 10)));
      const won = position >= opponentPosition;
      const finalScore = score + (won ? 50 : 0) + (position >= 100 ? 100 : 0);
      const accuracy = Math.min(100, (clicks / 10) * 20);
      
      console.log('🏃‍♂️ Calculando resultado con stat:', stat);
      const result = calculateResult(finalScore / 10, (reactionScore + accuracy) / 2, stat);
      console.log('🏃‍♂️ Resultado final:', result);
      onComplete(result);
    }
  }, [gameActive, showStart, timeLeft, position, opponentPosition, score, clicks, reactionTime, stat, onComplete]);

  if (showStart) {
    return (
      <div style={gameStyles.countdownContainer}>
        <div style={gameStyles.countdownNumber}>{countdown}</div>
        <div style={gameStyles.countdownText}>¡PREPARADO!</div>
        <div style={gameStyles.countdownSub}>Hacé click lo más rápido que puedas</div>
      </div>
    );
  }

  return (
    <div style={gameStyles.container}>
      <div style={gameStyles.stats}>
        <div style={gameStyles.stat}>🏃 Velocidad: {Math.floor(position)}%</div>
        <div style={gameStyles.stat}>⚔️ Rival: {Math.floor(opponentPosition)}%</div>
        <div style={gameStyles.stat}>⭐ Puntos: {score}</div>
        <div style={gameStyles.stat}>⏱️ {timeLeft}s</div>
      </div>
      
      <div style={gameStyles.raceTrack}>
        <div style={gameStyles.lane}>
          <div style={gameStyles.laneLabel}>🏃 TÚ</div>
          <div style={gameStyles.trackBg}>
            <div style={{...gameStyles.trackFill, width: `${position}%`, background: '#00f3ff'}} />
            <div style={{...gameStyles.runner, left: `${position}%`}}>🏃‍♂️</div>
          </div>
        </div>
        
        <div style={gameStyles.lane}>
          <div style={gameStyles.laneLabel}>🤖 RIVAL</div>
          <div style={gameStyles.trackBg}>
            <div style={{...gameStyles.trackFill, width: `${opponentPosition}%`, background: '#ff3366'}} />
            <div style={{...gameStyles.runner, left: `${opponentPosition}%`}}>🤖</div>
          </div>
        </div>
        
        <div style={gameStyles.finishLine}>🏁 META 🏁</div>
      </div>
      
      <button 
        onClick={handleClick}
        disabled={!gameActive}
        style={{
          ...gameStyles.clickButton,
          ...(!gameActive ? gameStyles.clickButtonDisabled : {}),
        }}
      >
        ⚡ ¡CORRÉ! HACÉ CLICK RÁPIDO ⚡
      </button>
      
      <div style={gameStyles.instructions}>
        💡 Hacé click lo más rápido que puedas para correr | 🏆 Llegá primero a la meta
      </div>
    </div>
  );
}

// ── Training Game: SHOOTING ─────────────────────────────────────────────────

function ShootingGame({ onComplete, stat, isDevMode }: TrainingGameProps) {
  const [targets, setTargets] = useState<{ id: number; x: number; y: number; active: boolean }[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [gameActive, setGameActive] = useState(true);
  const [shots, setShots] = useState(0);

  if (isDevMode) {
    return (
      <div style={gameStyles.devContainer}>
        <div style={gameStyles.devIcon}>🎮</div>
        <div style={gameStyles.devTitle}>MODO DESARROLLADOR</div>
        <div style={gameStyles.devText}>Simulando entrenamiento de {stat}...</div>
        <button onClick={() => onComplete(calculateResult(35, 90, stat))} style={gameStyles.devButton}>
          ⚡ SIMULAR RESULTADO PERFECTO (S)
        </button>
      </div>
    );
  }

  useEffect(() => {
    const newTargets = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      x: Math.random() * 80 + 10,
      y: Math.random() * 60 + 20,
      active: true,
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

  const handleShot = (targetId: number) => {
    if (!gameActive) return;
    setShots(prev => prev + 1);
    setTargets(prev => prev.map(t => t.id === targetId && t.active ? { ...t, active: false } : t));
    setScore(prev => prev + 1);
    
    setTimeout(() => {
      setTargets(prev => [
        ...prev.filter(t => t.id !== targetId),
        { id: Date.now(), x: Math.random() * 80 + 10, y: Math.random() * 60 + 20, active: true },
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
      </div>
      <div style={gameStyles.arena}>
        {targets.filter(t => t.active).map(target => (
          <button key={target.id} onClick={() => handleShot(target.id)} style={{...gameStyles.target, left: `${target.x}%`, top: `${target.y}%`}}>🎯</button>
        ))}
      </div>
      <div style={gameStyles.instructions}>💡 Hacé click en los objetivos para anotar</div>
    </div>
  );
}

// ── Training Game: DRIBBLING ─────────────────────────────────────────────────

function DribblingGame({ onComplete, stat, isDevMode }: TrainingGameProps) {
  const [cones, setCones] = useState<{ id: number; x: number; y: number }[]>([]);
  const [playerPos, setPlayerPos] = useState({ x: 10, y: 50 });
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [gameActive, setGameActive] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  if (isDevMode) {
    return (
      <div style={gameStyles.devContainer}>
        <div style={gameStyles.devIcon}>⚡</div>
        <div style={gameStyles.devTitle}>MODO DESARROLLADOR</div>
        <button onClick={() => onComplete(calculateResult(40, 95, stat))} style={gameStyles.devButton}>⚡ SIMULAR</button>
      </div>
    );
  }

  useEffect(() => {
    setCones(Array.from({ length: 8 }, (_, i) => ({ id: i, x: Math.random() * 70 + 15, y: Math.random() * 80 + 10 })));
  }, []);

  useEffect(() => {
    if (!gameActive) return;
    const timer = setInterval(() => setTimeLeft(prev => prev <= 1 ? (setGameActive(false), 0) : prev - 1), 1000);
    return () => clearInterval(timer);
  }, [gameActive]);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!gameActive || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    if (x >= 0 && x <= 100 && y >= 0 && y <= 100) {
      setPlayerPos({ x, y });
      const hitCone = cones.find(cone => Math.hypot(cone.x - x, cone.y - y) < 5);
      if (hitCone) {
        setCones(prev => prev.filter(c => c.id !== hitCone.id));
        setScore(prev => prev + 10);
        setTimeout(() => setCones(prev => [...prev, { id: Date.now(), x: Math.random() * 70 + 15, y: Math.random() * 80 + 10 }]), 500);
      }
    }
  };

  useEffect(() => {
    if (!gameActive && timeLeft === 0) onComplete(calculateResult(score / 10, score / 80 * 100, stat));
  }, [gameActive, score, timeLeft]);

  return (
    <div style={gameStyles.container}>
      <div style={gameStyles.stats}>
        <div style={gameStyles.stat}>⚡ Conos: {cones.length}</div>
        <div style={gameStyles.stat}>⭐ Puntos: {score}</div>
        <div style={gameStyles.stat}>⏱️ {timeLeft}s</div>
      </div>
      <div ref={containerRef} onMouseMove={handleMove} style={gameStyles.arena}>
        {cones.map(cone => <div key={cone.id} style={{...gameStyles.cone, left: `${cone.x}%`, top: `${cone.y}%`}}>🚧</div>)}
        <div style={{...gameStyles.player, left: `${playerPos.x}%`, top: `${playerPos.y}%`}}>⚽</div>
      </div>
      <div style={gameStyles.instructions}>💡 Mové el mouse para esquivar los conos</div>
    </div>
  );
}

// ── Training Game: DEFENDING ─────────────────────────────────────────────────

function DefendingGame({ onComplete, stat, isDevMode }: TrainingGameProps) {
  const [attackers, setAttackers] = useState<{ id: number; x: number; y: number }[]>([]);
  const [interceptions, setInterceptions] = useState(0);
  const [timeLeft, setTimeLeft] = useState(12);
  const [gameActive, setGameActive] = useState(true);

  if (isDevMode) {
    return (
      <div style={gameStyles.devContainer}>
        <div style={gameStyles.devIcon}>🛡️</div>
        <div style={gameStyles.devTitle}>MODO DESARROLLADOR</div>
        <button onClick={() => onComplete(calculateResult(30, 85, stat))} style={gameStyles.devButton}>⚡ SIMULAR</button>
      </div>
    );
  }

  useEffect(() => {
    const interval = setInterval(() => {
      if (gameActive) setAttackers(prev => [...prev, { id: Date.now(), x: 90, y: Math.random() * 80 + 10 }]);
    }, 1500);
    return () => clearInterval(interval);
  }, [gameActive]);

  useEffect(() => {
    const moveInterval = setInterval(() => {
      if (gameActive) setAttackers(prev => prev.map(a => ({ ...a, x: a.x - 2 })).filter(a => a.x > 0));
    }, 100);
    return () => clearInterval(moveInterval);
  }, [gameActive]);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(prev => prev <= 1 ? (setGameActive(false), 0) : prev - 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleIntercept = (id: number) => {
    if (!gameActive) return;
    setAttackers(prev => prev.filter(a => a.id !== id));
    setInterceptions(prev => prev + 1);
  };

  useEffect(() => {
    if (!gameActive && timeLeft === 0) onComplete(calculateResult(interceptions, (interceptions / 10) * 100, stat));
  }, [gameActive, interceptions, timeLeft]);

  return (
    <div style={gameStyles.container}>
      <div style={gameStyles.stats}>
        <div style={gameStyles.stat}>🛡️ Intercepciones: {interceptions}</div>
        <div style={gameStyles.stat}>⏱️ {timeLeft}s</div>
      </div>
      <div style={gameStyles.arena}>
        {attackers.map(a => <button key={a.id} onClick={() => handleIntercept(a.id)} style={{...gameStyles.attacker, left: `${a.x}%`, top: `${a.y}%`}}>🏃</button>)}
        <div style={gameStyles.defender}>🛡️</div>
      </div>
      <div style={gameStyles.instructions}>💡 Hacé click en los atacantes para interceptarlos</div>
    </div>
  );
}

// ── Training Game: PASSING ───────────────────────────────────────────────────

function PassingGame({ onComplete, stat, isDevMode }: TrainingGameProps) {
  const [targets, setTargets] = useState<{ id: number; x: number; y: number; points: number }[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10);
  const [gameActive, setGameActive] = useState(true);

  if (isDevMode) {
    return (
      <div style={gameStyles.devContainer}>
        <div style={gameStyles.devIcon}>🌀</div>
        <div style={gameStyles.devTitle}>MODO DESARROLLADOR</div>
        <button onClick={() => onComplete(calculateResult(45, 100, stat))} style={gameStyles.devButton}>⚡ SIMULAR</button>
      </div>
    );
  }

  useEffect(() => {
    setTargets(Array.from({ length: 6 }, (_, i) => ({ id: i, x: Math.random() * 80 + 10, y: Math.random() * 80 + 10, points: Math.random() > 0.7 ? 30 : 10 })));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(prev => prev <= 1 ? (setGameActive(false), 0) : prev - 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePass = (id: number, points: number) => {
    if (!gameActive) return;
    setScore(prev => prev + points);
    setTargets(prev => prev.filter(t => t.id !== id));
    setTimeout(() => setTargets(prev => [...prev, { id: Date.now(), x: Math.random() * 80 + 10, y: Math.random() * 80 + 10, points: Math.random() > 0.7 ? 30 : 10 }]), 400);
  };

  useEffect(() => {
    if (!gameActive && timeLeft === 0) onComplete(calculateResult(score / 10, (6 - targets.length) / 6 * 100, stat));
  }, [gameActive, score, timeLeft, targets.length]);

  return (
    <div style={gameStyles.container}>
      <div style={gameStyles.stats}>
        <div style={gameStyles.stat}>⭐ Puntos: {score}</div>
        <div style={gameStyles.stat}>⏱️ {timeLeft}s</div>
      </div>
      <div style={gameStyles.arena}>
        {targets.map(t => <button key={t.id} onClick={() => handlePass(t.id, t.points)} style={{...gameStyles.passTarget, left: `${t.x}%`, top: `${t.y}%`}}>🎯 {t.points}</button>)}
      </div>
      <div style={gameStyles.instructions}>💡 Hacé click en los objetivos para pasar</div>
    </div>
  );
}

// ── Training Game: PHYSICAL ──────────────────────────────────────────────────

function PhysicalGame({ onComplete, stat, isDevMode }: TrainingGameProps) {
  const [reactions, setReactions] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [gameActive, setGameActive] = useState(true);
  const [currentAction, setCurrentAction] = useState<{ key: string; name: string } | null>(null);

  const actions = [
    { key: 'ArrowUp', name: '⬆️ SALTAR' },
    { key: 'ArrowDown', name: '⬇️ AGACHARSE' },
    { key: 'ArrowLeft', name: '⬅️ ESQUIVAR' },
    { key: 'ArrowRight', name: '➡️ CORRER' },
    { key: ' ', name: '💪 FUERZA' },
  ];

  if (isDevMode) {
    return (
      <div style={gameStyles.devContainer}>
        <div style={gameStyles.devIcon}>💪</div>
        <div style={gameStyles.devTitle}>MODO DESARROLLADOR</div>
        <button onClick={() => onComplete(calculateResult(25, 80, stat))} style={gameStyles.devButton}>⚡ SIMULAR</button>
      </div>
    );
  }

  useEffect(() => {
    const interval = setInterval(() => {
      if (gameActive) {
        const randomAction = actions[Math.floor(Math.random() * actions.length)];
        setCurrentAction(randomAction);
        setTimeout(() => setCurrentAction(null), 800);
      }
    }, 1200);
    return () => clearInterval(interval);
  }, [gameActive]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!gameActive || !currentAction) return;
      const key = e.key === ' ' ? ' ' : e.key;
      if (key === currentAction.key) {
        setReactions(prev => prev + 1);
        setCurrentAction(null);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [currentAction, gameActive]);

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(prev => prev <= 1 ? (setGameActive(false), 0) : prev - 1), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!gameActive && timeLeft === 0) onComplete(calculateResult(reactions, (reactions / 15) * 100, stat));
  }, [gameActive, reactions, timeLeft]);

  return (
    <div style={gameStyles.container}>
      <div style={gameStyles.stats}>
        <div style={gameStyles.stat}>💪 Reacciones: {reactions}</div>
        <div style={gameStyles.stat}>⏱️ {timeLeft}s</div>
      </div>
      <div style={gameStyles.reactionBox}>
        {currentAction ? (
          <div style={gameStyles.reactionAction}>
            <div style={gameStyles.reactionIcon}>{currentAction.name}</div>
            <div style={gameStyles.reactionHint}>Presioná: {currentAction.key === ' ' ? 'ESPACIO' : currentAction.key.toUpperCase()}</div>
          </div>
        ) : (
          <div style={gameStyles.reactionWait}>⏳ Preparado...</div>
        )}
      </div>
      <div style={gameStyles.instructions}>💡 Presioná la tecla correcta cuando aparezca</div>
    </div>
  );
}

// ── Main Game Router ─────────────────────────────────────────────────────────

export function TrainingGame({ gameId, stat, onComplete, isDevMode }: TrainingGameProps) {
  switch (gameId) {
    case 'shooting': return <ShootingGame gameId={gameId} stat={stat} onComplete={onComplete} isDevMode={isDevMode} />;
    case 'dribbling': return <DribblingGame gameId={gameId} stat={stat} onComplete={onComplete} isDevMode={isDevMode} />;
    case 'defending': return <DefendingGame gameId={gameId} stat={stat} onComplete={onComplete} isDevMode={isDevMode} />;
    case 'passing': return <PassingGame gameId={gameId} stat={stat} onComplete={onComplete} isDevMode={isDevMode} />;
    case 'physical': return <PhysicalGame gameId={gameId} stat={stat} onComplete={onComplete} isDevMode={isDevMode} />;
    case 'pace': return <PaceGame gameId={gameId} stat={stat} onComplete={onComplete} isDevMode={isDevMode} />;
    default: return <div>Juego no encontrado</div>;
  }
}

// ── Styles ────────────────────────────────────────────────────────────────────

const selectorStyles: Record<string, React.CSSProperties> = {
  container: { padding: 10 },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 },
  gameCard: { background: 'rgba(0, 0, 0, 0.4)', border: '2px solid', borderRadius: 16, padding: 16, textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s ease' },
  gameIcon: { fontSize: 40, marginBottom: 8 },
  gameName: { fontSize: 12, fontWeight: 'bold', color: '#fff', marginBottom: 4, fontFamily: RUSSO },
  gameDesc: { fontSize: 9, color: 'rgba(255, 255, 255, 0.5)', marginBottom: 8 },
  statTag: { fontSize: 10, padding: '2px 8px', borderRadius: 12, display: 'inline-block' },
};

const gameStyles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', flexDirection: 'column', gap: 12 },
  stats: { display: 'flex', justifyContent: 'space-between', padding: 8, background: 'rgba(0, 0, 0, 0.3)', borderRadius: 8, flexWrap: 'wrap', gap: 4 },
  stat: { fontSize: 11, color: '#FFD700', fontFamily: RUSSO },
  arena: { position: 'relative', height: 300, borderRadius: 12, overflow: 'hidden', background: 'linear-gradient(135deg, #1a472a, #0a1a0f)' },
  instructions: { fontSize: 11, color: '#00f3ff', textAlign: 'center', padding: 8, background: 'rgba(0, 243, 255, 0.1)', borderRadius: 8, fontFamily: RUSSO },
  target: { position: 'absolute', width: 40, height: 40, fontSize: 24, background: 'none', border: 'none', cursor: 'pointer' },
  cone: { position: 'absolute', fontSize: 24, pointerEvents: 'none' },
  player: { position: 'absolute', fontSize: 32, transition: 'all 0.05s linear', pointerEvents: 'none', filter: 'drop-shadow(0 0 5px gold)' },
  attacker: { position: 'absolute', fontSize: 28, background: 'none', border: 'none', cursor: 'pointer' },
  defender: { position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)', fontSize: 48 },
  passTarget: { position: 'absolute', padding: '6px 12px', border: '2px solid #00f3ff', borderRadius: 20, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 12, cursor: 'pointer' },
  reactionBox: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, background: 'rgba(0,0,0,0.3)', borderRadius: 12 },
  reactionAction: { textAlign: 'center' },
  reactionIcon: { fontSize: 48, marginBottom: 16 },
  reactionHint: { fontSize: 14, color: '#FFD700', fontFamily: RUSSO },
  reactionWait: { fontSize: 24, color: 'rgba(255,255,255,0.3)' },
  devContainer: { textAlign: 'center', padding: 40 },
  devIcon: { fontSize: 64, marginBottom: 16 },
  devTitle: { fontSize: 18, color: '#ff00ff', marginBottom: 12, fontFamily: RUSSO },
  devText: { fontSize: 12, color: '#00f3ff', marginBottom: 24 },
  devButton: { background: 'linear-gradient(135deg, #00f3ff, #ff00ff)', border: 'none', borderRadius: 30, padding: '12px 24px', fontSize: 12, fontWeight: 'bold', color: '#fff', cursor: 'pointer', margin: '0 8px', fontFamily: RUSSO },
  devButtonSecondary: { background: 'linear-gradient(135deg, #ffa502, #ff6348)', border: 'none', borderRadius: 30, padding: '12px 24px', fontSize: 12, fontWeight: 'bold', color: '#fff', cursor: 'pointer', margin: '8px', fontFamily: RUSSO },
  // Estilos del juego de ritmo
  raceTrack: { background: 'rgba(0,0,0,0.3)', borderRadius: 16, padding: 16, marginBottom: 16 },
  lane: { marginBottom: 16 },
  laneLabel: { fontSize: 10, color: '#00f3ff', marginBottom: 6, fontWeight: 'bold', fontFamily: RUSSO },
  trackBg: { background: 'rgba(255,255,255,0.1)', borderRadius: 20, height: 40, position: 'relative', overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: 20, transition: 'width 0.05s linear' },
  runner: { position: 'absolute', top: 4, fontSize: 28, transition: 'left 0.05s linear', filter: 'drop-shadow(0 0 5px gold)' },
  finishLine: { textAlign: 'right', fontSize: 10, color: '#ffd700', marginTop: 8, paddingRight: 8, fontFamily: RUSSO },
  clickButton: { width: '100%', background: 'linear-gradient(135deg, #00f3ff, #ff00ff)', border: 'none', borderRadius: 40, padding: 16, fontSize: 16, fontWeight: 'bold', color: '#fff', cursor: 'pointer', transition: 'transform 0.1s', marginBottom: 12, fontFamily: RUSSO },
  clickButtonDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  countdownContainer: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, background: 'rgba(0,0,0,0.3)', borderRadius: 16 },
  countdownNumber: { fontSize: 72, fontWeight: 'bold', color: '#00f3ff', textShadow: '0 0 20px #00f3ff' },
  countdownText: { fontSize: 18, color: '#fff', marginTop: 16, fontFamily: RUSSO },
  countdownSub: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 8 },
};