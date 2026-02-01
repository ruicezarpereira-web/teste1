import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Falta = Tables<"faltas">;
export type FaltaInsert = TablesInsert<"faltas">;

export function useFaltas(servidorId?: string) {
  return useQuery({
    queryKey: ["faltas", servidorId],
    queryFn: async () => {
      let query = supabase
        .from("faltas")
        .select("*")
        .order("data_falta", { ascending: false });
      
      if (servidorId) {
        query = query.eq("servidor_id", servidorId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useUpsertFalta() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (falta: FaltaInsert) => {
      const { data, error } = await supabase
        .from("faltas")
        .upsert(falta)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faltas"] });
    },
  });
}
