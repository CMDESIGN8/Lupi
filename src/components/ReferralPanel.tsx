// src/components/ReferralPanel.tsx
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

interface ReferralPanelProps {
  userId: string;
}

export function ReferralPanel({ userId }: ReferralPanelProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadReferralStats();
  }, [userId]);

  const loadReferralStats = async () => {
    const { data, error } = await supabase
      .rpc('get_referral_stats', { p_user_id: userId });
    
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

  if (loading) return <div className="loading">Cargando...</div>;

  return (
    <div className="referral-panel">
      <div className="referral-header">
        <h3>🎁 Invita a tus amigos</h3>
        <p>Gana <strong>50 puntos</strong> por cada amigo que se registre con tu código</p>
      </div>

      <div className="referral-code-box">
        <div className="code-label">Tu código de referido:</div>
        <div className="code-value">{stats?.referral_code}</div>
        <button onClick={copyToClipboard} className="btn-copy">
          {copied ? '✅ ¡Copiado!' : '📋 Copiar'}
        </button>
      </div>

      <div className="share-buttons">
        <button onClick={shareOnWhatsApp} className="btn-whatsapp">
          💬 Compartir en WhatsApp
        </button>
      </div>

      <div className="referral-stats">
        <div className="stat">
          <span className="stat-value">{stats?.referral_count || 0}</span>
          <span className="stat-label">Amigos referidos</span>
        </div>
        <div className="stat">
          <span className="stat-value">{stats?.referral_points || 0}</span>
          <span className="stat-label">Puntos por referidos</span>
        </div>
      </div>

      {stats?.referrals?.length > 0 && (
        <div className="referral-list">
          <h4>Tus referidos</h4>
          {stats.referrals.map((ref: any) => (
            <div key={ref.username} className="referral-item">
              <span>👤 {ref.username}</span>
              <span>📅 {new Date(ref.joined_at).toLocaleDateString()}</span>
              <span>⭐ +{ref.points_awarded} pts</span>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .referral-panel {
          background: var(--surface);
          border-radius: 20px;
          padding: 24px;
          margin: 16px 0;
        }
        .referral-header h3 {
          font-family: var(--font-display);
          font-size: 24px;
          margin-bottom: 8px;
        }
        .referral-code-box {
          background: var(--surface2);
          border-radius: 12px;
          padding: 16px;
          margin: 16px 0;
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        .code-value {
          font-family: monospace;
          font-size: 24px;
          font-weight: bold;
          color: var(--accent);
          background: var(--bg);
          padding: 8px 16px;
          border-radius: 8px;
          letter-spacing: 2px;
        }
        .btn-copy, .btn-whatsapp {
          padding: 8px 16px;
          border-radius: 8px;
          border: none;
          cursor: pointer;
          font-weight: bold;
        }
        .btn-copy {
          background: var(--accent);
          color: #0a0a0f;
        }
        .btn-whatsapp {
          background: #25D366;
          color: white;
        }
        .referral-stats {
          display: flex;
          gap: 20px;
          margin: 20px 0;
          padding: 16px;
          background: var(--surface2);
          border-radius: 12px;
        }
        .stat {
          flex: 1;
          text-align: center;
        }
        .stat-value {
          font-family: var(--font-display);
          font-size: 32px;
          color: var(--accent);
          display: block;
        }
        .referral-item {
          display: flex;
          justify-content: space-between;
          padding: 12px;
          border-bottom: 1px solid var(--border);
        }
      `}</style>
    </div>
  );
}