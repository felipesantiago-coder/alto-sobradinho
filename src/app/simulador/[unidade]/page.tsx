'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ThemeToggleSimple } from '@/components/theme-toggle-simple';
import { getUnidadesByEmpreendimento } from '@/data/static-data';
import { Unidade } from '@/types/unidade';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, TrendingUp, DollarSign, AlertCircle, CheckCircle2, Home } from 'lucide-react';

// Datas de entrega estimadas
const deliveryDates: Record<string, Date> = {
  'alto-da-alvorada': new Date('2027-03-31'),
  'alto-da-aurora': new Date('2026-12-31'),
  'alto-do-horizonte': new Date('2027-06-30'),
};

interface IndiceData {
  avg180: number;
  avg12: number;
  source?: string;
  indicator?: string;
}

interface IndicesResponse {
  incc: IndiceData;
  ipca: IndiceData;
}

interface Parcela {
  vencimento: string;
  valor: number;
  descricao?: string;
}

interface ResultadoSimulacao {
  entrada: number;
  totalObras: number;
  saldoDevedor: number;
  parcelasObras: Parcela[];
}

export default function SimuladorUnidadePage() {
  const params = useParams();
  const router = useRouter();
  const slugParam = params.unidade as string; // Ex: "C-305" ou "alto-da-aurora-C-305"
  
  const [unidade, setUnidade] = useState<Unidade | null>(null);
  const [empreendimentoSlug, setEmpreendimentoSlug] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados do Simulador
  const [valorVenda, setValorVenda] = useState(0);
  const [desconto, setDesconto] = useState(0);
  const [percentualCaptação, setPercentualCaptação] = useState(30);
  const [indiceSelecionado, setIndiceSelecionado] = useState<'INCC' | 'IPCA'>('INCC');
  const [periodoMedia, setPeriodoMedia] = useState<'180m' | '12m' | 'projection'>('12m');
  
  // Dados dos Índices
  const [indicesData, setIndicesData] = useState<IndicesResponse | null>(null);
  const [loadingIndices, setLoadingIndices] = useState(true);
  
  // Resultados
  const [resultadoSimulacao, setResultadoSimulacao] = useState<ResultadoSimulacao | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        if (!slugParam) {
          throw new Error('Nenhuma unidade especificada na URL.');
        }

        // CORREÇÃO: Varredura completa em todos os empreendimentos
        const todosEmpreendimentos = ['alto-da-alvorada', 'alto-da-aurora', 'alto-do-horizonte'];
        let unidadeEncontrada: Unidade | undefined;
        let slugEncontrado = '';

        // Normaliza o termo de busca (remove prefixos se houver)
        const termoBusca = slugParam.toLowerCase().trim();

        for (const slug of todosEmpreendimentos) {
          const unidades = getUnidadesByEmpreendimento(slug);
          
          // Tenta encontrar por correspondência exata do código ou sufixo
          unidadeEncontrada = unidades.find(u => {
            const codigoLimpo = u.unidade?.trim().toLowerCase() || '';
            const codigoFull = `${slug}-${codigoLimpo}`.toLowerCase();
            
            return termoBusca === codigoLimpo || 
                   termoBusca === codigoFull || 
                   termoBusca.endsWith(codigoLimpo) ||
                   u.codigo?.toString() === termoBusca;
          });

          if (unidadeEncontrada) {
            slugEncontrado = slug;
            break;
          }
        }

        if (!unidadeEncontrada) {
          throw new Error(`Unidade "${slugParam}" não encontrada em nenhum empreendimento.`);
        }

        setUnidade(unidadeEncontrada);
        setEmpreendimentoSlug(slugEncontrado);
        setValorVenda(unidadeEncontrada.valorVenda || 0);

        // Carregar Índices da API Local
        await carregarIndices();

      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados.');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [slugParam]);

  // Recalcular simulação
  useEffect(() => {
    if (unidade && indicesData && valorVenda > 0) {
      const valorFinal = valorVenda - desconto;
      
      let taxaMensal = 0;
      const dadosIndice = indiceSelecionado === 'INCC' ? indicesData.incc : indicesData.ipca;

      if (periodoMedia === '180m') taxaMensal = dadosIndice.avg180;
      else if (periodoMedia === '12m') taxaMensal = dadosIndice.avg12;
      else taxaMensal = dadosIndice.avg12; // Projeção

      const dataEntrega = deliveryDates[empreendimentoSlug] || new Date('2027-01-01');

      const resultado = calcularSimulacaoTabelaDireta({
        valorFinal,
        percentualCaptação,
        taxaMensal,
        dataEntrega,
        dataInicio: new Date(),
      });

      setResultadoSimulacao(resultado);
    }
  }, [unidade, empreendimentoSlug, valorVenda, desconto, percentualCaptação, indiceSelecionado, periodoMedia, indicesData]);

  async function carregarIndices() {
    setLoadingIndices(true);
    try {
      const res = await fetch('/api/incc-ipca');
      if (!res.ok) throw new Error('Falha na API de índices');
      const data: IndicesResponse = await res.json();
      setIndicesData(data);
    } catch (err) {
      console.warn('Usando fallback para índices:', err);
      setIndicesData({
        incc: { avg180: 0.46, avg12: 0.51, source: 'Offline', indicator: 'INCC' },
        ipca: { avg180: 0.42, avg12: 0.39, source: 'Offline', indicator: 'IPCA' }
      });
    } finally {
      setLoadingIndices(false);
    }
  }

  function calcularSimulacaoTabelaDireta(args: {
    valorFinal: number;
    percentualCaptação: number;
    taxaMensal: number;
    dataEntrega: Date;
    dataInicio: Date;
  }): ResultadoSimulacao {
    const { valorFinal, percentualCaptação, taxaMensal, dataEntrega, dataInicio } = args;

    const entrada = valorFinal * 0.10;
    const valorTotalCaptação = valorFinal * (percentualCaptação / 100);
    let saldoParaObras = Math.max(0, valorTotalCaptação - entrada);

    const diffTime = Math.abs(dataEntrega.getTime() - dataInicio.getTime());
    const mesesObra = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30)));
    const parcelaBase = saldoParaObras / mesesObra;

    const parcelasObras: Parcela[] = [];
    let saldoDevedorObra = saldoParaObras;
    let dataAtual = new Date(dataInicio);

    for (let i = 0; i < mesesObra; i++) {
      dataAtual.setMonth(dataAtual.getMonth() + 1);
      
      // Aplica correção no saldo
      const correcao = saldoDevedorObra * (taxaMensal / 100);
      saldoDevedorObra += correcao;
      
      // Abate parcela
      saldoDevedorObra -= parcelaBase;
      if (saldoDevedorObra < 0) saldoDevedorObra = 0;

      parcelasObras.push({
        vencimento: dataAtual.toISOString(),
        valor: parcelaBase,
        descricao: `Parcela ${i + 1}/${mesesObra}`
      });
    }

    const totalPagoObras = entrada + parcelasObras.reduce((acc, p) => acc + p.valor, 0);
    
    return {
      entrada,
      totalObras: totalPagoObras,
      saldoDevedor: Math.max(0, valorFinal - totalPagoObras),
      parcelasObras
    };
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando dados da unidade...</p>
        </div>
      </div>
    );
  }

  if (error || !unidade) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md border-destructive shadow-lg">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Erro ao carregar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-6 text-sm">{error || 'Unidade não encontrada.'}</p>
            <Button asChild className="w-full">
              <Link href="/empreendimentos">Voltar aos Empreendimentos</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const valorFinal = valorVenda - desconto;
  const dadosIndiceAtuais = indiceSelecionado === 'INCC' ? indicesData?.incc : indicesData?.ipca;

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/20">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/empreendimentos" className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
              ← Voltar
            </Link>
            <div className="h-6 w-px bg-border hidden sm:block"></div>
            <h1 className="text-lg font-bold truncate text-foreground">
              {unidade.bloco} • {unidade.unidade}
            </h1>
          </div>
          <ThemeToggleSimple />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        
        {/* Card de Identificação da Unidade */}
        <Card className="border-l-4 border-l-primary shadow-md">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Home className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Unidade {unidade.unidade}</h2>
                  <p className="text-sm text-muted-foreground">Bloco {unidade.bloco} • {unidade.areaUtil} m² úteis</p>
                </div>
              </div>
              <div className="text-left md:text-right">
                <p className="text-sm text-muted-foreground">Valor de Tabela</p>
                <p className="text-2xl font-bold text-primary">R$ {valorVenda.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Controles */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Parâmetros da Simulação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                
                <div className="space-y-2">
                  <Label htmlFor="desconto">Desconto sobre o valor (R$)</Label>
                  <Input
                    id="desconto"
                    type="number"
                    value={desconto}
                    onChange={(e) => setDesconto(Number(e.target.value))}
                    placeholder="0"
                    className="font-mono text-right"
                  />
                  <div className="flex justify-between text-xs px-1">
                    <span className="text-muted-foreground">Valor Final:</span>
                    <span className="font-bold text-foreground">R$ {valorFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="captacao">Captação durante a obra (%)</Label>
                  <Select 
                    value={percentualCaptação.toString()} 
                    onValueChange={(val) => setPercentualCaptação(Number(val))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25% (Padrão)</SelectItem>
                      <SelectItem value="30">30%</SelectItem>
                      <SelectItem value="40">40%</SelectItem>
                      <SelectItem value="50">50%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Índice de Correção Monetária</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={indiceSelecionado === 'INCC' ? 'default' : 'outline'}
                      onClick={() => setIndiceSelecionado('INCC')}
                      className={indiceSelecionado === 'INCC' ? 'bg-primary hover:bg-primary/90' : ''}
                    >
                      INCC
                    </Button>
                    <Button
                      variant={indiceSelecionado === 'IPCA' ? 'default' : 'outline'}
                      onClick={() => setIndiceSelecionado('IPCA')}
                      className={indiceSelecionado === 'IPCA' ? 'bg-primary hover:bg-primary/90' : ''}
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
                      <SelectItem value="180m">
                        Média 180 Meses {dadosIndiceAtuais && <span className="text-muted-foreground ml-1">({dadosIndiceAtuais.avg180.toFixed(3)}% a.m.)</span>}
                      </SelectItem>
                      <SelectItem value="12m">
                        Média 12 Meses {dadosIndiceAtuais && <span className="text-muted-foreground ml-1">({dadosIndiceAtuais.avg12.toFixed(3)}% a.m.)</span>}
                      </SelectItem>
                      <SelectItem value="projection">Projeção Futura (Tendência)</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {loadingIndices ? (
                    <div className="text-xs text-blue-500 flex items-center gap-2 mt-2 bg-blue-50 p-2 rounded">
                      <Loader2 className="h-3 w-3 animate-spin" /> Buscando índices oficiais...
                    </div>
                  ) : dadosIndiceAtuais ? (
                    <div className="text-xs bg-muted/50 p-3 rounded-md border mt-2 space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Fonte dos Dados:</span>
                        <span className="font-medium text-foreground truncate max-w-[150px]" title={dadosIndiceAtuais.source}>{dadosIndiceAtuais.source}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Indicador:</span>
                        <span className="font-medium text-foreground">{dadosIndiceAtuais.indicator}</span>
                      </div>
                      <div className="pt-2 border-t mt-2 flex justify-between items-center">
                        <span className="font-semibold">Taxa Aplicada:</span>
                        <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {periodoMedia === '180m' ? dadosIndiceAtuais.avg180 : dadosIndiceAtuais.avg12}% a.m.
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Resultados */}
          <div className="lg:col-span-7">
            <Card className="h-full flex flex-col shadow-lg border-primary/20 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent border-b border-primary/10">
                <CardTitle className="flex items-center gap-2 text-primary">
                  <TrendingUp className="h-5 w-5" />
                  Resultado da Simulação
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto p-6 space-y-6">
                {resultadoSimulacao ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-5 bg-green-50 dark:bg-green-950/20 rounded-xl border border-green-200 dark:border-green-900 shadow-sm">
                        <p className="text-sm text-green-800 dark:text-green-200 font-medium mb-1 flex items-center gap-2">
                          <DollarSign className="h-4 w-4" /> Entrada (Sinal)
                        </p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                          R$ {resultadoSimulacao.entrada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="p-5 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-900 shadow-sm">
                        <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-1 flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" /> Total nas Obras
                        </p>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                          R$ {resultadoSimulacao.totalObras.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-lg text-foreground">Fluxo de Pagamentos (Obras)</h4>
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded-full font-medium">
                          {resultadoSimulacao.parcelasObras.length}x
                        </span>
                      </div>
                      
                      <div className="border rounded-lg overflow-hidden shadow-sm">
                        <div className="max-h-[400px] overflow-y-auto bg-white dark:bg-slate-950">
                          <Table>
                            <TableHeader className="bg-muted/50 sticky top-0 z-10">
                              <TableRow>
                                <TableHead className="w-[70px] text-center font-bold">#</TableHead>
                                <TableHead className="font-bold">Vencimento</TableHead>
                                <TableHead className="text-right font-bold">Valor</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {resultadoSimulacao.parcelasObras.map((p, i) => (
                                <TableRow key={i} className="hover:bg-muted/30 transition-colors">
                                  <TableCell className="font-medium text-center text-muted-foreground text-sm">{i + 1}ª</TableCell>
                                  <TableCell className="text-sm">{new Date(p.vencimento).toLocaleDateString('pt-BR')}</TableCell>
                                  <TableCell className="text-right font-mono text-sm font-semibold text-foreground">
                                    R$ {p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>
                    
                    <Alert className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 mt-4">
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                      <AlertDescription className="ml-3 space-y-1">
                        <p className="font-semibold text-foreground">Pós-Obra (Financiamento Bancário):</p>
                        <p className="text-xl font-bold text-primary">
                          Saldo Devedor: R$ {resultadoSimulacao.saldoDevedor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-muted-foreground pt-1">
                          *Simulação baseada no índice <strong>{indiceSelecionado}</strong> ({periodoMedia === '180m' ? dadosIndiceAtuais?.avg180 : dadosIndiceAtuais?.avg12}% a.m.). Valores sujeitos a alteração contratual.
                        </p>
                      </AlertDescription>
                    </Alert>
                  </>
                ) : (
                  <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-muted-foreground space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
                    <p>Calculando condições personalizadas...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
