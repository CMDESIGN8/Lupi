// apps/client/src/App.jsx
import React, { useState, useEffect } from 'react';
import { Auth } from './src/components/Auth';
import { CharacterCreation } from './src/components/CharacterCreation';
import { Dashboard } from './src/components/Dashboard'; // nuevo dashboard importado
import { supabase } from './src/lib/supabaseClient';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔧 App mounted - checking session');
    checkSession();

    // Escuchar cambios de auth
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
    }
  };

  const handleAuthChange = async (session) => {
    const currentUser = session?.user ?? null;
    setUser(currentUser);

    if (currentUser) {
      console.log('👤 User logged in:', currentUser.id);
      // Buscar personaje automáticamente
      await fetchCharacter(currentUser.id);
    } else {
      console.log('🚪 User logged out');
      setCharacter(null);
    }
  };

  const handleAuthSuccess = async (user) => {
    console.log('✅ Auth success:', user.id);
    setUser(user);
    // Buscar personaje si ya tenía uno
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
  };

  const fetchCharacter = async (userId) => {
  try {
    console.log('🔍 Buscando personaje para usuario:', userId);
    
    const { data, error } = await supabase
      .from('characters')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('❌ Error buscando personaje:', error);
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
  }
};

  if (loading) {
    return <div className="loading">Cargando LupiApp...</div>;
  }

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
        {/* Login/Registro */}
        {!user && <Auth onAuthSuccess={handleAuthSuccess} />}

        {/* Si hay usuario pero no personaje → creación */}
        {user && !character && (
          <CharacterCreation 
            user={user} 
            onCharacterCreated={handleCharacterCreated} 
          />
        )}

        {/* Si hay usuario y personaje → dashboard */}
        {user && character && (
          <Dashboard user={user} character={character} />
        )}
      </main>
    </div>
  );
}

export default App;
