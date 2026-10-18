// src/components/EditorIcons.tsx
// Íconos de categoría en SVG (reemplazan a los emojis del editor). Heredan el color del texto.
import type { ItemSlot } from "../hooks/useAuraInventory";

const PATHS: Record<ItemSlot, string> = {
  top: "M8.2 3.5 3 6.6l2.3 4.2 2.7-1.2V20h8V9.6l2.7 1.2L21 6.6l-5.2-3.1C15 5.1 13.7 6 12 6S9 5.1 8.2 3.5z",
  bottom: "M6.2 4h11.6l1.6 16h-5.3L12 11.6 9.9 20H4.6L6.2 4z",
  boots: "M3 13.6c0-1 .6-1.8 1.6-2.1l4-1.1 1.7-5.2h3l-.4 4.3 5.9 2.2c1.3.5 2.2 1.6 2.2 3v1.8H3v-2.9zM3 18.6h18v1.4H3z",
  accessory: "M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3.1-5.4 3.1 1.2-6-4.5-4.2 6.1-.7L12 3z",
};

export function SlotIcon({ slot, size = 24 }: { slot: ItemSlot; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false">
      <path d={PATHS[slot]} />
    </svg>
  );
}

export function GridIcon({ size = 24 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z" />
    </svg>
  );
}

export function CheckIcon({ size = 14 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  );
}

export function LockIcon({ size = 12 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M7 10V8a5 5 0 0 1 10 0v2h1.5A1.5 1.5 0 0 1 20 11.5v8a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19.5v-8A1.5 1.5 0 0 1 5.5 10H7zm2 0h6V8a3 3 0 0 0-6 0v2z" />
    </svg>
  );
}