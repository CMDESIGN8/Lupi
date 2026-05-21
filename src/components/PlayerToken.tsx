// components/PlayerToken.tsx
interface PlayerTokenProps {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  team: 'user' | 'rival';
  label: string;
  name: string;
  overall: number;
  hasBall?: boolean;
  highlight?: boolean;
  onPositionUpdate?: (x: number, y: number) => void;
}

export function PlayerToken({ 
  x: initialX, 
  y: initialY, 
  targetX, 
  targetY, 
  team, 
  label, 
  name, 
  overall, 
  hasBall, 
  highlight,
  onPositionUpdate 
}: PlayerTokenProps) {
  const [x, setX] = useState(initialX);
  const [y, setY] = useState(initialY);
  const [velocityX, setVelocityX] = useState(0);
  const [velocityY, setVelocityY] = useState(0);
  const frameRef = useRef<number>();
  
  // Física del movimiento
  useEffect(() => {
    const MASS = 1;
    const DRAG = 0.92; // Fricción
    const SPRING = 0.15; // Fuerza elástica hacia el objetivo
    
    let lastTimestamp = performance.now();
    
    const animate = (now: number) => {
      const delta = Math.min(0.033, (now - lastTimestamp) / 1000);
      lastTimestamp = now;
      
      // Calcular fuerza hacia el objetivo
      const dx = targetX - x;
      const dy = targetY - y;
      const forceX = dx * SPRING;
      const forceY = dy * SPRING;
      
      // Aceleración = Fuerza / Masa
      const accX = forceX / MASS;
      const accY = forceY / MASS;
      
      // Actualizar velocidad
      let newVelX = velocityX + accX * delta;
      let newVelY = velocityY + accY * delta;
      
      // Aplicar fricción
      newVelX *= DRAG;
      newVelY *= DRAG;
      
      // Actualizar posición
      let newX = x + newVelX * delta * 100; // Escalar para velocidad visible
      let newY = y + newVelY * delta * 100;
      
      // Limitar dentro de la cancha
      newX = Math.max(5, Math.min(95, newX));
      newY = Math.max(8, Math.min(92, newY));
      
      setX(newX);
      setY(newY);
      setVelocityX(newVelX);
      setVelocityY(newVelY);
      
      onPositionUpdate?.(newX, newY);
      frameRef.current = requestAnimationFrame(animate);
    };
    
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [targetX, targetY, x, y, velocityX, velocityY]);
  
  return (
    <div 
      className={`player-on-court ${highlight ? 'token-active' : ''}`}
      style={{
        left: `${x}%`,
        top: `${y}%`,
        transition: 'none', // La física maneja la animación
        filter: hasBall ? 'drop-shadow(0 0 8px rgba(61,255,160,0.8))' : 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))'
      }}
    >
      {/* Resto del contenido del token... */}
    </div>
  );
}