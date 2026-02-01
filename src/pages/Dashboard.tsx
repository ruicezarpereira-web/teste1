import { useAllQuinqueniosWithServidores } from "@/hooks/useQuinquenios";
import { classificarUrgencia, DIAS_QUINQUENIO } from "@/lib/quinquenio";
import { KPICard } from "@/components/KPICard";
import { StatusBadge } from "@/components/StatusBadge";
import { Layout } from "@/components/Layout";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Clock, Calendar, CalendarCheck, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { data: quinquenios, isLoading, error } = useAllQuinqueniosWithServidores();

  const stats = {
    vencidos: 0,
    urgentes: 0,
    proximos: 0,
    emBreve: 0,
  };

  const listaQuinquenios = quinquenios?.map(q => {
    const diasRestantes = DIAS_QUINQUENIO - (q.dias_liquidos || 0);
    const classificacao = classificarUrgencia(diasRestantes);
    
    if (classificacao.status === "VENCIDO") stats.vencidos++;
    else if (classificacao.status === "URGENTE") stats.urgentes++;
    else if (classificacao.status === "PRÓXIMO") stats.proximos++;
    else if (classificacao.status === "EM BREVE") stats.emBreve++;
    
    return {
      ...q,
      diasRestantes,
      classificacao,
    };
  }).sort((a, b) => a.diasRestantes - b.diasRestantes) || [];

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="text-center text-destructive">
          Erro ao carregar dados: {error.message}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral das licenças-prêmio
          </p>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Vencidos"
            value={stats.vencidos}
            icon={AlertTriangle}
            color="text-red-600"
            bgColor="bg-red-100"
          />
          <KPICard
            title="Urgentes"
            value={stats.urgentes}
            icon={Clock}
            color="text-orange-600"
            bgColor="bg-orange-100"
          />
          <KPICard
            title="Próximos"
            value={stats.proximos}
            icon={Calendar}
            color="text-yellow-600"
            bgColor="bg-yellow-100"
          />
          <KPICard
            title="Em Breve"
            value={stats.emBreve}
            icon={CalendarCheck}
            color="text-blue-600"
            bgColor="bg-blue-100"
          />
        </div>

        {/* Tabela de Quinquênios */}
        <Card>
          <CardHeader>
            <CardTitle>Situação dos Quinquênios</CardTitle>
          </CardHeader>
          <CardContent>
            {listaQuinquenios.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhum quinquênio cadastrado. Importe uma planilha para começar.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Matrícula</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Quinquênio</TableHead>
                    <TableHead className="text-right">Dias Restantes</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {listaQuinquenios.slice(0, 50).map((q) => (
                    <TableRow key={q.id}>
                      <TableCell className="font-mono">
                        {q.servidor?.matricula || "-"}
                      </TableCell>
                      <TableCell>
                        <Link 
                          to={`/servidor/${q.servidor_id}`}
                          className="text-primary hover:underline"
                        >
                          {q.servidor?.nome || "-"}
                        </Link>
                      </TableCell>
                      <TableCell>{q.numero}º</TableCell>
                      <TableCell className="text-right font-mono">
                        {q.diasRestantes}
                      </TableCell>
                      <TableCell>
                        <StatusBadge classificacao={q.classificacao} />
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
