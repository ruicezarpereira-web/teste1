import { useParams, Link } from "react-router-dom";
import { useServidor } from "@/hooks/useServidores";
import { useQuinquenios } from "@/hooks/useQuinquenios";
import { useFaltas } from "@/hooks/useFaltas";
import { useAfastamentos } from "@/hooks/useAfastamentos";
import { useProcessos } from "@/hooks/useProcessos";
import { Layout } from "@/components/Layout";
import { StatusBadge } from "@/components/StatusBadge";
import { formatarData, classificarUrgencia, DIAS_QUINQUENIO } from "@/lib/quinquenio";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ExternalLink, Loader2, User } from "lucide-react";

export default function DetalheServidor() {
  const { id } = useParams<{ id: string }>();
  const { data: servidor, isLoading: loadingServidor } = useServidor(id!);
  const { data: quinquenios, isLoading: loadingQuinquenios } = useQuinquenios(id);
  const { data: faltas } = useFaltas(id);
  const { data: afastamentos } = useAfastamentos(id);
  const { data: processos } = useProcessos(id);

  const isLoading = loadingServidor || loadingQuinquenios;

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!servidor) {
    return (
      <Layout>
        <div className="text-center">
          <p className="text-muted-foreground">Servidor não encontrado.</p>
          <Button asChild className="mt-4">
            <Link to="/servidores">Voltar</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/servidores">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{servidor.nome}</h1>
            <p className="text-muted-foreground">Matrícula: {servidor.matricula}</p>
          </div>
        </div>

        {/* Dados Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Dados Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">CPF</p>
                <p className="font-medium">{servidor.cpf || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">RG</p>
                <p className="font-medium">{servidor.rg || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                <p className="font-medium">{formatarData(servidor.data_nascimento)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cargo</p>
                <p className="font-medium">{servidor.cargo || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Lotação</p>
                <p className="font-medium">{servidor.lotacao || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data de Admissão</p>
                <p className="font-medium">{formatarData(servidor.data_admissao)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Situação</p>
                <p className="font-medium">{servidor.situacao || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{servidor.email || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Telefone</p>
                <p className="font-medium">{servidor.telefone || "-"}</p>
              </div>
            </div>
            {servidor.observacoes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-muted-foreground">Observações</p>
                <p className="mt-1">{servidor.observacoes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs com informações detalhadas */}
        <Tabs defaultValue="quinquenios" className="space-y-4">
          <TabsList>
            <TabsTrigger value="quinquenios">
              Quinquênios ({quinquenios?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="processos">
              Processos ({processos?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="faltas">
              Faltas ({faltas?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="afastamentos">
              Afastamentos ({afastamentos?.length || 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="quinquenios">
            <Card>
              <CardHeader>
                <CardTitle>Quinquênios</CardTitle>
              </CardHeader>
              <CardContent>
                {quinquenios?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum quinquênio registrado.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nº</TableHead>
                        <TableHead>Início</TableHead>
                        <TableHead>Fim</TableHead>
                        <TableHead className="text-right">Dias Corridos</TableHead>
                        <TableHead className="text-right">Acréscimo</TableHead>
                        <TableHead className="text-right">Dias Líquidos</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {quinquenios?.map((q) => {
                        const diasRestantes = DIAS_QUINQUENIO - (q.dias_liquidos || 0);
                        const classificacao = classificarUrgencia(diasRestantes);
                        return (
                          <TableRow key={q.id}>
                            <TableCell className="font-medium">{q.numero}º</TableCell>
                            <TableCell>{formatarData(q.data_inicio)}</TableCell>
                            <TableCell>{formatarData(q.data_fim)}</TableCell>
                            <TableCell className="text-right font-mono">
                              {q.dias_corridos || 0}
                            </TableCell>
                            <TableCell className="text-right font-mono text-destructive">
                              {q.dias_acrescimo || 0}
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold">
                              {q.dias_liquidos || 0}
                            </TableCell>
                            <TableCell>
                              <StatusBadge classificacao={classificacao} />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="processos">
            <Card>
              <CardHeader>
                <CardTitle>Processos</CardTitle>
              </CardHeader>
              <CardContent>
                {processos?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum processo registrado.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nº Processo</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Quinquênio Ref.</TableHead>
                        <TableHead>Abertura</TableHead>
                        <TableHead>Conclusão</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Link</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {processos?.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-mono">
                            {p.numero_processo || "-"}
                          </TableCell>
                          <TableCell>{p.tipo || "-"}</TableCell>
                          <TableCell>{p.quinquenio_ref ? `${p.quinquenio_ref}º` : "-"}</TableCell>
                          <TableCell>{formatarData(p.data_abertura)}</TableCell>
                          <TableCell>{formatarData(p.data_conclusao)}</TableCell>
                          <TableCell>
                            <Badge variant={p.status === "CONCLUÍDO" ? "default" : "secondary"}>
                              {p.status || "-"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {p.link_esalvador ? (
                              <Button variant="ghost" size="sm" asChild>
                                <a
                                  href={p.link_esalvador}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="faltas">
            <Card>
              <CardHeader>
                <CardTitle>Registro de Faltas</CardTitle>
              </CardHeader>
              <CardContent>
                {faltas?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhuma falta registrada.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead className="text-right">Dias</TableHead>
                        <TableHead>Justificada</TableHead>
                        <TableHead>Motivo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {faltas?.map((f) => (
                        <TableRow key={f.id}>
                          <TableCell>{formatarData(f.data_falta)}</TableCell>
                          <TableCell className="text-right font-mono">
                            {f.dias || 1}
                          </TableCell>
                          <TableCell>
                            <Badge variant={f.justificada ? "default" : "destructive"}>
                              {f.justificada ? "Sim" : "Não"}
                            </Badge>
                          </TableCell>
                          <TableCell>{f.motivo || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="afastamentos">
            <Card>
              <CardHeader>
                <CardTitle>Afastamentos</CardTitle>
              </CardHeader>
              <CardContent>
                {afastamentos?.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Nenhum afastamento registrado.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Início</TableHead>
                        <TableHead>Fim</TableHead>
                        <TableHead>Motivo</TableHead>
                        <TableHead>Documento</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {afastamentos?.map((a) => (
                        <TableRow key={a.id}>
                          <TableCell>
                            <Badge variant="outline">{a.tipo}</Badge>
                          </TableCell>
                          <TableCell>{formatarData(a.data_inicio)}</TableCell>
                          <TableCell>{formatarData(a.data_fim)}</TableCell>
                          <TableCell>{a.motivo || "-"}</TableCell>
                          <TableCell>{a.documento || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
