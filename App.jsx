import React, { useState, useEffect, useRef } from 'react';
import { Auth } from './src/components/Auth';
import { CharacterCreation } from './src/components/CharacterCreation';
import { Dashboard } from './src/components/Dashboard';
import { supabase } from './src/lib/supabaseClient';
import './App.css';
import GuideTour from './src/components/GuideTour';

function App() {
  const [user, setUser] = useState(null);
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const fetchInProgress = useRef(false); // Para evitar llamadas duplicadas

  useEffect(() => {
    console.log('🔧 App mounted - checking session');
    checkSession();

    // Escuchar cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('🔄 Auth state changed:', _event);
        await handleAuthChange(session);
      }
    );

    return () => {
      console.log('🧹 Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

  // Verificar sesión inicial
  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('📋 Initial session:', session?.user?.id);
      await handleAuthChange(session);
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
      setAuthChecked(true);
    }
  };

  const handleAuthChange = async (session) => {
    const currentUser = session?.user ?? null;
    console.log('👤 Auth change - User:', currentUser?.id);
    
    setUser(currentUser);

    if (currentUser) {
      console.log('✅ User logged in:', currentUser.id);
      // Buscar personaje automáticamente - SOLO UNA VEZ
      await fetchCharacter(currentUser.id);
    } else {
      console.log('🚪 User logged out');
      setCharacter(null);
    }
  };

  const handleAuthSuccess = async (user) => {
    console.log('🎯 Auth success - ya manejado por handleAuthChange');
    // NO llamar fetchCharacter aquí - ya se llama desde handleAuthChange
    setUser(user);
  };

  const handleCharacterCreated = (characterData) => {
    console.log('🎮 Character created:', characterData);
    setCharacter(characterData);
  };

  const handleLogout = async () => {
    console.log('🚪 Logging out...');
    await supabase.auth.signOut();
    setUser(null);
    setCharacter(null);
  };

  const fetchCharacter = async (userId) => {
    // Evitar llamadas duplicadas
    if (fetchInProgress.current) {
      console.log('⏳ Fetch ya en progreso, ignorando llamada duplicada');
      return;
    }

    try {
      fetchInProgress.current = true;
      console.log('🔍 Buscando personaje para usuario:', userId);
      setLoading(true);
      
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('❌ Error buscando personaje:', error);
        setCharacter(null);
        return;
      }
      
      console.log('📊 Resultado de búsqueda:', data);
      
      if (data) {
        console.log('✅ Personaje encontrado:', data.nickname);
        setCharacter(data);
      } else {
        console.log('❌ No se encontró personaje para este usuario');
        setCharacter(null);
      }
    } catch (error) {
      console.error('🔥 Fetch character failed:', error);
      setCharacter(null);
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  };

  // Función para recargar el personaje manualmente
  const refreshCharacter = async () => {
    if (user?.id) {
      await fetchCharacter(user.id);
    }
  };

  // Renderizado optimizado para evitar flashes
  const renderContent = () => {
    // Si está cargando y ya verificamos auth
    if (loading && authChecked) {
      return (
        <div className="loading-screen">
          <div className="loading-content">
            <div className="loading-spinner"></div>
            <p>Verificando tu personaje...</p>
          </div>
        </div>
      );
    }

    // Si no hay usuario
    if (!user) {
      return <Auth onAuthSuccess={handleAuthSuccess} />;
    }

    // Si hay usuario pero no personaje
    if (user && !character) {
      return (
        <CharacterCreation 
          user={user} 
          onCharacterCreated={handleCharacterCreated} 
        />
      );
    }

    // Si hay usuario y personaje
    if (user && character) {
      return (
        <Dashboard 
          user={user} 
          character={character} 
          onRefreshCharacter={refreshCharacter}
        />
      );
    }

    // Estado por defecto
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <p>Cargando...</p>
        </div>
      </div>
    );
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>🐺 LupiApp - MMORPG Deportivo</h1>
        {user && (
          <div className="user-info">
            <span>Hola, {user.email}</span>
            <button onClick={handleLogout}>Cerrar Sesión</button>
          </div>
        )}
      </header>

      <main className="app-main">
        {renderContent()}

        {/* Debug info - solo en desarrollo */}
        {process.env.NODE_ENV === 'development' && (
          <div style={{ 
            position: 'fixed', 
            bottom: '10px', 
            left: '10px', 
            background: 'rgba(0,0,0,0.8)', 
            color: 'white', 
            padding: '10px', 
            borderRadius: '5px',
            fontSize: '12px',
            zIndex: 9999 
          }}>
            <div>User: {user ? '✅' : '❌'}</div>
            <div>Character: {character ? '✅' : '❌'}</div>
            <div>Loading: {loading ? '🔄' : '✅'}</div>
          </div>
        )}
      </main>

      {/* Componente de Guía - solo mostrar cuando hay dashboard */}
      {user && character && <GuideTour />}
    </div>
  );
}

export default App;