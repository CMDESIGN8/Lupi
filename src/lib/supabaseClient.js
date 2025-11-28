
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Cliente simple sin proxy para producción
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false // Deshabilitar para evitar llamadas automáticas
  },
  global: {
    headers: {
      'apikey': supabaseAnonKey,
    }
  }
});

// Cliente para debug (usar este temporalmente para encontrar el problema)
export const supabaseDebug = new Proxy(createClient(supabaseUrl, supabaseAnonKey), {
  get(target, prop) {
    if (prop === 'from') {
      return (tableName) => {
        const table = target[prop](tableName);
        return new Proxy(table, {
          get(tableTarget, tableProp) {
            if (['select', 'insert', 'update', 'delete'].includes(tableProp)) {
              return (...args) => {
                const stack = new Error().stack;
                console.group(`🏁 SUPABASE ${tableProp.toUpperCase()} on ${tableName}`);
                console.log('Arguments:', args);
                console.log('Stack trace:', stack);
                console.groupEnd();
                
                return tableTarget[tableProp](...args).then(result => {
                  console.group(`✅ SUPABASE ${tableProp.toUpperCase()} RESULT on ${tableName}`);
                  console.log('Data:', result.data);
                  console.log('Error:', result.error);
                  console.groupEnd();
                  return result;
                });
              };
            }
            return tableTarget[tableProp];
          }
        });
      };
    }
    return target[prop];
  }
});