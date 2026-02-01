import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Servidor = Tables<"servidores">;
export type ServidorInsert = TablesInsert<"servidores">;

export function useServidores(search?: string) {
  return useQuery({
    queryKey: ["servidores", search],
    queryFn: async () => {
      let query = supabase
        .from("servidores")
        .select("*")
        .order("nome");
      
      if (search) {
        query = query.or(`nome.ilike.%${search}%,matricula.ilike.%${search}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });
}

export function useServidor(id: string) {
  return useQuery({
    queryKey: ["servidor", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("servidores")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });
}

export function useUpsertServidor() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (servidor: ServidorInsert) => {
      const { data, error } = await supabase
        .from("servidores")
        .upsert(servidor, { onConflict: "matricula" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servidores"] });
    },
  });
}
