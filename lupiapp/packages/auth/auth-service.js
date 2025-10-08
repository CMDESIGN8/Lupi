// packages/auth/src/auth-service.js
import { supabase } from '../../database/supabase-client.js';

export class AuthService {
  // Registro de usuario
  static async register(email, password, username) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username }
      }
    });

    if (authError) throw authError;
    
    // Crear perfil del usuario
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        { 
          id: authData.user.id, 
          username: username,
          email: email
        }
      ]);

    if (profileError) throw profileError;
    
    return authData.user;
  }

  // Login
  static async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data.user;
  }

  // Logout
  static async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }
}