// src/components/OnboardingTour.tsx
import { useState } from 'react';

interface Step {
  title: string;
  description: string;
  icon: string;
  target?: string;
}

const steps: Step[] = [
  {
    title: '🎟️ Cargá tu entrada',
    description: 'Escaneá el QR o ingresá el número manualmente. Cada entrada suma 10 puntos.',
    icon: '🎟️'
  },
  {
    title: '⭐ Acumulá puntos',
    description: 'Los puntos nunca se resetean. Seguí sumando semana a semana.',
    icon: '⭐'
  },
  {
    title: '🏆 Competí en el ranking',
    description: 'Los 3 primeros ganan entradas gratis cada semana.',
    icon: '🏆'
  },
  {
    title: '🎲 Sorteo semanal',
    description: 'Todos los jueves a las 20:00 se sortean 3 entradas gratis.',
    icon: '🎲'
  },
  {
    title: '🎁 Invitá amigos',
    description: 'Compartí tu código y ganá 50 puntos por cada amigo que se registre.',
    icon: '🎁'
  }
];

export function OnboardingTour({ onComplete }: { onComplete: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('tour_completed', 'true');
    setIsVisible(false);
    onComplete();
  };

  const handleSkip = () => {
    handleComplete();
  };

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay oscuro */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          zIndex: 9999,
          backdropFilter: 'blur(8px)'
        }}
        onClick={handleSkip}
      />
      
      {/* Tooltip central */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'linear-gradient(135deg, var(--surface), var(--surface2))',
          border: '2px solid var(--accent)',
          borderRadius: '24px',
          padding: '28px',
          maxWidth: '340px',
          width: 'calc(100% - 40px)',
          zIndex: 10000,
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
          animation: 'fadeUp 0.3s ease'
        }}
      >
        {/* Icono y título */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{ fontSize: '64px', marginBottom: '12px' }}>{step.icon}</div>
          <h2 style={{ 
            fontSize: '24px', 
            margin: 0, 
            color: 'var(--accent)',
            fontFamily: 'var(--font-display)'
          }}>
            {step.title}
          </h2>
        </div>
        
        {/* Descripción */}
        <p style={{ 
          textAlign: 'center', 
          fontSize: '16px', 
          lineHeight: 1.5,
          marginBottom: '24px',
          color: 'var(--text)'
        }}>
          {step.description}
        </p>
        
        {/* Indicador de progreso */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '8px', 
          marginBottom: '24px' 
        }}>
          {steps.map((_, idx) => (
            <div
              key={idx}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '4px',
                background: idx === currentStep ? 'var(--accent)' : 'var(--text2)',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </div>
        
        {/* Botones */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={handleSkip}
            style={{
              background: 'transparent',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '10px 20px',
              fontSize: '14px',
              cursor: 'pointer',
              color: 'var(--text2)',
              fontWeight: '600'
            }}
          >
            Omitir
          </button>
          
          {currentStep > 0 && (
            <button
              onClick={handlePrevious}
              style={{
                background: 'transparent',
                border: '1px solid var(--border)',
                borderRadius: '12px',
                padding: '10px 20px',
                fontSize: '14px',
                cursor: 'pointer',
                color: 'var(--text2)',
                fontWeight: '600'
              }}
            >
              Anterior
            </button>
          )}
          
          <button
            onClick={handleNext}
            style={{
              background: 'linear-gradient(135deg, var(--accent), #0f6bc0)',
              border: 'none',
              borderRadius: '12px',
              padding: '10px 28px',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              color: '#0a0a0f'
            }}
          >
            {isLastStep ? 'Comenzar' : 'Siguiente'}
          </button>
        </div>
        
        {/* Indicador de paso */}
        <div style={{ 
          textAlign: 'center', 
          marginTop: '16px', 
          fontSize: '12px', 
          color: 'var(--text2)' 
        }}>
          Paso {currentStep + 1} de {steps.length}
        </div>
      </div>
    </>
  );
}