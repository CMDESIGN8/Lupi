// apps/client/src/components/Auth.jsx
import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export const Auth = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: ''
  });
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
        onAuthSuccess(data.user);
      } else {
        // Registro
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              username: formData.username
            }
          }
        });
        if (error) throw error;
        
        if (data.user) {
          // Crear perfil del usuario
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: data.user.id,
                username: formData.username,
                email: formData.email
              }
            ]);
          
          if (profileError) throw profileError;
          onAuthSuccess(data.user);
        }
      }
    } catch (error) {
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>{isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'} - LupiApp</h2>
        <form onSubmit={handleAuth} className="auth-form">
          {!isLogin && (
            <input
              type="text"
              placeholder="Nombre de usuario"
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              required
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Cargando...' : (isLogin ? 'Iniciar Sesión' : 'Registrarse')}
          </button>
        </form>
        <p>
          {isLogin ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
          <button 
            type="button" 
            onClick={() => setIsLogin(!isLogin)}
            className="link-button"
          >
            {isLogin ? 'Regístrate' : 'Inicia Sesión'}
          </button>
        </p>
      </div>
    </div>
  );
};