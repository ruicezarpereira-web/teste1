import { useState } from "react";
import { useServidores } from "@/hooks/useServidores";
import { useQuinquenios } from "@/hooks/useQuinquenios";
import { classificarUrgencia, DIAS_QUINQUENIO } from "@/lib/quinquenio";
import { Layout } from "@/components/Layout";
import { StatusBadge } from "@/components/StatusBadge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Search, Eye, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function Servidores() {
  const [search, setSearch] = useState("");
  const { data: servidores, isLoading } = useServidores(search);
  const { data: quinquenios } = useQuinquenios();

  const quinquenioMap = new Map(
    quinquenios?.map((q) => [q.servidor_id, q]) || []
  );

  const servidoresComStatus = servidores?.map((s) => {
    const ultimoQuinquenio = quinquenioMap.get(s.id);
    const diasRestantes = ultimoQuinquenio
      ? DIAS_QUINQUENIO - (ultimoQuinquenio.dias_liquidos || 0)
      : null;
    const classificacao = diasRestantes !== null 
      ? classificarUrgencia(diasRestantes)
      : null;

    return {
      ...s,
      ultimoQuinquenio,
      diasRestantes,
      classificacao,
    };
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Servidores</h1>
          <p className="text-muted-foreground">
            Listagem de todos os servidores cadastrados
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
              <CardTitle>Lista de Servidores</CardTitle>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome ou matrícula..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : servidoresComStatus?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum servidor encontrado.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Matrícula</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Cargo</TableHead>
                      <TableHead>Lotação</TableHead>
                      <TableHead>Situação Quinquênio</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {servidoresComStatus?.map((servidor) => (
                      <TableRow key={servidor.id}>
                        <TableCell className="font-mono">
                          {servidor.matricula}
                        </TableCell>
                        <TableCell className="font-medium">
                          {servidor.nome}
                        </TableCell>
                        <TableCell>{servidor.cargo || "-"}</TableCell>
                        <TableCell>{servidor.lotacao || "-"}</TableCell>
                        <TableCell>
                          {servidor.classificacao ? (
                            <StatusBadge classificacao={servidor.classificacao} />
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link to={`/servidor/${servidor.id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              Ver
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
