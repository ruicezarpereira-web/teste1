import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import * as XLSX from "xlsx";
import { supabase } from "@/integrations/supabase/client";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCreateImportacao, useUpdateImportacao, useImportacoes } from "@/hooks/useImportacoes";
import { useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Upload, FileSpreadsheet, CheckCircle, XCircle, Loader2, AlertCircle } from "lucide-react";
import { formatarData, DIAS_QUINQUENIO, PENALIDADE_FALTA } from "@/lib/quinquenio";
import { differenceInDays, parseISO, isValid } from "date-fns";

interface PreviewData {
  servidores: any[];
  processos: any[];
  faltas: any[];
  afastamentos: any[];
}

function parseExcelDate(value: any): string | null {
  if (!value) return null;
  
  if (typeof value === "number") {
    const date = XLSX.SSF.parse_date_code(value);
    if (date) {
      return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
    }
  }
  
  if (typeof value === "string") {
    // Try dd/mm/yyyy format
    const parts = value.split("/");
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
    // Try ISO format
    if (value.includes("-")) {
      return value.split("T")[0];
    }
  }
  
  return null;
}

export default function Importacao() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [importing, setImporting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const { toast } = useToast();
  const createImportacao = useCreateImportacao();
  const updateImportacao = useUpdateImportacao();
  const { data: importacoes } = useImportacoes();
  const queryClient = useQueryClient();

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const uploadedFile = acceptedFiles[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setParsing(true);
    setPreview(null);

    try {
      const data = await uploadedFile.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });

      const previewData: PreviewData = {
        servidores: [],
        processos: [],
        faltas: [],
        afastamentos: [],
      };

      // Parse each sheet
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: null });
        const lowerName = sheetName.toLowerCase();

        if (lowerName.includes("servidor") || lowerName.includes("dados")) {
          previewData.servidores = jsonData.slice(0, 100);
        } else if (lowerName.includes("processo") || lowerName.includes("controle")) {
          previewData.processos = jsonData.slice(0, 100);
        } else if (lowerName.includes("falta")) {
          previewData.faltas = jsonData.slice(0, 100);
        } else if (lowerName.includes("afastamento")) {
          previewData.afastamentos = jsonData.slice(0, 100);
        }
      }

      setPreview(previewData);
      toast({
        title: "Arquivo carregado",
        description: `${previewData.servidores.length} servidores, ${previewData.processos.length} processos, ${previewData.faltas.length} faltas, ${previewData.afastamentos.length} afastamentos encontrados.`,
      });
    } catch (error) {
      console.error("Error parsing Excel:", error);
      toast({
        title: "Erro ao ler arquivo",
        description: "Verifique se o arquivo é um Excel válido.",
        variant: "destructive",
      });
    } finally {
      setParsing(false);
    }
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel.sheet.macroEnabled.12": [".xlsm"],
    },
    maxFiles: 1,
  });

  const handleImport = async () => {
    if (!preview || !file) return;

    setImporting(true);
    const errors: string[] = [];
    let totalImportados = 0;

    try {
      // Create import record
      const importRecord = await createImportacao.mutateAsync({
        nome_arquivo: file.name,
        status: "EM ANDAMENTO",
      });

      // Map to store servidor IDs by matricula
      const servidorMap = new Map<string, string>();

      // 1. Import Servidores
      for (const row of preview.servidores) {
        try {
          const matricula = String(row["MATRÍCULA"] || row["Matrícula"] || row["matricula"] || "").trim();
          if (!matricula) continue;

          const servidorData = {
            matricula,
            nome: row["NOME"] || row["Nome"] || row["nome"] || "Sem nome",
            cpf: row["CPF"] || row["cpf"] || null,
            rg: row["RG"] || row["rg"] || null,
            cargo: row["CARGO"] || row["Cargo"] || row["cargo"] || null,
            lotacao: row["LOTAÇÃO"] || row["Lotação"] || row["lotacao"] || null,
            situacao: row["SITUAÇÃO"] || row["Situação"] || row["situacao"] || null,
            data_admissao: parseExcelDate(row["DATA ADMISSÃO"] || row["Data Admissão"] || row["data_admissao"]),
            data_nascimento: parseExcelDate(row["DATA NASCIMENTO"] || row["Data Nascimento"] || row["data_nascimento"]),
            email: row["EMAIL"] || row["Email"] || row["email"] || null,
            telefone: row["TELEFONE"] || row["Telefone"] || row["telefone"] || null,
          };

          const { data, error } = await supabase
            .from("servidores")
            .upsert(servidorData, { onConflict: "matricula" })
            .select()
            .single();

          if (error) {
            errors.push(`Servidor ${matricula}: ${error.message}`);
          } else if (data) {
            servidorMap.set(matricula, data.id);
            totalImportados++;
          }
        } catch (e: any) {
          errors.push(`Erro servidor: ${e.message}`);
        }
      }

      // Fetch all servidores to complete the map
      const { data: allServidores } = await supabase.from("servidores").select("id, matricula");
      allServidores?.forEach((s) => servidorMap.set(s.matricula, s.id));

      // 2. Import Faltas
      for (const row of preview.faltas) {
        try {
          const matricula = String(row["MATRÍCULA"] || row["Matrícula"] || row["matricula"] || "").trim();
          const servidorId = servidorMap.get(matricula);
          if (!servidorId) continue;

          const faltaData = {
            servidor_id: servidorId,
            data_falta: parseExcelDate(row["DATA"] || row["Data"] || row["data_falta"]) || new Date().toISOString().split("T")[0],
            dias: Number(row["DIAS"] || row["Dias"] || row["dias"]) || 1,
            justificada: row["JUSTIFICADA"] === "SIM" || row["justificada"] === true,
            motivo: row["MOTIVO"] || row["Motivo"] || row["motivo"] || null,
          };

          const { error } = await supabase.from("faltas").insert(faltaData);
          if (error && !error.message.includes("duplicate")) {
            errors.push(`Falta ${matricula}: ${error.message}`);
          } else {
            totalImportados++;
          }
        } catch (e: any) {
          errors.push(`Erro falta: ${e.message}`);
        }
      }

      // 3. Import Afastamentos
      for (const row of preview.afastamentos) {
        try {
          const matricula = String(row["MATRÍCULA"] || row["Matrícula"] || row["matricula"] || "").trim();
          const servidorId = servidorMap.get(matricula);
          if (!servidorId) continue;

          const afastamentoData = {
            servidor_id: servidorId,
            tipo: row["TIPO"] || row["Tipo"] || row["tipo"] || "OUTROS",
            data_inicio: parseExcelDate(row["INÍCIO"] || row["Início"] || row["data_inicio"]) || new Date().toISOString().split("T")[0],
            data_fim: parseExcelDate(row["FIM"] || row["Fim"] || row["data_fim"]),
            motivo: row["MOTIVO"] || row["Motivo"] || row["motivo"] || null,
            documento: row["DOCUMENTO"] || row["Documento"] || row["documento"] || null,
          };

          const { error } = await supabase.from("afastamentos").insert(afastamentoData);
          if (error && !error.message.includes("duplicate")) {
            errors.push(`Afastamento ${matricula}: ${error.message}`);
          } else {
            totalImportados++;
          }
        } catch (e: any) {
          errors.push(`Erro afastamento: ${e.message}`);
        }
      }

      // 4. Import Processos
      for (const row of preview.processos) {
        try {
          const matricula = String(row["MATRÍCULA"] || row["Matrícula"] || row["matricula"] || "").trim();
          const servidorId = servidorMap.get(matricula);
          if (!servidorId) continue;

          const processoData = {
            servidor_id: servidorId,
            numero_processo: row["PROCESSO"] || row["Processo"] || row["numero_processo"] || null,
            tipo: row["TIPO"] || row["Tipo"] || row["tipo"] || null,
            quinquenio_ref: Number(row["QUINQUÊNIO"] || row["Quinquênio"] || row["quinquenio_ref"]) || null,
            data_abertura: parseExcelDate(row["ABERTURA"] || row["Abertura"] || row["data_abertura"]),
            data_conclusao: parseExcelDate(row["CONCLUSÃO"] || row["Conclusão"] || row["data_conclusao"]),
            status: row["STATUS"] || row["Status"] || row["status"] || "PENDENTE",
            link_esalvador: row["LINK"] || row["Link"] || row["link_esalvador"] || null,
            observacoes: row["OBSERVAÇÕES"] || row["Observações"] || row["observacoes"] || null,
          };

          const { error } = await supabase.from("processos").insert(processoData);
          if (error && !error.message.includes("duplicate")) {
            errors.push(`Processo ${matricula}: ${error.message}`);
          } else {
            totalImportados++;
          }
        } catch (e: any) {
          errors.push(`Erro processo: ${e.message}`);
        }
      }

      // 5. Recalculate Quinquenios
      await recalcularQuinquenios(servidorMap);

      // Update import record
      await updateImportacao.mutateAsync({
        id: importRecord.id,
        status: errors.length > 0 ? "CONCLUÍDO COM ERROS" : "CONCLUÍDO",
        registros_importados: totalImportados,
        erros: errors.length > 0 ? errors : null,
      });

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["servidores"] });
      queryClient.invalidateQueries({ queryKey: ["quinquenios"] });
      queryClient.invalidateQueries({ queryKey: ["faltas"] });
      queryClient.invalidateQueries({ queryKey: ["afastamentos"] });
      queryClient.invalidateQueries({ queryKey: ["processos"] });

      toast({
        title: "Importação concluída",
        description: `${totalImportados} registros importados.${errors.length > 0 ? ` ${errors.length} erros.` : ""}`,
        variant: errors.length > 0 ? "destructive" : "default",
      });

      setFile(null);
      setPreview(null);
    } catch (error: any) {
      console.error("Import error:", error);
      toast({
        title: "Erro na importação",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const recalcularQuinquenios = async (servidorMap: Map<string, string>) => {
    for (const [matricula, servidorId] of servidorMap) {
      try {
        // Get servidor data
        const { data: servidor } = await supabase
          .from("servidores")
          .select("data_admissao")
          .eq("id", servidorId)
          .single();

        if (!servidor?.data_admissao) continue;

        // Get faltas count
        const { data: faltas } = await supabase
          .from("faltas")
          .select("dias")
          .eq("servidor_id", servidorId)
          .eq("justificada", false);

        const totalFaltas = faltas?.reduce((acc, f) => acc + (f.dias || 1), 0) || 0;

        // Calculate quinquenio
        const dataAdmissao = parseISO(servidor.data_admissao);
        const hoje = new Date();
        
        if (!isValid(dataAdmissao)) continue;

        const diasCorridos = differenceInDays(hoje, dataAdmissao) + 1;
        const diasAcrescimo = totalFaltas * PENALIDADE_FALTA;
        const diasLiquidos = diasCorridos - diasAcrescimo;
        const quinquenioAtual = Math.floor(diasLiquidos / DIAS_QUINQUENIO) + 1;

        // Upsert quinquenio
        const quinquenioData = {
          servidor_id: servidorId,
          numero: quinquenioAtual,
          data_inicio: servidor.data_admissao,
          data_fim: null,
          dias_corridos: diasCorridos,
          dias_acrescimo: diasAcrescimo,
          dias_liquidos: diasLiquidos,
          status: diasLiquidos >= DIAS_QUINQUENIO ? "COMPLETO" : "INCOMPLETO",
        };

        await supabase.from("quinquenios").upsert(quinquenioData, {
          onConflict: "servidor_id,numero",
        });
      } catch (e) {
        console.error(`Error calculating quinquenio for ${matricula}:`, e);
      }
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Importação</h1>
          <p className="text-muted-foreground">
            Importe dados de planilhas Excel (.xlsx ou .xlsm)
          </p>
        </div>

        {/* Upload Area */}
        <Card>
          <CardHeader>
            <CardTitle>Upload de Planilha</CardTitle>
            <CardDescription>
              Arraste um arquivo Excel ou clique para selecionar. Abas reconhecidas: 
              Servidores, Processos, Faltas, Afastamentos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                transition-colors duration-200
                ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}
              `}
            >
              <input {...getInputProps()} />
              {parsing ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p>Processando arquivo...</p>
                </div>
              ) : file ? (
                <div className="flex flex-col items-center gap-2">
                  <FileSpreadsheet className="h-10 w-10 text-green-600" />
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Arquivo carregado com sucesso
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <p className="font-medium">
                    {isDragActive ? "Solte o arquivo aqui" : "Clique ou arraste um arquivo"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Suporta arquivos .xlsx e .xlsm
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        {preview && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Pré-visualização</CardTitle>
                  <CardDescription>
                    Revise os dados antes de importar
                  </CardDescription>
                </div>
                <Button onClick={handleImport} disabled={importing}>
                  {importing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Importar Dados
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Servidores</p>
                  <p className="text-2xl font-bold">{preview.servidores.length}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Processos</p>
                  <p className="text-2xl font-bold">{preview.processos.length}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Faltas</p>
                  <p className="text-2xl font-bold">{preview.faltas.length}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <p className="text-sm text-muted-foreground">Afastamentos</p>
                  <p className="text-2xl font-bold">{preview.afastamentos.length}</p>
                </div>
              </div>

              {preview.servidores.length > 0 && (
                <div className="mt-6">
                  <h4 className="font-medium mb-2">Amostra de Servidores (primeiros 5)</h4>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {Object.keys(preview.servidores[0] || {}).slice(0, 6).map((key) => (
                            <TableHead key={key}>{key}</TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {preview.servidores.slice(0, 5).map((row, i) => (
                          <TableRow key={i}>
                            {Object.values(row).slice(0, 6).map((val: any, j) => (
                              <TableCell key={j}>
                                {val !== null && val !== undefined ? String(val) : "-"}
                              </TableCell>
                            ))}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Import History */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Importações</CardTitle>
          </CardHeader>
          <CardContent>
            {importacoes?.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhuma importação realizada.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Arquivo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Registros</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {importacoes?.map((imp) => (
                    <TableRow key={imp.id}>
                      <TableCell className="font-medium">{imp.nome_arquivo}</TableCell>
                      <TableCell>{formatarData(imp.data_importacao)}</TableCell>
                      <TableCell>{imp.registros_importados || 0}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            imp.status === "CONCLUÍDO"
                              ? "default"
                              : imp.status === "CONCLUÍDO COM ERROS"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {imp.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
