// src/components/NavBadge.tsx
export function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  const label = count > 9 ? "9+" : String(count);
  return <span className="nav-badge">{label}</span>;
}