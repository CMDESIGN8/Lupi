import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Login from '../components/auth/Login';
import Register from '../components/auth/Register';

const Home = () => {
  const { isAuthenticated, user } = useAuth();
  const [showLogin, setShowLogin] = React.useState(false);
  const [showRegister, setShowRegister] = React.useState(false);

  if (!isAuthenticated) {
    return (
      <div className="home-page">
        <div className="hero-section">
          <h1>🎮 Bienvenido a LupiApp</h1>
          <p>La plataforma de gaming deportivo donde puedes mejorar tus habilidades, completar misiones y unirte a clubes</p>
          
          <div className="auth-buttons">
            <button 
              className="btn btn-primary"
              onClick={() => setShowLogin(true)}
            >
              Iniciar Sesión
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => setShowRegister(true)}
            >
              Registrarse
            </button>
          </div>
        </div>

        <div className="features-section">
          <div className="feature-card">
            <h3>🎯 Misiones Diarias</h3>
            <p>Completa misiones para ganar experiencia y LupiCoins</p>
          </div>
          <div className="feature-card">
            <h3>🛍️ Tienda de Avatares</h3>
            <p>Personaliza tu personaje con avatares únicos</p>
          </div>
          <div className="feature-card">
            <h3>🏆 Clubes Deportivos</h3>
            <p>Únete a clubes y compite con otros jugadores</p>
          </div>
          <div className="feature-card">
            <h3>⚽ Juego en Tiempo Real</h3>
            <p>Juega partidos en tiempo real con otros usuarios</p>
          </div>
        </div>

        {showLogin && (
          <Login onClose={() => setShowLogin(false)} />
        )}

        {showRegister && (
          <Register onClose={() => setShowRegister(false)} />
        )}
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="welcome-section">
        <h1>¡Hola, {user?.email}!
</h1>
        <p>¿Qué te gustaría hacer hoy?</p>
        
        <div className="quick-actions">
          <Link to="/dashboard" className="action-card">
            <h3>📊 Dashboard</h3>
            <p>Ver tu progreso y estadísticas</p>
          </Link>
          <Link to="/missions" className="action-card">
            <h3>🎯 Misiones</h3>
            <p>Completar misiones diarias</p>
          </Link>
          <Link to="/game" className="action-card">
            <h3>⚽ Jugar</h3>
            <p>Unirse a partido en tiempo real</p>
          </Link>
          <Link to="/clubs" className="action-card">
            <h3>🏆 Clubes</h3>
            <p>Explorar clubes deportivos</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;