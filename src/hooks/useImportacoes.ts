import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type Importacao = Tables<"importacoes">;
export type ImportacaoInsert = TablesInsert<"importacoes">;

export function useImportacoes() {
  return useQuery({
    queryKey: ["importacoes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("importacoes")
        .select("*")
        .order("data_importacao", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateImportacao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (importacao: ImportacaoInsert) => {
      const { data, error } = await supabase
        .from("importacoes")
        .insert(importacao)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["importacoes"] });
    },
  });
}

export function useUpdateImportacao() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Importacao> & { id: string }) => {
      const { data, error } = await supabase
        .from("importacoes")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["importacoes"] });
    },
  });
}
