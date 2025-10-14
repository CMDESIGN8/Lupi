// src/components/common/Header.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-content">
        <Link to="/" className="logo">
          <h1>Lupi</h1>
        </Link>
        
        <nav className="nav">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/missions">Misiones</Link>
              <Link to="/clubs">Clubs</Link>
              <Link to="/shop">Tienda</Link>
              <Link to="/game">Jugar</Link>
              <div className="user-menu">
                <span>Hola, {user?.username}</span>
                <button onClick={handleLogout} className="btn-logout">
                  Cerrar Sesión
                </button>
              </div>
            </>
          ) : (
            <div className="auth-links">
              <Link to="/login" className="btn-secondary">
                Iniciar Sesión
              </Link>
              <Link to="/register" className="btn-primary">
                Crear Cuenta
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;