import React, { useState, useEffect } from 'react';
import { getClubs, joinClub } from '../../services/api';
import '../../styles/ClubList.css';

export const ClubList = ({ character, onClubUpdate }) => {
  const [clubs, setClubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [joining, setJoining] = useState(null);

  useEffect(() => {
    fetchClubs();
  }, []);

  const fetchClubs = async () => {
    try {
      setLoading(true);
      const response = await getClubs();
      setClubs(response.clubs || []);
    } catch (error) {
      console.error('Error cargando clubes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinClub = async (clubId) => {
    try {
      setJoining(clubId);
      await joinClub(clubId, character.id);
      alert('¡Te has unido al club exitosamente!');
      onClubUpdate(); // Actualizar datos del personaje
    } catch (error) {
      console.error('Error uniéndose al club:', error);
      alert(error.message);
    } finally {
      setJoining(null);
    }
  };

  const filteredClubs = clubs.filter(club =>
    club.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    club.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="clubs-loading">
        <div className="loading-spinner"></div>
        <p>Cargando clubes...</p>
      </div>
    );
  }

  return (
    <div className="club-list">
      <div className="club-list-header">
        <h2>🏆 CLUBES DISPONIBLES</h2>
        <div className="club-search">
          <input
            type="text"
            placeholder="Buscar clubes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="clubs-grid">
        {filteredClubs.map(club => (
          <div key={club.id} className="club-card">
            <div className="club-header">
              <div className="club-logo">
                {club.logo_url ? (
                  <img src={club.logo_url} alt={club.name} />
                ) : (
                  <div className="club-icon">🏆</div>
                )}
              </div>
              <div className="club-info">
                <h3 className="club-name">{club.name}</h3>
                <p className="club-description">{club.description || 'Sin descripción'}</p>
                <div className="club-stats">
                  <span className="stat">
                    👥 {club.member_count || 0} miembros
                  </span>
                  <span className="stat">
                    ⭐ Nv. {club.level || 1}
                  </span>
                </div>
              </div>
            </div>

            <div className="club-actions">
              {character.club_id === club.id ? (
                <button className="btn-joined" disabled>
                  ✅ MIEMBRO
                </button>
              ) : (
                <button
                  className="btn-join"
                  onClick={() => handleJoinClub(club.id)}
                  disabled={joining === club.id || character.club_id}
                >
                  {joining === club.id ? '🔄 UNIÉNDOSE...' : '🎯 UNIRSE'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredClubs.length === 0 && (
        <div className="no-clubs">
          <p>No se encontraron clubes</p>
          <button onClick={fetchClubs} className="btn-refresh">
            🔄 RECARGAR
          </button>
        </div>
      )}
    </div>
  );
};