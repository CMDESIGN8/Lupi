// src/lib/chatFilter.ts
// Primera barrera del chat. El servidor repite las reglas de datos personales y términos bloqueados
// (ver lobby_chat.sql): este filtro existe para dar feedback inmediato y cuidar al resto, no es la única defensa.

export const MAX_LEN = 140;

export type CheckResult = { ok: true; text: string } | { ok: false; reason: string };

const REASON_RULES = "Ese mensaje no cumple las reglas del chat. Acá nos tratamos bien.";
const REASON_PERSONAL = "Por seguridad no se pueden compartir teléfonos, redes ni links.";

/** minúsculas, sin tildes, y letras "disfrazadas" (4→a, 3→e, 1→i, 0→o, 5→s, 7→t, $→s, @→a) */
function plainText(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[@4]/g, "a")
    .replace(/3/g, "e")
    .replace(/[1!|]/g, "i")
    .replace(/0/g, "o")
    .replace(/[5$]/g, "s")
    .replace(/7/g, "t");
}

/** Palabras sueltas (no subcadenas: así "computadora" o "disputa" no se bloquean por error). */
const BLOCKED_WORDS = new Set([
  // insultos y vulgaridades fuertes
  "puta", "puto", "putas", "putos", "mierda", "pelotudo", "pelotuda", "pelotudos", "forro", "forra", "forros",
  "concha", "conchudo", "reconcha", "sorete", "hdp", "hijodeputa", "verga", "pija", "culo",
  // discriminación
  "mogolico", "mogolica", "retrasado", "retrasada", "maricon", "trolo", "sudaca", "bolita",
  // sexual
  "porno", "porn", "sexo", "sexy", "tetas", "nude", "nudes", "pene", "coger",
  // violencia dirigida
  "matate", "suicidate",
]);

const BLOCKED_PHRASES = [/te voy a (matar|reventar)/, /anda a matarte/];

/** Pedidos típicos de contacto o de datos de menores. */
const PERSONAL_PHRASES = [
  /(pasame|mandame|dame|pasa)\s+(tu|una)\s+(numero|foto|insta|cel|celular|whats)/,
  /donde vivis/,
  /cuantos anos tenes/,
  /que edad tenes/,
  /mi (numero|cel|celular|whats|insta) es/,
];

const CONTACT_SITES = /\b(whats?app|wsp|wpp|insta|instagram|tiktok|telegram|discord|snap|snapchat|facebook|messenger|skype)\b/;

function hasBlockedWord(plain: string) {
  const words = plain.split(/[^a-z]+/).filter(Boolean);

  // "p u t a" / "p.u.t.a": se juntan las rachas de letras sueltas y se prueban como una palabra
  const joined: string[] = [];
  let run = "";
  for (const raw of plain.split(/[\s._\-*]+/)) {
    if (/^[a-z]$/.test(raw)) {
      run += raw;
    } else {
      if (run.length >= 3) joined.push(run);
      run = "";
    }
  }
  if (run.length >= 3) joined.push(run);

  return [...words, ...joined].some((w) => BLOCKED_WORDS.has(w) || BLOCKED_WORDS.has(w.replace(/s$/, "")));
}

export function checkMessage(raw: string): CheckResult {
  // espacios y repeticiones: "holaaaaaaa" -> "holaaa"
  const text = raw.replace(/\s+/g, " ").trim().replace(/(.)\1{4,}/g, "$1$1$1");

  if (!text) return { ok: false, reason: "Escribí algo para mandar." };
  if (text.length > MAX_LEN) return { ok: false, reason: `Máximo ${MAX_LEN} caracteres.` };

  const lower = text.toLowerCase();
  const plain = plainText(text);

  // datos personales: links, mails, teléfonos (con o sin separadores), redes
  const digits = lower.match(/\d(?:[\s.\-()]*\d){6,}/);
  const looksLikeUrl = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|ar|net|org|io|gg|me|tv|ly|app)\b)/.test(lower);
  const looksLikeEmail = /\S+@\S+\.\S+/.test(lower);
  if (digits || looksLikeUrl || looksLikeEmail || CONTACT_SITES.test(plain) || PERSONAL_PHRASES.some((r) => r.test(plain))) {
    return { ok: false, reason: REASON_PERSONAL };
  }

  if (hasBlockedWord(plain) || BLOCKED_PHRASES.some((r) => r.test(plain))) {
    return { ok: false, reason: REASON_RULES };
  }

  return { ok: true, text };
}