import React, { useState, useEffect } from 'react';
import { getClubDetails, getClubMembers, leaveClub } from '../../services/api';
import { ClubEvents } from './ClubEvents'; // ← NUEVO IMPORT
import { MemberManagement } from '../cmdesign/MemberManagement'; // ← Verificar que esta línea esté presente

import '../../styles/MyClub.css';

export const MyClub = ({ character, onClubUpdate }) => {
  const [club, setClub] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (character.club_id) {
      fetchClubData();
    }
  }, [character.club_id]);

  const fetchClubData = async () => {
    try {
      setLoading(true);
      const [clubData, membersData] = await Promise.all([
        getClubDetails(character.club_id),
        getClubMembers(character.club_id)
      ]);
      
      setClub(clubData.club);
      setMembers(membersData.members || []);
    } catch (error) {
      console.error('Error cargando datos del club:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveClub = async () => {
    if (!window.confirm('¿Estás seguro de que quieres abandonar el club?')) {
      return;
    }

    try {
      setLeaving(true);
      await leaveClub(character.club_id, character.id);
      alert('Has abandonado el club');
      onClubUpdate(); // Actualizar dashboard
    } catch (error) {
      console.error('Error abandonando club:', error);
      alert(error.message);
    } finally {
      setLeaving(false);
    }
  };

  if (loading) {
    return (
      <div className="club-loading">
        <div className="loading-spinner"></div>
        <p>Cargando información del club...</p>
      </div>
    );
  }

  if (!club) {
    return (
      <div className="no-club-data">
        <p>No se pudo cargar la información del club</p>
        <button onClick={fetchClubData} className="btn-refresh">
          🔄 REINTENTAR
        </button>
      </div>
    );
  }

  const currentMember = members.find(m => m.character_id === character.id);
  const isAdmin = currentMember?.role === 'admin';

  return (
    <div className="my-club">
      {/* Header del Club */}
      <div className="club-header">
        <div className="club-banner">
          <div className="club-logo-large">
            {club.logo_url ? (
              <img src={club.logo_url} alt={club.name} />
            ) : (
              <div className="club-icon-large">🏆</div>
            )}
          </div>
          <div className="club-details">
            <h2 className="club-title">{club.name}</h2>
            <p className="club-description">{club.description}</p>
            <div className="club-stats-overview">
              <div className="stat-item">
                <span className="stat-value">{club.member_count || 0}</span>
                <span className="stat-label">MIEMBROS</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{club.level || 1}</span>
                <span className="stat-label">NIVEL</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{club.total_contributions || 0}</span>
                <span className="stat-label">CONTRIBUCIONES</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{currentMember?.role || 'member'}</span>
                <span className="stat-label">TU ROL</span>
              </div>
            </div>
          </div>
        </div>

        <div className="club-actions">
          {isAdmin && (
            <button className="btn-admin" title="Panel de Administración">
              ⚙️ ADMIN
            </button>
          )}
          <button
            onClick={handleLeaveClub}
            disabled={leaving}
            className="btn-leave"
            title="Abandonar Club"
          >
            {leaving ? '🔄...' : '🚪 SALIR'}
          </button>
        </div>
      </div>

      {/* Navegación de pestañas */}
      <div className="club-tabs">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 RESUMEN
        </button>
        <button
      className={`tab-button ${activeTab === 'events' ? 'active' : ''}`}
      onClick={() => setActiveTab('events')}
    >
      📅 EVENTOS
    </button>
        <button
          className={`tab-button ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          👥 MIEMBROS
        </button>
        <button
          className={`tab-button ${activeTab === 'missions' ? 'active' : ''}`}
          onClick={() => setActiveTab('missions')}
        >
          🎯 MISIONES
        </button>
        <button
          className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          💬 CHAT
        </button>
        {isAdmin && (
  <button
    className={`tab-button ${activeTab === 'management' ? 'active' : ''}`}
    onClick={() => setActiveTab('management')}
  >
    👑 ADMINISTRAR
  </button>
)}
        
      </div>

      
      {/* Contenido de las pestañas */}
      <div className="club-content">
        {activeTab === 'overview' && (
          <div className="tab-content">
            <h3>Resumen del Club</h3>
            <p>Bienvenido al club {club.name}. Aquí podrás ver las actividades recientes, misiones y eventos.</p>
            {/* Aquí irá el feed de actividades */}
          </div>
        )}

        {activeTab === 'management' && isAdmin && (
  <div className="tab-content">
    <MemberManagement 
      club={club}
      character={character}
      members={members}
      onMembersUpdate={fetchClubData}
    />
  </div>
)}

        {/* ← NUEVA PESTAÑA EVENTOS */}
    {activeTab === 'events' && (
      <div className="tab-content">
        <ClubEvents 
          club={club} 
          character={character} 
        />
      </div>
    )}

        {activeTab === 'members' && (
          <div className="tab-content">
            <h3>Miembros del Club ({members.length})</h3>
            <div className="members-list">
              {members.map(member => (
                <div key={member.character_id} className="member-card">
                  <div className="member-avatar">
                    {member.characters?.nickname?.charAt(0) || '?'}
                  </div>
                  <div className="member-info">
                    <span className="member-name">
                      {member.characters?.nickname || 'Desconocido'}
                    </span>
                    <span className="member-level">
                      Nv. {member.characters?.level || 1}
                    </span>
                  </div>
                  <div className="member-stats">
                    <span className="member-role badge-role">
                      {member.role}
                    </span>
                    <span className="member-contribution">
                      {member.weekly_contribution || 0} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'missions' && (
          <div className="tab-content">
            <h3>Misiones del Club</h3>
            <p>Las misiones de club estarán disponibles pronto.</p>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="tab-content">
            <h3>Chat del Club</h3>
            <p>El chat interno del club estará disponible pronto.</p>
          </div>
        )}
      </div>
    </div>
  );
};