import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Processo = Tables<"processos">;
export type ProcessoInsert = TablesInsert<"processos">;

export function useProcessos(servidorId?: string) {
  return useQuery({
    queryKey: ["processos", servidorId],
    queryFn: async () => {
      let query = supabase
        .from("processos")
        .select("*")
        .order("data_abertura", { ascending: false });
      
      if (servidorId) {
        query = query.eq("servidor_id", servidorId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertProcesso() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (processo: ProcessoInsert) => {
      const { data, error } = await supabase
        .from("processos")
        .upsert(processo)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["processos"] });
    },
  });
}
