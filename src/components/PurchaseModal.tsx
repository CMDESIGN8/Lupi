// src/components/PurchaseModal.tsx
import { useEffect } from "react";
import { ShopItem } from "../lib/api";

type Props = {
  item: ShopItem;
  userCoins: number;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function PurchaseModal({
  item,
  userCoins,
  loading,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel, loading]);

  const remaining = userCoins - item.cost;
  const canBuy = remaining >= 0;

  return (
    <div className="purchase-modal" onClick={() => !loading && onCancel()}>
      <div className="purchase-content" onClick={(e) => e.stopPropagation()}>
        <div className="purchase-icon">{item.icon}</div>

        <h2 className="purchase-title">¿Comprar {item.title}?</h2>
        <p className="purchase-desc">{item.description}</p>

        <div className="purchase-summary">
          <div className="purchase-row">
            <span>Precio</span>
            <strong>🪙 {item.cost}</strong>
          </div>
          <div className="purchase-row">
            <span>Tu saldo</span>
            <span>🪙 {userCoins.toLocaleString("es-AR")}</span>
          </div>
          <div className="purchase-divider" />
          <div className="purchase-row total">
            <span>Saldo después</span>
            <strong className={remaining < 0 ? "negative" : ""}>
              🪙 {remaining.toLocaleString("es-AR")}
            </strong>
          </div>
        </div>

        <div className="purchase-actions">
          <button
            className="btn btn-ghost"
            onClick={onCancel}
            disabled={loading}
          >
            CANCELAR
          </button>
          <button
            className="btn btn-primary purchase-confirm"
            onClick={onConfirm}
            disabled={!canBuy || loading}
          >
            {loading
              ? "..."
              : !canBuy
              ? "SALDO INSUFICIENTE"
              : "COMPRAR"}
          </button>
        </div>
      </div>
    </div>
  );
}