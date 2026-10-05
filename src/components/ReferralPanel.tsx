// src/components/ReferralPanel.tsx
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

interface ReferralPanelProps {
  userId: string;
}

export function ReferralPanel({ userId }: ReferralPanelProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadReferralStats();
  }, [userId]);

  const loadReferralStats = async () => {
    const { data, error } = await supabase.rpc("get_referral_stats", {
      p_user_id: userId,
    });

    if (!error && data) {
      setStats(data);
      setShareLink(`${window.location.origin}?ref=${data.referral_code}`);
    }
    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOnWhatsApp = () => {
    const text = `¡Usá mi código de referido ${stats?.referral_code} y ganá puntos extra en LupiApp! ${shareLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
  };

  if (loading) {
    return (
      <div className="referral-card">
        <div className="skeleton" style={{ height: 120, borderRadius: 14 }} />
      </div>
    );
  }

  const referralCode = stats?.referral_code || "NO_CODE";
  const referralCount = stats?.referral_count || 0;
  const referralPoints = stats?.referral_points || 0;

  return (
    <div className="referral-card">
      <div className="referral-header">
        <div className="referral-header-icon">🤝</div>
        <div className="referral-header-copy">
          <h3>INVITÁ A TUS AMIGOS</h3>
          <p>Ganá <strong>50 puntos</strong> por cada amigo que se registre con tu código</p>
        </div>
      </div>

      <div className="referral-code-block">
        <span className="referral-code-label">TU CÓDIGO</span>
        <span className="referral-code-value">{referralCode}</span>
        <button onClick={copyToClipboard} className="referral-copy-btn">
          {copied ? "✅ COPIADO" : "📋 COPIAR"}
        </button>
      </div>

      <button onClick={shareOnWhatsApp} className="referral-wa-btn">
        <span>💬</span> Compartir en WhatsApp
      </button>

      <div className="referral-stats-grid">
        <div className="referral-stat">
          <span className="referral-stat-value">{referralCount}</span>
          <span className="referral-stat-label">Amigos referidos</span>
        </div>
        <div className="referral-stat">
          <span className="referral-stat-value">{referralPoints}</span>
          <span className="referral-stat-label">Puntos ganados</span>
        </div>
      </div>

      {stats?.referrals?.length > 0 && (
        <div className="referral-list">
          <div className="referral-list-title">Tus referidos</div>
          {stats.referrals.map((ref: any) => (
            <div key={ref.username} className="referral-item">
              <span className="referral-item-user">
                <span className="referral-item-avatar">
                  {ref.username[0]?.toUpperCase()}
                </span>
                {ref.username}
              </span>
              <span className="referral-item-date">
                {new Date(ref.joined_at).toLocaleDateString("es-AR", {
                  day: "2-digit",
                  month: "short",
                })}
              </span>
              <span className="referral-item-points">+{ref.points_awarded}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}