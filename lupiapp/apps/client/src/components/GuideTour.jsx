// components/GuideTour.jsx
import React, { useState, useEffect } from 'react';
import Joyride from 'react-joyride';

const GuideTour = () => {
  const [run, setRun] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  // Detectar tamaño de pantalla
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determinar placement basado en tamaño de pantalla
  const getPlacement = (stepIndex) => {
    const isMobile = windowSize.width < 768;
    
    switch(stepIndex) {
      case 0: // Panel izquierdo
        return isMobile ? 'bottom' : 'right';
      case 1: // Panel central
        return isMobile ? 'bottom' : 'top';
      case 2: // Panel derecho
        return isMobile ? 'bottom' : 'left';
      case 3: // Primer skill
        return isMobile ? 'bottom' : 'right';
      case 4: // Botón entrenar
        return isMobile ? 'bottom' : 'left';
      case 5: // Barra exp
        return isMobile ? 'bottom' : 'top';
      default:
        return 'bottom';
    }
  };

  const steps = [
    {
      target: '.panel-left',
      content: 'Aquí puedes ver la información básica de tu personaje: nivel, experiencia, puntos de skill y lupicoins.',
      placement: getPlacement(0),
      title: '📊 Información del Personaje',
      spotlightPadding: 10,
    },
    {
      target: '.panel-center',
      content: 'En esta sección puedes mejorar tus habilidades usando los puntos de skill disponibles. ¡Elige sabiamente!',
      placement: getPlacement(1),
      title: '⚔️ Mejorar Habilidades',
      spotlightPadding: 10,
    },
    {
      target: '.panel-right',
      content: 'Realiza acciones como entrenar, visitar el mercado o unirte a clubes para progresar en el juego.',
      placement: getPlacement(2),
      title: '🛠️ Acciones Disponibles',
      spotlightPadding: 10,
    },
    {
      target: '.skills-grid',
      content: 'Haz clic en los botones "+" para aumentar tus habilidades. Cada punto mejora tu rendimiento en el campo.',
      placement: getPlacement(3),
      title: '🎯 Aumentar Habilidades',
      spotlightPadding: 5,
    },
    {
      target: '.actions button:first-child',
      content: 'Entrena para ganar experiencia y subir de nivel. ¡Cada nivel te da más puntos de skill!',
      placement: getPlacement(4),
      title: '💪 Entrenar Personaje',
      spotlightPadding: 5,
    },
    {
      target: '.exp-bar',
      content: 'Esta barra muestra tu progreso hacia el siguiente nivel. ¡Llénala para subir de nivel!',
      placement: getPlacement(5),
      title: '📈 Barra de Experiencia',
      spotlightPadding: 5,
    }
  ];

  const handleJoyrideCallback = (data) => {
    const { action, index, type, size } = data;

    console.log('Tour callback:', { action, index, type, size });

    if (type === 'tour:end' || type === 'tour:skip') {
      setRun(false);
      setStepIndex(0);
      localStorage.setItem('lupi_hasSeenTutorial', 'true');
    } else if (type === 'step:after') {
      if (action === 'next') {
        setStepIndex(index + 1);
      } else if (action === 'prev') {
        setStepIndex(index - 1);
      }
    } else if (type === 'error:target_not_found') {
      // Si no encuentra el target, saltar al siguiente paso
      setStepIndex(prev => Math.min(prev + 1, steps.length - 1));
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
        scrollOffset={100}
        disableScrolling={false}
        spotlightPadding={10}
        floaterProps={{
          styles: {
            floater: {
              filter: 'none'
            }
          }
        }}
        styles={{
          options: {
            arrowColor: '#0c1320',
            backgroundColor: '#0c1320',
            overlayColor: 'rgba(12, 19, 32, 0.85)',
            primaryColor: '#00bfff',
            textColor: '#ffffff',
            zIndex: 9999,
          },
          tooltip: {
            background: '#0c1320',
            border: '2px solid #00bfff',
            borderRadius: '10px',
            fontSize: '14px',
            maxWidth: windowSize.width < 768 ? '300px' : '350px',
          },
          tooltipContainer: {
            textAlign: 'left',
          },
          tooltipTitle: {
            color: '#00f0ff',
            fontSize: '16px',
            marginBottom: '8px',
          },
          tooltipContent: {
            fontSize: '14px',
            lineHeight: '1.4',
          },
          buttonNext: {
            background: '#00bfff',
            color: '#0b0f1a',
            borderRadius: '6px',
            fontWeight: 'bold',
            fontSize: '14px',
            padding: '8px 16px',
          },
          buttonBack: {
            color: '#00bfff',
            fontWeight: 'bold',
            fontSize: '14px',
          },
          buttonSkip: {
            color: '#ff6b6b',
            fontSize: '14px',
          },
          beacon: {
            background: '#00bfff',
          },
          beaconInner: {
            background: '#00f0ff',
          },
          beaconOuter: {
            borderColor: '#00bfff',
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
      {!hasSeenTutorial && !run && (
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
            boxShadow: '0 0 40px #00f0ff',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ 
              color: '#00f0ff', 
              marginBottom: '20px',
              fontSize: windowSize.width < 768 ? '1.5rem' : '2rem',
              textShadow: '0 0 10px #00f0ff'
            }}>
              🐺 ¡Bienvenido a Lupi Soccer!
            </h2>
            <p style={{ 
              marginBottom: '25px', 
              fontSize: windowSize.width < 768 ? '1rem' : '1.1rem',
              lineHeight: '1.5'
            }}>
              Te guiaremos por las funciones principales del juego para que empieces con el pie derecho.
              <br /><br />
              <strong>Puedes hacer clic en el botón "?" en cualquier momento para repetir el tutorial.</strong>
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button 
                onClick={() => {
                  localStorage.setItem('lupi_hasSeenTutorial', 'true');
                  startTour();
                }}
                style={{
                  background: 'linear-gradient(135deg, #00bfff, #00f0ff)',
                  color: '#0b0f1a',
                  border: 'none',
                  padding: '12px 25px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                  minWidth: '140px'
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
              <button 
                onClick={() => {
                  localStorage.setItem('lupi_hasSeenTutorial', 'true');
                }}
                style={{
                  background: 'transparent',
                  color: '#00bfff',
                  border: '2px solid #00bfff',
                  padding: '12px 25px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  transition: 'all 0.3s ease',
                  minWidth: '140px'
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = '#00bfff';
                  e.target.style.color = '#0b0f1a';
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = '#00bfff';
                }}
              >
                Saltar Tutorial
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GuideTour;