'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ThemeToggleSimple } from '@/components/theme-toggle-simple';
// CORREÇÃO: Importando a função correta exportada pelo serviço
import { getIBGEIndices, IBGEData } from '@/services/ibge-service';
import { Unidade } from '@/types/unidade';
import { simulateDirectTable } from '@/utils/simulation-utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, TrendingUp, DollarSign, Calendar, AlertCircle } from 'lucide-react';

// Datas de entrega estimadas por empreendimento (slug)
const deliveryDates: Record<string, Date> = {
  'alto-da-alvorada': new Date('2027-03-31'),
  'alto-da-aurora': new Date('2026-12-31'),
  // Adicione outros empreendimentos conforme necessário
};

export default function SimuladorUnidadePage() {
  const params = useParams();
  const slug = params.unidade as string;
  
  const [unidade, setUnidade] = useState<Unidade | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados do Simulador
  const [valorVenda, setValorVenda] = useState(0);
  const [desconto, setDesconto] = useState(0);
  const [percentualCaptação, setPercentualCaptação] = useState(30); // Default 30%
  const [indiceSelecionado, setIndiceSelecionado] = useState<'INCC' | 'IPCA'>('INCC');
  const [periodoMedia, setPeriodoMedia] = useState<'15anos' | '12meses' | 'projecao'>('12meses');
  
  // Dados dos Índices
  const [indicesData, setIndicesData] = useState<IBGEData | null>(null);
  const [loadingIndices, setLoadingIndices] = useState(true);
  const [erroIndices, setErroIndices] = useState<string | null>(null);

  // Resultados da Simulação
  const [resultadoSimulacao, setResultadoSimulacao] = useState<any>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        // 1. Carregar dados da unidade (mock ou API real dependendo da sua implementação)
        // Ajuste este fetch conforme sua lógica real de obtenção de unidades
        const response = await fetch(`/api/unidades?slug=${slug}`);
        if (!response.ok) throw new Error('Unidade não encontrada');
        const data = await response.json();
        setUnidade(data);
        setValorVenda(data.valorVenda || 0);

        // 2. Carregar Índices do IBGE
        await carregarIndices();

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [slug]);

  // Recalcular simulação sempre que os inputs mudarem
  useEffect(() => {
    if (unidade && indicesData) {
      const valorFinal = valorVenda - desconto;
      const taxaAnual = obterTaxaPorPeriodo(periodoMedia, indiceSelecionado, indicesData);
      
      const simulacao = simulateDirectTable({
        valorFinal,
        percentualCaptação,
        taxaAnual,
        dataEntrega: deliveryDates[slug] || new Date('2027-01-01'),
        dataInicio: new Date(),
      });

      setResultadoSimulacao(simulacao);
    }
  }, [unidade, valorVenda, desconto, percentualCaptação, indiceSelecionado, periodoMedia, indicesData, slug]);

  async function carregarIndices() {
    setLoadingIndices(true);
    setErroIndices(null);
    try {
      // CORREÇÃO: Chamando a função correta
      const data = await getIBGEIndices();
      setIndicesData(data);
    } catch (err) {
      console.error('Erro ao carregar índices:', err);
      setErroIndices('Não foi possível carregar os índices atualizados. Usando valores padrão.');
      // Fallback seguro se a API falhar
      setIndicesData({
        incc: { media15Anos: 4.5, media12Meses: 5.0, projecao: 5.2 },
        ipca: { media15Anos: 5.0, media12Meses: 4.8, projecao: 5.1 }
      });
    } finally {
      setLoadingIndices(false);
    }
  }

  function obterTaxaPorPeriodo(periodo: string, indice: 'INCC' | 'IPCA', data: IBGEData): number {
    const tipoIndice = data[indice.toLowerCase() as 'incc' | 'ipca'];
    if (!tipoIndice) return 0;

    switch (periodo) {
      case '15anos': return tipoIndice.media15Anos;
      case '12meses': return tipoIndice.media12Meses;
      case 'projecao': return tipoIndice.projecao;
      default: return tipoIndice.media12Meses;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !unidade) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error || 'Unidade não encontrada.'}</p>
            <Button asChild className="mt-4">
              <Link href="/empreendimentos">Voltar aos Empreendimentos</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const valorFinal = valorVenda - desconto;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/empreendimentos`} className="text-sm font-medium hover:text-primary transition-colors">
              ← Voltar
            </Link>
            <h1 className="text-lg font-bold hidden sm:block">
              Simulador: {unidade.bloco} - {unidade.numero}
            </h1>
          </div>
          <ThemeToggleSimple />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        
        {/* Resumo da Unidade */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Detalhes da Unidade
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Valor de Venda</p>
              <p className="text-lg font-semibold">R$ {valorVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Área Útil</p>
              <p className="text-lg font-semibold">{unidade.areaUtil} m²</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Quartos / Banheiros</p>
              <p className="text-lg font-semibold">{unidade.quartos} / {unidade.banheiros}</p>
            </div>
          </CardContent>
        </Card>

        {/* Controles da Simulação */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Parâmetros Financeiros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="space-y-2">
                <Label htmlFor="desconto">Desconto (R$)</Label>
                <Input
                  id="desconto"
                  type="number"
                  value={desconto}
                  onChange={(e) => setDesconto(Number(e.target.value))}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Valor Final com Desconto: <strong>R$ {valorFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="captacao">Captação durante a obra (%)</Label>
                <Select 
                  value={percentualCaptação.toString()} 
                  onValueChange={(val) => setPercentualCaptação(Number(val))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione %" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25%</SelectItem>
                    <SelectItem value="30">30%</SelectItem>
                    <SelectItem value="40">40%</SelectItem>
                    <SelectItem value="50">50%</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Índice de Correção</Label>
                <div className="flex gap-2">
                  <Button
                    variant={indiceSelecionado === 'INCC' ? 'default' : 'outline'}
                    onClick={() => setIndiceSelecionado('INCC')}
                    className="flex-1"
                  >
                    INCC
                  </Button>
                  <Button
                    variant={indiceSelecionado === 'IPCA' ? 'default' : 'outline'}
                    onClick={() => setIndiceSelecionado('IPCA')}
                    className="flex-1"
                  >
                    IPCA
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Base de Cálculo do Índice</Label>
                <Select 
                  value={periodoMedia} 
                  onValueChange={(val: any) => setPeriodoMedia(val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15anos">Média Histórica (15 anos)</SelectItem>
                    <SelectItem value="12meses">Média Recente (12 meses)</SelectItem>
                    <SelectItem value="projecao">Projeção até Entrega</SelectItem>
                  </SelectContent>
                </Select>
                
                {loadingIndices ? (
                  <p className="text-xs text-blue-500 flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Carregando dados do IBGE...
                  </p>
                ) : erroIndices ? (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {erroIndices}
                  </p>
                ) : indicesData ? (
                  <div className="text-xs bg-muted p-2 rounded mt-2">
                    <p><strong>Taxa Aplicada:</strong> {obterTaxaPorPeriodo(periodoMedia, indiceSelecionado, indicesData).toFixed(2)}% a.a.</p>
                    <p className="text-muted-foreground mt-1">
                      Média 15a: {indicesData[indiceSelecionado.toLowerCase() as 'incc'|'ipca']?.media15Anos.toFixed(2)}% | 
                      Média 12m: {indicesData[indiceSelecionado.toLowerCase() as 'incc'|'ipca']?.media12Meses.toFixed(2)}%
                    </p>
                  </div>
                ) : null}
              </div>

            </CardContent>
          </Card>

          {/* Resultados */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Resultado da Simulação
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              {resultadoSimulacao ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center p-4 bg-primary/10 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Entrada (Sinal)</p>
                      <p className="text-xl font-bold text-primary">
                        R$ {resultadoSimulacao.entrada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total nas Obras</p>
                      <p className="text-xl font-bold text-primary">
                        R$ {resultadoSimulacao.totalObras.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  <h4 className="font-semibold mt-4 mb-2">Fluxo de Pagamentos (Obras)</h4>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[100px]">Mês</TableHead>
                          <TableHead>Vencimento</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resultadoSimulacao.parcelasObras.map((p: any, i: number) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{i + 1}ª</TableCell>
                            <TableCell>{new Date(p.vencimento).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell className="text-right">
                              R$ {p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <Alert className="mt-4">
                    <AlertDescription>
                      <p className="font-semibold">Pós-Obra:</p>
                      <p>Saldo Devedor: R$ {resultadoSimulacao.saldoDevedor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        *Valores corrigidos pelo {indiceSelecionado} ({obterTaxaPorPeriodo(periodoMedia, indiceSelecionado, indicesData!).toFixed(2)}% a.a.)
                      </p>
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Preencha os parâmetros para ver a simulação
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
