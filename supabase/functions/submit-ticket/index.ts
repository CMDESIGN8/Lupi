import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', // Asegúrate de incluir OPTIONS
};

Deno.serve(async (req) => {
  // 1. MANEJAR EL PREFLIGHT (CORS) - ESTO ES LO QUE ESTÁ FALLANDO
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      status: 200, // Debe ser 200 OK
      headers: corsHeaders 
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    // Usamos el cliente ADMIN para todo el proceso
    const admin = createClient(supabaseUrl, serviceKey);

    // Extraer el Token manualmente
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No Authorization header");

    const token = authHeader.replace("Bearer ", "");
    
    // VALIDACIÓN MANUAL DEL USUARIO
    const { data: { user }, error: authError } = await admin.auth.getUser(token);

    if (authError || !user) {
      console.error("JWT Error:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Sesión inválida. Por favor, vuelve a entrar." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Lógica de Body y Base de Datos
    const { ticketNumber } = await req.json();
    const clean = String(ticketNumber || "").trim();

    // 1. Verificar Duplicado
    const { data: existing } = await admin.from("tickets").select("id").eq("ticket_number", clean).maybeSingle();
    if (existing) throw new Error("Ticket ya registrado anteriormente.");

    // 2. Obtener Perfil (puntos y club)
    const { data: profile } = await admin.from("profiles").select("club, points").eq("id", user.id).single();
    if (!profile) throw new Error("No se encontró el perfil del usuario.");

    // 3. Registrar Ticket y Sumar Puntos
    const { error: insErr } = await admin.from("tickets").insert({
      user_id: user.id,
      ticket_number: clean,
      club: profile.club,
      status: "pendiente"
    });
    if (insErr) throw new Error("Error al guardar el ticket.");

    const newPoints = (profile.points || 0) + 10;
    await admin.from("profiles").update({ points: newPoints }).eq("id", user.id);

    return new Response(
      JSON.stringify({ success: true, newPoints }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});