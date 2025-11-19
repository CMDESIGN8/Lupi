// src/components/cmdesign/ClubManagement.jsx
import React, { useState, useEffect } from 'react';
import { getClubDetails, getClubMembers, getClubEvents, updateClubEvent, deleteClubEvent } from '../../services/api';

export const ClubManagement = ({ selectedClub }) => {
  const [activeTab, setActiveTab] = useState('members');
  const [clubData, setClubData] = useState(null);
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Simulamos que tenemos un club seleccionado (luego vendrá de props)
  const currentClubId = '242ff70d-1b5d-4837-a37e-88daac29cb70'; // Por ahora hardcodeado

  useEffect(() => {
    if (currentClubId) {
      fetchClubData();
    }
  }, [currentClubId]);

  const fetchClubData = async () => {
    try {
      setLoading(true);
      const [clubResponse, membersResponse, eventsResponse] = await Promise.all([
        getClubDetails(currentClubId),
        getClubMembers(currentClubId),
        getClubEvents(currentClubId)
      ]);

      setClubData(clubResponse.club);
      setMembers(membersResponse.members || []);
      setEvents(eventsResponse.events || []);
    } catch (error) {
      console.error('Error cargando datos del club:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMemberRole = async (characterId, newRole) => {
    try {
      // Aquí iría la lógica para actualizar el rol
      alert(`Rol actualizado a ${newRole}`);
      fetchClubData(); // Recargar datos
    } catch (error) {
      alert('Error actualizando rol: ' + error.message);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este evento?')) {
      try {
        await deleteClubEvent(currentClubId, eventId, 'character-id'); // Necesitarías el character_id
        alert('Evento eliminado exitosamente');
        fetchClubData(); // Recargar datos
      } catch (error) {
        alert('Error eliminando evento: ' + error.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="club-management-loading">
        <div className="loading-spinner"></div>
        <p>Cargando gestión del club...</p>
      </div>
    );
  }

  return (
    <div className="club-management">
      <div className="club-management-header">
        <h2>🏆 Gestión de Club: {clubData?.name || 'Mi Club'}</h2>
        <div className="club-stats">
          <div className="club-stat">
            <span className="stat-number">{members.length}</span>
            <span className="stat-label">Socios</span>
          </div>
          <div className="club-stat">
            <span className="stat-number">{events.length}</span>
            <span className="stat-label">Eventos</span>
          </div>
          <div className="club-stat">
            <span className="stat-number">{clubData?.level || 1}</span>
            <span className="stat-label">Nivel</span>
          </div>
        </div>
      </div>

      {/* Navegación de pestañas */}
      <div className="management-tabs">
        <button 
          className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          👥 Gestión de Socios
        </button>
        <button 
          className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          📅 Gestión de Eventos
        </button>
        <button 
          className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Configuración
        </button>
        <button 
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📊 Analytics
        </button>
      </div>

      {/* Contenido de las pestañas */}
      <div className="management-content">
        {activeTab === 'members' && (
          <MembersManagement 
            members={members} 
            onUpdateRole={handleUpdateMemberRole}
          />
        )}

        {activeTab === 'events' && (
          <EventsManagement 
            events={events}
            onDeleteEvent={handleDeleteEvent}
            clubId={currentClubId}
          />
        )}

        {activeTab === 'settings' && (
          <ClubSettings clubData={clubData} />
        )}

        {activeTab === 'analytics' && (
          <ClubAnalytics clubData={clubData} members={members} events={events} />
        )}
      </div>
    </div>
  );
};

// Componente de Gestión de Socios
const MembersManagement = ({ members, onUpdateRole }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMembers = members.filter(member =>
    member.characters?.nickname?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="members-management">
      <div className="section-header">
        <h3>Gestión de Socios ({members.length})</h3>
        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar socio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="members-table">
        <div className="table-header">
          <div className="table-col">Socio</div>
          <div className="table-col">Nivel</div>
          <div className="table-col">Rol</div>
          <div className="table-col">Contribución</div>
          <div className="table-col">Acciones</div>
        </div>

        <div className="table-body">
          {filteredMembers.map(member => (
            <div key={member.character_id} className="table-row">
              <div className="table-col">
                <div className="member-info">
                  <div className="member-avatar">
                    {member.characters?.nickname?.charAt(0) || '?'}
                  </div>
                  <div className="member-details">
                    <span className="member-name">{member.characters?.nickname || 'Desconocido'}</span>
                    <span className="member-email">{member.characters?.user_id}</span>
                  </div>
                </div>
              </div>
              <div className="table-col">
                <span className="member-level">Nv. {member.characters?.level || 1}</span>
              </div>
              <div className="table-col">
                <span className={`role-badge ${member.role}`}>
                  {member.role}
                </span>
              </div>
              <div className="table-col">
                <span className="contribution">
                  {member.weekly_contribution || 0} pts
                </span>
              </div>
              <div className="table-col">
                <div className="action-buttons">
                  {member.role !== 'admin' && (
                    <>
                      <button 
                        className="btn-promote"
                        onClick={() => onUpdateMemberRole(member.character_id, 'moderator')}
                      >
                        Promover
                      </button>
                      <button 
                        className="btn-demote"
                        onClick={() => onUpdateMemberRole(member.character_id, 'member')}
                      >
                        Degradar
                      </button>
                    </>
                  )}
                  <button className="btn-remove">
                    Expulsar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Componente de Gestión de Eventos
const EventsManagement = ({ events, onDeleteEvent, clubId }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);

  return (
    <div className="events-management">
      <div className="section-header">
        <h3>Gestión de Eventos ({events.length})</h3>
        <button 
          className="btn-create-event"
          onClick={() => setShowCreateForm(true)}
        >
          + Crear Nuevo Evento
        </button>
      </div>

      {showCreateForm && (
        <EventCreationForm 
          clubId={clubId}
          onClose={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            // Recargar eventos
          }}
        />
      )}

      <div className="events-grid">
        {events.map(event => (
          <div key={event.id} className="event-management-card">
            <div className="event-header">
              <div className="event-type">{getEventIcon(event.event_type)}</div>
              <div className="event-info">
                <h4>{event.title}</h4>
                <p>{event.description}</p>
              </div>
              <div className="event-status">
                <span className={`status-badge ${event.status}`}>
                  {event.status}
                </span>
              </div>
            </div>
            
            <div className="event-details">
              <div className="event-detail">
                <span>📅</span>
                <span>{new Date(event.start_date).toLocaleDateString()}</span>
              </div>
              <div className="event-detail">
                <span>👥</span>
                <span>{event.club_event_participants?.length || 0} participantes</span>
              </div>
              {event.price > 0 && (
                <div className="event-detail">
                  <span>💰</span>
                  <span>${event.price}</span>
                </div>
              )}
            </div>

            <div className="event-actions">
              <button className="btn-edit">✏️ Editar</button>
              <button className="btn-notify">🔔 Notificar</button>
              <button 
                className="btn-delete"
                onClick={() => onDeleteEvent(event.id)}
              >
                🗑️ Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Componente de Configuración del Club
const ClubSettings = ({ clubData }) => {
  return (
    <div className="club-settings">
      <h3>Configuración del Club</h3>
      <div className="settings-grid">
        <div className="setting-group">
          <label>Nombre del Club</label>
          <input type="text" defaultValue={clubData?.name} />
        </div>
        <div className="setting-group">
          <label>Descripción</label>
          <textarea defaultValue={clubData?.description} rows="3" />
        </div>
        <div className="setting-group">
          <label>Logo URL</label>
          <input type="url" defaultValue={clubData?.logo_url} />
        </div>
        <div className="setting-group">
          <label>
            <input type="checkbox" defaultChecked={clubData?.is_public} />
            Club Público
          </label>
        </div>
      </div>
      <div className="settings-actions">
        <button className="btn-save">💾 Guardar Cambios</button>
        <button className="btn-danger">🚨 Eliminar Club</button>
      </div>
    </div>
  );
};

// Componente de Analytics
const ClubAnalytics = ({ clubData, members, events }) => {
  return (
    <div className="club-analytics">
      <h3>Analytics del Club</h3>
      <div className="analytics-grid">
        <div className="analytics-card">
          <h4>📈 Crecimiento</h4>
          <div className="analytics-placeholder">
            Gráfico de crecimiento de miembros
          </div>
        </div>
        <div className="analytics-card">
          <h4>🎯 Participación</h4>
          <div className="analytics-placeholder">
            Métricas de participación en eventos
          </div>
        </div>
        <div className="analytics-card">
          <h4>💰 Ingresos</h4>
          <div className="analytics-placeholder">
            Reporte de ingresos por eventos
          </div>
        </div>
        <div className="analytics-card">
          <h4>👥 Top Contribuidores</h4>
          <div className="top-contributors">
            {members.slice(0, 5).map((member, index) => (
              <div key={member.character_id} className="contributor">
                <span className="rank">{index + 1}</span>
                <span className="name">{member.characters?.nickname}</span>
                <span className="points">{member.weekly_contribution || 0} pts</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper functions
const getEventIcon = (type) => {
  const icons = {
    tournament: '🏆',
    training: '🏋️',
    raffle: '🎫',
    friendly: '🤝',
    social: '🍻'
  };
  return icons[type] || '📅';
};

// Componente temporal para creación de eventos (podés reutilizar el que ya tenés)
const EventCreationForm = ({ clubId, onClose, onSuccess }) => {
  return (
    <div className="event-creation-modal">
      <div className="modal-content">
        <h3>Crear Nuevo Evento</h3>
        <p>Formulario de creación de eventos...</p>
        <div className="modal-actions">
          <button onClick={onClose}>Cancelar</button>
          <button onClick={onSuccess}>Crear</button>
        </div>
      </div>
    </div>
  );
};

export default ClubManagement;