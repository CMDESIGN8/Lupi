// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import Loading from './components/common/Loading';

// Pages
import Home from './pages/Home';
import Register from './components/auth/Register';
import Login from './components/auth/Login';
import Dashboard from './pages/Dashboard';
import Clubs from './pages/Clubs';
import Missions from './pages/Missions';
import Shop from './pages/Shop';
import Game from './pages/Game';

import './styles/index.css';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading />;
  }

  return (
    <Router>
      <div className="app">
        <Header />
        <main className="main-content">
          <Routes>
            {/* Ruta principal - redirige a registro si no está autenticado */}
            <Route 
              path="/" 
              element={
                user ? <Navigate to="/dashboard" replace /> : <Navigate to="/register" replace />
              } 
            />
            
            {/* Rutas de autenticación */}
            <Route 
              path="/register" 
              element={user ? <Navigate to="/dashboard" replace /> : <Register />} 
            />
            <Route 
              path="/login" 
              element={user ? <Navigate to="/dashboard" replace /> : <Login />} 
            />
            
            {/* Rutas protegidas */}
            <Route 
              path="/dashboard" 
              element={user ? <Dashboard /> : <Navigate to="/register" replace />} 
            />
            <Route 
              path="/clubs" 
              element={user ? <Clubs /> : <Navigate to="/register" replace />} 
            />
            <Route 
              path="/missions" 
              element={user ? <Missions /> : <Navigate to="/register" replace />} 
            />
            <Route 
              path="/shop" 
              element={user ? <Shop /> : <Navigate to="/register" replace />} 
            />
            <Route 
              path="/game" 
              element={user ? <Game /> : <Navigate to="/register" replace />} 
            />
            
            {/* Ruta de fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;