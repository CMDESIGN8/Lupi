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
  const [message, setMessage] = useState(''); // ✅ estado agregado

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isLogin) {
        // LOGIN
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            throw new Error('Email o contraseña incorrectos');
          }
          throw error;
        }

        setMessage('¡Login exitoso!');
        onAuthSuccess(data.user);

      } else {
        // REGISTRO
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { username: formData.username }
          }
        });

        if (authError) {
          if (authError.message.includes('User already registered')) {
            throw new Error('Este email ya está registrado');
          }
          if (authError.message.includes('Password should be at least')) {
            throw new Error('La contraseña debe tener al menos 6 caracteres');
          }
          throw authError;
        }

        if (authData.user) {
          // Crear perfil
          const { error: profileError } = await supabase
            .from('profiles')
            .insert([
              {
                id: authData.user.id,
                username: formData.username,
                email: formData.email
              }
            ]);

          if (profileError) {
            if (profileError.code === '23505') { // Unique violation
              throw new Error('Este nombre de usuario ya está en uso');
            }
            throw new Error('Error al crear el perfil');
          }

          setMessage('¡Cuenta creada exitosamente! Ya puedes iniciar sesión.');
          // No llamamos onAuthSuccess inmediatamente
        }
      }
    } catch (error) {
      console.error('Error de autenticación:', error);
      setMessage(error.message);
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

        {/* ✅ Mostrar mensajes */}
        {message && <p className="auth-message">{message}</p>}

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
