import {
  useAuraInventory,
  type InventoryItem,
  type ItemSlot,
} from "../hooks/useAuraInventory";
import "./AuraInventory.css";

type AuraInventoryProps = {
  userId: string;
  level: number;
};

const SLOTS: { slot: ItemSlot; label: string; icon: string }[] = [
  { slot: "top", label: "TOP", icon: "👕" },
  { slot: "bottom", label: "BOTTOM", icon: "🩳" },
  { slot: "boots", label: "BOTINES", icon: "👟" },
  { slot: "accessory", label: "EXTRA", icon: "🧢" },
];

function ItemIcon({ item }: { item: InventoryItem }) {
  if (item.imageUrl) {
    return <img src={item.imageUrl} alt={item.name} className="inv-item-img" />;
  }
  return <span className="inv-item-emoji">{item.icon}</span>;
}

export function AuraInventory({ userId, level }: AuraInventoryProps) {
  const { items, loading, toggleEquip } = useAuraInventory(userId, level);

  if (loading) {
    return <div className="aura-inventory inv-loading">Cargando inventario...</div>;
  }

  const ownedCount = items.filter((i) => i.owned).length;

  const getStatus = (item: InventoryItem) => {
    if (item.equipped) return "EQUIPADO";
    if (item.owned) return "EQUIPAR";
    if (level < item.requiredLevel) return `🔒 LVL ${item.requiredLevel}`;
    return "🔒 BLOQUEADO";
  };

  return (
    <div className="aura-inventory">
      {/* ===== EQUIPADO ===== */}
      <div className="inv-header">
        <span className="inv-title">EQUIPADO</span>
      </div>

      <div className="inv-slots">
        {SLOTS.map(({ slot, label, icon }) => {
          const equipped = items.find((i) => i.slot === slot && i.equipped);

          return (
            <button
              key={slot}
              type="button"
              className={`inv-slot ${equipped ? `filled rarity-${equipped.rarity}` : ""}`}
              onClick={() => equipped && toggleEquip(equipped.id)}
              title={equipped ? `Desequipar ${equipped.name}` : `${label} vacío`}
            >
              <div className="inv-slot-visual">
                {equipped ? (
                  <ItemIcon item={equipped} />
                ) : (
                  <span className="inv-slot-empty">{icon}</span>
                )}
              </div>
              <small>{equipped ? equipped.name : label}</small>
            </button>
          );
        })}
      </div>

      {/* ===== INVENTARIO ===== */}
      <div className="inv-header">
        <span className="inv-title">INVENTARIO</span>
        <span className="inv-count">
          {ownedCount} / {items.length}
        </span>
      </div>

      <div className="inv-grid">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={!item.owned}
            onClick={() => toggleEquip(item.id)}
            className={[
              "inv-item",
              `rarity-${item.rarity}`,
              item.owned ? "owned" : "locked",
              item.equipped ? "equipped" : "",
            ].join(" ")}
          >
            <div className="inv-item-visual">
              <ItemIcon item={item} />
            </div>

            <strong>{item.name}</strong>
            <small>{item.drop}</small>

            <span className="inv-item-status">{getStatus(item)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}