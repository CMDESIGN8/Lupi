import { divisions, snapshotLabel } from "../data/futsalData";
// Etapa 1: datos locales, sin conexiones a Supabase ni escrituras.
// Futuras importaciones deberán validar y publicar los datos antes de exponerlos.
export function getFutsalSnapshot() { return { divisions, snapshotLabel }; }
