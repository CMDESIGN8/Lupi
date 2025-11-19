// src/components/clubs/ClubEvents.jsx
import React, { useState, useEffect } from 'react';
import { getClubEvents, createClubEvent, joinClubEvent, updateClubEvent, deleteClubEvent } from '../../services/api';
import '../../styles/ClubEvents.css';

export const ClubEvents = ({ club, character }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [activeEvent, setActiveEvent] = useState(null);

  const isAdmin = character.club_role === 'admin';

  useEffect(() => {
    fetchEvents();
  }, [club.id]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await getClubEvents(club.id);
      setEvents(response.events || []);
    } catch (error) {
      console.error('Error cargando eventos:', error);
      alert('Error al cargar eventos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEvent = async (eventData) => {
    try {
      setCreating(true);
      const response = await createClubEvent(club.id, {
        ...eventData,
        character_id: character.id
      });
      
      setEvents(prev => [response.event, ...prev]);
      setShowCreateForm(false);
      alert('✅ Evento creado exitosamente!');
    } catch (error) {
      alert('❌ Error creando evento: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleJoinEvent = async (eventId) => {
    try {
      const response = await joinClubEvent(club.id, eventId, character.id);
      alert('✅ ' + response.message);
      fetchEvents(); // Recargar eventos para actualizar estado
    } catch (error) {
      alert('❌ Error uniéndose al evento: ' + error.message);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este evento?')) {
      return;
    }

    try {
      await deleteClubEvent(club.id, eventId, character.id);
      alert('✅ Evento eliminado exitosamente');
      setEvents(prev => prev.filter(event => event.id !== eventId));
    } catch (error) {
      alert('❌ Error eliminando evento: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="events-loading">
        <div className="loading-spinner"></div>
        <p>Cargando eventos...</p>
      </div>
    );
  }

  return (
    <div className="club-events">
      <div className="events-header">
        <h3>📅 Eventos del Club</h3>
        {isAdmin && (
          <button 
            onClick={() => setShowCreateForm(true)}
            className="btn-create-event"
            disabled={creating}
          >
            {creating ? '🔄 CREANDO...' : '+ CREAR EVENTO'}
          </button>
        )}
      </div>

      {/* Formulario de creación */}
      {showCreateForm && (
        <EventCreationForm 
          onSubmit={handleCreateEvent}
          onCancel={() => setShowCreateForm(false)}
          loading={creating}
        />
      )}

      {/* Lista de eventos */}
      <div className="events-list">
        {events.length === 0 ? (
          <div className="no-events">
            <p>🎯 No hay eventos programados</p>
            <p className="no-events-subtitle">
              {isAdmin 
                ? 'Crea el primer evento para tu club' 
                : 'Los administradores crearán eventos pronto'
              }
            </p>
          </div>
        ) : (
          events.map(event => (
            <EventCard 
              key={event.id}
              event={event}
              character={character}
              onJoin={handleJoinEvent}
              onDelete={handleDeleteEvent}
              isAdmin={isAdmin}
            />
          ))
        )}
      </div>
    </div>
  );
};

// Componente para formulario de creación
const EventCreationForm = ({ onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'training',
    start_date: '',
    end_date: '',
    max_participants: '',
    location: '',
    price: '',
    reward_lupicoins: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validaciones básicas
    if (!formData.title.trim() || !formData.start_date) {
      alert('Título y fecha de inicio son requeridos');
      return;
    }

    // Preparar datos para enviar
    const eventData = {
      ...formData,
      max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
      price: formData.price ? parseFloat(formData.price) : 0,
      reward_lupicoins: formData.reward_lupicoins ? parseInt(formData.reward_lupicoins) : 0
    };

    onSubmit(eventData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="event-creation-form">
      <h4>Crear Nuevo Evento</h4>
      
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="form-group">
            <label>Título *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Ej: Torneo de Pádel Mensual"
              required
            />
          </div>

          <div className="form-group">
            <label>Tipo de Evento</label>
            <select
              name="event_type"
              value={formData.event_type}
              onChange={handleChange}
            >
              <option value="training">🏋️ Entrenamiento</option>
              <option value="tournament">🏆 Torneo</option>
              <option value="raffle">🎫 Rifa</option>
              <option value="friendly">🤝 Amistoso</option>
              <option value="social">🍻 Social</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Descripción</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe el evento, reglas, premios..."
            rows="3"
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Fecha de Inicio *</label>
            <input
              type="datetime-local"
              name="start_date"
              value={formData.start_date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Fecha de Fin</label>
            <input
              type="datetime-local"
              name="end_date"
              value={formData.end_date}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Lugar</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              placeholder="Ej: Cancha Central"
            />
          </div>

          <div className="form-group">
            <label>Máx. Participantes</label>
            <input
              type="number"
              name="max_participants"
              value={formData.max_participants}
              onChange={handleChange}
              placeholder="Sin límite"
              min="1"
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Precio ($)</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="0.00"
              min="0"
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label>Lupicoins de Recompensa</label>
            <input
              type="number"
              name="reward_lupicoins"
              value={formData.reward_lupicoins}
              onChange={handleChange}
              placeholder="0"
              min="0"
            />
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn-cancel"
            disabled={loading}
          >
            CANCELAR
          </button>
          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading ? '🔄 CREANDO...' : '🎯 CREAR EVENTO'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Componente para tarjeta de evento
const EventCard = ({ event, character, onJoin, onDelete, isAdmin }) => {
  const isParticipant = event.club_event_participants?.some(
    p => p.character_id === character.id
  );
  
  const canJoin = !isParticipant && event.status === 'scheduled';
  const isFull = event.max_participants && 
                event.club_event_participants?.length >= event.max_participants;

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-ES', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={`event-card ${event.status}`}>
      <div className="event-header">
        <div className="event-icon">
          {getEventIcon(event.event_type)}
        </div>
        <div className="event-info">
          <h4 className="event-title">{event.title}</h4>
          <p className="event-description">{event.description}</p>
        </div>
        <div className="event-status">
          <span className={`status-badge ${event.status}`}>
            {event.status === 'scheduled' ? '🟢 Programado' : 
             event.status === 'active' ? '🔵 Activo' : 
             event.status === 'completed' ? '✅ Completado' : '❌ Cancelado'}
          </span>
        </div>
      </div>

      <div className="event-details">
        <div className="event-detail">
          <span className="detail-label">📅</span>
          <span>{formatDate(event.start_date)}</span>
        </div>
        
        {event.location && (
          <div className="event-detail">
            <span className="detail-label">📍</span>
            <span>{event.location}</span>
          </div>
        )}
        
        {event.max_participants && (
          <div className="event-detail">
            <span className="detail-label">👥</span>
            <span>
              {event.club_event_participants?.length || 0} / {event.max_participants}
              {isFull && ' (Lleno)'}
            </span>
          </div>
        )}
        
        {event.price > 0 && (
          <div className="event-detail">
            <span className="detail-label">💰</span>
            <span>${event.price}</span>
          </div>
        )}
        
        {event.reward_lupicoins > 0 && (
          <div className="event-detail">
            <span className="detail-label">🪙</span>
            <span>{event.reward_lupicoins} Lupicoins</span>
          </div>
        )}
      </div>

      <div className="event-actions">
        {canJoin && !isFull && (
          <button
            onClick={() => onJoin(event.id)}
            className="btn-join-event"
          >
            🎯 UNIRSE
          </button>
        )}
        
        {isParticipant && (
          <span className="participant-badge">✅ INSCRIPTO</span>
        )}
        
        {isFull && !isParticipant && (
          <span className="full-badge">❌ EVENTO LLENO</span>
        )}
        
        {isAdmin && (
          <button
            onClick={() => onDelete(event.id)}
            className="btn-delete-event"
          >
            🗑️ ELIMINAR
          </button>
        )}
      </div>
    </div>
  );
};