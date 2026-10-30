export type Pos = { x: number; y: number };
export type Formation = Record<number, Pos>;

export const USER_BASE: Formation = {
  0:{ x:10, y:50 },
  1:{ x:25, y:50 },
  2:{ x:35, y:22 },
  3:{ x:35, y:78 },
  4:{ x:44, y:50 },
};
export const RIVAL_BASE: Formation = {
  0:{ x:90, y:50 },
  1:{ x:75, y:50 },
  2:{ x:65, y:22 },
  3:{ x:65, y:78 },
  4:{ x:56, y:50 },
};

export const FORMATIONS: Record<string, Formation> = {
  base:         { 0:{ x:10,y:50 }, 1:{ x:25,y:50 }, 2:{ x:35,y:22 }, 3:{ x:35,y:78 }, 4:{ x:44,y:50 } },
  attack:       { 0:{ x:12,y:50 }, 1:{ x:32,y:50 }, 2:{ x:58,y:18 }, 3:{ x:58,y:82 }, 4:{ x:68,y:50 } },
  counterAttack:{ 0:{ x:10,y:50 }, 1:{ x:30,y:50 }, 2:{ x:62,y:20 }, 3:{ x:62,y:80 }, 4:{ x:72,y:50 } },
  defense:      { 0:{ x:8, y:50 }, 1:{ x:18,y:50 }, 2:{ x:24,y:28 }, 3:{ x:24,y:72 }, 4:{ x:32,y:50 } },
  celebrate:    { 0:{ x:15,y:50 }, 1:{ x:60,y:48 }, 2:{ x:68,y:35 }, 3:{ x:68,y:65 }, 4:{ x:75,y:50 } },
  mourn:        { 0:{ x:10,y:50 }, 1:{ x:22,y:50 }, 2:{ x:30,y:30 }, 3:{ x:30,y:70 }, 4:{ x:40,y:50 } },
};

export function mirror(f: Formation): Formation {
  return Object.fromEntries(Object.entries(f).map(([k, v]) => [k, { x: 100 - v.x, y: 100 - v.y }])) as Formation;
}

