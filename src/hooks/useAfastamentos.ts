import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Afastamento = Tables<"afastamentos">;
export type AfastamentoInsert = TablesInsert<"afastamentos">;

export function useAfastamentos(servidorId?: string) {
  return useQuery({
    queryKey: ["afastamentos", servidorId],
    queryFn: async () => {
      let query = supabase
        .from("afastamentos")
        .select("*")
        .order("data_inicio", { ascending: false });
      
      if (servidorId) {
        query = query.eq("servidor_id", servidorId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertAfastamento() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (afastamento: AfastamentoInsert) => {
      const { data, error } = await supabase
        .from("afastamentos")
        .upsert(afastamento)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["afastamentos"] });
    },
  });
}
