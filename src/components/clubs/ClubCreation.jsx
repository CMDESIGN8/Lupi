import React, { useState } from 'react';
import { createClub } from '../../services/api';
import '../../styles/ClubCreation.css';

export const ClubCreation = ({ user, character, onClubCreated }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logo_url: '',
    is_public: true
  });
  const [creating, setCreating] = useState(false);

  const handleCreateClick = () => {
    setIsCreating(true);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setFormData({
      name: '',
      description: '',
      logo_url: '',
      is_public: true
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('El nombre del club es requerido');
      return;
    }

    try {
      setCreating(true);
      const response = await createClub({
        ...formData,
        user_id: user.id
      });

      alert(response.message);
      setIsCreating(false);
      onClubCreated(); // Actualizar el dashboard
    } catch (error) {
      console.error('Error creando club:', error);
      alert(error.message);
    } finally {
      setCreating(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (!isCreating) {
    return (
      <div className="club-creation-prompt">
        <div className="creation-header">
          <h3>¿No encuentras un club que te guste?</h3>
          <p>Crea tu propio club y recluta miembros</p>
        </div>
        <button onClick={handleCreateClick} className="btn-create-club">
          🏆 CREAR NUEVO CLUB
        </button>
      </div>
    );
  }

  return (
    <div className="club-creation-form">
      <h3>CREAR NUEVO CLUB</h3>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Nombre del Club *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Ej: Lobos Legendarios"
            maxLength={50}
            required
          />
          <span className="char-count">{formData.name.length}/50</span>
        </div>

        <div className="form-group">
          <label htmlFor="description">Descripción</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe tu club, objetivos, requisitos..."
            rows="3"
            maxLength={200}
          />
          <span className="char-count">{formData.description.length}/200</span>
        </div>

        <div className="form-group">
          <label htmlFor="logo_url">URL del Logo (opcional)</label>
          <input
            type="url"
            id="logo_url"
            name="logo_url"
            value={formData.logo_url}
            onChange={handleChange}
            placeholder="https://ejemplo.com/logo.png"
          />
        </div>

        <div className="form-group checkbox-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="is_public"
              checked={formData.is_public}
              onChange={handleChange}
            />
            <span className="checkmark"></span>
            Club Público (cualquiera puede unirse)
          </label>
          <small>
            Si está desactivado, los miembros necesitarán invitación
          </small>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={handleCancel}
            className="btn-cancel"
            disabled={creating}
          >
            CANCELAR
          </button>
          <button
            type="submit"
            className="btn-submit"
            disabled={creating || !formData.name.trim()}
          >
            {creating ? '🔄 CREANDO...' : '🏆 CREAR CLUB'}
          </button>
        </div>
      </form>
    </div>
  );
};