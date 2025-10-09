// components/GuideTour.jsx
import React, { useState } from 'react';
import Joyride from 'react-joyride';

const GuideTour = () => {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    {
      target: '.panel-left',
      content: 'Aquí puedes ver la información básica de tu personaje: nivel, experiencia, puntos de skill y lupicoins.',
      placement: 'right',
      title: '📊 Información del Personaje',
    },
    {
      target: '.panel-center',
      content: 'En esta sección puedes mejorar tus habilidades usando los puntos de skill disponibles. ¡Elige sabiamente!',
      placement: 'top',
      title: '⚔️ Mejorar Habilidades',
    },
    {
      target: '.panel-right',
      content: 'Realiza acciones como entrenar, visitar el mercado o unirte a clubes para progresar en el juego.',
      placement: 'left',
      title: '🛠️ Acciones Disponibles',
    },
    {
      target: '.skills-grid .skill-card:first-child',
      content: 'Haz clic en el botón "+" para aumentar esta habilidad. Cada punto mejora tu rendimiento en el campo.',
      placement: 'right',
      title: '🎯 Aumentar Habilidad',
    },
    {
      target: '.actions button:first-child',
      content: 'Entrena para ganar experiencia y subir de nivel. ¡Cada nivel te da más puntos de skill!',
      placement: 'left',
      title: '💪 Entrenar Personaje',
    },
    {
      target: '.exp-bar',
      content: 'Esta barra muestra tu progreso hacia el siguiente nivel. ¡Llénala para subir de nivel!',
      placement: 'top',
      title: '📈 Barra de Experiencia',
    }
  ];

  const handleJoyrideCallback = (data) => {
    const { action, index, type } = data;

    if (type === 'tour:end' || type === 'tour:skip') {
      setRun(false);
      setStepIndex(0);
      // Guardar en localStorage que el usuario ya vio el tutorial
      localStorage.setItem('lupi_hasSeenTutorial', 'true');
    } else if (type === 'step:after' && action === 'next') {
      setStepIndex(index + 1);
    } else if (type === 'step:after' && action === 'prev') {
      setStepIndex(index - 1);
    }
  };

  const startTour = () => {
    setRun(true);
    setStepIndex(0);
  };

  // Verificar si ya vio el tutorial
  const hasSeenTutorial = localStorage.getItem('lupi_hasSeenTutorial');

  return (
    <>
      {/* Botón flotante para iniciar el tutorial */}
      <button 
        onClick={startTour}
        className="tour-button"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 9998,
          background: 'linear-gradient(135deg, #00bfff, #00f0ff)',
          color: '#0b0f1a',
          border: 'none',
          borderRadius: '50%',
          width: '60px',
          height: '60px',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 4px 20px rgba(0, 191, 255, 0.4)',
          fontWeight: 'bold',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.transform = 'scale(1.1)';
          e.target.style.boxShadow = '0 6px 25px rgba(0, 191, 255, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.target.style.transform = 'scale(1)';
          e.target.style.boxShadow = '0 4px 20px rgba(0, 191, 255, 0.4)';
        }}
        title="Iniciar tutorial interactivo"
      >
        ?
      </button>

      <Joyride
        steps={steps}
        run={run}
        stepIndex={stepIndex}
        callback={handleJoyrideCallback}
        continuous={true}
        showSkipButton={true}
        showProgress={true}
        scrollToFirstStep={true}
        spotlightPadding={5}
        styles={{
          options: {
            arrowColor: '#0c1320',
            backgroundColor: '#0c1320',
            overlayColor: 'rgba(12, 19, 32, 0.9)',
            primaryColor: '#00bfff',
            textColor: '#ffffff',
            zIndex: 9999,
          },
          tooltip: {
            background: '#0c1320',
            border: '2px solid #00bfff',
            borderRadius: '10px',
            fontSize: '14px',
          },
          tooltipContainer: {
            textAlign: 'left',
          },
          buttonNext: {
            background: '#00bfff',
            color: '#0b0f1a',
            borderRadius: '6px',
            fontWeight: 'bold',
          },
          buttonBack: {
            color: '#00bfff',
            fontWeight: 'bold',
          },
          buttonSkip: {
            color: '#ff6b6b',
          },
          beacon: {
            background: '#00bfff',
          }
        }}
        locale={{
          back: '← Atrás',
          close: '× Cerrar',
          last: 'Finalizar',
          next: 'Siguiente →',
          skip: 'Saltar tutorial'
        }}
      />

      {/* Tutorial de bienvenida automático - solo primera vez */}
      {!hasSeenTutorial && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(12, 19, 32, 0.95)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          animation: 'fadeIn 0.5s ease'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #0c1320, #1a243f)',
            border: '3px solid #00bfff',
            borderRadius: '15px',
            padding: '30px',
            color: 'white',
            textAlign: 'center',
            maxWidth: '500px',
            margin: '20px',
            boxShadow: '0 0 40px #00f0ff'
          }}>
            <h2 style={{ 
              color: '#00f0ff', 
              marginBottom: '20px',
              fontSize: '2rem',
              textShadow: '0 0 10px #00f0ff'
            }}>
              🐺 ¡Bienvenido a Lupi Soccer!
            </h2>
            <p style={{ 
              marginBottom: '25px', 
              fontSize: '1.1rem',
              lineHeight: '1.5'
            }}>
              Te guiaremos por las funciones principales del juego para que empieces con el pie derecho.
              <br /><br />
              <strong>Puedes hacer clic en el botón "?" en cualquier momento para repetir el tutorial.</strong>
            </p>
            <button 
              onClick={() => {
                localStorage.setItem('lupi_hasSeenTutorial', 'true');
                startTour();
              }}
              style={{
                background: 'linear-gradient(135deg, #00bfff, #00f0ff)',
                color: '#0b0f1a',
                border: 'none',
                padding: '12px 30px',
                borderRadius: '8px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontSize: '1.1rem',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(0, 191, 255, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              🚀 Comenzar Tutorial
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default GuideTour;