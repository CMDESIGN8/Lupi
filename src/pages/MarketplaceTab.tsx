// src/pages/MarketplaceTab.tsx
import { useState } from "react";
import { AppUser, ShopItem } from "../lib/api";
import { useShopItems } from "../hooks/useShopItems";
import { usePurchaseItem } from "../hooks/usePurchaseItem";
import { PurchaseModal } from "../components/PurchaseModal";
import { useToastContext } from "../components/ToastProvider";

type Category = "all" | "packs" | "boosts" | "cosmetics" | "specials";

const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: "all",       label: "Todos",       icon: "🏪" },
  { id: "packs",     label: "Packs",       icon: "🎁" },
  { id: "boosts",    label: "Boosts",      icon: "⚡" },
  { id: "cosmetics", label: "Cosméticos",  icon: "🎨" },
  { id: "specials",  label: "Especiales",  icon: "⭐" },
];

export function MarketplaceTab({
  user,
  onCoinsUpdate,
  onRewardClaimed,
}: {
  user: AppUser;
  onCoinsUpdate: (newCoins: number) => void;
  onRewardClaimed?: () => void;
}) {
  const { items, loading, error, refetch } = useShopItems();
  const { purchase } = usePurchaseItem();
  const { showToast } = useToastContext();

  const [activeCategory, setActiveCategory] = useState<Category>("all");
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  const filteredItems = items.filter(
    (i) => activeCategory === "all" || i.category === activeCategory
  );

  const handleConfirmPurchase = async () => {
    if (!selectedItem) return;
    setPurchasing(true);
    try {
      const result = await purchase(selectedItem.id);

      // Actualizar saldo en el estado global
      onCoinsUpdate(result.newCoins);

      // Toast de éxito
      showToast(`✅ Compraste "${selectedItem.title}"`, "success");

      // Refrescar items (por si el stock cambió)
      await refetch();

      // Aplicar efecto visual según tipo
      if (result.effect.type === "open_pack") {
        // TODO: abrir PackModal con las cartas del pack comprado
        // Por ahora, toast informativo
        showToast(
          `🎁 ¡Se abrió tu pack! (efecto próximamente visual)`,
          "info",
          4000
        );
      } else if (result.effect.type === "add_xp") {
        showToast(
          `⚡ +${result.effect.payload.amount || 50} XP acreditados`,
          "success"
        );
      } else {
        showToast(`✨ Efecto aplicado: ${selectedItem.title}`, "info");
      }

      // Refrescar contador de pendientes
      onRewardClaimed?.();

      // Cerrar modal
      setSelectedItem(null);
    } catch (e: any) {
      showToast(`❌ ${e.message || "Error al comprar"}`, "error");
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <div className="main-content">
      <div className="container">
        {/* HERO */}
        <section className="shop-hero">
          <span className="shop-kicker">LUPIAPP · TIENDA</span>
          <h1>Comprá con tus<br />LUPICOINS.</h1>
          <p>Packs, boosts y cosméticos para tu cuenta.</p>
          <div className="shop-balance">
            <span>💰</span>
            <div>
              <strong>{(user.coins || 0).toLocaleString("es-AR")}</strong>
              <small>LUPICOINS DISPONIBLES</small>
            </div>
          </div>
        </section>

        {/* FILTROS */}
        <div className="shop-filters">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              className={`shop-filter${activeCategory === cat.id ? " active" : ""}`}
              onClick={() => setActiveCategory(cat.id)}
            >
              <span>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* CONTENIDO */}
        {loading ? (
          <div className="shop-grid">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="skeleton"
                style={{ height: 190, borderRadius: 20 }}
              />
            ))}
          </div>
        ) : error ? (
          <div className="empty-state fade-up">
            <div className="empty-icon">⚠️</div>
            <div className="empty-text">{error}</div>
            <button
              className="btn btn-primary"
              onClick={refetch}
              style={{ marginTop: 16, maxWidth: 200, margin: "16px auto 0" }}
            >
              REINTENTAR
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="empty-state fade-up">
            <div className="empty-icon">📭</div>
            <div className="empty-text">No hay items en esta categoría.</div>
          </div>
        ) : (
          <div className="shop-grid">
            {filteredItems.map((item) => {
              const canAfford = (user.coins || 0) >= item.cost;
              const outOfStock = item.stock !== null && item.stock <= 0;
              const disabled = !canAfford || outOfStock;
              return (
                <button
                  key={item.id}
                  className={`shop-card${disabled ? " disabled" : ""}`}
                  onClick={() => !disabled && setSelectedItem(item)}
                  disabled={disabled}
                >
                  {item.badge && <span className="shop-badge">{item.badge}</span>}
                  <div className="shop-icon">{item.icon}</div>
                  <div className="shop-title">{item.title}</div>
                  <div className="shop-desc">{item.description}</div>
                  <div
                    className={`shop-price${
                      outOfStock
                        ? " unavailable"
                        : canAfford
                        ? " can-afford"
                        : " cant-afford"
                    }`}
                  >
                    {outOfStock
                      ? "AGOTADO"
                      : canAfford
                      ? `🪙 ${item.cost}`
                      : `FALTAN ${item.cost - (user.coins || 0)}`}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <p className="shop-footnote">
          Los items comprados se aplican automáticamente a tu cuenta.
        </p>
      </div>

      {/* MODAL */}
      {selectedItem && (
        <PurchaseModal
          item={selectedItem}
          userCoins={user.coins || 0}
          loading={purchasing}
          onConfirm={handleConfirmPurchase}
          onCancel={() => !purchasing && setSelectedItem(null)}
        />
      )}
    </div>
  );
}