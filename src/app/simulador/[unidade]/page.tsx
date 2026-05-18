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

// Datas de entrega
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

// Formatador de Moeda
const formatCurrency = (value: number) => 
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

export default function SimuladorUnidadePage() {
  const params = useParams();
  const router = useRouter();
  const slugParam = params.unidade as string; // Ex: "C-305" ou "alto-da-aurora-C-305"
  
  const [unidade, setUnidade] = useState<Unidade | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados
  const [valorVenda, setValorVenda] = useState(0);
  const [desconto, setDesconto] = useState(0);
  const [percentualCaptação, setPercentualCaptação] = useState(30);
  const [indiceSelecionado, setIndiceSelecionado] = useState<'INCC' | 'IPCA'>('INCC');
  const [periodoMedia, setPeriodoMedia] = useState<'180m' | '12m' | 'projection'>('12m');
  
  const [indicesData, setIndicesData] = useState<IndicesResponse | null>(null);
  const [loadingIndices, setLoadingIndices] = useState(true);
  const [resultadoSimulacao, setResultadoSimulacao] = useState<ResultadoSimulacao | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        if (!slugParam) throw new Error('Unidade não especificada.');

        // Lógica de Busca Robusta: Procura em TODOS os empreendimentos
        let unidadeEncontrada: Unidade | undefined;
        const todosEmpreendimentos = [
          getUnidadesByEmpreendimento('alto-da-alvorada'),
          getUnidadesByEmpreendimento('alto-da-aurora'),
          getUnidadesByEmpreendimento('alto-do-horizonte')
        ];

        // Limpa o slug para pegar apenas o código provável (remove prefixos conhecidos)
        const codigoLimpo = slugParam
          .replace(/alto-da-alvorada[- ]?/i, '')
          .replace(/alto-da-aurora[- ]?/i, '')
          .replace(/alto-do-horizonte[- ]?/i, '')
          .trim();

        for (const lista of todosEmpreendimentos) {
          unidadeEncontrada = lista.find(u => 
            u.unidade?.trim().toLowerCase() === codigoLimpo.toLowerCase() || 
            u.unidade?.trim().toLowerCase() === slugParam.toLowerCase() ||
            String(u.codigo) === codigoLimpo
          );
          if (unidadeEncontrada) break;
        }

        if (!unidadeEncontrada) {
          throw new Error(`Unidade "${slugParam}" não encontrada em nenhum empreendimento.`);
        }

        setUnidade(unidadeEncontrada);
        setValorVenda(unidadeEncontrada.valorVenda || 0);

        // Carregar Índices
        const res = await fetch('/api/incc-ipca');
        if (res.ok) {
          const data = await res.json();
          setIndicesData(data);
        } else {
          throw new Error('Falha ao carregar índices econômicos.');
        }

      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido.');
        // Fallback manual de índices se a API falhar
        setIndicesData({
          incc: { avg180: 0.45, avg12: 0.50, source: 'Fallback', indicator: 'INCC' },
          ipca: { avg180: 0.40, avg12: 0.38, source: 'Fallback', indicator: 'IPCA' }
        });
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
      const dadosIndice = indiceSelecionado === 'INCC' ? indicesData.incc : indicesData.ipca;
      
      let taxaMensal = periodoMedia === '180m' ? dadosIndice.avg180 : dadosIndice.avg12;
      if (periodoMedia === 'projection') taxaMensal = dadosIndice.avg12;

      // Descobrir data de entrega baseada na lista onde a unidade foi encontrada
      let dataEntrega = deliveryDates['alto-da-alvorada']; // Default
      if (getUnidadesByEmpreendimento('alto-da-aurora').includes(unidade)) dataEntrega = deliveryDates['alto-da-aurora'];
      else if (getUnidadesByEmpreendimento('alto-do-horizonte').includes(unidade)) dataEntrega = deliveryDates['alto-do-horizonte'];

      const resultado = calcularSimulacao({
        valorFinal,
        percentualCaptação,
        taxaMensal,
        dataEntrega,
        dataInicio: new Date(),
      });
      setResultadoSimulacao(resultado);
    }
  }, [unidade, valorVenda, desconto, percentualCaptação, indiceSelecionado, periodoMedia, indicesData]);

  function calcularSimulacao(args: {
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
      const correcao = saldoDevedorObra * (taxaMensal / 100);
      saldoDevedorObra += correcao;
      saldoDevedorObra -= parcelaBase;
      if (saldoDevedorObra < 0) saldoDevedorObra = 0;

      parcelasObras.push({
        vencimento: dataAtual.toISOString(),
        valor: parcelaBase,
        descricao: `${i + 1}ª`
      });
    }

    const totalPago = entrada + parcelasObras.reduce((acc, p) => acc + p.valor, 0);
    return {
      entrada,
      totalObras: totalPago,
      saldoDevedor: Math.max(0, valorFinal - totalPago),
      parcelasObras
    };
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !unidade) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader><CardTitle className="text-red-600">Erro</CardTitle></CardHeader>
          <CardContent>
            <p className="mb-4">{error}</p>
            <Button asChild><Link href="/empreendimentos">Voltar</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const valorFinal = valorVenda - desconto;
  const dadosAtuais = indiceSelecionado === 'INCC' ? indicesData?.incc : indicesData?.ipca;
  const taxaAplicada = periodoMedia === '180m' ? dadosAtuais?.avg180 : dadosAtuais?.avg12;

  return (
    <div className="min-h-screen bg-background font-sans">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Link corrigido para não levar a 404 */}
            <Link href="/empreendimentos" className="text-sm font-medium hover:text-primary flex items-center gap-1">
              ← Voltar
            </Link>
            <div className="h-6 w-px bg-border mx-2 hidden sm:block" />
            <h1 className="text-lg font-bold truncate">
              {unidade.bloco} • {unidade.unidade}
            </h1>
          </div>
          <ThemeToggleSimple />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        
        {/* Card de Resumo com Formatação Correta */}
        <Card className="bg-gradient-to-r from-primary/5 to-transparent border-l-4 border-l-primary">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Valor de Tabela</p>
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(valorVenda)}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <span className="block text-muted-foreground">Área</span>
                  <span className="font-semibold">{unidade.areaUtil} m²</span>
                </div>
                <div>
                  <span className="block text-muted-foreground">Quartos</span>
                  <span className="font-semibold">{unidade.quartos}</span>
                </div>
                <div>
                  <span className="block text-muted-foreground">Banheiros</span>
                  <span className="font-semibold">{unidade.banheiros}</span>
                </div>
                <div>
                  <span className="block text-muted-foreground">Vagas</span>
                  <span className="font-semibold">{unidade.vagas || '-'}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Controles */}
          <div className="lg:col-span-5 space-y-6">
            <Card>
              <CardHeader><CardTitle>Simulação</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                
                <div className="space-y-2">
                  {/* htmlFor corrigido para bater com o id "desconto" */}
                  <Label htmlFor="desconto">Desconto (R$)</Label>
                  <Input
                    id="desconto"
                    type="number"
                    value={desconto}
                    onChange={(e) => setDesconto(Number(e.target.value))}
                    className="font-mono"
                  />
                  <p className="text-xs text-right text-muted-foreground">
                    Final: <strong>{formatCurrency(valorFinal)}</strong>
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="captacao">Captação na Obra (%)</Label>
                  <Select value={String(percentualCaptação)} onValueChange={(v) => setPercentualCaptação(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25%</SelectItem>
                      <SelectItem value="30">30%</SelectItem>
                      <SelectItem value="40">40%</SelectItem>
                      <SelectItem value="50">50%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Índice</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant={indiceSelecionado === 'INCC' ? 'default' : 'outline'} onClick={() => setIndiceSelecionado('INCC')}>INCC</Button>
                    <Button variant={indiceSelecionado === 'IPCA' ? 'default' : 'outline'} onClick={() => setIndiceSelecionado('IPCA')}>IPCA</Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="periodo">Período de Referência</Label>
                  <Select value={periodoMedia} onValueChange={(v: any) => setPeriodoMedia(v)}>
                    <SelectTrigger id="periodo"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="180m">Média 180 Meses ({dadosAtuais?.avg180.toFixed(3)}% a.m.)</SelectItem>
                      <SelectItem value="12m">Média 12 Meses ({dadosAtuais?.avg12.toFixed(3)}% a.m.)</SelectItem>
                      <SelectItem value="projection">Projeção Futura</SelectItem>
                    </SelectContent>
                  </Select>
                  {dadosAtuais && (
                    <div className="text-xs bg-muted p-2 rounded mt-2">
                      <p className="font-semibold">Fonte: {dadosAtuais.source}</p>
                      <p>Indicador: {dadosAtuais.indicator}</p>
                      <p className="text-primary font-bold mt-1">Taxa: {taxaAplicada?.toFixed(3)}% a.m.</p>
                    </div>
                  )}
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Resultados */}
          <div className="lg:col-span-7">
            <Card className="h-full border-primary/20 shadow-lg">
              <CardHeader className="bg-primary/5 border-b border-primary/10">
                <CardTitle className="flex items-center gap-2 text-primary">
                  <TrendingUp className="h-5 w-5" /> Resultado
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {resultadoSimulacao ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200">
                        <p className="text-sm text-green-800 dark:text-green-200 font-medium">Entrada (Sinal)</p>
                        <p className="text-2xl font-bold text-green-700">{formatCurrency(resultadoSimulacao.entrada)}</p>
                      </div>
                      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800 dark:text-blue-200 font-medium">Total nas Obras</p>
                        <p className="text-2xl font-bold text-blue-700">{formatCurrency(resultadoSimulacao.totalObras)}</p>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3 flex justify-between">
                        <span>Parcelas na Obra</span>
                        <span className="text-xs bg-muted px-2 py-1 rounded-full self-center">{resultadoSimulacao.parcelasObras.length}x</span>
                      </h4>
                      <div className="border rounded-lg max-h-[350px] overflow-y-auto">
                        <Table>
                          <TableHeader className="sticky top-0 bg-muted/50">
                            <TableRow>
                              <TableHead className="w-16 text-center">#</TableHead>
                              <TableHead>Vencimento</TableHead>
                              <TableHead className="text-right">Valor</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {resultadoSimulacao.parcelasObras.map((p, i) => (
                              <TableRow key={i}>
                                <TableCell className="text-center text-muted-foreground">{i + 1}ª</TableCell>
                                <TableCell>{new Date(p.vencimento).toLocaleDateString('pt-BR')}</TableCell>
                                <TableCell className="text-right font-mono">{formatCurrency(p.valor)}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                    
                    <Alert>
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <AlertDescription className="ml-2">
                        <p className="font-semibold">Saldo para Financiamento:</p>
                        <p className="text-xl font-bold text-primary">{formatCurrency(resultadoSimulacao.saldoDevedor)}</p>
                      </AlertDescription>
                    </Alert>
                  </>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <Loader2 className="animate-spin mr-2" /> Calculando...
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
