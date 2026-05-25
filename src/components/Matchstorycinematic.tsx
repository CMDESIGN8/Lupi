// src/components/MatchStoryCinematic.tsx
// Reemplaza StoryCinematic.tsx y CampaignMatch.tsx para escenas pre-partido
// Props: leagueId (string), matchIndex (number), onStart (), onBack ()

import { useState, useEffect, useRef } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────
type SpeakerRole = 'protagonist' | 'coach' | 'rival';

type Emotion =
  | 'determined' | 'fire' | 'pumped' | 'menacing' | 'arrogant'
  | 'cold' | 'confident' | 'tactical' | 'emotional' | 'calm'
  | 'inspired' | 'smug' | 'serious' | 'mysterious' | 'threatening'
  | 'commanding' | 'surprised' | 'intrigued' | 'amused' | 'legendary'
  | 'moved' | 'curious' | 'focused';

interface DialogueLine {
  speaker: SpeakerRole;
  emotion: Emotion;
  text: string;
}

interface RivalConfig {
  name: string;
  fullName: string;
  avatar: string;
  color: string;
  colorDark: string;
}

interface MatchStoryScene {
  matchIndex: number;
  rival: RivalConfig;
  preMatchScene: DialogueLine[];
}

export interface MatchStoryCinematicProps {
  leagueId: string;
  matchIndex: number;
  onStart: () => void;
  onBack: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// FUENTE
// ─────────────────────────────────────────────────────────────────────────────
const RUSSO = "'Russo One', sans-serif";
if (typeof document !== 'undefined' && !document.getElementById('msc-font')) {
  const link = document.createElement('link');
  link.id = 'msc-font';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Russo+One&display=swap';
  document.head.appendChild(link);
}

// ─────────────────────────────────────────────────────────────────────────────
// LORE — PERSONAJES FIJOS
// ─────────────────────────────────────────────────────────────────────────────
const LORE = {
  protagonist: {
    name: 'LUPI',
    role: "Delantero · Capitán",
    avatar: '⚡',
    color: '#00D9FF',
    colorDark: '#0044AA',
  },
  coach: {
    name: 'PROFE OMAR',
    role: 'Entrenador del Club',
    avatar: '🎯',
    color: '#FFD93D',
    colorDark: '#A07800',
  },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// ESCENAS POR LIGA Y PARTIDO
// ─────────────────────────────────────────────────────────────────────────────
export const MATCH_STORY_SCENES: Record<string, MatchStoryScene[]> = {
  rookie: [
    {
      matchIndex: 0,
      rival: { name: 'EL PIRAÑA', fullName: 'Piraña FC', avatar: '🦈', color: '#FF4444', colorDark: '#800000' },
      preMatchScene: [
        { speaker: 'coach',       emotion: 'pumped',     text: 'Lupi, hoy debutás en la liga oficial. El Piraña FC mordió a todos del barrio sur. ¿Estás listo, pibe?' },
        { speaker: 'protagonist', emotion: 'determined', text: 'Profe, me preparé toda la vida para este momento. Ningún pez me va a parar.' },
        { speaker: 'rival',       emotion: 'menacing',   text: '¿El club del potrero? Disfruten el partido, porque es el último que juegan en esta liga.' },
        { speaker: 'protagonist', emotion: 'fire',       text: 'Te voy a demostrar que el fútbol de barrio tiene más corazón que todos tus petrodólares juntos.' },
      ],
    },
    {
      matchIndex: 1,
      rival: { name: 'TANQUE RODAS', fullName: 'Los Tanques del Sur', avatar: '🛡️', color: '#888888', colorDark: '#333333' },
      preMatchScene: [
        { speaker: 'coach',       emotion: 'tactical',  text: 'Escuchame bien. Tanque Rodas tiene 97 kilos. No lo encarés de frente. Usá tu velocidad.' },
        { speaker: 'rival',       emotion: 'menacing',  text: 'Flaquito, la última vez que alguien me esquivó fue hace 4 años. No terminó bien para él.' },
        { speaker: 'protagonist', emotion: 'confident', text: 'Eso fue hace 4 años, Tanque. Hoy el barrio aprendió a volar.' },
        { speaker: 'coach',       emotion: 'pumped',    text: '¡ASÍ SE HABLA! ¡Salgan a ganar, que la cancha es nuestra!' },
      ],
    },
    {
      matchIndex: 2,
      rival: { name: 'EL MAESTRO', fullName: 'Academia Técnica FC', avatar: '👑', color: '#FFD700', colorDark: '#8B6914' },
      preMatchScene: [
        { speaker: 'rival',       emotion: 'arrogant',  text: 'Pibitos del potrero en la final. La academia los va a educar.' },
        { speaker: 'coach',       emotion: 'fire',      text: '¡Lupi! ¿Sabés cuánto tiempo esperé este partido? ¡15 AÑOS dedicándole el alma a este club!' },
        { speaker: 'protagonist', emotion: 'emotional', text: 'Esta final es para usted, para el barrio, para todos, Profe.' },
        { speaker: 'rival',       emotion: 'cold',      text: 'Qué escena tan conmovedora. Lástima que los sentimientos no meten goles.' },
        { speaker: 'protagonist', emotion: 'fire',      text: 'Hoy sí los meten.' },
      ],
    },
  ],
  bronze: [
    {
      matchIndex: 0,
      rival: { name: 'EL ZORRITO', fullName: 'Zorros del Norte FC', avatar: '🦊', color: '#FF8C00', colorDark: '#7A3800' },
      preMatchScene: [
        { speaker: 'coach',       emotion: 'tactical', text: 'Liga Bronce. Otro nivel, Lupi. Los Zorros son rápidos y tramposos. Ojo con sus provocaciones.' },
        { speaker: 'rival',       emotion: 'smug',     text: 'Bienvenidos a las grandes ligas, campeones de barrio. Acá el engaño también es técnica.' },
        { speaker: 'protagonist', emotion: 'calm',     text: 'Zorrito, mi único truco es meterla adentro.' },
        { speaker: 'coach',       emotion: 'serious',  text: 'Foco total. Hoy demostramos que el ascenso no fue casualidad.' },
      ],
    },
    {
      matchIndex: 1,
      rival: { name: 'LA MURALLA', fullName: 'Fortaleza FC', avatar: '🧱', color: '#607D8B', colorDark: '#263238' },
      preMatchScene: [
        { speaker: 'rival',       emotion: 'cold',       text: 'Seis partidos. Cero goles en contra. Pueden intentarlo, eso sí.' },
        { speaker: 'coach',       emotion: 'inspired',   text: 'Lupi, ¿recordás cuando el barrio te decía que eras demasiado flaco para jugar en serio?' },
        { speaker: 'protagonist', emotion: 'determined', text: 'Siempre lo recuerdo, Profe.' },
        { speaker: 'coach',       emotion: 'fire',       text: '¡Pues hoy le decimos lo mismo a este muro! ¡NADA ES INFRANQUEABLE!' },
        { speaker: 'protagonist', emotion: 'fire',       text: 'Muralla... hoy aprendés lo que es derrumbarse.' },
      ],
    },
    {
      matchIndex: 2,
      rival: { name: 'KAISER JUNIORS', fullName: 'Kaiser Juniors FC', avatar: '⚔️', color: '#4169E1', colorDark: '#0D1B6E' },
      preMatchScene: [
        { speaker: 'rival',       emotion: 'arrogant', text: 'Leí todo sobre vos, Lupi. Potrero, barrio, sueños grandes. Qué romántico.' },
        { speaker: 'protagonist', emotion: 'focused',  text: '¿Y?' },
        { speaker: 'rival',       emotion: 'cold',     text: 'Y que los sueños no ganan finales. La táctica, sí.' },
        { speaker: 'coach',       emotion: 'pumped',   text: '¡SUFICIENTE! Los que hablan mucho se callan cuando los goleamos.' },
        { speaker: 'protagonist', emotion: 'fire',     text: 'Guardate las palabras para después del partido, Kaiser.' },
      ],
    },
  ],
  silver: [
    {
      matchIndex: 0,
      rival: { name: 'EL CÓNDOR', fullName: 'Cóndores del Cerro', avatar: '🦅', color: '#9C27B0', colorDark: '#4A0072' },
      preMatchScene: [
        { speaker: 'coach',       emotion: 'serious',     text: 'Liga Plata, Lupi. Ya no somos el equipo sorpresa. Todos van a buscar nuestro punto débil.' },
        { speaker: 'rival',       emotion: 'threatening', text: 'Escuché hablar del Lupi de las pulgas. A ver si volás tan alto como los cóndores, pichón.' },
        { speaker: 'protagonist', emotion: 'calm',        text: 'No vuelo. Corro. Y corro más rápido que cualquier pájaro.' },
        { speaker: 'coach',       emotion: 'tactical',    text: '¡Bien dicho! Velocidad y presión. ¡Vamos, que esta liga también es nuestra!' },
      ],
    },
    {
      matchIndex: 1,
      rival: { name: 'SOMBRA', fullName: 'Los Fantasmas FC', avatar: '👻', color: '#00BCD4', colorDark: '#006064' },
      preMatchScene: [
        { speaker: 'rival',       emotion: 'mysterious', text: 'Nadie sabe de dónde venimos ni adónde vamos. Somos las sombras del fútbol. Inasibles.' },
        { speaker: 'coach',       emotion: 'tactical',   text: 'Lupi, cambian de sistema cada 10 minutos. Jugá intuitivo. Confiá en lo que aprendiste en el potrero.' },
        { speaker: 'protagonist', emotion: 'determined', text: 'En el potrero no había sistema, Profe. Solo había ganas. Y ganas no me faltan.' },
        { speaker: 'rival',       emotion: 'intrigued',  text: 'Interesante... Quizás este partido valga la pena después de todo.' },
      ],
    },
    {
      matchIndex: 2,
      rival: { name: 'EL GENERAL', fullName: 'Batallón FC', avatar: '🎖️', color: '#795548', colorDark: '#3E2723' },
      preMatchScene: [
        { speaker: 'rival',       emotion: 'commanding', text: 'Mi equipo entrena 6 horas diarias. Táctica militar. Disciplina total. ¿Qué tienen ustedes?' },
        { speaker: 'coach',       emotion: 'emotional',  text: 'Lupi... esta es la final más importante de mi vida. Nací en este barrio. Quiero ganarla.' },
        { speaker: 'protagonist', emotion: 'emotional',  text: 'Profe, ¿sabe qué tenemos? Veinte años de historia. Un barrio entero detrás. Eso vale más que seis horas.' },
        { speaker: 'coach',       emotion: 'fire',       text: '¡Así es! ¡No hay general que gane contra el corazón!' },
        { speaker: 'rival',       emotion: 'cold',       text: 'El corazón no alcanza. Aprenderán la lección hoy.' },
        { speaker: 'protagonist', emotion: 'fire',       text: 'La única lección de hoy... la aprendés vos.' },
      ],
    },
  ],
  gold: [
    {
      matchIndex: 0,
      rival: { name: 'DIAMANTE', fullName: 'Diamante Elite FC', avatar: '💎', color: '#00E5FF', colorDark: '#006064' },
      preMatchScene: [
        { speaker: 'rival',       emotion: 'arrogant',  text: 'Un equipo de barrio en la Liga Oro. Qué... pintoresco.' },
        { speaker: 'coach',       emotion: 'serious',   text: 'Lupi, llegamos acá solos. Sin sponsors, sin nada. Eso nos hace libres.' },
        { speaker: 'protagonist', emotion: 'confident', text: 'Profe, tenemos algo que ellos nunca van a poder comprar.' },
        { speaker: 'coach',       emotion: 'curious',   text: '¿Qué cosa?' },
        { speaker: 'protagonist', emotion: 'fire',      text: 'Hambre.' },
      ],
    },
    {
      matchIndex: 1,
      rival: { name: 'EL GENIO', fullName: 'Club Génesis', avatar: '🧠', color: '#E91E63', colorDark: '#880E4F' },
      preMatchScene: [
        { speaker: 'rival',       emotion: 'cold',      text: 'Analicé cada partido tuyo, Lupi. Conozco tus tres movimientos favoritos. Estás descifrado.' },
        { speaker: 'coach',       emotion: 'tactical',  text: 'Si te tiene estudiado, tenés que inventar algo nuevo. Hoy en la cancha.' },
        { speaker: 'protagonist', emotion: 'amused',    text: '¿Estudiaste mis movimientos? Perfecto. Ahora toca crear los que todavía no existen.' },
        { speaker: 'rival',       emotion: 'surprised', text: '...Eso no estaba en mi análisis.' },
      ],
    },
    {
      matchIndex: 2,
      rival: { name: 'REY COBRA', fullName: 'Cobra Real FC', avatar: '🐍', color: '#4CAF50', colorDark: '#1B5E20' },
      preMatchScene: [
        { speaker: 'rival',       emotion: 'menacing',  text: 'Viniste del polvo, del barro. Y acá estás en la final de Oro. Respeto. Pero acá termina tu cuento.' },
        { speaker: 'coach',       emotion: 'emotional', text: 'Lupi, el barrio está mirando. Todo el país está mirando.' },
        { speaker: 'protagonist', emotion: 'emotional', text: 'Significa que el fútbol todavía le pertenece a la gente, Profe.' },
        { speaker: 'coach',       emotion: 'fire',      text: '¡EXACTO! ¡Salí y demostralo!' },
        { speaker: 'rival',       emotion: 'cold',      text: 'En el fútbol hablan los pies.' },
        { speaker: 'protagonist', emotion: 'fire',      text: 'Exactamente. Y los míos llevan veinte años hablando.' },
      ],
    },
  ],
  champion: [
    {
      matchIndex: 0,
      rival: { name: 'EL KAISER', fullName: 'Kaiser FC Internacional', avatar: '👑', color: '#9C27B0', colorDark: '#4A0072' },
      preMatchScene: [
        { speaker: 'rival',       emotion: 'legendary', text: 'Club sin historia, sin sponsors, sin nada. Del barrio Los Pinos. ¿Lupi Ferreyra?' },
        { speaker: 'protagonist', emotion: 'calm',      text: 'Sin nada... excepto esto.' },
        { speaker: 'rival',       emotion: 'cold',      text: '¿Qué tenés, exactamente?' },
        { speaker: 'coach',       emotion: 'fire',      text: '¡TIENE UN EQUIPO, TIENE UN BARRIO, TIENE VEINTE AÑOS DE LUCHA!' },
        { speaker: 'protagonist', emotion: 'fire',      text: 'Y hoy... te tenemos a vos.' },
      ],
    },
    {
      matchIndex: 1,
      rival: { name: 'OMEGA', fullName: 'Club Omega Prime', avatar: '⚡', color: '#FF5722', colorDark: '#BF360C' },
      preMatchScene: [
        { speaker: 'coach',       emotion: 'serious',   text: 'Llevamos tres años llegando hasta acá. Tres años de barro, frío y lluvia.' },
        { speaker: 'rival',       emotion: 'arrogant',  text: 'Cuánto sacrificio. Y para qué. Para perder en semifinal.' },
        { speaker: 'protagonist', emotion: 'fire',      text: 'El sacrificio no pide permiso. No pregunta si vale la pena. Solo existe.' },
        { speaker: 'coach',       emotion: 'emotional', text: 'Pibe... vas a ser leyenda. Lo sé desde el primer día que te vi en el potrero.' },
        { speaker: 'protagonist', emotion: 'emotional', text: 'Cuando entre a esa cancha, lo hago por usted también, Profe.' },
      ],
    },
    {
      matchIndex: 2,
      rival: { name: 'EL ETERNO', fullName: 'Élite Mundial FC', avatar: '🌟', color: '#FFD700', colorDark: '#7A5C00' },
      preMatchScene: [
        { speaker: 'rival',       emotion: 'legendary', text: 'Llegaste hasta la gran final. Nadie del interior lo logró en 40 años. Merecés reconocimiento.' },
        { speaker: 'protagonist', emotion: 'calm',      text: 'No vine por reconocimiento.' },
        { speaker: 'rival',       emotion: 'curious',   text: '¿Entonces por qué?' },
        { speaker: 'coach',       emotion: 'emotional', text: 'Por los pibes que sueñan en el potrero. Por los que les dijeron que era imposible.' },
        { speaker: 'protagonist', emotion: 'fire',      text: 'Para que ningún pibe del barrio vuelva a escuchar que es imposible.' },
        { speaker: 'rival',       emotion: 'moved',     text: '...Hoy va a ser el partido más hermoso de mi carrera.' },
        { speaker: 'protagonist', emotion: 'fire',      text: 'Y el último que perdés.' },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// EMOTION LABELS
// ─────────────────────────────────────────────────────────────────────────────
const EMOTION_LABELS: Record<Emotion, string> = {
  determined: '¡DETERMINADO!', fire: '¡EN LLAMAS!',   pumped: '¡ENERGIZADO!',
  menacing: 'AMENAZANTE',      arrogant: 'ARROGANTE',  cold: 'FRÍO',
  confident: 'SEGURO',         tactical: 'ANALÍTICO',  emotional: 'EMOTIVO',
  calm: 'TRANQUILO',           inspired: '¡INSPIRADO!',smug: 'PETULANTE',
  serious: 'SERIO',            mysterious: 'MISTERIOSO',threatening: 'INTIMIDANTE',
  commanding: 'IMPONENTE',     surprised: '¡SORPRENDIDO!',intrigued: 'INTRIGADO',
  amused: 'DIVERTIDO',         legendary: '¡LEGENDARIO!',moved: 'CONMOVIDO',
  curious: 'CURIOSO',          focused: 'CONCENTRADO',
};

// ─────────────────────────────────────────────────────────────────────────────
// KEYFRAMES
// ─────────────────────────────────────────────────────────────────────────────
const KEYFRAMES = `
  @keyframes msc-glow    { from{opacity:.3;transform:scale(1)} to{opacity:.85;transform:scale(1.07)} }
  @keyframes msc-vs      { 0%,100%{opacity:1;transform:scale(1) rotate(-3deg)} 50%{opacity:.65;transform:scale(1.22) rotate(-3deg)} }
  @keyframes msc-up      { from{transform:translateY(30px);opacity:0} to{transform:translateY(0);opacity:1} }
  @keyframes msc-left    { from{transform:translateX(-38px);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes msc-right   { from{transform:translateX(38px);opacity:0} to{transform:translateX(0);opacity:1} }
  @keyframes msc-blink   { 0%,100%{opacity:1} 50%{opacity:0} }
  @keyframes msc-speed   { from{background-position:0 0} to{background-position:300px 0} }
  @keyframes msc-border  { 0%,100%{border-color:#FFD93D} 50%{border-color:#FF6B6B} }
  @keyframes msc-pulse   { 0%,100%{transform:scale(1)} 50%{transform:scale(1.04)} }
`;

// ─────────────────────────────────────────────────────────────────────────────
// AVATAR
// ─────────────────────────────────────────────────────────────────────────────
interface AvatarProps {
  name: string; avatar: string; color: string; colorDark?: string;
  role?: string; emotion: Emotion; isActive: boolean;
  size?: number; slideDir?: 'left' | 'right';
}

function CharAvatar({ name, avatar, color, colorDark, role, emotion, isActive, size = 96, slideDir }: AvatarProps) {
  return (
    <div style={{
      position: 'relative', width: size, height: size,
      transition: 'all .4s cubic-bezier(.34,1.56,.64,1)',
      transform: isActive ? 'scale(1)' : 'scale(0.88)',
      opacity: isActive ? 1 : 0.45,
      animation: isActive && slideDir ? `msc-${slideDir} .35s ease` : undefined,
    }}>
      {isActive && (
        <div style={{
          position: 'absolute', inset: -12, borderRadius: '50%',
          background: `radial-gradient(circle, ${color}50, transparent)`,
          filter: 'blur(16px)',
          animation: 'msc-glow 1.6s ease-in-out infinite alternate',
        }} />
      )}
      <div style={{
        width: size, height: size, borderRadius: '50%', boxSizing: 'border-box',
        background: `linear-gradient(135deg, ${color}22, ${colorDark || color}44)`,
        border: `3px solid ${isActive ? color : 'rgba(255,255,255,.1)'}`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        filter: isActive ? 'brightness(1.1) contrast(1.05)' : 'brightness(.5) saturate(.45)',
        transition: 'all .3s',
      }}>
        <span style={{ fontSize: size * 0.38, lineHeight: 1 }}>{avatar}</span>
        <span style={{
          fontSize: 7, fontFamily: RUSSO,
          color: isActive ? color : 'rgba(255,255,255,.3)',
          letterSpacing: 1, marginTop: 4, textAlign: 'center', padding: '0 4px',
        }}>{name}</span>
      </div>
      {isActive && (
        <div style={{
          position: 'absolute', bottom: -22, left: '50%', transform: 'translateX(-50%)',
          background: color, color: '#000', fontSize: 7, fontFamily: RUSSO,
          padding: '3px 8px', borderRadius: 99, whiteSpace: 'nowrap', letterSpacing: .5,
        }}>
          {EMOTION_LABELS[emotion]}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────
export default function MatchStoryCinematic({ leagueId, matchIndex, onStart, onBack }: MatchStoryCinematicProps) {
  const sceneData = MATCH_STORY_SCENES[leagueId]?.[matchIndex] ?? MATCH_STORY_SCENES['rookie'][0];
  const { rival, preMatchScene: dialogues } = sceneData;

  const [lineIdx,    setLineIdx]    = useState(0);
  const [displayed,  setDisplayed]  = useState('');
  const [isTyping,   setIsTyping]   = useState(false);
  const [phase,      setPhase]      = useState<'dialogue' | 'ready'>('dialogue');
  const typingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const current = dialogues[lineIdx] ?? null;

  const startTyping = (text: string) => {
    if (typingRef.current) clearInterval(typingRef.current);
    setDisplayed(''); setIsTyping(true);
    let i = 0;
    typingRef.current = setInterval(() => {
      if (i < text.length) { setDisplayed(text.slice(0, i + 1)); i++; }
      else { clearInterval(typingRef.current!); setIsTyping(false); }
    }, 26);
  };

  useEffect(() => {
    if (current) startTyping(current.text);
    return () => { if (typingRef.current) clearInterval(typingRef.current); };
  }, [lineIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  const advance = () => {
    if (isTyping) {
      clearInterval(typingRef.current!);
      setDisplayed(current!.text); setIsTyping(false); return;
    }
    if (lineIdx < dialogues.length - 1) setLineIdx(l => l + 1);
    else setPhase('ready');
  };

  // ── Helpers de speaker activo ──
  const lupiActive  = phase === 'dialogue' && current?.speaker === 'protagonist';
  const coachActive = phase === 'dialogue' && current?.speaker === 'coach';
  const rivalActive = phase === 'dialogue' && current?.speaker === 'rival';

  const spColor     = rivalActive ? rival.color     : coachActive ? LORE.coach.color     : LORE.protagonist.color;
  const spColorDark = rivalActive ? rival.colorDark : coachActive ? LORE.coach.colorDark : LORE.protagonist.colorDark;
  const spName      = rivalActive ? rival.name      : coachActive ? LORE.coach.name      : LORE.protagonist.name;
  const spAvatar    = rivalActive ? rival.avatar    : coachActive ? LORE.coach.avatar    : LORE.protagonist.avatar;
  const spRole      = rivalActive ? rival.fullName  : coachActive ? LORE.coach.role      : LORE.protagonist.role;

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 10000,
      background: '#000', fontFamily: RUSSO,
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      <style>{KEYFRAMES}</style>

      {/* Speed lines bg */}
      <div style={{ position:'absolute',inset:0,pointerEvents:'none',
        background:'repeating-linear-gradient(-70deg,transparent 0,transparent 18px,rgba(255,255,255,.018) 19px)',
        animation:'msc-speed .8s linear infinite' }} />

      {/* Dark radial bg */}
      <div style={{ position:'absolute',inset:0,
        background:'radial-gradient(ellipse at center bottom,rgba(0,40,80,.75),rgba(0,0,0,.97) 70%)' }} />

      {/* Scanlines */}
      <div style={{ position:'absolute',inset:0,pointerEvents:'none',
        background:'repeating-linear-gradient(0deg,transparent 0,transparent 3px,rgba(0,0,0,.06) 4px)' }} />

      {/* Speaker color flash */}
      <div style={{ position:'absolute',inset:0,pointerEvents:'none',
        background:`radial-gradient(ellipse at ${rivalActive?'right':'left'} center,${spColor}12,transparent 60%)`,
        transition:'background .5s' }} />

      {/* ── TOP BAR ── */}
      <div style={{
        position:'relative', zIndex:10, flexShrink:0,
        display:'flex', justifyContent:'space-between', alignItems:'center',
        padding:'10px 14px',
        borderBottom:'1px solid rgba(255,255,255,.07)',
        background:'rgba(0,0,0,.55)', backdropFilter:'blur(8px)',
      }}>
        <div style={{ background:'rgba(0,217,255,.12)', border:'1px solid rgba(0,217,255,.35)',
          borderRadius:8, padding:'5px 11px', fontSize:9, color:'#00D9FF', letterSpacing:2 }}>
          ⚡ PRE-PARTIDO
        </div>

        {/* Progress dots */}
        <div style={{ display:'flex', gap:5 }}>
          {dialogues.map((_, i) => (
            <div key={i} style={{
              width: i === lineIdx ? 18 : 5, height:5, borderRadius:3,
              background: i === lineIdx ? spColor : i < lineIdx ? 'rgba(255,255,255,.28)' : 'rgba(255,255,255,.1)',
              transition:'all .3s ease',
            }} />
          ))}
        </div>

        <button onClick={onBack} style={{
          background:'rgba(255,255,255,.05)', border:'1px solid rgba(255,255,255,.12)',
          borderRadius:8, padding:'5px 10px', color:'rgba(255,255,255,.45)',
          fontSize:9, cursor:'pointer', fontFamily:RUSSO, letterSpacing:1,
        }}>✕ SALIR</button>
      </div>

      {/* Subtitle */}
      <div style={{ position:'relative', zIndex:5, flexShrink:0,
        textAlign:'center', padding:'7px 14px',
        fontSize:9, letterSpacing:2, color:'rgba(255,255,255,.25)' }}>
        {leagueId.toUpperCase()} · PARTIDO {matchIndex + 1} · {rival.fullName}
      </div>

      {/* ── CHARACTERS ── */}
      <div style={{
        position:'relative', zIndex:5, flex:1,
        display:'flex', alignItems:'flex-end',
        padding:'0 8px 20px', minHeight:220,
      }}>
        {/* LEFT: Lupi + Profe */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-start', gap:22, flex:1, paddingBottom:8 }}>
          <CharAvatar
            name={LORE.protagonist.name} avatar={LORE.protagonist.avatar}
            color={LORE.protagonist.color} colorDark={LORE.protagonist.colorDark}
            role={LORE.protagonist.role}
            emotion={lupiActive ? (current?.emotion ?? 'calm') : 'calm'}
            isActive={lupiActive} size={96} slideDir="left"
          />
          <div style={{ paddingLeft:14 }}>
            <CharAvatar
              name={LORE.coach.name} avatar={LORE.coach.avatar}
              color={LORE.coach.color} colorDark={LORE.coach.colorDark}
              role={LORE.coach.role}
              emotion={coachActive ? (current?.emotion ?? 'calm') : 'calm'}
              isActive={coachActive} size={84} slideDir="left"
            />
          </div>
        </div>

        {/* VS */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center',
          justifyContent:'center', width:52, flexShrink:0 }}>
          <div style={{ fontSize:20, color:'#FFD93D', letterSpacing:2,
            textShadow:'0 0 14px rgba(255,217,61,.8)',
            animation:'msc-vs 1.5s ease-in-out infinite' }}>VS</div>
          <div style={{ width:1, height:72,
            background:'linear-gradient(180deg,transparent,rgba(255,255,255,.1),transparent)',
            marginTop:10 }} />
        </div>

        {/* RIGHT: Rival */}
        <div style={{ flex:1, display:'flex', justifyContent:'flex-end', paddingBottom:8, paddingRight:6 }}>
          <CharAvatar
            name={rival.name} avatar={rival.avatar}
            color={rival.color} colorDark={rival.colorDark}
            role={rival.fullName}
            emotion={rivalActive ? (current?.emotion ?? 'cold') : 'cold'}
            isActive={rivalActive} size={106} slideDir="right"
          />
        </div>
      </div>

      {/* ── DIALOGUE BOX ── */}
      {phase === 'dialogue' && current && (
        <div onClick={advance} style={{
          position:'relative', zIndex:10, flexShrink:0,
          margin:'0 12px 12px', borderRadius:15, overflow:'hidden',
          cursor:'pointer', border:`1px solid ${spColor}33`,
          animation:'msc-up .28s ease',
        }}>
          {/* Speaker badge */}
          <div style={{
            background:`linear-gradient(90deg, ${spColor}, ${spColorDark}88)`,
            padding:'8px 14px', display:'flex', alignItems:'center', gap:10,
          }}>
            <span style={{ fontSize:16 }}>{spAvatar}</span>
            <div>
              <div style={{ fontSize:11, color:'#000', letterSpacing:1 }}>{spName}</div>
              <div style={{ fontSize:8, color:'rgba(0,0,0,.5)', letterSpacing:.5 }}>{spRole}</div>
            </div>
            <div style={{ marginLeft:'auto' }}>
              <span style={{ fontSize:7, background:'rgba(0,0,0,.2)', color:'#000',
                padding:'2px 7px', borderRadius:99, letterSpacing:.5 }}>
                {EMOTION_LABELS[current.emotion]}
              </span>
            </div>
          </div>

          {/* Text */}
          <div style={{ background:'rgba(4,8,20,.97)', padding:'14px 16px' }}>
            <p style={{ margin:0, fontSize:13, lineHeight:1.65,
              color:'#fff', minHeight:48, letterSpacing:.3, fontFamily:RUSSO }}>
              "{displayed}
              {isTyping  && <span style={{ animation:'msc-blink .5s step-end infinite', marginLeft:1 }}>▌</span>}
              {!isTyping && '"'}
            </p>
            <div style={{ marginTop:9, display:'flex', justifyContent:'flex-end',
              alignItems:'center', gap:6, opacity:isTyping?.25:.7, transition:'opacity .3s' }}>
              <span style={{ fontSize:8, color:'rgba(255,255,255,.4)', letterSpacing:1 }}>
                {isTyping ? 'ESCRIBIENDO...'
                  : lineIdx < dialogues.length - 1 ? 'TOCÁ PARA CONTINUAR'
                  : 'TOCÁ PARA IR AL PARTIDO'}
              </span>
              {!isTyping && <span style={{ fontSize:11, color:spColor, animation:'msc-blink .8s step-end infinite' }}>▶</span>}
            </div>
          </div>
        </div>
      )}

      {/* ── READY SCREEN ── */}
      {phase === 'ready' && (
        <div style={{ position:'relative', zIndex:10, flexShrink:0,
          margin:'0 12px 12px', animation:'msc-up .35s ease' }}>
          <div style={{ borderRadius:15, overflow:'hidden',
            border:'2px solid #FFD93D', animation:'msc-border 1.5s ease-in-out infinite',
            background:'rgba(4,8,20,.97)' }}>
            <div style={{ background:'linear-gradient(90deg,#FFD93D,#FF9800)',
              padding:'9px 16px', textAlign:'center' }}>
              <div style={{ fontSize:12, color:'#000', letterSpacing:3 }}>¡EL MOMENTO LLEGÓ!</div>
            </div>
            <div style={{ padding:'14px' }}>
              <div style={{ fontSize:9, color:'rgba(255,255,255,.4)', letterSpacing:1,
                marginBottom:14, textAlign:'center' }}>
                {rival.fullName} · {leagueId.toUpperCase()} · PARTIDO {matchIndex + 1}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={onBack} style={{
                  flex:1, padding:'11px', background:'transparent',
                  border:'1px solid rgba(255,255,255,.18)', borderRadius:10,
                  color:'rgba(255,255,255,.45)', fontSize:10,
                  cursor:'pointer', fontFamily:RUSSO,
                }}>← VOLVER</button>
                <button onClick={onStart} style={{
                  flex:2, padding:'13px',
                  background:'linear-gradient(135deg,#FFD93D,#FF9800)',
                  border:'none', borderRadius:10, color:'#000', fontSize:13,
                  cursor:'pointer', fontFamily:RUSSO, letterSpacing:2,
                  boxShadow:'0 4px 0 #7A3800, 0 0 24px rgba(255,180,0,.5)',
                  animation:'msc-pulse 1s ease-in-out infinite',
                }}>⚽ ¡JUGAR!</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}