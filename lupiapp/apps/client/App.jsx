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
    // Verificar sesión al cargar
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escuchar cambios de auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        // Verificar si el usuario ya tiene personaje
        checkExistingCharacter(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkExistingCharacter = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (data && !error) {
        setCharacter(data);
      }
    } catch (error) {
      // No hay personaje, es normal
    }
  };

  const handleAuthSuccess = (user) => {
    setUser(user);
    checkExistingCharacter(user.id);
  };

  const handleCharacterCreated = (characterData) => {
    setCharacter(characterData);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setCharacter(null);
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