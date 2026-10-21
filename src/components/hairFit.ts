export type HairFit = { x: number; y: number; width: number; height: number };
export const HAIR_FIT: Record<string, HairFit> = {
  // Calibración inicial V13, porcentajes relativos al rostro.
  short:  {x:0,y:-12,width:130,height:153},
  fade:   {x:0,y:-12,width:130,height:154},
  curly:  {x:0,y:-17,width:130,height:161},
  long:   {x:0,y:-4,width:150,height:200},
  buzz:   {x:0,y:-8,width:110,height:137},
  side:   {x:-10,y:-18,width:140,height:160},
  spiky:  {x:0,y:-19,width:130,height:104},
  afro:   {x:0,y:-15,width:230,height:104},
  melena: {x:0,y:-3,width:140,height:160},
  coleta: {x:-14,y:-10,width:160,height:160},
};

export const HAIR_FIT_EVENT = 'lupi:hair-fit';
export const HAIR_FIT_STORAGE = 'lupi:hair-fit-v13';
export function getHairFit(hair: string): HairFit {
  const fallback = HAIR_FIT[hair] ?? HAIR_FIT.short;
  if (typeof window === 'undefined') return fallback;
  try {
    const saved = JSON.parse(localStorage.getItem(HAIR_FIT_STORAGE) || '{}');
    const value = saved[hair];
    return value && ['x','y','width','height'].every(k => Number.isFinite(value[k])) ? value : fallback;
  } catch { return fallback; }
}
