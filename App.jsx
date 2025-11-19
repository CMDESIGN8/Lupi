// apps/client/src/App.jsx
import React, { useState, useEffect } from 'react';
import { Auth } from './src/components/Auth';
import { CharacterCreation } from './src/components/CharacterCreation';
import { Dashboard } from './src/components/Dashboard';
import { CMDashboard } from './src/components/cmdesign/CMDashboard'; // ← NUEVO IMPORT
import { supabase } from './src/lib/supabaseClient';
import './App.css';
import { LoadingSpinner } from './src/components/LoadingSpinner';

function App() {
  const [user, setUser] = useState(null);
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkingCharacter, setCheckingCharacter] = useState(false);
  const [currentView, setCurrentView] = useState('cmdesign'); // ← NUEVO ESTADO: 'cmdesign' | 'lupiapp'

  useEffect(() => {
    console.log('🔧 App mounted - checking session');
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('🔄 Auth state changed:', _event);
        handleAuthChange(session);
      }
    );

    return () => {
      console.log('🧹 Cleaning up auth listener');
      subscription.unsubscribe();
    };
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('📋 Initial session:', session?.user?.id);
      await handleAuthChange(session);
    } catch (error) {
      console.error('Error checking session:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthChange = async (session) => {
    const currentUser = session?.user ?? null;
    setUser(currentUser);

    if (currentUser) {
      console.log('👤 User logged in:', currentUser.id);
      await fetchCharacter(currentUser.id);
    } else {
      console.log('🚪 User logged out');
      setCharacter(null);
    }
  };

  const handleAuthSuccess = async (user) => {
    console.log('✅ Auth success:', user.id);
    setUser(user);
    await fetchCharacter(user.id);
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
    setCurrentView('cmdesign'); // ← Resetear a vista principal al logout
  };

  const fetchCharacter = async (userId) => {
    setCheckingCharacter(true);
    try {
      console.log('🔍 Buscando personaje para usuario:', userId);

      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('🧩 Resultado Supabase:', { data, error });

      if (error) {
        console.error('❌ Error buscando personaje:', error);
        return;
      }

      if (data) {
        console.log('✅ Personaje encontrado:', data.nickname);
        setCharacter(data);
      } else {
        console.log('❌ No se encontró personaje para este usuario');
        setCharacter(null);
      }
    } catch (error) {
      console.error('🔥 Fetch character failed:', error);
    } finally {
      setCheckingCharacter(false);
    }
  };

  // ← NUEVA FUNCIÓN: Navegar a LupiApp
  const handleNavigateToLupiApp = () => {
    console.log('🎮 Navegando a LupiApp...');
    setCurrentView('lupiapp');
  };

  // ← NUEVA FUNCIÓN: Navegar a CM DESIGN Suite
  const handleNavigateToCMDesign = () => {
    console.log('🏢 Navegando a CM DESIGN Suite...');
    setCurrentView('cmdesign');
  };

  if (loading) {
    return <LoadingSpinner message="Cargando LupiApp..." />;
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1>
          {currentView === 'cmdesign' ? '🏢 CM DESIGN Suite' : '🐺 LupiApp - MMORPG Deportivo'}
        </h1>
        {user && (
          <div className="user-info">
            <span>Hola, {user.email}</span>
            {/* ← NUEVO BOTÓN DE NAVEGACIÓN */}
            {currentView === 'lupiapp' && (
              <button 
                onClick={handleNavigateToCMDesign}
                className="nav-button"
              >
                🏢 Ir a CM DESIGN
              </button>
            )}
            <button onClick={handleLogout}>Cerrar Sesión</button>
          </div>
        )}
      </header>

      <main className="app-main">
        {!user && <Auth onAuthSuccess={handleAuthSuccess} />}

        {user && checkingCharacter && <LoadingSpinner message="Cargando personaje..." />}

        {user && !checkingCharacter && !character && (
          <CharacterCreation 
            user={user} 
            onCharacterCreated={handleCharacterCreated} 
          />
        )}

        {/* ← NUEVA LÓGICA DE VISTAS */}
        {user && !checkingCharacter && character && (
          <>
            {currentView === 'cmdesign' && (
              <CMDashboard 
                user={user} 
                character={character}
                onNavigateToLupiApp={handleNavigateToLupiApp}
              />
            )}
            
            {currentView === 'lupiapp' && (
              <Dashboard user={user} character={character} />
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;