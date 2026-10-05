import { supabase } from "../lib/supabaseClient";

export type ProcessUserActionParams = {
  userId: string;
  actionType: string;
  actionValue?: number;
  referenceId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function processUserAction({
  userId,
  actionType,
  actionValue = 0,
  referenceId = null,
  metadata = {},
}: ProcessUserActionParams) {
  const { data, error } = await supabase.rpc("process_user_action", {
    p_user_id: userId,
    p_action_type: actionType,
    p_action_value: actionValue,
    p_reference_id: referenceId,
    p_metadata: metadata,
  });

  if (error) {
    console.error("Error procesando acción:", error);
    throw error;
  }

  // 🔄 Avisar a todos los componentes que la progresión cambió
  window.dispatchEvent(
    new CustomEvent("lupi:progression-updated", {
      detail: {
        userId,
        actionType,
        result: data,
      },
    })
  );

  return data;
}