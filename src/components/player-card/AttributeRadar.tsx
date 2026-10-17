// src/components/player-card/AttributeRadar.tsx
import { ATTRIBUTE_META } from "./constants";
import type { LupiAttributes } from "./types";

const CENTER = 100;
const RADIUS = 64;
const COUNT = ATTRIBUTE_META.length;

function point(index: number, scale: number): [number, number] {
  const angle = (Math.PI * 2 * index) / COUNT - Math.PI / 2;
  return [CENTER + Math.cos(angle) * RADIUS * scale, CENTER + Math.sin(angle) * RADIUS * scale];
}

const toPoints = (scales: number[]) =>
  scales.map((scale, i) => point(i, scale).map((v) => v.toFixed(1)).join(",")).join(" ");

export function AttributeRadar({ attributes }: { attributes: LupiAttributes }) {
  const values = ATTRIBUTE_META.map((meta) => Math.max(0, Math.min(99, attributes[meta.key])) / 99);
  const summary = ATTRIBUTE_META.map((meta) => `${meta.life} ${attributes[meta.key]}`).join(", ");

  return (
    <svg className="lw-radar" viewBox="0 0 200 200" role="img" aria-label={`Atributos: ${summary}`}>
      {[1 / 3, 2 / 3, 1].map((ring) => (
        <polygon key={ring} className="lw-radar__ring" points={toPoints(Array(COUNT).fill(ring))} />
      ))}
      {ATTRIBUTE_META.map((meta, i) => {
        const [x, y] = point(i, 1);
        return <line key={meta.key} className="lw-radar__axis" x1={CENTER} y1={CENTER} x2={x} y2={y} />;
      })}
      <polygon className="lw-radar__shape" points={toPoints(values)} />
      {values.map((value, i) => {
        const [x, y] = point(i, value);
        return <circle key={ATTRIBUTE_META[i].key} className="lw-radar__dot" cx={x} cy={y} r={2.6} />;
      })}
      {ATTRIBUTE_META.map((meta, i) => {
        const [x, y] = point(i, 1.36);
        return (
          <g key={meta.key} className="lw-radar__label" aria-hidden="true">
            <text x={x} y={y - 6} textAnchor="middle" dominantBaseline="middle" className="lw-radar__code">
              {meta.code}
            </text>
            <text x={x} y={y + 7} textAnchor="middle" dominantBaseline="middle" className="lw-radar__val">
              {attributes[meta.key]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
