// hooks/useIntelligentMovement.ts
import { useState, useEffect, useRef } from 'react';

interface PlayerPosition {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  marker?: number; // ID del jugador que está marcando
}

export function useIntelligentMovement(
  phase: string,
  ballPos: { x: number; y: number },
  ballOwner: 'user' | 'rival' | null,
  userBase: Record<number, { x: number; y: number; label: string }>,
  rivalBase: Record<number, { x: number; y: number; label: string }>
) {
  const [userPositions, setUserPositions] = useState<Record<number, PlayerPosition>>({});
  const [rivalPositions, setRivalPositions] = useState<Record<number, PlayerPosition>>({});
  const frameRef = useRef<number>();
  const lastUpdate = useRef(Date.now());

  // Velocidad de movimiento (px por segundo)
  const MOVEMENT_SPEED = 180; // %/s - velocidad de desplazamiento
  const MARKING_DISTANCE = 12; // % de distancia máxima para marcar

  useEffect(() => {
    if (phase !== 'battle') return;

    // Inicializar posiciones base
    const initUser: Record<number, PlayerPosition> = {};
    const initRival: Record<number, PlayerPosition> = {};
    
    Object.entries(userBase).forEach(([id, pos]) => {
      initUser[Number(id)] = { x: pos.x, y: pos.y, baseX: pos.x, baseY: pos.y };
    });
    Object.entries(rivalBase).forEach(([id, pos]) => {
      initRival[Number(id)] = { x: pos.x, y: pos.y, baseX: pos.x, baseY: pos.y };
    });
    
    setUserPositions(initUser);
    setRivalPositions(initRival);

    const updatePositions = () => {
      const now = Date.now();
      const delta = Math.min(0.033, (now - lastUpdate.current) / 1000); // 33ms max
      lastUpdate.current = now;

      setUserPositions(prev => calculateNewPositions(prev, 'user', ballPos, ballOwner, userBase, rivalBase, delta, MOVEMENT_SPEED));
      setRivalPositions(prev => calculateNewPositions(prev, 'rival', ballPos, ballOwner, userBase, rivalBase, delta, MOVEMENT_SPEED));
      
      frameRef.current = requestAnimationFrame(updatePositions);
    };

    frameRef.current = requestAnimationFrame(updatePositions);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [phase, ballPos.x, ballPos.y, ballOwner]);

  return { userPositions, rivalPositions };
}

function calculateNewPositions(
  positions: Record<number, PlayerPosition>,
  team: 'user' | 'rival',
  ballPos: { x: number; y: number },
  ballOwner: 'user' | 'rival' | null,
  basePositions: Record<number, { x: number; y: number; label: string }>,
  opponentBase: Record<number, { x: number; y: number; label: string }>,
  delta: number,
  speed: number
): Record<number, PlayerPosition> {
  const newPositions = { ...positions };
  const isAttacking = (team === 'user' && ballOwner === 'user') || (team === 'rival' && ballOwner === 'rival');
  const isDefending = ballOwner !== null && ballOwner !== team;
  const isTransition = ballOwner === null;

  Object.entries(newPositions).forEach(([idStr, pos]) => {
    const id = Number(idStr);
    let targetX = pos.baseX;
    let targetY = pos.baseY;
    
    // Comportamiento según fase del juego
    if (isAttacking) {
      // Atacando: jugadores se proyectan hacia adelante
      const attackMultiplier = id === 5 ? 1.2 : (id >= 3 ? 1.0 : 0.6); // Delanteros más adelante
      targetX = Math.min(pos.baseX + 15 * attackMultiplier, 85);
      targetY = pos.baseY + (Math.random() * 8 - 4); // Desmarques
    } 
    else if (isDefending) {
      // Defendiendo: replegarse hacia el arco propio
      const retreatZone = team === 'user' ? 25 : 75;
      targetX = pos.baseX * 0.7 + retreatZone * 0.3;
      targetY = pos.baseY + (Math.random() * 10 - 5);
      
      // Marcaje al jugador rival más cercano
      const nearestOpponent = findNearestOpponent(pos, opponentBase, team);
      if (nearestOpponent) {
        const dx = nearestOpponent.x - pos.x;
        const dy = nearestOpponent.y - pos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 15) {
          // Perseguir al rival si está cerca
          targetX += dx * 0.3;
          targetY += dy * 0.3;
        }
      }
    }
    else if (isTransition) {
      // Transición: ocupar espacios intermedios
      targetX = pos.baseX + (ballPos.x - 50) * 0.2;
      targetY = pos.baseY + (ballPos.y - 50) * 0.1;
    }

    // Calcular movimiento con inercia
    const dx = targetX - pos.x;
    const dy = targetY - pos.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const moveAmount = Math.min(distance, speed * delta * 1.5);
    
    if (distance > 0.5) {
      // Movimiento con aceleración/desaceleración
      const smoothFactor = 0.85 + Math.random() * 0.1; // Variación entre jugadores
      newPositions[id] = {
        ...pos,
        x: pos.x + (dx / distance) * moveAmount,
        y: pos.y + (dy / distance) * moveAmount,
      };
    }
    
    // Añadir pequeña vibración para movimiento orgánico
    newPositions[id].x += (Math.random() - 0.5) * 0.8;
    newPositions[id].y += (Math.random() - 0.5) * 0.8;
    
    // Limitar dentro de la cancha
    newPositions[id].x = Math.max(5, Math.min(95, newPositions[id].x));
    newPositions[id].y = Math.max(8, Math.min(92, newPositions[id].y));
  });
  
  return newPositions;
}

function findNearestOpponent(
  pos: PlayerPosition,
  opponentBase: Record<number, { x: number; y: number; label: string }>,
  team: 'user' | 'rival'
): { x: number; y: number } | null {
  let nearest = null;
  let minDist = Infinity;
  
  Object.values(opponentBase).forEach(opp => {
    const dx = opp.x - pos.x;
    const dy = opp.y - pos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDist) {
      minDist = dist;
      nearest = opp;
    }
  });
  
  return nearest;
}