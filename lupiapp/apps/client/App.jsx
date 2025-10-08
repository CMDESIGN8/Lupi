// apps/client/src/App.jsx
import React, { useState, useEffect } from 'react';
import { Auth } from './src/components/Auth';
import { CharacterCreation } from './src/components/CharacterCreation';
import { supabase } from './src/lib/supabaseClient';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('🔧 App mounted - checking session');
    
    // Verificar sesión inicial
    checkSession();
    
    // Escuchar cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', event);
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
      // NO hacemos consulta automática aquí
    } else {
      console.log('🚪 User logged out');
      setCharacter(null);
    }
  };

  const handleAuthSuccess = (user) => {
    console.log('✅ Auth success:', user.id);
    setUser(user);
    // NO verificamos personaje automáticamente
  };

  const handleCharacterCreated = (characterData) => {
    console.log('🎮 Character created:', characterData);
    setCharacter(characterData);
    // NO hacemos consulta adicional
  };

  const handleLogout = async () => {
    console.log('🚪 Logging out...');
    await supabase.auth.signOut();
    setUser(null);
    setCharacter(null);
  };

  // Función MANUAL para verificar personaje (solo si es necesario)
  const manualCheckCharacter = async () => {
    if (!user) return;
    
    console.log('🔍 Manual character check for user:', user.id);
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('id, nickname, level')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Manual check error:', error);
        return;
      }

      if (data) {
        console.log('🎯 Character found manually:', data);
        setCharacter(data);
      } else {
        console.log('❌ No character found manually');
        setCharacter(null);
      }
    } catch (error) {
      console.error('Manual check failed:', error);
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
            <button onClick={manualCheckCharacter} style={{marginRight: '10px'}}>
              Verificar Personaje
            </button>
            <button onClick={handleLogout}>Cerrar Sesión</button>
          </div>
        )}
      </header>

      <main className="app-main">
        {!user && <Auth onAuthSuccess={handleAuthSuccess} />}
        
        {user && !character && (
          <CharacterCreation 
            user={user} 
            onCharacterCreated={handleCharacterCreated} 
          />
        )}
        
        {user && character && (
          <div className="game-dashboard">
            <h2>¡Bienvenido a LupiApp, {character.nickname}!</h2>
            <div className="character-info">
              <h3>Tu Personaje:</h3>
              <p>Nivel: {character.level}</p>
              <p>Experiencia: {character.experience}/{character.experience_to_next_level}</p>
              <p>Wallet: {character.nickname.toLowerCase()}.lupi</p>
              
              <h4>Stats:</h4>
              <div className="stats-grid">
                <span>📨 Pase: {character.pase}</span>
                <span>⚽ Potencia: {character.potencia}</span>
                <span>💨 Velocidad: {character.velocidad}</span>
                <span>👑 Liderazgo: {character.liderazgo}</span>
                <span>🥅 Tiro: {character.tiro}</span>
                <span>🎯 Regate: {character.regate}</span>
                <span>🔧 Técnica: {character.tecnica}</span>
                <span>🧠 Estrategia: {character.estrategia}</span>
                <span>📈 Inteligencia: {character.inteligencia}</span>
                <span>🛡️ Defensa: {character.defensa}</span>
                <span>🏃 Resistencia: {character.resistencia_base}</span>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;