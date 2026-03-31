// src/components/ConfirmationDialog.tsx
import { useState } from 'react';

interface ConfirmationDialogProps {
  detectedNumber: string;
  originalText: string;
  onConfirm: (number: string) => void;
  onCancel: () => void;
  onEdit: () => void;
}

export function ConfirmationDialog({ 
  detectedNumber, 
  originalText, 
  onConfirm, 
  onCancel, 
  onEdit 
}: ConfirmationDialogProps) {
  const [editedNumber, setEditedNumber] = useState(detectedNumber);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div className="confirmation-modal">
      <div className="confirmation-container">
        <div className="confirmation-header">
          <h3>🔍 Verificar número</h3>
          <button className="confirmation-close" onClick={onCancel}>
            ✕
          </button>
        </div>

        <div className="confirmation-content">
          <div className="detected-number-box">
            <div className="detected-label">📷 Número detectado:</div>
            {!isEditing ? (
              <div className="detected-number">{detectedNumber}</div>
            ) : (
              <input
                type="text"
                className="edit-input"
                value={editedNumber}
                onChange={(e) => setEditedNumber(e.target.value.replace(/[^0-9]/g, ''))}
                maxLength={12}
                autoFocus
                placeholder="Ingresá el número manualmente"
              />
            )}
          </div>

          {!isEditing && (
            <div className="original-text-box">
              <details>
                <summary>📄 Ver texto detectado completo</summary>
                <div className="original-text">
                  {originalText.substring(0, 200)}
                  {originalText.length > 200 && '...'}
                </div>
              </details>
            </div>
          )}

          <div className="confirmation-warning">
            ⚠️ Verificá que el número coincida con tu entrada antes de confirmar
          </div>

          <div className="confirmation-buttons">
            {!isEditing ? (
              <>
                <button className="btn btn-secondary" onClick={onCancel}>
                  Cancelar
                </button>
                <button className="btn btn-secondary" onClick={() => setIsEditing(true)}>
                  ✏️ Editar
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={() => onConfirm(detectedNumber)}
                >
                  ✅ Confirmar
                </button>
              </>
            ) : (
              <>
                <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                  ↺ Volver
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={() => {
                    if (editedNumber.length >= 4) {
                      onConfirm(editedNumber);
                    } else {
                      alert('El número debe tener al menos 4 dígitos');
                    }
                  }}
                >
                  💾 Guardar
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}