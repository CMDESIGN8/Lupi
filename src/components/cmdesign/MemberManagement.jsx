// src/components/clubs/MemberManagement.jsx
import React, { useState } from 'react';
import { promoteToAdmin, demoteToMember } from '../../services/api';
import '../../styles/MemberManagement.css';

export const MemberManagement = ({ club, character, members, onMembersUpdate }) => {
  const [processing, setProcessing] = useState(null);

  const handlePromoteToAdmin = async (targetCharacterId, targetNickname) => {
    if (!window.confirm(`¿Estás seguro de promover a "${targetNickname}" como administrador?`)) {
      return;
    }

    try {
      setProcessing(targetCharacterId);
      const result = await promoteToAdmin(club.id, character.id, targetCharacterId);
      alert(result.message);
      onMembersUpdate(); // Recargar lista de miembros
    } catch (error) {
      alert('❌ Error: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  const handleDemoteToMember = async (targetCharacterId, targetNickname) => {
    if (!window.confirm(`¿Estás seguro de degradar a "${targetNickname}" a miembro regular?`)) {
      return;
    }

    try {
      setProcessing(targetCharacterId);
      const result = await demoteToMember(club.id, character.id, targetCharacterId);
      alert(result.message);
      onMembersUpdate(); // Recargar lista de miembros
    } catch (error) {
      alert('❌ Error: ' + error.message);
    } finally {
      setProcessing(null);
    }
  };

  // Filtrar miembros que no sean el usuario actual
  const otherMembers = members.filter(member => 
    member.character_id !== character.id
  );

  return (
    <div className="member-management">
      <h3>👑 Gestión de Administradores</h3>
      <p className="management-description">
        Gestiona los roles de administrador para los miembros del club.
      </p>

      <div className="members-management-list">
        {otherMembers.map(member => (
          <div key={member.character_id} className="management-member-card">
            <div className="member-info">
              <div className="member-avatar">
                {member.characters?.nickname?.charAt(0) || '?'}
              </div>
              <div className="member-details">
                <span className="member-name">
                  {member.characters?.nickname || 'Desconocido'}
                </span>
                <span className="member-level">
                  Nv. {member.characters?.level || 1}
                </span>
                <span className={`member-role badge-${member.role}`}>
                  {member.role === 'admin' ? '👑 Administrador' : 
                   member.role === 'moderator' ? '🛡️ Moderador' : '👥 Miembro'}
                </span>
              </div>
            </div>

            <div className="member-actions">
              {member.role === 'admin' ? (
                <button
                  onClick={() => handleDemoteToMember(
                    member.character_id, 
                    member.characters?.nickname || 'este administrador'
                  )}
                  disabled={processing === member.character_id}
                  className="btn-demote"
                  title="Degradar a miembro regular"
                >
                  {processing === member.character_id ? '🔄' : '👥 Miembro'}
                </button>
              ) : (
                <button
                  onClick={() => handlePromoteToAdmin(
                    member.character_id, 
                    member.characters?.nickname || 'este miembro'
                  )}
                  disabled={processing === member.character_id}
                  className="btn-promote"
                  title="Promover a administrador"
                >
                  {processing === member.character_id ? '🔄' : '👑 Admin'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {otherMembers.length === 0 && (
        <div className="no-members-management">
          <p>No hay otros miembros en el club para gestionar.</p>
        </div>
      )}
    </div>
  );
};