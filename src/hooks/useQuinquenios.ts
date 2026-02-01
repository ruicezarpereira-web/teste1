import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Quinquenio = Tables<"quinquenios">;
export type QuinquenioInsert = TablesInsert<"quinquenios">;

export function useQuinquenios(servidorId?: string) {
  return useQuery({
    queryKey: ["quinquenios", servidorId],
    queryFn: async () => {
      let query = supabase
        .from("quinquenios")
        .select("*")
        .order("numero");
      
      if (servidorId) {
        query = query.eq("servidor_id", servidorId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useQuinquenio(id: string) {
  return useQuery({
    queryKey: ["quinquenio", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quinquenios")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useUpsertQuinquenio() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (quinquenio: QuinquenioInsert) => {
      const { data, error } = await supabase
        .from("quinquenios")
        .upsert(quinquenio)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quinquenios"] });
    },
  });
}

export function useAllQuinqueniosWithServidores() {
  return useQuery({
    queryKey: ["quinquenios-with-servidores"],
    queryFn: async () => {
      const { data: quinquenios, error: qError } = await supabase
        .from("quinquenios")
        .select("*")
        .order("servidor_id");
      
      if (qError) throw qError;
      
      const { data: servidores, error: sError } = await supabase
        .from("servidores")
        .select("*");
      
      if (sError) throw sError;
      
      const servidoresMap = new Map(servidores.map(s => [s.id, s]));
      
      return quinquenios.map(q => ({
        ...q,
        servidor: servidoresMap.get(q.servidor_id),
      }));
    },
  });
}
