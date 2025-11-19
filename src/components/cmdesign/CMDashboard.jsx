// src/components/cmdesign/CMDashboard.jsx
// En CMDashboard.jsx - VERSIÓN SOLO PARA ADMINS
import React, { useState, useEffect } from 'react';
import { ClubManagement } from './ClubManagement';
import '../../styles/CMDashboard.css';

export const CMDashboard = ({ user, character, onNavigateToLupiApp }) => {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [isClubAdmin, setIsClubAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkClubAdminStatus();
  }, [user, character]);

  const checkClubAdminStatus = () => {
    console.log('🔍 Verificando admin status para:', character?.nickname);
    
    // MÉTODO REAL: Verificar si el usuario es admin basado en character.club_role
    const userIsAdmin = character?.club_role === 'admin';
    
    console.log('📊 Resultado verificación admin:', {
      nickname: character?.nickname,
      club_role: character?.club_role,
      club_id: character?.club_id,
      es_admin: userIsAdmin
    });
    
    setIsClubAdmin(userIsAdmin);
    setLoading(false);
  };

  return (
    <div className="cm-dashboard">
      {/* Sidebar */}
      <div className="cm-sidebar">
        <div className="sidebar-header">
          <h2>🏢 CMDesign Suite</h2>
        </div>
        
        <nav className="sidebar-nav">
          <div className="nav-section">
            <h3>Dashboard</h3>
            <button 
              className={`nav-item ${activeSection === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveSection('dashboard')}
            >
              📊 Dashboard
            </button>
          </div>

          <div className="nav-section">
            <h3>AI Tools</h3>
            <button className="nav-item">🤖 TaskFlow</button>
            <button className="nav-item">📅 AutoScheduler</button>
            <button className="nav-item">✉️ AutoMailer</button>
            <button className="nav-item">📈 MetricsMini</button>
            <button className="nav-item">🔌 ZapEasy</button>
          </div>

          {/* SECCIÓN CLUBES - Solo visible para admins reales */}
          {!loading && isClubAdmin && (
            <div className="nav-section">
              <h3>Clubes</h3>
              <button 
                className={`nav-item ${activeSection === 'club-management' ? 'active' : ''}`}
                onClick={() => setActiveSection('club-management')}
              >
                🏆 Gestionar Club
              </button>
            </div>
          )}

          <div className="nav-section">
            <button 
              className="nav-item lupi-app-btn"
              onClick={onNavigateToLupiApp}
            >
              🎮 Entrar a LupiApp
            </button>
          </div>

          <div className="nav-section">
            <button className="nav-item">⚙️ Settings</button>
          </div>
        </nav>

        {/* DEBUG INFO MEJORADO */}
        <div className="debug-info">
          <div><strong>🔐 ESTADO DE PERMISOS</strong></div>
          <div>Usuario: {user?.email}</div>
          <div>Personaje: {character?.nickname}</div>
          <div>Club Role: <span style={{
            color: character?.club_role === 'admin' ? '#4cc9f0' : '#ef4444',
            fontWeight: 'bold'
          }}>
            {character?.club_role || 'Ninguno'}
          </span></div>
          <div>Es Admin: <span style={{
            color: isClubAdmin ? '#4cc9f0' : '#94a3b8'
          }}>
            {isClubAdmin ? '✅ SÍ' : '❌ NO'}
          </span></div>
          <div>Loading: {loading ? '⏳' : '✅'}</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="cm-main">
        <header className="cm-header">
          <div className="header-actions">
            <span>Bienvenido, {user?.email}</span>
            {isClubAdmin && (
              <span style={{marginLeft: '1rem', color: '#4cc9f0', fontWeight: '600'}}>
                🏆 Administrador de Club
              </span>
            )}
          </div>
        </header>

        <div className="cm-content">
          {activeSection === 'dashboard' && <DashboardView />}
          {activeSection === 'club-management' && isClubAdmin && <ClubManagement />}
          {activeSection === 'club-management' && !isClubAdmin && (
            <div className="access-denied">
              <h3>🚫 Acceso Restringido</h3>
              <p>No tienes permisos de administrador para gestionar clubes.</p>
              <p>Tu rol actual es: <strong>{character?.club_role || 'miembro'}</strong></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ... (DashboardView se mantiene igual)

// Vista del Dashboard Principal (según tu diseño)
const DashboardView = () => {
  return (
    <div className="dashboard-view">
      <div className="dashboard-grid">
        
        {/* CRM Section */}
        <div className="dashboard-card crm-card">
          <h3>CRM</h3>
          <div className="crm-stats">
            <div className="stat-item">
              <span className="stat-number">16</span>
              <span className="stat-label">Cotizaciones</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">18</span>
              <span className="stat-label">Clientes</span>
            </div>
          </div>
          <div className="crm-stats">
            <div className="stat-item">
              <span className="stat-number">$25,600</span>
              <span className="stat-label">Ingresos</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">4</span>
              <span className="stat-label">Pendientes</span>
            </div>
          </div>
        </div>

        {/* TaskFlow Section */}
        <div className="dashboard-card taskflow-card">
          <h3>TaskFlow</h3>
          <div className="taskflow-columns">
            <div className="task-column">
              <h4>Pendiente</h4>
              <div className="task-list">
                {/* Tasks would go here */}
              </div>
            </div>
            <div className="task-column">
              <h4>En progreso</h4>
              <div className="task-list">
                {/* Tasks would go here */}
              </div>
            </div>
            <div className="task-column">
              <h4>Listo</h4>
              <div className="task-list">
                {/* Tasks would go here */}
              </div>
            </div>
          </div>
        </div>

        {/* MetricsMini Section */}
        <div className="dashboard-card metrics-card">
          <h3>MetricsMini</h3>
          <div className="metrics-stats">
            <div className="metric-item">
              <span className="metric-number">25</span>
              <span className="metric-label">Cotizaciones enviadas</span>
            </div>
            <div className="metric-item">
              <span className="metric-number">8</span>
              <span className="metric-label">Clientes nuevos</span>
            </div>
            <div className="metric-item">
              <span className="metric-number">12%</span>
              <span className="metric-label">Tasa de conversión</span>
            </div>
          </div>
        </div>

        {/* Brand Starter Section */}
        <div className="dashboard-card brand-card">
          <h3>Brand Starter</h3>
          <div className="brand-content">
            <div className="business-name">
              <label>Nombre del negocio</label>
              <input type="text" placeholder="Ingresa el nombre" />
            </div>
            <button className="generate-logo-btn">
              🎨 Generar logo
            </button>
          </div>
        </div>

        {/* AutoScheduler Section */}
        <div className="dashboard-card scheduler-card">
          <h3>AutoScheduler</h3>
          <div className="calendar-header">
            <h4>July 2024</h4>
          </div>
          <div className="calendar-grid">
            {/* Calendar would go here */}
            <div className="calendar-placeholder">
              📅 Calendario interactivo
            </div>
          </div>
        </div>

        {/* Business Planner Section */}
        <div className="dashboard-card business-card">
          <h3>Business Planner</h3>
          <div className="business-chart">
            <div className="chart-legends">
              <div className="legend-item">
                <span className="legend-color income"></span>
                <span>Ingresos</span>
              </div>
              <div className="legend-item">
                <span className="legend-color expenses"></span>
                <span>Gastos</span>
              </div>
            </div>
            <div className="chart-months">
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
            </div>
            <div className="chart-placeholder">
              📊 Gráfico de ingresos vs gastos
            </div>
          </div>
        </div>

        {/* ZapEasy Section */}
        <div className="dashboard-card zappeasy-card">
          <h3>ZapEasy</h3>
          <div className="zap-content">
            <div className="zap-rule">
              <div className="zap-when">
                <span>When</span>
                {/* Trigger condition */}
              </div>
              <div className="zap-do">
                <span>Do</span>
                {/* Action */}
              </div>
            </div>
            <div className="zap-stats">
              <div className="zap-stat">
                <span className="zap-number">$10,222</span>
                <span className="zap-label">Lnditalo</span>
              </div>
              <div className="zap-stat">
                <span className="zap-number">$30,400</span>
                <span className="zap-label">Ingresos proyectados</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};