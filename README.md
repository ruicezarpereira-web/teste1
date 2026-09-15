# TESTE1

Crie um sistema web administrativo para controle de Licenças-Prêmio.

Componentes obrigatórios:

Tela de importação de Excel

Tela de servidores

Tela de detalhe do servidor

Tela de cálculo automático de quinquênio

Dashboard gerencial

Importação:

Ler planilhas Excel (.xlsm)

Ignorar macros

Mapear abas: Controle de Processos, Dados de Servidores, Registro de Faltas, Afastamentos

Matrícula sempre como texto

Regras de cálculo (obrigatório seguir):

Quinquênio = 1825 dias

Cada dia de falta acrescenta 10 dias

Dias líquidos = dias corridos − acréscimos

Períodos extras devem ser considerados

Dashboard:

Classificar licenças em: VENCIDO, URGENTE, PRÓXIMO, EM BREVE

Atualização automática

Requisitos técnicos:

Banco relacional normalizado

Cálculos automáticos

Datas no formato dd/mm/yyyy

Sem edição manual de cálculos

O sistema deve substituir integralmente o Excel atual.

1. COMPONENTES (TELAS) NO LOVABLE
1.1 Tela: Importação de Planilha

Componentes

File Upload (.xlsx / .xlsm)

Botão: Importar dados

Tabela de pré-visualização

Toast de sucesso/erro

Fluxo

Upload → Parse Excel

Mapear abas:

“2. Controle de Processos”

“4. Dados de Servidores”

“3. Registro de Faltas”

“7. Afastamentos”

Regras

Matrícula sempre como texto

Datas convertidas para dd/mm/yyyy

Ignorar macros

1.2 Tela: Servidores

Componentes

Data Table (Servidores)

Campo de busca por matrícula/nome

Botão: Ver detalhes

Colunas

Matrícula

Nome

Cargo

Lotação

Situação do quinquênio atual

1.3 Tela: Detalhe do Servidor

Componentes

Card: Dados pessoais

Tabela: Quinquênios

Tabela: Processos

Tabela: Faltas

Tabela: Afastamentos

Ações

Clique em quinquênio → abre cálculo

Clique em processo → link externo (e-Salvador)

1.4 Tela: Cálculo de Quinquênio

Componentes

Date Picker: Data de referência

Tabela: Períodos computados

Card resumo:

Dias trabalhados

Acréscimos

Dias líquidos

Status (COMPLETO / INCOMPLETO)

⚠️ Tudo somente leitura
Nada manual, igual ao Excel bem-feito.

1.5 Tela: Dashboard

Componentes

KPI Cards:

VENCIDOS

URGENTES

PRÓXIMOS

EM BREVE

Data Table:

Matrícula

Nome

Quinquênio

Dias restantes

Status (cor)

2. FLUXOS (WORKFLOWS) NO LOVABLE
2.1 Workflow: Importar Excel

Trigger

Botão Importar dados

Passos

Parse Excel

Para cada aba:

Normalizar campos

Upsert (não duplicar)

Criar/atualizar:

Servidores

Processos

Faltas

Afastamentos

Disparar recalculo automático

2.2 Workflow: Recalcular Quinquênios

Trigger

Importação concluída

Alteração de falta

Alteração de afastamento

Mudança de data de referência

Passos

Buscar períodos do quinquênio

Somar dias corridos

Aplicar acréscimos

Atualizar status

2.3 Workflow: Classificação de Urgência
dias_restantes = 1825 - dias_liquidos

< 0 → VENCIDO
0–30 → URGENTE
31–90 → PRÓXIMO
91–180 → EM BREVE


Atualiza dashboard em tempo real.

3. FUNÇÃO DE CÁLCULO (REGRA NO LOVABLE)

Essa lógica você pede para o Lovable criar como Function / Automation

Função: calcularQuinquenio

Entrada

{
  "periodos": [
    { "inicio": "2020-02-11", "fim": "2024-12-31" }
  ],
  "faltas": 4,
  "acrescimos_mensais": 0
}


Lógica

dias_corridos = soma((fim - inicio) + 1)
acrescimo = faltas * 10 + acrescimos_mensais
dias_liquidos = dias_corridos - acrescimo
status = dias_liquidos >= 1825 ? "COMPLETO" : "INCOMPLETO"


Saída

{
  "dias_corridos": 1785,
  "acrescimo": 40,
  "dias_liquidos": 1745,
  "status": "INCOMPLETO",
  "dias_faltantes": 80

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/1fa5bf6d-3e1a-418f-a9be-da32c913f233).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
