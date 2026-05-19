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
import { Switch } from '@/components/ui/switch'; // Assuming it exists, otherwise use checkbox
import { Loader2, TrendingUp, DollarSign, AlertCircle, CheckCircle2, Calendar, Info } from 'lucide-react';

// --- DELIVERY DATE CONFIGURATION UPDATED ---
const deliveryDates: Record<string, Date> = {
  'alto-da-alvorada': new Date('2027-03-31'),
  'alto-da-aurora': new Date('2029-02-28'),
  'alto-do-horizonte': new Date('2026-07-31'),
};

interface IndiceData {
  avg180: number;
  avg12: number;
  source: string;
  indicator: string;
  isFallback: boolean;
}

interface IndicesResponse {
  incc: IndiceData;
  ipca: IndiceData;
}

interface Parcela {
  id: string;
  tipo: 'mensal' | 'extra-semestral' | 'extra-anual';
  vencimento: string;
  valorBase: number; // Original value provided by user (for reference)
  valorCorrigido: number; // Value with monetary correction applied
  descricao: string;
}

interface ResultadoSimulacao {
  entrada: number;
  totalObras: number;
  saldoDevedor: number;
  parcelas: Parcela[];
}

export default function SimuladorUnidadePage() {
  const params = useParams();
  const router = useRouter();
  const slugParam = params.unidade as string;
  
  const [unidade, setUnidade] = useState<Unidade | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Simulator States
  const [valorVenda, setValorVenda] = useState(0);
  const [desconto, setDesconto] = useState(0);
  const [percentualCaptação, setPercentualCaptação] = useState(30); // Default 30%
  
  // Index Selection
  const [indiceSelecionado, setIndiceSelecionado] = useState<'INCC' | 'IPCA'>('INCC');
  const [periodoMedia, setPeriodoMedia] = useState<'180m' | '12m'>('12m');
  
  // Index Data
  const [indicesData, setIndicesData] = useState<IndicesResponse | null>(null);
  const [loadingIndices, setLoadingIndices] = useState(true);
  
  // Extra Payments Configuration
  const [habilitarParcelasExtras, setHabilitarParcelasExtras] = useState(false);
  const [tipoParcelaExtra, setTipoParcelaExtra] = useState<'semestral' | 'anual'>('semestral');
  const [valorBaseParcelaExtra, setValorBaseParcelaExtra] = useState<number>(0);
  const [dataBaseParcelaExtra, setDataBaseParcelaExtra] = useState<string>('');
  
  // Monthly Customization
  const [valorPrimeiraMensal, setValorPrimeiraMensal] = useState<number | ''>('');

  // Results
  const [resultadoSimulacao, setResultadoSimulacao] = useState<ResultadoSimulacao | null>(null);
  const [temEspacoSemestral, setTemEspacoSemestral] = useState(false);
  const [temEspacoAnual, setTemEspacoAnual] = useState(false);

  // Load Initial Data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        if (!slugParam) throw new Error('Unidade não especificada.');

        // Find Unit
        let unidadeEncontrada: Unidade | undefined;
        const slugsConhecidos = ['alto-da-alvorada', 'alto-da-aurora', 'alto-do-horizonte'];
        const slugLower = slugParam.toLowerCase();
        
        const slugDetectado = slugsConhecidos.find(s => slugLower.startsWith(s));
        
        if (slugDetectado) {
          const codigoParte = slugParam.substring(slugDetectado.length).replace(/^[- ]+/, '');
          const unidades = getUnidadesByEmpreendimento(slugDetectado);
          unidadeEncontrada = unidades.find(u => 
            u.unidade?.trim().toLowerCase() === codigoParte.trim().toLowerCase() || 
            u.codigo?.toString() === codigoParte.trim()
          );
        } else {
          for (const slug of slugsConhecidos) {
            const unidades = getUnidadesByEmpreendimento(slug);
            unidadeEncontrada = unidades.find(u => u.unidade?.trim().toLowerCase() === slugParam.trim().toLowerCase());
            if (unidadeEncontrada) break;
          }
        }

        if (!unidadeEncontrada) throw new Error(`Unidade "${slugParam}" não encontrada.`);

        setUnidade(unidadeEncontrada);
        setValorVenda(unidadeEncontrada.valorVenda || 0);

        // Set base date for extra payment (today + 6 or 12 months)
        const hoje = new Date();
        const dataSemestral = new Date(hoje.setMonth(hoje.getMonth() + 6));
        const dataAnual = new Date(hoje.setMonth(hoje.getMonth() + 12)); // Be careful with month mutation, re-calculate if needed
        
        // Simple date reset
        const hojeReset = new Date();
        const dSemestral = new Date(hojeReset.getFullYear(), hojeReset.getMonth() + 6, hojeReset.getDate());
        const dAnual = new Date(hojeReset.getFullYear(), hojeReset.getMonth() + 12, hojeReset.getDate());

        setDataBaseParcelaExtra(dSemestral.toISOString().split('T')[0]);
        setValorBaseParcelaExtra(0);

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

  // Check space for extra payments and recalculate
  useEffect(() => {
    if (!unidade || !indicesData) return;

    // Determine delivery date
    let dataEntrega = new Date('2027-01-01');
    if (getUnidadesByEmpreendimento('alto-da-aurora').includes(unidade)) dataEntrega = deliveryDates['alto-da-aurora'];
    else if (getUnidadesByEmpreendimento('alto-da-alvorada').includes(unidade)) dataEntrega = deliveryDates['alto-da-alvorada'];
    else if (getUnidadesByEmpreendimento('alto-do-horizonte').includes(unidade)) dataEntrega = deliveryDates['alto-do-horizonte'];

    const hoje = new Date();
    const limiteSemestral = new Date(dataEntrega);
    limiteSemestral.setMonth(limiteSemestral.getMonth() - 3); // 3 months before delivery

    const limiteAnual = new Date(dataEntrega);
    limiteAnual.setMonth(limiteAnual.getMonth() - 3);

    // Checks if at least one semi-annual installment fits (6 months from today)
    const dataPrimeiraSemestral = new Date(hoje);
    dataPrimeiraSemestral.setMonth(dataPrimeiraSemestral.getMonth() + 6);
    
    // Checks if at least one annual installment fits (12 months from today)
    const dataPrimeiraAnual = new Date(hoje);
    dataPrimeiraAnual.setMonth(dataPrimeiraAnual.getMonth() + 12);

    setTemEspacoSemestral(dataPrimeiraSemestral <= limiteSemestral);
    setTemEspacoAnual(dataPrimeiraAnual <= limiteAnual);

    // If there's no space for the selected type, disable it
    if (habilitarParcelasExtras) {
      if (tipoParcelaExtra === 'semestral' && !temEspacoSemestral) {
        setHabilitarParcelasExtras(false);
      } else if (tipoParcelaExtra === 'anual' && !temEspacoAnual) {
        setHabilitarParcelasExtras(false);
      }
    }

    // Recalculate simulation whenever dependencies change
    calcularSimulacao(dataEntrega);

  }, [unidade, valorVenda, desconto, percentualCaptação, indiceSelecionado, periodoMedia, indicesData, habilitarParcelasExtras, tipoParcelaExtra, valorBaseParcelaExtra, dataBaseParcelaExtra, valorPrimeiraMensal]);

  async function carregarIndices() {
    setLoadingIndices(true);
    try {
      const res = await fetch('/api/incc-ipca');
      if (!res.ok) throw new Error('Falha na API');
      const data: IndicesResponse = await res.json();
      
      // Additional sanity check on frontend to avoid visual bugs
      const sanitize = (v: number) => (v > 0.05 && v < 2.0) ? v : 0.45; // Between 0.05% and 2.0%

      const safeData = {
        incc: { ...data.incc, avg12: sanitize(data.incc.avg12), avg180: sanitize(data.incc.avg180) },
        ipca: { ...data.ipca, avg12: sanitize(data.ipca.avg12), avg180: sanitize(data.ipca.avg180) }
      };

      setIndicesData(safeData);
    } catch (err) {
      console.warn('Fallback de índices ativado.', err);
      setIndicesData({
        incc: { avg180: 0.48, avg12: 0.46, source: 'Estimativa Histórica', indicator: 'INCC', isFallback: true },
        ipca: { avg180: 0.42, avg12: 0.39, source: 'Estimativa Histórica', indicator: 'IPCA', isFallback: true }
      });
    } finally {
      setLoadingIndices(false);
    }
  }

  function calcularSimulacao(dataEntrega: Date) {
    if (!indicesData || valorVenda === 0) return;

    const valorFinal = valorVenda - desconto;
    const dadosIndice = indiceSelecionado === 'INCC' ? indicesData.incc : indicesData.ipca;
    const taxaMensalPct = periodoMedia === '12m' ? dadosIndice.avg12 : dadosIndice.avg180;
    const taxaMensalDecimal = taxaMensalPct / 100;

    // 1. Entry (10%)
    const entrada = valorFinal * 0.10;

    // 2. Total Capture
    const totalCaptação = valorFinal * (percentualCaptação / 100);
    let saldoParaObras = totalCaptação - entrada;
    if (saldoParaObras < 0) saldoParaObras = 0;

    // 3. Term in Months
    const hoje = new Date();
    // Fine adjustment to account for full days
    const diffTime = dataEntrega.getTime() - hoje.getTime();
    const mesesTotais = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30)); 
    const mesesValidos = Math.max(1, mesesTotais);

    const parcelas: Parcela[] = [];
    let saldoDevedorAtual = saldoParaObras;
    
    // Base values for calculation
    const valorMensalPadrao = saldoParaObras / mesesValidos;
    const primeiraMensalDefinida = typeof valorPrimeiraMensal === 'number' && valorPrimeiraMensal > 0 ? valorPrimeiraMensal : valorMensalPadrao;
    
    // Adjust initial balance if first installment is different
    // Simplified logic: The total balance to cover is fixed. If the first is higher, the others decrease proportionally or the correction flow is maintained.
    // Chosen approach: The first installment has the defined value. The remaining balance is divided among the remaining months + correction.
    let saldoRestanteParaDivisao = saldoParaObras - primeiraMensalDefinida;
    if (saldoRestanteParaDivisao < 0) saldoRestanteParaDivisao = 0;
    
    const mesesRestantes = mesesValidos - 1;
    const valorMensalRestante = mesesRestantes > 0 ? saldoRestanteParaDivisao / mesesRestantes : 0;

    // Generate monthly installments
    const dataAtual = new Date(hoje);
    for (let i = 0; i < mesesValidos; i++) {
        const dataVencimento = new Date(dataAtual);
        dataVencimento.setDate(10); // Fixed due date

        // Ensure payment doesn't exceed delivery date
        if (dataVencimento > dataEntrega) {
            break;
        }

        const valorOriginal = i === 0 ? primeiraMensalDefinida : valorMensalRestante;
        const mesesDecorridos = i;
        const fatorCorrecao = Math.pow(1 + taxaMensalDecimal, mesesDecorridos);
        const valorCorrigido = valorOriginal * fatorCorrecao;

        // Stop adding payments if we reach the delivery date
        if (dataVencimento >= dataEntrega) {
            break;
        }

        parcelas.push({
            id: `mensal-${i}`,
            tipo: 'mensal',
            vencimento: dataVencimento.toISOString().split('T')[0],
            valorBase: valorOriginal,
            valorCorrigido: parseFloat(valorCorrigido.toFixed(2)),
            descricao: `Mensal ${i + 1}/${mesesValidos}`
        });

        dataAtual.setMonth(dataAtual.getMonth() + 1);
    }

    // Add extra payments if enabled and possible
    if (habilitarParcelasExtras) {
        const dataBase = new Date(dataBaseParcelaExtra);
        const hoje = new Date();

        // Ensure base date is not before today
        if (dataBase < hoje) {
            dataBase.setTime(hoje.getTime());
        }

        let dataProximaExtra = new Date(dataBase);
        if (tipoParcelaExtra === 'semestral') {
            dataProximaExtra.setMonth(dataProximaExtra.getMonth() + 6);
        } else if (tipoParcelaExtra === 'anual') {
            dataProximaExtra.setFullYear(dataProximaExtra.getFullYear() + 1);
        }

        while (dataProximaExtra < dataEntrega) {
            // Calculate correction factor from base date to due date
            const diffMonths = (dataProximaExtra.getFullYear() - dataBase.getFullYear()) * 12 + (dataProximaExtra.getMonth() - dataBase.getMonth());
            const fatorCorrecaoExtra = Math.pow(1 + taxaMensalDecimal, diffMonths);
            const valorCorrigidoExtra = valorBaseParcelaExtra * fatorCorrecaoExtra;

            // Ensure payment doesn't occur within 3 months of delivery
            const limiteMinimo = new Date(dataEntrega);
            limiteMinimo.setMonth(limiteMinimo.getMonth() - 3);
            if (dataProximaExtra >= limiteMinimo) {
                break; // Stop if this installment would be too close to delivery
            }

            parcelas.push({
                id: `extra-${dataProximaExtra.getTime()}`,
                tipo: `extra-${tipoParcelaExtra}` as 'extra-semestral' | 'extra-anual',
                vencimento: dataProximaExtra.toISOString().split('T')[0],
                valorBase: valorBaseParcelaExtra,
                valorCorrigido: parseFloat(valorCorrigidoExtra.toFixed(2)),
                descricao: `${tipoParcelaExtra === 'semestral' ? 'Semestral' : 'Anual'} Extra`
            });

            // Schedule next installment
            if (tipoParcelaExtra === 'semestral') {
                dataProximaExtra.setMonth(dataProximaExtra.getMonth() + 6);
            } else if (tipoParcelaExtra === 'anual') {
                dataProximaExtra.setFullYear(dataProximaExtra.getFullYear() + 1);
            }
        }
    }

    // Sort all installments by due date
    parcelas.sort((a, b) => new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime());

    const resultado: ResultadoSimulacao = {
      entrada: parseFloat(entrada.toFixed(2)),
      totalObras: parseFloat(totalCaptação.toFixed(2)),
      saldoDevedor: parseFloat(saldoDevedorAtual.toFixed(2)),
      parcelas: parcelas
    };

    setResultadoSimulacao(resultado);
  }


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        <Button onClick={() => router.back()} className="mt-4">Voltar</Button>
      </div>
    );
  }

  if (!unidade) {
    return <div>Unidade não encontrada.</div>;
  }

  const dadosIndiceAtivo = indicesData ? (indiceSelecionado === 'INCC' ? indicesData.incc : indicesData.ipca) : null;
  const fonteDados = dadosIndiceAtivo?.isFallback ? "Estimados (Fallback)" : "Oficiais (Bacen)";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg">
            <TrendingUp className="h-6 w-6" />
            <span>Simulador de Captação</span>
          </Link>
          <ThemeToggleSimple />
        </div>
      </header>

      <main className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <Button variant="outline" onClick={() => router.back()}>
            &larr; Voltar
          </Button>
        </div>

        <Card className="max-w-4xl mx-auto mb-8">
          <CardHeader>
            <CardTitle>Simulador para {unidade.unidade || `Unidade ${unidade.codigo}`}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <Label htmlFor="valorVenda">Valor de Venda (R$)</Label>
                <Input
                  id="valorVenda"
                  type="number"
                  value={valorVenda}
                  onChange={(e) => setValorVenda(Number(e.target.value))}
                  disabled={loadingIndices}
                />
              </div>
              <div>
                <Label htmlFor="desconto">Desconto (R$)</Label>
                <Input
                  id="desconto"
                  type="number"
                  value={desconto}
                  onChange={(e) => setDesconto(Number(e.target.value))}
                  disabled={loadingIndices}
                />
              </div>
              <div>
                <Label htmlFor="percentualCaptação">Percentual de Captação</Label>
                <Select value={percentualCaptação.toString()} onValueChange={(v) => setPercentualCaptação(Number(v))} disabled={loadingIndices}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25%</SelectItem>
                    <SelectItem value="30">30%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="indiceSelecionado">Índice de Correção</Label>
                <Select value={indiceSelecionado} onValueChange={(v) => setIndiceSelecionado(v as 'INCC' | 'IPCA')} disabled={loadingIndices}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="INCC">INCC</SelectItem>
                    <SelectItem value="IPCA">IPCA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="periodoMedia">Período da Média</Label>
                <Select value={periodoMedia} onValueChange={(v) => setPeriodoMedia(v as '12m' | '180m')} disabled={loadingIndices}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12m">Últimos 12 meses</SelectItem>
                    <SelectItem value="180m">Últimos 180 meses</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="fonteDados">Fonte dos Dados</Label>
                <Input
                  id="fonteDados"
                  type="text"
                  value={fonteDados}
                  readOnly
                  className="cursor-not-allowed bg-muted"
                />
              </div>
              <div>
                 <Label htmlFor="valorPrimeiraMensal">Valor Primeira Mensal (R$, opcional)</Label>
                 <Input
                   id="valorPrimeiraMensal"
                   type="number"
                   value={valorPrimeiraMensal === '' ? '' : valorPrimeiraMensal}
                   onChange={(e) => setValorPrimeiraMensal(e.target.value === '' ? '' : Number(e.target.value))}
                   disabled={loadingIndices}
                 />
               </div>
            </div>

            {/* Extra Payments Section */}
            <div className="mb-6 p-4 border rounded-md bg-accent/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <DollarSign className="h-5 w-5" /> Parcelas Extras Inteligentes
                </h3>
                <Switch
                  id="habilitarParcelasExtras"
                  checked={habilitarParcelasExtras}
                  onCheckedChange={(checked) => {
                      if (checked) {
                          // Only allow enabling if there's space for the currently selected type
                          if ((tipoParcelaExtra === 'semestral' && temEspacoSemestral) ||
                              (tipoParcelaExtra === 'anual' && temEspacoAnual)) {
                             setHabilitarParcelasExtras(checked);
                          }
                      } else {
                          setHabilitarParcelasExtras(checked);
                      }
                  }}
                  disabled={(!temEspacoSemestral && tipoParcelaExtra === 'semestral') || (!temEspacoAnual && tipoParcelaExtra === 'anual')}
                />
              </div>
              
              {habilitarParcelasExtras && (
                <div className="space-y-4 pl-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="tipoParcelaExtra">Tipo de Parcela</Label>
                      <Select value={tipoParcelaExtra} onValueChange={(v) => setTipoParcelaExtra(v as 'semestral' | 'anual')}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="semestral" disabled={!temEspacoSemestral}>Semestral</SelectItem>
                          <SelectItem value="anual" disabled={!temEspacoAnual}>Anual</SelectItem>
                        </SelectContent>
                      </Select>
                      {!temEspacoSemestral && tipoParcelaExtra === 'semestral' && (
                        <p className="text-xs text-muted-foreground mt-1">Não disponível: muito próximo da data de entrega.</p>
                      )}
                      {!temEspacoAnual && tipoParcelaExtra === 'anual' && (
                        <p className="text-xs text-muted-foreground mt-1">Não disponível: muito próximo da data de entrega.</p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="dataBaseParcelaExtra">Data Base para Correção</Label>
                      <Input
                        id="dataBaseParcelaExtra"
                        type="date"
                        value={dataBaseParcelaExtra}
                        onChange={(e) => setDataBaseParcelaExtra(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="valorBaseParcelaExtra">Valor Base (R$)</Label>
                      <Input
                        id="valorBaseParcelaExtra"
                        type="number"
                        value={valorBaseParcelaExtra}
                        onChange={(e) => setValorBaseParcelaExtra(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      As parcelas extras serão corrigidas monetariamente desde a data base escolhida até suas datas de vencimento,
                      usando o índice selecionado. Elas nunca vencerão a menos de 3 meses da data de entrega das chaves.
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              {(!temEspacoSemestral && !temEspacoAnual) && (
                 <p className="text-sm text-muted-foreground pl-6">Não é possível adicionar parcelas extras: a data de entrega está muito próxima.</p>
              )}
            </div>

            {loadingIndices && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Carregando dados econômicos...</span>
              </div>
            )}

            {dadosIndiceAtivo && !loadingIndices && (
              <Alert className="mb-6">
                <TrendingUp className="h-4 w-4" />
                <AlertDescription>
                  Usando {dadosIndiceAtivo.indicator} - Média {periodoMedia === '12m' ? 'últimos 12 meses' : 'últimos 180 meses'}: ~{(periodoMedia === '12m' ? dadosIndiceAtivo.avg12 : dadosIndiceAtivo.avg180).toFixed(2)}% a.m. | Fonte: {fonteDados}
                </AlertDescription>
              </Alert>
            )}

            {resultadoSimulacao && (
              <div className="mt-8">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><CheckCircle2 className="h-5 w-5" /> Resultado da Simulação</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-primary/5 p-4 rounded-lg border">
                    <p className="text-sm text-muted-foreground">Entrada (10%)</p>
                    <p className="text-lg font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resultadoSimulacao.entrada)}</p>
                  </div>
                  <div className="bg-primary/5 p-4 rounded-lg border">
                    <p className="text-sm text-muted-foreground">Total para Obras ({percentualCaptação}%)</p>
                    <p className="text-lg font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resultadoSimulacao.totalObras)}</p>
                  </div>
                  <div className="bg-primary/5 p-4 rounded-lg border">
                    <p className="text-sm text-muted-foreground">Saldo para Mensais</p>
                    <p className="text-lg font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resultadoSimulacao.saldoDevedor)}</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Descrição</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead className="text-right">Valor Base (R$)</TableHead>
                        <TableHead className="text-right">Valor Corrigido (R$)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resultadoSimulacao.parcelas.map((parcela) => (
                        <TableRow key={parcela.id}>
                          <TableCell className="capitalize">{parcela.tipo.replace('extra-', '').replace('-', ' ')}</TableCell>
                          <TableCell>{parcela.descricao}</TableCell>
                          <TableCell>{new Date(parcela.vencimento).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell className="text-right">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parcela.valorBase)}</TableCell>
                          <TableCell className="text-right font-medium">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parcela.valorCorrigido)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
