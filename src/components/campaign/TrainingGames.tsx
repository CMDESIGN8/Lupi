// src/components/campaign/TrainingGames.tsx
// ─────────────────────────────────────────────────────────────────────────────
// VERSIÓN CORREGIDA - HOOKS SIEMPRE ANTES DE CONDICIONALES
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
  difficulty?: 'easy' | 'normal' | 'hard';
}

const RUSSO = "'Russo One', sans-serif";

// ── Configuración de dificultad ───────────────────────────────────────────────

const DIFFICULTY_SETTINGS = {
  easy: {
    timeMultiplier: 1.5,
    scoreMultiplier: 0.8,
    speedMultiplier: 0.6,
    targetSizeMultiplier: 1.3,
  },
  normal: {
    timeMultiplier: 1.0,
    scoreMultiplier: 1.0,
    speedMultiplier: 1.0,
    targetSizeMultiplier: 1.0,
  },
  hard: {
    timeMultiplier: 0.7,
    scoreMultiplier: 1.3,
    speedMultiplier: 1.5,
    targetSizeMultiplier: 0.7,
  }
};

// ── Games Configuration ───────────────────────────────────────────────────────

interface GameConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  stat: TrainingStat;
  instructions: string[];
}

const AVAILABLE_GAMES: GameConfig[] = [
  {
    id: 'shooting',
    name: 'REMATE AL ARCO',
    icon: '🎯',
    description: 'Apuntá y definí con precisión',
    color: '#FF4757',
    stat: 'finishing',
    instructions: [
      '🎯 Apuntá a los arcos que aparecen',
      '👆 Tocá cada arco para anotar un gol',
      '⚡ Cuantos más goles, más puntos',
      '🔥 Hacé combinaciones para bonus extra'
    ],
  },
  {
    id: 'dribbling',
    name: 'GAMBETA RÁPIDA',
    icon: '⚡',
    description: 'Eslabón y velocidad con el balón',
    color: '#00E5FF',
    stat: 'dribbling',
    instructions: [
      '⚽ Mové el dedo por la pantalla',
      '🚧 Esquivá todos los conos',
      '⭐ Cada cono esquivado da puntos',
      '🏆 Llegá a la mayor cantidad posible'
    ],
  },
  {
    id: 'defending',
    name: 'MURO DEFENSIVO',
    icon: '🛡️',
    description: 'Anticipación e interceptación',
    color: '#2ED573',
    stat: 'defending',
    instructions: [
      '🛡️ Defendé tu área',
      '🏃 Los atacantes vienen hacia vos',
      '👆 Tocá cada atacante para interceptar',
      '⏱️ Tenés tiempo limitado'
    ],
  },
  {
    id: 'passing',
    name: 'PASES PRECISOS',
    icon: '🌀',
    description: 'Precisión en los pases',
    color: '#A55FEF',
    stat: 'passing',
    instructions: [
      '🌀 Hacé pases precisos',
      '👆 Tocá a tus compañeros',
      '🎯 Los objetivos dorados dan más puntos',
      '📈 Mejorá tu precisión'
    ],
  },
  {
    id: 'physical',
    name: 'REACCIÓN FÍSICA',
    icon: '💪',
    description: 'Potencia y resistencia',
    color: '#FFA502',
    stat: 'physical',
    instructions: [
      '💪 Reacción rápida',
      '👆 Tocá el botón cuando aparezca',
      '⚡ Cada acción correcta suma puntos',
      '🏃 Mantené la concentración'
    ],
  },
  { 
    id: 'pace', 
    name: 'VELOCIDAD', 
    icon: '🏃‍♂️', 
    description: 'Tocá rápido para correr más que el rival',
    color: '#FF6B6B', 
    stat: 'pace',
    instructions: [
      '🏃‍♂️ Carrera de velocidad',
      '👆 Tocá el botón LO MÁS RÁPIDO POSIBLE',
      '⚡ Cada toque te hace correr más',
      '🏁 Llegá primero a la meta'
    ],
  },
];

// ── Pantalla de instrucciones ─────────────────────────────────────────────────

interface InstructionsScreenProps {
  gameConfig: GameConfig;
  difficulty: 'easy' | 'normal' | 'hard';
  onStart: () => void;
}

function InstructionsScreen({ gameConfig, difficulty, onStart }: InstructionsScreenProps) {
  const difficultyInfo = {
    easy: { color: '#2ED573', text: '👶 MODO FÁCIL: Más tiempo y objetivos más grandes' },
    normal: { color: '#00E5FF', text: '👨 MODO NORMAL: Dificultad balanceada' },
    hard: { color: '#FF4757', text: '🏆 MODO EXPERTO: Más rápido y desafiante' }
  }[difficulty];

  return (
    <div style={instructionStyles.container}>
      <div style={instructionStyles.header}>
        <div style={{ ...instructionStyles.icon, background: `${gameConfig.color}20` }}>
          {gameConfig.icon}
        </div>
        <div style={instructionStyles.title}>{gameConfig.name}</div>
        <div style={instructionStyles.statBadge}>
          +{getStatBonus(gameConfig.stat)}
        </div>
      </div>
      
      <div style={instructionStyles.description}>
        {gameConfig.description}
      </div>
      
      <div style={{ ...instructionStyles.difficultyBadge, background: `${difficultyInfo.color}20`, color: difficultyInfo.color }}>
        {difficultyInfo.text}
      </div>
      
      <div style={instructionStyles.instructionsList}>
        <div style={instructionStyles.instructionsTitle}>📖 CÓMO JUGAR:</div>
        {gameConfig.instructions.map((instruction, idx) => (
          <div key={idx} style={instructionStyles.instructionItem}>
            <span style={instructionStyles.bullet}>{idx + 1}</span>
            <span>{instruction}</span>
          </div>
        ))}
      </div>
      
      <div style={instructionStyles.tipsBox}>
        <div style={instructionStyles.tipsTitle}>💡 CONSEJOS:</div>
        <div style={instructionStyles.tipsText}>
          • Prestá atención a los tiempos<br/>
          • Cada acierto suma puntos para tu entrenamiento<br/>
          • Mejor desempeño = mejores recompensas
        </div>
      </div>
      
      <button 
        onClick={onStart}
        onTouchStart={(e) => {
          
          onStart();
        }}
        style={instructionStyles.startButton}
      >
        <div style={instructionStyles.startButtonIcon}>🎮</div>
        <div style={instructionStyles.startButtonText}>¡COMENZAR JUEGO!</div>
        <div style={instructionStyles.startButtonSub}>Tocá para empezar</div>
      </button>
      
      <div style={instructionStyles.preview}>
        <div style={instructionStyles.previewText}>
          ⏱️ Duración: ~15 segundos
        </div>
      </div>
    </div>
  );
}

// ── Game Selector ─────────────────────────────────────────────────────────────

export function TrainingGameSelector({ onSelectGame }: { onSelectGame: (gameId: string) => void }) {
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
            onTouchStart={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)';
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
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

function calculateResult(score: number, accuracy: number, stat: TrainingStat, difficulty: string = 'normal'): TrainingResult {
  let grade: 'S' | 'A' | 'B' | 'C';
  let delta: number;
  let xpBonus: number;
  let message: string;
  
  const difficultyBonus = difficulty === 'hard' ? 1.2 : difficulty === 'easy' ? 0.8 : 1;
  const adjustedScore = score * difficultyBonus;
  
  if (adjustedScore >= 30 || accuracy >= 85) {
    grade = 'S';
    delta = Math.floor(8 * difficultyBonus);
    xpBonus = Math.floor(200 * difficultyBonus);
    message = '🎉 ¡PERFECTO! ¡Sos un campeón! 🎉';
  } else if (adjustedScore >= 20 || accuracy >= 70) {
    grade = 'A';
    delta = Math.floor(5 * difficultyBonus);
    xpBonus = Math.floor(120 * difficultyBonus);
    message = '⭐ ¡Muy bien! Seguí así ⭐';
  } else if (adjustedScore >= 10 || accuracy >= 50) {
    grade = 'B';
    delta = Math.floor(3 * difficultyBonus);
    xpBonus = Math.floor(70 * difficultyBonus);
    message = '👍 Bien! Un poco más de práctica 👍';
  } else {
    grade = 'C';
    delta = Math.floor(1 * difficultyBonus);
    xpBonus = Math.floor(40 * difficultyBonus);
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

// ── Feedback táctil ──────────────────────────────────────────────────────────

const addHapticFeedback = () => {
  if (window.navigator && window.navigator.vibrate) {
    window.navigator.vibrate(50);
  }
};

// ── Training Game: PACE (CORREGIDO) ───────────────────────────────────────────

function PaceGame({ onComplete, stat, isDevMode, difficulty = 'normal' }: TrainingGameProps) {
  // TODOS LOS HOOKS AL PRINCIPIO - SIN CONDICIONALES
  const [position, setPosition] = useState(0);
  const [opponentPosition, setOpponentPosition] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10 * DIFFICULTY_SETTINGS[difficulty].timeMultiplier);
  const [gameActive, setGameActive] = useState(true);
  const [clicks, setClicks] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  const [lastTouchTime, setLastTouchTime] = useState<number>(Date.now());

  const speedMultiplier = DIFFICULTY_SETTINGS[difficulty].speedMultiplier;
  const opponentSpeed = 3 + (2 * speedMultiplier);
  const gameConfig = AVAILABLE_GAMES.find(g => g.id === 'pace')!;

  // useEffect hooks - SIEMPRE se ejecutan
  useEffect(() => {
    if (!gameActive || showInstructions) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setGameActive(false);
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [gameActive, showInstructions]);

  useEffect(() => {
    if (!gameActive || showInstructions) return;
    const opponentInterval = setInterval(() => {
      setOpponentPosition(prev => {
        const increment = (Math.random() * 4 + opponentSpeed) * speedMultiplier;
        const newPos = Math.min(100, prev + increment);
        if (newPos >= 100) {
          setGameActive(false);
        }
        return newPos;
      });
    }, 500);
    return () => clearInterval(opponentInterval);
  }, [gameActive, showInstructions, speedMultiplier, opponentSpeed]);

  useEffect(() => {
    if (!gameActive && !showInstructions) {
      const won = position >= opponentPosition;
      const finalScore = (score + (won ? 50 : 0) + (position >= 100 ? 100 : 0)) / 10;
      const accuracy = Math.min(100, (clicks / 15) * 100);
      const result = calculateResult(finalScore, accuracy, stat, difficulty);
      onComplete(result);
    }
  }, [gameActive, position, opponentPosition, score, clicks, stat, onComplete, difficulty, showInstructions]);

  const handleTap = () => {
    if (!gameActive || showInstructions) return;
    
    addHapticFeedback();
    
    const now = Date.now();
    const reaction = now - lastTouchTime;
    setLastTouchTime(now);
    setClicks(prev => prev + 1);
    
    const increment = Math.min(8, 400 / Math.max(1, reaction));
    const newPosition = Math.min(100, position + increment);
    setPosition(newPosition);
    
    const pointsGained = Math.floor(100 / Math.max(1, reaction) * 8);
    setScore(prev => prev + Math.min(25, pointsGained));
    
    if (newPosition >= 100) {
      setGameActive(false);
    }
  };

  // Modo desarrollador
  if (isDevMode) {
    return (
      <div style={gameStyles.devContainer}>
        <div style={gameStyles.devIcon}>🏃‍♂️</div>
        <div style={gameStyles.devTitle}>MODO DESARROLLADOR</div>
        <div style={gameStyles.devText}>Simulando entrenamiento de {stat}</div>
        <button onClick={() => onComplete(calculateResult(35, 90, stat, difficulty))} style={gameStyles.devButton}>
          ⚡ SIMULAR RESULTADO PERFECTO (S)
        </button>
        <button onClick={() => onComplete(calculateResult(20, 70, stat, difficulty))} style={gameStyles.devButtonSecondary}>
          🏃 SIMULAR RESULTADO NORMAL (A)
        </button>
      </div>
    );
  }

  if (showInstructions) {
    return (
      <InstructionsScreen 
        gameConfig={gameConfig} 
        difficulty={difficulty} 
        onStart={() => setShowInstructions(false)} 
      />
    );
  }

  return (
    <div style={gameStyles.container}>
      <div style={gameStyles.stats}>
        <div style={gameStyles.stat}>🏃 TÚ: {Math.floor(position)}%</div>
        <div style={gameStyles.stat}>🤖 RIVAL: {Math.floor(opponentPosition)}%</div>
        <div style={gameStyles.stat}>⭐ {score}</div>
        <div style={gameStyles.stat}>⏱️ {Math.ceil(timeLeft)}s</div>
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
        onClick={handleTap}
        onTouchStart={(e) => {
          
          handleTap();
        }}
        disabled={!gameActive}
        style={{
          ...gameStyles.tapButton,
          ...(!gameActive ? gameStyles.tapButtonDisabled : {}),
        }}
      >
        <div style={gameStyles.tapButtonIcon}>⚡</div>
        <div style={gameStyles.tapButtonText}>¡CORRÉ!</div>
        <div style={gameStyles.tapButtonSub}>Tocá RÁPIDO</div>
      </button>
      
      <div style={gameStyles.instructions}>
        👆 Tocá lo más rápido que puedas para correr
      </div>
    </div>
  );
}

// ── Training Game: SHOOTING (CORREGIDO) ───────────────────────────────────────

function ShootingGame({ onComplete, stat, isDevMode, difficulty = 'normal' }: TrainingGameProps) {
  // TODOS LOS HOOKS AL PRINCIPIO
  const [targets, setTargets] = useState<{ id: number; x: number; y: number; active: boolean }[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10 * DIFFICULTY_SETTINGS[difficulty].timeMultiplier);
  const [gameActive, setGameActive] = useState(true);
  const [shots, setShots] = useState(0);
  const [combo, setCombo] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);

  const targetSizeMultiplier = DIFFICULTY_SETTINGS[difficulty].targetSizeMultiplier;
  const gameConfig = AVAILABLE_GAMES.find(g => g.id === 'shooting')!;

  // useEffect hooks - SIEMPRE se ejecutan
  useEffect(() => {
    if (showInstructions) return;
    const newTargets = Array.from({ length: 5 }, (_, i) => ({
      id: i,
      x: Math.random() * 80 + 10,
      y: Math.random() * 60 + 20,
      active: true,
    }));
    setTargets(newTargets);
  }, [showInstructions]);

  useEffect(() => {
    if (!gameActive || showInstructions) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          setGameActive(false);
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [gameActive, showInstructions]);

  useEffect(() => {
    if (!gameActive && !showInstructions) {
      const accuracy = shots > 0 ? (score / shots) * 100 : 0;
      const comboBonus = Math.floor(combo / 5) * 10;
      const result = calculateResult(score + comboBonus, accuracy, stat, difficulty);
      onComplete(result);
    }
  }, [gameActive, score, shots, combo, stat, onComplete, difficulty, showInstructions]);

  const handleShot = (targetId: number) => {
    if (!gameActive || showInstructions) return;
    
    addHapticFeedback();
    setShots(prev => prev + 1);
    setTargets(prev => prev.map(t => t.id === targetId && t.active ? { ...t, active: false } : t));
    setScore(prev => prev + 1);
    setCombo(prev => prev + 1);
    
    setTimeout(() => {
      setTargets(prev => [
        ...prev.filter(t => t.id !== targetId),
        { id: Date.now(), x: Math.random() * 80 + 10, y: Math.random() * 60 + 20, active: true },
      ]);
    }, 300);
  };

  if (isDevMode) {
    return (
      <div style={gameStyles.devContainer}>
        <div style={gameStyles.devIcon}>🎮</div>
        <div style={gameStyles.devTitle}>MODO DESARROLLADOR</div>
        <button onClick={() => onComplete(calculateResult(35, 90, stat, difficulty))} style={gameStyles.devButton}>
          ⚡ SIMULAR
        </button>
      </div>
    );
  }

  if (showInstructions) {
    return (
      <InstructionsScreen 
        gameConfig={gameConfig} 
        difficulty={difficulty} 
        onStart={() => setShowInstructions(false)} 
      />
    );
  }

  return (
    <div style={gameStyles.container}>
      <div style={gameStyles.stats}>
        <div style={gameStyles.stat}>🎯 {score}</div>
        <div style={gameStyles.stat}>🔥 Combo x{combo}</div>
        <div style={gameStyles.stat}>⏱️ {Math.ceil(timeLeft)}s</div>
      </div>
      <div style={gameStyles.arena}>
        {targets.filter(t => t.active).map(target => (
          <button 
            key={target.id} 
            onClick={() => handleShot(target.id)}
            onTouchStart={(e) => {
              
              handleShot(target.id);
            }}
            style={{
              ...gameStyles.target, 
              left: `${target.x}%`, 
              top: `${target.y}%`,
              width: `${40 * targetSizeMultiplier}px`,
              height: `${40 * targetSizeMultiplier}px`,
              fontSize: `${24 * targetSizeMultiplier}px`,
            }}
          >
            🎯
          </button>
        ))}
      </div>
      <div style={gameStyles.instructions}>
        👆 Tocá los arcos para anotar goles
      </div>
    </div>
  );
}

// ── Training Game: DRIBBLING (CORREGIDO) ──────────────────────────────────────

function DribblingGame({ onComplete, stat, isDevMode, difficulty = 'normal' }: TrainingGameProps) {
  // TODOS LOS HOOKS AL PRINCIPIO
  const [cones, setCones] = useState<{ id: number; x: number; y: number }[]>([]);
  const [playerPos, setPlayerPos] = useState({ x: 10, y: 50 });
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15 * DIFFICULTY_SETTINGS[difficulty].timeMultiplier);
  const [gameActive, setGameActive] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const gameConfig = AVAILABLE_GAMES.find(g => g.id === 'dribbling')!;

  useEffect(() => {
    if (showInstructions) return;
    const coneCount = 8;
    setCones(Array.from({ length: coneCount }, (_, i) => ({ 
      id: i, 
      x: Math.random() * 70 + 15, 
      y: Math.random() * 80 + 10 
    })));
  }, [showInstructions]);

  useEffect(() => {
    if (!gameActive || showInstructions) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          setGameActive(false);
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [gameActive, showInstructions]);

  useEffect(() => {
    if (!gameActive && !showInstructions) {
      const result = calculateResult(score / 8, (score / 80) * 100, stat, difficulty);
      onComplete(result);
    }
  }, [gameActive, score, stat, onComplete, difficulty, showInstructions]);

  const handleMove = (clientX: number, clientY: number) => {
    if (!gameActive || showInstructions || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    let x = ((clientX - rect.left) / rect.width) * 100;
    let y = ((clientY - rect.top) / rect.height) * 100;
    
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));
    
    setPlayerPos({ x, y });
    
    const hitCone = cones.find(cone => Math.hypot(cone.x - x, cone.y - y) < 8);
    if (hitCone) {
      addHapticFeedback();
      setCones(prev => prev.filter(c => c.id !== hitCone.id));
      setScore(prev => prev + 10);
      
      setTimeout(() => {
        setCones(prev => [...prev, { 
          id: Date.now(), 
          x: Math.random() * 70 + 15, 
          y: Math.random() * 80 + 10 
        }]);
      }, 500);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) {
      handleMove(e.clientX, e.clientY);
    }
  };

  if (isDevMode) {
    return (
      <div style={gameStyles.devContainer}>
        <div style={gameStyles.devIcon}>⚡</div>
        <div style={gameStyles.devTitle}>MODO DESARROLLADOR</div>
        <button onClick={() => onComplete(calculateResult(35, 90, stat, difficulty))} style={gameStyles.devButton}>
          ⚡ SIMULAR
        </button>
      </div>
    );
  }

  if (showInstructions) {
    return (
      <InstructionsScreen 
        gameConfig={gameConfig} 
        difficulty={difficulty} 
        onStart={() => setShowInstructions(false)} 
      />
    );
  }

  return (
    <div style={gameStyles.container}>
      <div style={gameStyles.stats}>
        <div style={gameStyles.stat}>🚧 {cones.length}</div>
        <div style={gameStyles.stat}>⭐ {score}</div>
        <div style={gameStyles.stat}>⏱️ {Math.ceil(timeLeft)}s</div>
      </div>
      <div 
        ref={containerRef} 
        onTouchMove={handleTouchMove}
        onTouchStart={() => setIsDragging(true)}
        onTouchEnd={() => setIsDragging(false)}
        onMouseMove={handleMouseMove}
        onMouseDown={() => setIsDragging(true)}
        onMouseUp={() => setIsDragging(false)}
        style={gameStyles.arena}
      >
        {cones.map(cone => (
          <div 
            key={cone.id} 
            style={{
              ...gameStyles.cone, 
              left: `${cone.x}%`, 
              top: `${cone.y}%`,
              fontSize: `${28 * DIFFICULTY_SETTINGS[difficulty].targetSizeMultiplier}px`,
            }}
          >
            🚧
          </div>
        ))}
        <div style={{...gameStyles.player, left: `${playerPos.x}%`, top: `${playerPos.y}%`}}>
          ⚽
        </div>
      </div>
      <div style={gameStyles.instructions}>
        👆 Mové el dedo por la pantalla para esquivar los conos
      </div>
    </div>
  );
}

// ── Training Game: DEFENDING (CORREGIDO) ──────────────────────────────────────

function DefendingGame({ onComplete, stat, isDevMode, difficulty = 'normal' }: TrainingGameProps) {
  const [attackers, setAttackers] = useState<{ id: number; x: number; y: number }[]>([]);
  const [interceptions, setInterceptions] = useState(0);
  const [timeLeft, setTimeLeft] = useState(12 * DIFFICULTY_SETTINGS[difficulty].timeMultiplier);
  const [gameActive, setGameActive] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);

  const speedMultiplier = DIFFICULTY_SETTINGS[difficulty].speedMultiplier;
  const gameConfig = AVAILABLE_GAMES.find(g => g.id === 'defending')!;

  useEffect(() => {
    if (!gameActive || showInstructions) return;
    const interval = setInterval(() => {
      setAttackers(prev => [...prev, { 
        id: Date.now(), 
        x: 90, 
        y: Math.random() * 80 + 10 
      }]);
    }, 1500 / speedMultiplier);
    return () => clearInterval(interval);
  }, [gameActive, showInstructions, speedMultiplier]);

  useEffect(() => {
    if (!gameActive || showInstructions) return;
    const moveInterval = setInterval(() => {
      setAttackers(prev => prev.map(a => ({ ...a, x: a.x - (2 * speedMultiplier) })).filter(a => a.x > 0));
    }, 100);
    return () => clearInterval(moveInterval);
  }, [gameActive, showInstructions, speedMultiplier]);

  useEffect(() => {
    if (!gameActive || showInstructions) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          setGameActive(false);
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [gameActive, showInstructions]);

  useEffect(() => {
    if (!gameActive && !showInstructions) {
      const result = calculateResult(interceptions, (interceptions / 8) * 100, stat, difficulty);
      onComplete(result);
    }
  }, [gameActive, interceptions, stat, onComplete, difficulty, showInstructions]);

  const handleIntercept = (id: number) => {
    if (!gameActive || showInstructions) return;
    addHapticFeedback();
    setAttackers(prev => prev.filter(a => a.id !== id));
    setInterceptions(prev => prev + 1);
  };

  if (isDevMode) {
    return (
      <div style={gameStyles.devContainer}>
        <div style={gameStyles.devIcon}>🛡️</div>
        <div style={gameStyles.devTitle}>MODO DESARROLLADOR</div>
        <button onClick={() => onComplete(calculateResult(30, 85, stat, difficulty))} style={gameStyles.devButton}>
          ⚡ SIMULAR
        </button>
      </div>
    );
  }

  if (showInstructions) {
    return (
      <InstructionsScreen 
        gameConfig={gameConfig} 
        difficulty={difficulty} 
        onStart={() => setShowInstructions(false)} 
      />
    );
  }

  return (
    <div style={gameStyles.container}>
      <div style={gameStyles.stats}>
        <div style={gameStyles.stat}>🛡️ {interceptions}</div>
        <div style={gameStyles.stat}>⏱️ {Math.ceil(timeLeft)}s</div>
      </div>
      <div style={gameStyles.arena}>
        {attackers.map(a => (
          <button 
            key={a.id} 
            onClick={() => handleIntercept(a.id)}
            onTouchStart={(e) => {
              
              handleIntercept(a.id);
            }}
            style={{...gameStyles.attacker, left: `${a.x}%`, top: `${a.y}%`}}
          >
            🏃
          </button>
        ))}
        <div style={gameStyles.defender}>🛡️</div>
      </div>
      <div style={gameStyles.instructions}>
        👆 Tocá los atacantes para interceptarlos
      </div>
    </div>
  );
}

// ── Training Game: PASSING (CORREGIDO) ────────────────────────────────────────

function PassingGame({ onComplete, stat, isDevMode, difficulty = 'normal' }: TrainingGameProps) {
  const [targets, setTargets] = useState<{ id: number; x: number; y: number; points: number }[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(10 * DIFFICULTY_SETTINGS[difficulty].timeMultiplier);
  const [gameActive, setGameActive] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);

  const targetSizeMultiplier = DIFFICULTY_SETTINGS[difficulty].targetSizeMultiplier;
  const gameConfig = AVAILABLE_GAMES.find(g => g.id === 'passing')!;

  useEffect(() => {
    if (showInstructions) return;
    setTargets(Array.from({ length: 6 }, (_, i) => ({ 
      id: i, 
      x: Math.random() * 80 + 10, 
      y: Math.random() * 80 + 10, 
      points: Math.random() > 0.7 ? 30 : 10 
    })));
  }, [showInstructions]);

  useEffect(() => {
    if (!gameActive || showInstructions) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          setGameActive(false);
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [gameActive, showInstructions]);

  useEffect(() => {
    if (!gameActive && !showInstructions) {
      const result = calculateResult(score / 10, (targets.length / 6) * 100, stat, difficulty);
      onComplete(result);
    }
  }, [gameActive, score, targets.length, stat, onComplete, difficulty, showInstructions]);

  const handlePass = (id: number, points: number) => {
    if (!gameActive || showInstructions) return;
    addHapticFeedback();
    setScore(prev => prev + points);
    setTargets(prev => prev.filter(t => t.id !== id));
    setTimeout(() => {
      setTargets(prev => [...prev, { 
        id: Date.now(), 
        x: Math.random() * 80 + 10, 
        y: Math.random() * 80 + 10, 
        points: Math.random() > 0.7 ? 30 : 10 
      }]);
    }, 400);
  };

  if (isDevMode) {
    return (
      <div style={gameStyles.devContainer}>
        <div style={gameStyles.devIcon}>🌀</div>
        <div style={gameStyles.devTitle}>MODO DESARROLLADOR</div>
        <button onClick={() => onComplete(calculateResult(35, 90, stat, difficulty))} style={gameStyles.devButton}>
          ⚡ SIMULAR
        </button>
      </div>
    );
  }

  if (showInstructions) {
    return (
      <InstructionsScreen 
        gameConfig={gameConfig} 
        difficulty={difficulty} 
        onStart={() => setShowInstructions(false)} 
      />
    );
  }

  return (
    <div style={gameStyles.container}>
      <div style={gameStyles.stats}>
        <div style={gameStyles.stat}>⭐ {score}</div>
        <div style={gameStyles.stat}>⏱️ {Math.ceil(timeLeft)}s</div>
      </div>
      <div style={gameStyles.arena}>
        {targets.map(t => (
          <button 
            key={t.id} 
            onClick={() => handlePass(t.id, t.points)}
            onTouchStart={(e) => {
              
              handlePass(t.id, t.points);
            }}
            style={{
              ...gameStyles.passTarget, 
              left: `${t.x}%`, 
              top: `${t.y}%`,
              padding: `${6 * targetSizeMultiplier}px ${12 * targetSizeMultiplier}px`,
              fontSize: `${12 * targetSizeMultiplier}px`,
            }}
          >
            🎯 {t.points}
          </button>
        ))}
      </div>
      <div style={gameStyles.instructions}>
        👆 Tocá los compañeros para pasarles la pelota
      </div>
    </div>
  );
}

// ── Training Game: PHYSICAL (CORREGIDO) ───────────────────────────────────────

function PhysicalGame({ onComplete, stat, isDevMode, difficulty = 'normal' }: TrainingGameProps) {
  const [reactions, setReactions] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15 * DIFFICULTY_SETTINGS[difficulty].timeMultiplier);
  const [gameActive, setGameActive] = useState(true);
  const [currentAction, setCurrentAction] = useState<{ id: string; name: string; icon: string } | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);

  const actions = [
    { id: 'jump', name: 'SALTAR', icon: '⬆️' },
    { id: 'duck', name: 'AGACHARSE', icon: '⬇️' },
    { id: 'dodge', name: 'ESQUIVAR', icon: '⬅️' },
    { id: 'run', name: 'CORRER', icon: '➡️' },
    { id: 'push', name: 'EMPUJAR', icon: '💪' },
  ];

  const gameConfig = AVAILABLE_GAMES.find(g => g.id === 'physical')!;

  useEffect(() => {
    if (!gameActive || showInstructions) return;
    const interval = setInterval(() => {
      const randomAction = actions[Math.floor(Math.random() * actions.length)];
      setCurrentAction({ ...randomAction, id: Date.now().toString() });
      setTimeout(() => setCurrentAction(null), 1200);
    }, 1500 / DIFFICULTY_SETTINGS[difficulty].speedMultiplier);
    return () => clearInterval(interval);
  }, [gameActive, showInstructions, difficulty]);

  useEffect(() => {
    if (!gameActive || showInstructions) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.1) {
          setGameActive(false);
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);
    return () => clearInterval(timer);
  }, [gameActive, showInstructions]);

  useEffect(() => {
    if (!gameActive && !showInstructions) {
      const result = calculateResult(reactions, (reactions / 12) * 100, stat, difficulty);
      onComplete(result);
    }
  }, [gameActive, reactions, stat, onComplete, difficulty, showInstructions]);

  const handleReaction = () => {
    if (!gameActive || showInstructions || !currentAction) return;
    
    addHapticFeedback();
    setReactions(prev => prev + 1);
    setCurrentAction(null);
  };

  if (isDevMode) {
    return (
      <div style={gameStyles.devContainer}>
        <div style={gameStyles.devIcon}>💪</div>
        <div style={gameStyles.devTitle}>MODO DESARROLLADOR</div>
        <button onClick={() => onComplete(calculateResult(25, 80, stat, difficulty))} style={gameStyles.devButton}>
          ⚡ SIMULAR
        </button>
      </div>
    );
  }

  if (showInstructions) {
    return (
      <InstructionsScreen 
        gameConfig={gameConfig} 
        difficulty={difficulty} 
        onStart={() => setShowInstructions(false)} 
      />
    );
  }

  return (
    <div style={gameStyles.container}>
      <div style={gameStyles.stats}>
        <div style={gameStyles.stat}>💪 {reactions}</div>
        <div style={gameStyles.stat}>⏱️ {Math.ceil(timeLeft)}s</div>
      </div>
      <div style={gameStyles.reactionBox}>
        {currentAction ? (
          <button 
            onClick={handleReaction}
            onTouchStart={(e) => {
              
              handleReaction();
            }}
            style={gameStyles.reactionButton}
          >
            <div style={gameStyles.reactionIcon}>{currentAction.icon}</div>
            <div style={gameStyles.reactionName}>{currentAction.name}</div>
            <div style={gameStyles.reactionAction}>👆 ¡TOCÁ AHORA!</div>
          </button>
        ) : (
          <div style={gameStyles.reactionWait}>
            <div>⏳</div>
            <div style={gameStyles.reactionWaitText}>Preparado...</div>
          </div>
        )}
      </div>
      <div style={gameStyles.instructions}>
        👆 Tocá el botón apenas veas la acción
      </div>
    </div>
  );
}

// ── Main Game Router ─────────────────────────────────────────────────────────

export function TrainingGame({ gameId, stat, onComplete, isDevMode, difficulty = 'normal' }: TrainingGameProps) {
  const commonProps = { gameId, stat, onComplete, isDevMode, difficulty };
  
  switch (gameId) {
    case 'shooting': return <ShootingGame {...commonProps} />;
    case 'dribbling': return <DribblingGame {...commonProps} />;
    case 'defending': return <DefendingGame {...commonProps} />;
    case 'passing': return <PassingGame {...commonProps} />;
    case 'physical': return <PhysicalGame {...commonProps} />;
    case 'pace': return <PaceGame {...commonProps} />;
    default: return <div>Juego no encontrado</div>;
  }
}

// ── Styles ────────────────────────────────────────────────────────────────────

const selectorStyles: Record<string, React.CSSProperties> = {
  container: { 
    padding: '10px',
    touchAction: 'manipulation',
  },
  grid: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
    gap: '12px' 
  },
  gameCard: { 
    background: 'rgba(0, 0, 0, 0.4)', 
    border: '2px solid', 
    borderRadius: '16px', 
    padding: '16px', 
    textAlign: 'center', 
    cursor: 'pointer', 
    transition: 'all 0.2s ease',
    touchAction: 'manipulation',
    minHeight: '120px',
  },
  gameIcon: { fontSize: '48px', marginBottom: '8px' },
  gameName: { fontSize: '14px', fontWeight: 'bold', color: '#fff', marginBottom: '4px', fontFamily: RUSSO },
  gameDesc: { fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '8px' },
  statTag: { fontSize: '11px', padding: '4px 12px', borderRadius: '12px', display: 'inline-block' },
};

const instructionStyles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '20px',
    background: 'linear-gradient(135deg, rgba(0,0,0,0.8), rgba(0,0,0,0.6))',
    borderRadius: '24px',
    backdropFilter: 'blur(10px)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    flexWrap: 'wrap',
  },
  icon: {
    fontSize: '48px',
    padding: '12px',
    borderRadius: '20px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: RUSSO,
    flex: 1,
  },
  statBadge: {
    fontSize: '14px',
    padding: '6px 12px',
    background: 'rgba(255,215,0,0.2)',
    borderRadius: '20px',
    color: '#FFD700',
    fontFamily: RUSSO,
  },
  description: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    padding: '12px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '12px',
  },
  difficultyBadge: {
    fontSize: '14px',
    padding: '8px 16px',
    borderRadius: '20px',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  instructionsList: {
    background: 'rgba(0,0,0,0.3)',
    borderRadius: '16px',
    padding: '16px',
  },
  instructionsTitle: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#00f3ff',
    marginBottom: '12px',
    fontFamily: RUSSO,
  },
  instructionItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '8px 0',
    fontSize: '14px',
    color: '#fff',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
  },
  bullet: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
    background: 'rgba(0,243,255,0.2)',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 'bold',
    color: '#00f3ff',
  },
  tipsBox: {
    background: 'rgba(255,215,0,0.1)',
    borderRadius: '16px',
    padding: '16px',
    border: '1px solid rgba(255,215,0,0.3)',
  },
  tipsTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: '8px',
  },
  tipsText: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 1.5,
  },
  startButton: {
    background: 'linear-gradient(135deg, #00f3ff, #ff00ff)',
    border: 'none',
    borderRadius: '60px',
    padding: '20px',
    cursor: 'pointer',
    touchAction: 'manipulation',
    transition: 'transform 0.1s',
    marginTop: '8px',
  },
  startButtonIcon: {
    fontSize: '32px',
    marginBottom: '8px',
  },
  startButtonText: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#fff',
    fontFamily: RUSSO,
  },
  startButtonSub: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.8)',
    marginTop: '4px',
  },
  preview: {
    textAlign: 'center',
    padding: '8px',
  },
  previewText: {
    fontSize: '11px',
    color: 'rgba(255,255,255,0.4)',
  },
};

const gameStyles: Record<string, React.CSSProperties> = {
  container: { 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '12px',
    touchAction: 'pan-y pinch-zoom',
  },
  stats: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    padding: '12px', 
    background: 'rgba(0, 0, 0, 0.3)', 
    borderRadius: '12px', 
    flexWrap: 'wrap', 
    gap: '8px' 
  },
  stat: { 
    fontSize: '14px', 
    fontWeight: 'bold',
    color: '#FFD700', 
    fontFamily: RUSSO 
  },
  arena: { 
    position: 'relative', 
    height: '350px', 
    borderRadius: '16px', 
    overflow: 'hidden', 
    background: 'linear-gradient(135deg, #1a472a, #0a1a0f)',
    touchAction: 'none',
  },
  instructions: { 
    fontSize: '14px', 
    color: '#00f3ff', 
    textAlign: 'center', 
    padding: '12px', 
    background: 'rgba(0, 243, 255, 0.1)', 
    borderRadius: '12px', 
    fontFamily: RUSSO 
  },
  target: { 
    position: 'absolute', 
    background: 'none', 
    border: 'none', 
    cursor: 'pointer',
    touchAction: 'manipulation',
    transition: 'transform 0.1s',
  },
  cone: { 
    position: 'absolute', 
    pointerEvents: 'none',
    transition: 'all 0.05s linear',
  },
  player: { 
    position: 'absolute', 
    fontSize: '40px', 
    transition: 'all 0.05s linear', 
    pointerEvents: 'none', 
    filter: 'drop-shadow(0 0 8px gold)',
  },
  attacker: { 
    position: 'absolute', 
    fontSize: '36px', 
    background: 'none', 
    border: 'none', 
    cursor: 'pointer',
    touchAction: 'manipulation',
    padding: '10px',
    minWidth: '50px',
    minHeight: '50px',
  },
  defender: { 
    position: 'absolute', 
    bottom: '20px', 
    left: '50%', 
    transform: 'translateX(-50%)', 
    fontSize: '56px' 
  },
  passTarget: { 
    position: 'absolute', 
    border: '2px solid #00f3ff', 
    borderRadius: '24px', 
    background: 'rgba(0,0,0,0.6)', 
    color: '#fff', 
    cursor: 'pointer',
    touchAction: 'manipulation',
    fontWeight: 'bold',
  },
  reactionBox: { 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center', 
    minHeight: '250px', 
    background: 'rgba(0,0,0,0.3)', 
    borderRadius: '16px' 
  },
  reactionButton: {
    width: '80%',
    padding: '40px',
    background: 'linear-gradient(135deg, #FFA502, #FF6348)',
    border: 'none',
    borderRadius: '24px',
    cursor: 'pointer',
    touchAction: 'manipulation',
    transition: 'transform 0.1s',
  },
  reactionIcon: { fontSize: '64px', marginBottom: '16px' },
  reactionName: { fontSize: '24px', fontWeight: 'bold', color: '#fff', marginBottom: '12px', fontFamily: RUSSO },
  reactionAction: { fontSize: '16px', color: '#FFD700', fontFamily: RUSSO },
  reactionWait: { 
    textAlign: 'center',
    fontSize: '48px',
  },
  reactionWaitText: { fontSize: '18px', color: 'rgba(255,255,255,0.3)', marginTop: '12px' },
  raceTrack: { 
    background: 'rgba(0,0,0,0.3)', 
    borderRadius: '20px', 
    padding: '20px', 
    marginBottom: '16px' 
  },
  lane: { marginBottom: '20px' },
  laneLabel: { fontSize: '12px', color: '#00f3ff', marginBottom: '8px', fontWeight: 'bold', fontFamily: RUSSO },
  trackBg: { 
    background: 'rgba(255,255,255,0.1)', 
    borderRadius: '30px', 
    height: '50px', 
    position: 'relative', 
    overflow: 'hidden' 
  },
  trackFill: { 
    height: '100%', 
    borderRadius: '30px', 
    transition: 'width 0.05s linear' 
  },
  runner: { 
    position: 'absolute', 
    top: '4px', 
    fontSize: '36px', 
    transition: 'left 0.05s linear', 
    filter: 'drop-shadow(0 0 5px gold)' 
  },
  finishLine: { 
    textAlign: 'right', 
    fontSize: '12px', 
    color: '#ffd700', 
    marginTop: '8px', 
    paddingRight: '8px', 
    fontFamily: RUSSO 
  },
  tapButton: {
    width: '100%',
    background: 'linear-gradient(135deg, #00f3ff, #ff00ff)',
    border: 'none',
    borderRadius: '60px',
    padding: '24px',
    cursor: 'pointer',
    touchAction: 'manipulation',
    transition: 'transform 0.1s, opacity 0.2s',
    boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
  },
  tapButtonDisabled: { 
    opacity: 0.5, 
    cursor: 'not-allowed' 
  },
  tapButtonIcon: { fontSize: '48px', marginBottom: '8px' },
  tapButtonText: { fontSize: '24px', fontWeight: 'bold', color: '#fff', fontFamily: RUSSO, marginBottom: '4px' },
  tapButtonSub: { fontSize: '14px', color: 'rgba(255,255,255,0.8)' },
  devContainer: { textAlign: 'center', padding: '40px' },
  devIcon: { fontSize: '80px', marginBottom: '16px' },
  devTitle: { fontSize: '20px', color: '#ff00ff', marginBottom: '12px', fontFamily: RUSSO },
  devText: { fontSize: '14px', color: '#00f3ff', marginBottom: '24px' },
  devButton: { 
    background: 'linear-gradient(135deg, #00f3ff, #ff00ff)', 
    border: 'none', 
    borderRadius: '40px', 
    padding: '16px 32px', 
    fontSize: '16px', 
    fontWeight: 'bold', 
    color: '#fff', 
    cursor: 'pointer', 
    margin: '8px',
    touchAction: 'manipulation',
  },
  devButtonSecondary: { 
    background: 'linear-gradient(135deg, #ffa502, #ff6348)', 
    border: 'none', 
    borderRadius: '40px', 
    padding: '16px 32px', 
    fontSize: '16px', 
    fontWeight: 'bold', 
    color: '#fff', 
    cursor: 'pointer', 
    margin: '8px',
    touchAction: 'manipulation',
  },
};