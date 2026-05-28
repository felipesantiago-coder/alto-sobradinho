'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ThemeToggleSimple } from '@/components/theme-toggle-simple';
import { getUnidadesByEmpreendimento, Unidade } from '@/data/static-data';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Loader2, TrendingUp, DollarSign, AlertCircle, CheckCircle2, Info, CalendarDays, Building2, Home, Percent, ArrowDown, ChevronRight, ArrowLeft } from 'lucide-react';

// --- DATAS DE ENTREGA ATUALIZADAS E CORRETAS ---
const deliveryDates: Record<string, Date> = {
  'alto-da-alvorada': new Date('2027-03-31'),
  'alto-da-aurora': new Date('2029-02-28'), // Corrigido para 2029
  'alto-do-horizonte': new Date('2026-07-31'),
};

interface IndiceData {
  avg180: number;
  avg12: number;
  projecao: number;
  source: string;
  indicator: string;
  isFallback: boolean;
  projecaoData?: string;
}

interface IndicesResponse {
  incc: IndiceData;
  ipca: IndiceData;
}

interface Parcela {
  id: string;
  tipo: 'mensal' | 'extra-semestral' | 'extra-anual';
  vencimento: string;
  valorBase: number;
  valorCorrigido: number;
  descricao: string;
}

interface ParcelaPosObra {
  id: string;
  mes: number;
  vencimento: string;
  parcela: number;
  juros: number;
  amortizacao: number;
  saldoDevedor: number;
}

interface ResultadoSimulacao {
  entrada: number;
  totalObras: number;
  saldoDevedor: number;
  parcelas: Parcela[];
  parcelasPosObra: ParcelaPosObra[];
  prestacaoPosObra: number;
}

export default function SimuladorUnidadePage() {
  const params = useParams();
  const router = useRouter();
  const slugParam = params.unidade as string;
  
  const [unidade, setUnidade] = useState<Unidade | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [slugEmpreendimentoDetectado, setSlugEmpreendimentoDetectado] = useState<string>(''); // Estado para guardar o slug correto
  
  // Estados do Simulador
  const [valorVenda, setValorVenda] = useState(0);
  const [desconto, setDesconto] = useState(0);
  const [percentualCaptação, setPercentualCaptação] = useState(30);
  
  // Seleção de Índices
  const [indiceSelecionado, setIndiceSelecionado] = useState<'INCC' | 'IPCA'>('INCC');
  const [periodoMedia, setPeriodoMedia] = useState<'180m' | '12m' | 'projecao'>('12m');
  
  // Dados dos Índices
  const [indicesData, setIndicesData] = useState<IndicesResponse | null>(null);
  const [loadingIndices, setLoadingIndices] = useState(true);
  
  // Parcelas Extras
  const [habilitarParcelasExtras, setHabilitarParcelasExtras] = useState(false);
  const [tipoParcelaExtra, setTipoParcelaExtra] = useState<'semestral' | 'anual'>('semestral');
  const [valorBaseParcelaExtra, setValorBaseParcelaExtra] = useState<number>(0);
  const [dataBaseParcelaExtra, setDataBaseParcelaExtra] = useState<string>('');
  
  // Personalização Mensal
  const [valorPrimeiraMensal, setValorPrimeiraMensal] = useState<number | ''>('');

  // Parcelamento Pós-Obra (PRICE)
  const [habilitarPosObra, setHabilitarPosObra] = useState(false);
  const [prazoPosObra, setPrazoPosObra] = useState(120);

  // Resultados e Validações
  const [resultadoSimulacao, setResultadoSimulacao] = useState<ResultadoSimulacao | null>(null);
  const [temEspacoSemestral, setTemEspacoSemestral] = useState(false);
  const [temEspacoAnual, setTemEspacoAnual] = useState(false);

  // Carregamento Inicial
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        if (!slugParam) throw new Error('Unidade não especificada.');

        let unidadeEncontrada: Unidade | undefined;
        let slugDetectado = '';
        const slugsConhecidos = ['alto-da-alvorada', 'alto-da-aurora', 'alto-do-horizonte'];
        const slugLower = slugParam.toLowerCase();
        
        // 1. Tentativa de detecção por prefixo
        slugDetectado = slugsConhecidos.find(s => slugLower.startsWith(s)) || '';
        
        if (slugDetectado) {
          const codigoParte = slugParam.substring(slugDetectado.length).replace(/^[- ]+/, '');
          const unidades = getUnidadesByEmpreendimento(slugDetectado);
          unidadeEncontrada = unidades.find(u => 
            u.unidade?.trim().toLowerCase() === codigoParte.trim().toLowerCase() || 
            u.codigo?.toString() === codigoParte.trim()
          );
        } 
        
        // 2. Fallback: Busca global se falhou ou não tinha prefixo claro
        if (!unidadeEncontrada) {
          for (const slug of slugsConhecidos) {
            const unidades = getUnidadesByEmpreendimento(slug);
            unidadeEncontrada = unidades.find(u => u.unidade?.trim().toLowerCase() === slugParam.trim().toLowerCase());
            if (unidadeEncontrada) {
              slugDetectado = slug; // Garante que o slug correto seja capturado mesmo na busca global
              break;
            }
          }
        }

        if (!unidadeEncontrada) throw new Error(`Unidade "${slugParam}" não encontrada.`);
        if (!slugDetectado) throw new Error('Não foi possível identificar o empreendimento desta unidade.');

        setUnidade(unidadeEncontrada);
        setSlugEmpreendimentoDetectado(slugDetectado); // Salva o slug correto para uso no cálculo
        const vv = unidadeEncontrada.valorVenda;
        setValorVenda(typeof vv === 'string' ? parseFloat(vv) || 0 : vv || 0);

        // Configura datas base para parcelas extras
        const hoje = new Date();
        const dSemestral = new Date(hoje.getFullYear(), hoje.getMonth() + 6, hoje.getDate());
        
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

  // Recálculo automático
  useEffect(() => {
    // IMPORTANTE: Agora usamos o estado slugEmpreendimentoDetectado para pegar a data correta
    if (!unidade || !indicesData || !slugEmpreendimentoDetectado) return;

    const dataEntrega = deliveryDates[slugEmpreendimentoDetectado];
    
    if (!dataEntrega) {
      console.error("Data de entrega não encontrada para o slug:", slugEmpreendimentoDetectado);
      return;
    }

    const hoje = new Date();
    
    // Limite: 3 meses antes da entrega
    const limiteMinimoExtra = new Date(dataEntrega);
    limiteMinimoExtra.setMonth(limiteMinimoExtra.getMonth() - 3);

    // Verifica viabilidade para Semestral (6 meses a partir de hoje)
    const dataPrimeiraSemestral = new Date(hoje);
    dataPrimeiraSemestral.setMonth(dataPrimeiraSemestral.getMonth() + 6);
    setTemEspacoSemestral(dataPrimeiraSemestral < limiteMinimoExtra);

    // Verifica viabilidade para Anual (12 meses a partir de hoje)
    const dataPrimeiraAnual = new Date(hoje);
    dataPrimeiraAnual.setMonth(dataPrimeiraAnual.getMonth() + 12);
    setTemEspacoAnual(dataPrimeiraAnual < limiteMinimoExtra);

    // Desliga switch se não houver mais espaço
    if (habilitarParcelasExtras) {
      if (tipoParcelaExtra === 'semestral' && !temEspacoSemestral) setHabilitarParcelasExtras(false);
      if (tipoParcelaExtra === 'anual' && !temEspacoAnual) setHabilitarParcelasExtras(false);
    }

    calcularSimulacao(dataEntrega);
  }, [unidade, valorVenda, desconto, percentualCaptação, indiceSelecionado, periodoMedia, indicesData, habilitarParcelasExtras, tipoParcelaExtra, valorBaseParcelaExtra, dataBaseParcelaExtra, valorPrimeiraMensal, temEspacoSemestral, temEspacoAnual, slugEmpreendimentoDetectado, habilitarPosObra, prazoPosObra]);

  async function carregarIndices() {
    setLoadingIndices(true);
    try {
      const res = await fetch('/api/incc-ipca');
      if (!res.ok) throw new Error('Falha na conexão');
      const data: IndicesResponse = await res.json();
      
      // Sanitização de segurança
      const sanitize = (v: number) => (v > 0.05 && v < 3.0) ? v : 0; 
      
      setIndicesData({
        incc: { ...data.incc, avg12: sanitize(data.incc.avg12), avg180: sanitize(data.incc.avg180), projecao: sanitize(data.incc.projecao) },
        ipca: { ...data.ipca, avg12: sanitize(data.ipca.avg12), avg180: sanitize(data.ipca.avg180), projecao: sanitize(data.ipca.projecao) }
      });
    } catch (err) {
      console.warn('Usando fallback de índices.', err);
      setIndicesData({
        incc: { avg180: 0.48, avg12: 0.46, projecao: 0.46, source: 'Estimativa Histórica', indicator: 'INCC', isFallback: true },
        ipca: { avg180: 0.42, avg12: 0.39, projecao: 0.39, source: 'Estimativa Histórica', indicator: 'IPCA', isFallback: true }
      });
    } finally {
      setLoadingIndices(false);
    }
  }

  function calcularSimulacao(dataEntrega: Date) {
    if (!indicesData || valorVenda === 0) return;

    const valorFinal = valorVenda - desconto;
    const dadosIndice = indiceSelecionado === 'INCC' ? indicesData.incc : indicesData.ipca;
    const taxaMensalPct = periodoMedia === '12m' ? dadosIndice.avg12 : periodoMedia === 'projecao' ? dadosIndice.projecao : dadosIndice.avg180;
    const taxaMensalDecimal = taxaMensalPct / 100;

    // 1. Entrada (10%)
    const entrada = valorFinal * 0.10;

    // 2. Total Captação
    const totalCaptação = valorFinal * (percentualCaptação / 100);
    let saldoParaObras = totalCaptação - entrada;
    if (saldoParaObras < 0) saldoParaObras = 0;

    // 3. Prazo em Meses
    const hoje = new Date();
    const diffAnos = dataEntrega.getFullYear() - hoje.getFullYear();
    const diffMeses = diffAnos * 12 + (dataEntrega.getMonth() - hoje.getMonth());
    const mesesTotais = Math.max(1, diffMeses);

    const parcelas: Parcela[] = [];
    
    // Lógica da Primeira Mensal
    const valorMensalPadrao = saldoParaObras / mesesTotais;
    const primeiraMensalDefinida = typeof valorPrimeiraMensal === 'number' && valorPrimeiraMensal > 0 ? valorPrimeiraMensal : valorMensalPadrao;
    
    let saldoRestanteParaDivisao = saldoParaObras - primeiraMensalDefinida;
    if (saldoRestanteParaDivisao < 0) saldoRestanteParaDivisao = 0;
    
    const mesesRestantes = mesesTotais - 1;
    const valorMensalRestante = mesesRestantes > 0 ? saldoRestanteParaDivisao / mesesRestantes : 0;

    // Geração das Parcelas Mensais (Início no mês seguinte)
    const dataAtualLoop = new Date(hoje);
    dataAtualLoop.setMonth(dataAtualLoop.getMonth() + 1);
    dataAtualLoop.setDate(10);

    for (let i = 0; i < mesesTotais; i++) {
      if (dataAtualLoop >= dataEntrega) break;

      const valorOriginal = i === 0 ? primeiraMensalDefinida : valorMensalRestante;
      const fatorCorrecao = Math.pow(1 + taxaMensalDecimal, i);
      const valorCorrigido = valorOriginal * fatorCorrecao;

      parcelas.push({
        id: `mensal-${i}`,
        tipo: 'mensal',
        vencimento: dataAtualLoop.toISOString().split('T')[0],
        valorBase: valorOriginal,
        valorCorrigido: parseFloat(valorCorrigido.toFixed(2)),
        descricao: `Mensal ${i + 1}/${mesesTotais}`
      });

      dataAtualLoop.setMonth(dataAtualLoop.getMonth() + 1);
      if (dataAtualLoop.getDate() !== 10) {
         dataAtualLoop.setDate(10);
      }
    }

    // Geração de Parcelas Extras
    if (habilitarParcelasExtras && valorBaseParcelaExtra > 0) {
      const dataBase = new Date(dataBaseParcelaExtra);
      if (dataBase < hoje) dataBase.setTime(hoje.getTime());

      let dataProximaExtra = new Date(dataBase);
      
      while (dataProximaExtra < dataEntrega) {
        const limiteMinimo = new Date(dataEntrega);
        limiteMinimo.setMonth(limiteMinimo.getMonth() - 3);
        
        if (dataProximaExtra >= limiteMinimo) break;

        const diffTimeExtra = dataProximaExtra.getTime() - hoje.getTime();
        const mesesDecorridosExtra = diffTimeExtra / (1000 * 60 * 60 * 24 * 30);
        const fatorCorrecaoExtra = Math.pow(1 + taxaMensalDecimal, mesesDecorridosExtra);
        const valorCorrigidoExtra = valorBaseParcelaExtra * fatorCorrecaoExtra;

        parcelas.push({
          id: `extra-${dataProximaExtra.getTime()}`,
          tipo: `extra-${tipoParcelaExtra}` as 'extra-semestral' | 'extra-anual',
          vencimento: dataProximaExtra.toISOString().split('T')[0],
          valorBase: valorBaseParcelaExtra,
          valorCorrigido: parseFloat(valorCorrigidoExtra.toFixed(2)),
          descricao: `${tipoParcelaExtra === 'semestral' ? 'Semestral' : 'Anual'} Extra`
        });

        if (tipoParcelaExtra === 'semestral') {
          dataProximaExtra.setMonth(dataProximaExtra.getMonth() + 6);
        } else {
          dataProximaExtra.setFullYear(dataProximaExtra.getFullYear() + 1);
        }
      }
    }

    parcelas.sort((a, b) => new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime());

    // Saldo Devedor Pós-Obras corrigido pelo índice durante todo o período de obras
    const saldoDevedorOriginal = valorFinal - totalCaptação;
    const saldoDevedorCorrigido = saldoDevedorOriginal * Math.pow(1 + taxaMensalDecimal, mesesTotais);

    // --- PARCELAMENTO PÓS-OBRA (TABELA PRICE) ---
    let parcelasPosObra: ParcelaPosObra[] = [];
    let prestacaoPosObra = 0;

    if (habilitarPosObra && saldoDevedorCorrigido > 0 && prazoPosObra > 0) {
      // Taxa do período pós-obra: IPCA + 1% ao mês (composto)
      // i_pos = (1 + IPCA_mensal) * (1 + 0.01) - 1
      const dadosIpcParaPosObra = indicesData.ipca;
      const ipcaMensalPosObra = periodoMedia === '12m' ? dadosIpcParaPosObra.avg12 : periodoMedia === 'projecao' ? dadosIpcParaPosObra.projecao : dadosIpcParaPosObra.avg180;
      const ipcaDecimalPosObra = ipcaMensalPosObra / 100;
      const taxaPosObra = (1 + ipcaDecimalPosObra) * 1.01 - 1; // IPCA + 1% compostos

      // PMT (prestação fixa PRICE)
      const n = prazoPosObra;
      const i = taxaPosObra;
      const fator = Math.pow(1 + i, n);
      prestacaoPosObra = saldoDevedorCorrigido * (i * fator) / (fator - 1);

      // Data de início: mês seguinte à entrega
      const dataInicioPosObra = new Date(dataEntrega);
      dataInicioPosObra.setMonth(dataInicioPosObra.getMonth() + 1);
      dataInicioPosObra.setDate(10);

      let saldoAtual = saldoDevedorCorrigido;

      for (let m = 1; m <= n; m++) {
        const jurosMes = saldoAtual * i;
        const amortizacaoMes = prestacaoPosObra - jurosMes;

        const dataVencimento = new Date(dataInicioPosObra);
        dataVencimento.setMonth(dataVencimento.getMonth() + (m - 1));

        // Saldo devedor = saldo NO INÍCIO do mês (antes do pagamento)
        parcelasPosObra.push({
          id: `pos-obra-${m}`,
          mes: m,
          vencimento: dataVencimento.toISOString().split('T')[0],
          parcela: parseFloat(prestacaoPosObra.toFixed(2)),
          juros: parseFloat(jurosMes.toFixed(2)),
          amortizacao: parseFloat(amortizacaoMes.toFixed(2)),
          saldoDevedor: parseFloat(saldoAtual.toFixed(2)),
        });

        // Atualiza saldo APÓS registrar a parcela
        saldoAtual = saldoAtual - amortizacaoMes;

        // Evitar saldo negativo por arredondamento
        if (saldoAtual < 0.01) saldoAtual = 0;
      }
    }

    setResultadoSimulacao({
      entrada: parseFloat(entrada.toFixed(2)),
      totalObras: parseFloat(totalCaptação.toFixed(2)),
      saldoDevedor: parseFloat(saldoDevedorCorrigido.toFixed(2)),
      parcelas: parcelas,
      parcelasPosObra,
      prestacaoPosObra: parseFloat(prestacaoPosObra.toFixed(2)),
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-muted-foreground">Carregando simulador...</p>
        </div>
      </div>
    );
  }

  if (error || !unidade) {
    return (
      <div className="container mx-auto py-10 px-4">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-6 shadow-md">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-red-800 dark:text-red-200 mb-1">Erro</h3>
              <p className="text-sm text-red-700 dark:text-red-300">{error || 'Unidade não encontrada.'}</p>
              <Button onClick={() => router.back()} className="mt-4" variant="outline">Voltar</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const dadosIndiceAtivo = indicesData ? (indiceSelecionado === 'INCC' ? indicesData.incc : indicesData.ipca) : null;
  const fonteDados = dadosIndiceAtivo?.isFallback ? "Estimados (Fallback)" : "Oficiais (Bacen/FGV)";

  // Valores derivados para o resumo
  const valorFinal = valorVenda - desconto;
  const dataEntregaAtual = slugEmpreendimentoDetectado ? deliveryDates[slugEmpreendimentoDetectado] : null;
  const mesesObras = dataEntregaAtual ? (() => {
    const hoje = new Date();
    return Math.max(1, (dataEntregaAtual.getFullYear() - hoje.getFullYear()) * 12 + (dataEntregaAtual.getMonth() - hoje.getMonth()));
  })() : 0;
  const totalPagoObrasCorrigido = resultadoSimulacao ? resultadoSimulacao.parcelas.reduce((s, p) => s + p.valorCorrigido, 0) : 0;
  const totalPosObraPago = resultadoSimulacao ? resultadoSimulacao.parcelasPosObra.reduce((s, p) => s + p.parcela, 0) : 0;
  const taxaAtiva = dadosIndiceAtivo ? (periodoMedia === 'projecao' ? dadosIndiceAtivo.projecao : periodoMedia === '12m' ? dadosIndiceAtivo.avg12 : dadosIndiceAtivo.avg180) : 0;

  // Derived values for structured summary
  const totalBaseObras = resultadoSimulacao ? resultadoSimulacao.parcelas.reduce((s, p) => s + p.valorBase, 0) : 0;
  const saldoDevedorOriginal = valorFinal - (valorFinal * (percentualCaptação / 100));
  const totalPosObraJuros = resultadoSimulacao ? totalPosObraPago - resultadoSimulacao.saldoDevedor : 0;
  const custoTotalEfetivo = resultadoSimulacao ? resultadoSimulacao.entrada + totalPagoObrasCorrigido + totalPosObraPago : 0;
  const custoTotalObras = resultadoSimulacao ? resultadoSimulacao.entrada + totalPagoObrasCorrigido : 0;
  const percentualCustoSobreVenda = valorFinal > 0 ? ((custoTotalEfetivo / valorFinal) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800 font-sans">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Top Bar: Back + Theme */}
        <div className="mb-6 flex items-center justify-between">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          </Link>
          <ThemeToggleSimple />
        </div>

        {/* Page Header with Logo */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-2">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
              <img src="/logo.svg" alt="QB" className="w-8 h-8 sm:w-9 sm:h-9" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
                {unidade.unidade}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                <span className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                  {unidade.tipologia}
                </span>
                <span className="text-muted-foreground/40">·</span>
                <span className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                  {unidade.areaPrivativa}
                </span>
                <span className="text-muted-foreground/40">·</span>
                <span className={cn(
                  'text-sm sm:text-base font-medium',
                  unidade.posicaoSol === 'Nascente'
                    ? 'text-yellow-600 dark:text-yellow-400'
                    : 'text-blue-600 dark:text-blue-400'
                )}>
                  {unidade.posicaoSol}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Controles */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="shadow-md border-0 bg-white/80 backdrop-blur dark:bg-slate-800/80">
              <CardHeader>
                <CardTitle>Parâmetros Financeiros</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                
                <div className="space-y-2">
                  <Label htmlFor="desconto">Desconto (R$)</Label>
                  <Input
                    id="desconto"
                    type="number"
                    value={desconto}
                    onChange={(e) => setDesconto(Number(e.target.value))}
                    className="font-mono"
                  />
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Valor Final:</span>
                    <span className="font-semibold">R$ {(valorVenda - desconto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="captacao">Captação na Obra (%)</Label>
                  <Select 
                    value={percentualCaptação.toString()} 
                    onValueChange={(val) => setPercentualCaptação(Number(val))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25%</SelectItem>
                      <SelectItem value="30">30%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Índice de Correção</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={indiceSelecionado === 'INCC' ? 'default' : 'outline'}
                      onClick={() => setIndiceSelecionado('INCC')}
                      className={indiceSelecionado === 'INCC' ? 'bg-primary text-primary-foreground' : ''}
                    >
                      INCC
                    </Button>
                    <Button
                      variant={indiceSelecionado === 'IPCA' ? 'default' : 'outline'}
                      onClick={() => setIndiceSelecionado('IPCA')}
                      className={indiceSelecionado === 'IPCA' ? 'bg-primary text-primary-foreground' : ''}
                    >
                      IPCA
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Período de Referência</Label>
                  <Select 
                    value={periodoMedia} 
                    onValueChange={(val: any) => setPeriodoMedia(val)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="projecao">
                        Projeção Futura {dadosIndiceAtivo && `(${dadosIndiceAtivo.projecao.toFixed(3)}% a.m.)`}
                      </SelectItem>
                      <SelectItem value="12m">
                        Média 12 Meses {dadosIndiceAtivo && `(${dadosIndiceAtivo.avg12.toFixed(3)}% a.m.)`}
                      </SelectItem>
                      <SelectItem value="180m">
                        Média 180 Meses {dadosIndiceAtivo && `(${dadosIndiceAtivo.avg180.toFixed(3)}% a.m.)`}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {loadingIndices ? (
                    <div className="text-xs text-blue-500 flex items-center gap-2 mt-2">
                      <Loader2 className="h-3 w-3 animate-spin" /> Buscando dados oficiais...
                    </div>
                  ) : dadosIndiceAtivo ? (
                    <div className="text-xs bg-muted/50 p-3 rounded-md border mt-2 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fonte:</span>
                        <span className={`font-medium ${dadosIndiceAtivo.isFallback ? 'text-amber-600' : 'text-green-600'}`}>
                          {fonteDados}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Indicador:</span>
                        <span className="font-medium">{dadosIndiceAtivo.indicator}</span>
                      </div>
                      <div className="pt-2 border-t flex justify-between items-center">
                        <span className="font-semibold">Taxa Aplicada:</span>
                        <span className="font-bold text-primary">
                          {periodoMedia === 'projecao' ? dadosIndiceAtivo.projecao : periodoMedia === '12m' ? dadosIndiceAtivo.avg12 : dadosIndiceAtivo.avg180}% a.m.
                        </span>
                      </div>
                      {periodoMedia === 'projecao' && dadosIndiceAtivo.projecaoData && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Ref. Projeção:</span>
                          <span className="font-medium text-xs">{new Date(dadosIndiceAtivo.projecaoData + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>

                <div className="space-y-2 pt-4 border-t">
                   <Label htmlFor="valorPrimeiraMensal">Valor 1ª Parcela Mensal (Opcional)</Label>
                   <Input
                     id="valorPrimeiraMensal"
                     type="number"
                     value={valorPrimeiraMensal === '' ? '' : valorPrimeiraMensal}
                     onChange={(e) => setValorPrimeiraMensal(e.target.value === '' ? '' : Number(e.target.value))}
                     placeholder="Deixe em branco para cálculo automático"
                   />
                   <p className="text-xs text-muted-foreground">
                     As demais parcelas serão recalculadas proporcionalmente. Vencimento inicia no mês seguinte.
                   </p>
                 </div>

              </CardContent>
            </Card>

            {/* Cartão de Parcelas Extras */}
            <Card className="shadow-md border-0 bg-white/80 backdrop-blur dark:bg-slate-800/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Parcelas Extras Inteligentes</span>
                  <Switch
                    checked={habilitarParcelasExtras}
                    onCheckedChange={(checked) => {
                        if (checked) {
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
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!temEspacoSemestral && !temEspacoAnual && (
                  <p className="text-xs text-muted-foreground italic">Sem prazo hábil para extras (regra dos 3 meses).</p>
                )}
                
                {habilitarParcelasExtras && (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="col-span-2">
                        <Label>Tipo</Label>
                        <Select value={tipoParcelaExtra} onValueChange={(v) => setTipoParcelaExtra(v as 'semestral' | 'anual')}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="semestral" disabled={!temEspacoSemestral}>Semestral</SelectItem>
                            <SelectItem value="anual" disabled={!temEspacoAnual}>Anual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Data 1º Vencimento</Label>
                        <Input
                          type="date"
                          value={dataBaseParcelaExtra}
                          onChange={(e) => setDataBaseParcelaExtra(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Valor Base (R$)</Label>
                        <Input
                          type="number"
                          value={valorBaseParcelaExtra}
                          onChange={(e) => setValorBaseParcelaExtra(Number(e.target.value))}
                        />
                      </div>
                    </div>
                    <Alert variant="default" className="bg-blue-50 border-blue-200">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-xs text-blue-800">
                        O valor base será corrigido pelo índice selecionado até a data de cada vencimento. Parcelas não podem vencer a menos de 3 meses da entrega.
                      </AlertDescription>
                    </Alert>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Cartão de Parcelamento Pós-Obra */}
            <Card className="shadow-md border-0 bg-white/80 backdrop-blur dark:bg-slate-800/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Parcelamento Pós-Obra (PRICE)</span>
                  <Switch
                    checked={habilitarPosObra}
                    onCheckedChange={setHabilitarPosObra}
                  />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {habilitarPosObra && (
                  <>
                    <div className="space-y-2">
                      <Label>Prazo (meses)</Label>
                      <Select value={prazoPosObra.toString()} onValueChange={(v) => setPrazoPosObra(Number(v))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="24">24 meses (2 anos)</SelectItem>
                          <SelectItem value="60">60 meses (5 anos)</SelectItem>
                          <SelectItem value="84">84 meses (7 anos)</SelectItem>
                          <SelectItem value="120">120 meses (10 anos)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Alert variant="default" className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
                      <Info className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-xs text-amber-800 dark:text-amber-200">
                        Tabela PRICE com correção mensal de <b>IPCA + 1% a.m.</b> O saldo devedor pós-obra é corrigido pelo índice de obras durante todo o período de construção.
                      </AlertDescription>
                    </Alert>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Resultados */}
          <div className="lg:col-span-7 space-y-6">
            {resultadoSimulacao ? (
              <>
                {/* Card 1: Fluxo de Pagamento */}
                <Card className="shadow-lg border-0 bg-white/80 backdrop-blur dark:bg-slate-800/80">
                  <CardHeader className="bg-primary/5 border-b border-primary/10">
                    <CardTitle className="flex items-center gap-2 text-primary">
                      <TrendingUp className="h-5 w-5" />
                      Fluxo de Pagamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    {/* Visual Timeline */}
                    <div className="flex items-center justify-center gap-1 sm:gap-2 overflow-x-auto py-2 px-1">
                      {/* Step 1: Entrada */}
                      <div className="flex flex-col items-center gap-1.5 min-w-[64px]">
                        <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center ring-2 ring-green-300 dark:ring-green-700">
                          <DollarSign className="h-4 w-4 text-green-700 dark:text-green-400" />
                        </div>
                        <span className="text-[10px] sm:text-xs font-semibold text-green-700 dark:text-green-400 text-center leading-tight">Entrada</span>
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground text-center leading-tight">10%</span>
                      </div>

                      <ChevronRight className="h-5 w-5 text-green-300 dark:text-green-700 flex-shrink-0" />

                      {/* Step 2: Obras */}
                      <div className="flex flex-col items-center gap-1.5 min-w-[64px]">
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center ring-2 ring-blue-300 dark:ring-blue-700">
                          <Building2 className="h-4 w-4 text-blue-700 dark:text-blue-400" />
                        </div>
                        <span className="text-[10px] sm:text-xs font-semibold text-blue-700 dark:text-blue-400 text-center leading-tight">Obras</span>
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground text-center leading-tight">{mesesObras} meses</span>
                      </div>

                      <ChevronRight className="h-5 w-5 text-blue-300 dark:text-blue-700 flex-shrink-0" />

                      {/* Step 3: Entrega */}
                      <div className="flex flex-col items-center gap-1.5 min-w-[64px]">
                        <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center ring-2 ring-purple-300 dark:ring-purple-700">
                          <CalendarDays className="h-4 w-4 text-purple-700 dark:text-purple-400" />
                        </div>
                        <span className="text-[10px] sm:text-xs font-semibold text-purple-700 dark:text-purple-400 text-center leading-tight">Entrega</span>
                        <span className="text-[9px] sm:text-[10px] text-muted-foreground text-center leading-tight">{dataEntregaAtual ? new Date(dataEntregaAtual).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : '-'}</span>
                      </div>

                      {habilitarPosObra && resultadoSimulacao.parcelasPosObra.length > 0 && (
                        <>
                          <ChevronRight className="h-5 w-5 text-purple-300 dark:text-purple-700 flex-shrink-0" />
                          {/* Step 4: Pós-Obra */}
                          <div className="flex flex-col items-center gap-1.5 min-w-[64px]">
                            <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center ring-2 ring-amber-300 dark:ring-amber-700">
                              <Home className="h-4 w-4 text-amber-700 dark:text-amber-400" />
                            </div>
                            <span className="text-[10px] sm:text-xs font-semibold text-amber-700 dark:text-amber-400 text-center leading-tight">Pós-Obra</span>
                            <span className="text-[9px] sm:text-[10px] text-muted-foreground text-center leading-tight">{prazoPosObra} meses</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Structured Financial Summary */}
                    <div className="space-y-4">

                      {/* ====== SEÇÃO 1: VALOR TOTAL DO IMÓVEL ====== */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-lg border bg-muted/30">
                        <div className="flex items-center gap-2">
                          <Percent className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-semibold text-muted-foreground">Valor Total do Imóvel</span>
                        </div>
                        <span className="text-sm font-bold font-mono">
                          R$ {valorFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>

                      {/* ====== SEÇÃO 2: DURANTE AS OBRAS ====== */}
                      <div className="rounded-lg border-2 border-blue-200 dark:border-blue-900 overflow-hidden">
                        <div className="bg-blue-50 dark:bg-blue-950/30 px-3 py-2 border-b border-blue-200 dark:border-blue-900">
                          <span className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wide">Período de Obras</span>
                          <span className="text-[11px] text-blue-600 dark:text-blue-400 ml-2">{mesesObras} meses • {indiceSelecionado} ({taxaAtiva.toFixed(3)}% a.m.)</span>
                        </div>
                        <div className="p-3 space-y-2.5">

                          {/* Entrada */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-2 rounded-full bg-green-500" />
                              <span className="text-sm font-semibold text-green-800 dark:text-green-300">Entrada (Sinal)</span>
                              <span className="text-xs text-muted-foreground">— 10%</span>
                            </div>
                            <span className="text-sm font-bold font-mono text-green-700 dark:text-green-400">
                              R$ {resultadoSimulacao.entrada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>

                          {/* Parcelas Mensais + Extras */}
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1.5">
                            <div className="flex items-start gap-2">
                              <div className="h-2 w-2 rounded-full bg-blue-500 mt-1" />
                              <div>
                                <span className="text-sm font-semibold text-blue-800 dark:text-blue-300">Parcelas ({percentualCaptação}% − entrada)</span>
                                <p className="text-[11px] text-blue-600 dark:text-blue-400">
                                  {resultadoSimulacao.parcelas.length} parcelas • corrigidas pelo {indiceSelecionado}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">
                                Base: R$ {totalBaseObras.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Correção: +R$ {(totalPagoObrasCorrigido - totalBaseObras).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-sm font-bold font-mono text-blue-700 dark:text-blue-400">
                                Corrigido: R$ {totalPagoObrasCorrigido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>

                          {/* Subtotal Obras */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pt-2 mt-1 border-t border-blue-200 dark:border-blue-800">
                            <span className="text-xs font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide">Total Pago nas Obras</span>
                            <span className="text-sm font-bold font-mono text-blue-800 dark:text-blue-200">
                              R$ {custoTotalObras.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* ====== SEÇÃO 3: PÓS-OBRA ====== */}
                      <div className={`rounded-lg border-2 overflow-hidden ${
                        habilitarPosObra && resultadoSimulacao.parcelasPosObra.length > 0
                          ? 'border-amber-200 dark:border-amber-900'
                          : 'border-slate-200 dark:border-slate-800'
                      }`}>
                        <div className={`px-3 py-2 border-b ${
                          habilitarPosObra && resultadoSimulacao.parcelasPosObra.length > 0
                            ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900'
                            : 'bg-slate-50 dark:bg-slate-950/30 border-slate-200 dark:border-slate-800'
                        }`}>
                          <span className={`text-xs font-bold uppercase tracking-wide ${
                            habilitarPosObra && resultadoSimulacao.parcelasPosObra.length > 0
                              ? 'text-amber-800 dark:text-amber-300'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}>
                            Pós-Obra
                          </span>
                          <span className={`text-[11px] ml-2 ${
                            habilitarPosObra && resultadoSimulacao.parcelasPosObra.length > 0
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-500 dark:text-slate-500'
                          }`}>
                            {habilitarPosObra && resultadoSimulacao.parcelasPosObra.length > 0
                              ? `${prazoPosObra} meses • PRICE (IPCA + 1% a.m.)`
                              : `Saldo restante a ser quitado na entrega`
                            }
                          </span>
                        </div>
                        <div className="p-3 space-y-2.5">

                          {/* Saldo Devedor Base vs Corrigido */}
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1.5">
                            <div className="flex items-start gap-2">
                              <div className={`h-2 w-2 rounded-full mt-1 ${
                                habilitarPosObra && resultadoSimulacao.parcelasPosObra.length > 0
                                  ? 'bg-amber-500' : 'bg-slate-500'
                              }`} />
                              <div>
                                <span className={`text-sm font-semibold ${
                                  habilitarPosObra && resultadoSimulacao.parcelasPosObra.length > 0
                                    ? 'text-amber-800 dark:text-amber-300' : 'text-slate-800 dark:text-slate-300'
                                }`}>
                                  Saldo Devedor — {100 - percentualCaptação}%
                                </span>
                                <p className={`text-[11px] mt-0.5 ${
                                  habilitarPosObra && resultadoSimulacao.parcelasPosObra.length > 0
                                    ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'
                                }`}>
                                  Corrigido pelo {indiceSelecionado} durante {mesesObras} meses de obra
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-muted-foreground">
                                Base: R$ {saldoDevedorOriginal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Correção: +R$ {(resultadoSimulacao.saldoDevedor - saldoDevedorOriginal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                              <p className={`text-sm font-bold font-mono ${
                                habilitarPosObra && resultadoSimulacao.parcelasPosObra.length > 0
                                  ? 'text-amber-700 dark:text-amber-400'
                                  : 'text-slate-700 dark:text-slate-400'
                              }`}>
                                Corrigido: R$ {resultadoSimulacao.saldoDevedor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </p>
                            </div>
                          </div>

                          {/* Parcelamento PRICE (quando habilitado) */}
                          {habilitarPosObra && resultadoSimulacao.parcelasPosObra.length > 0 && (
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-1.5">
                              <div className="flex items-start gap-2">
                                <div className="h-2 w-2 rounded-full bg-amber-500 mt-1" />
                                <div>
                                  <span className="text-sm font-semibold text-amber-800 dark:text-amber-300">Parcelamento PRICE</span>
                                  <p className="text-[11px] text-amber-600 dark:text-amber-400">
                                    Prestação fixa • {prazoPosObra} meses
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xs text-muted-foreground">
                                  Juros totais: R$ {totalPosObraJuros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Amortização: R$ {resultadoSimulacao.saldoDevedor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-sm font-bold font-mono text-amber-700 dark:text-amber-400">
                                  Total: R$ {totalPosObraPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Subtotal Pós-Obra */}
                          <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pt-2 mt-1 border-t ${
                            habilitarPosObra && resultadoSimulacao.parcelasPosObra.length > 0
                              ? 'border-amber-200 dark:border-amber-800'
                              : 'border-slate-200 dark:border-slate-700'
                          }`}>
                            <span className={`text-xs font-bold uppercase tracking-wide ${
                              habilitarPosObra && resultadoSimulacao.parcelasPosObra.length > 0
                                ? 'text-amber-700 dark:text-amber-300'
                                : 'text-slate-600 dark:text-slate-400'
                            }`}>
                              Total Pós-Obra
                            </span>
                            <span className={`text-sm font-bold font-mono ${
                              habilitarPosObra && resultadoSimulacao.parcelasPosObra.length > 0
                                ? 'text-amber-800 dark:text-amber-200'
                                : 'text-slate-700 dark:text-slate-400'
                            }`}>
                              R$ {(habilitarPosObra && resultadoSimulacao.parcelasPosObra.length > 0 ? totalPosObraPago : resultadoSimulacao.saldoDevedor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* ====== SEÇÃO 4: RESUMO GERAL ====== */}
                      {habilitarPosObra && resultadoSimulacao.parcelasPosObra.length > 0 ? (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-lg border-2 border-primary/30 bg-primary/5">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                            <div>
                              <span className="text-sm font-bold text-primary">Total Geral Pago</span>
                              <p className="text-[11px] text-primary/60">Obras + Pós-Obra</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-base font-bold font-mono text-primary">
                              R$ {custoTotalEfetivo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-[11px] text-primary/70">
                              {percentualCustoSobreVenda.toFixed(1)}% do valor do imóvel
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-4 rounded-lg border-2 border-primary/30 bg-primary/5">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                            <div>
                              <span className="text-sm font-bold text-primary">Total Pago nas Obras</span>
                              <p className="text-[11px] text-primary/60">Entrada + Parcelas Corrigidas</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-base font-bold font-mono text-primary">
                              R$ {custoTotalObras.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                            <p className="text-[11px] text-primary/70">
                              {((custoTotalObras / valorFinal) * 100).toFixed(1)}% do valor do imóvel
                            </p>
                            <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">
                              + Saldo devedor de R$ {resultadoSimulacao.saldoDevedor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} pendente na entrega
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card className="shadow-md border-0 bg-white/80 backdrop-blur dark:bg-slate-800/80">
                  <CardHeader className="bg-blue-50/50 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-300">
                        <Building2 className="h-5 w-5" />
                        Parcelas Durante as Obras
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full font-medium">
                          {resultadoSimulacao.parcelas.length} parcelas
                        </span>
                        <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full font-semibold flex items-center gap-1">
                          <Percent className="h-3 w-3" />
                          {taxaAtiva.toFixed(3)}%
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="border rounded-lg overflow-hidden">
                      <div className="max-h-[420px] overflow-y-auto">
                        <Table>
                          <TableHeader className="bg-muted/50 sticky top-0 z-10">
                            <TableRow>
                              <TableHead className="w-[60px] text-center">Nº</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Vencimento</TableHead>
                              <TableHead className="text-right">Valor Base</TableHead>
                              <TableHead className="text-center">Fator Corr.</TableHead>
                              <TableHead className="text-right font-bold text-primary">Valor Corrigido</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {resultadoSimulacao.parcelas.map((p, i) => (
                              <TableRow key={p.id} className="hover:bg-muted/30">
                                <TableCell className="font-medium text-center text-muted-foreground">{i + 1}</TableCell>
                                <TableCell>
                                  {p.tipo === 'mensal' ? (
                                    <span className="inline-flex items-center text-[11px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                                      Mensal
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center text-[11px] font-semibold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                                      {p.tipo.replace('extra-', '').charAt(0).toUpperCase() + p.tipo.replace('extra-', '').slice(1)}
                                    </span>
                                  )}
                                </TableCell>
                                <TableCell className="text-sm">{new Date(p.vencimento).toLocaleDateString('pt-BR')}</TableCell>
                                <TableCell className="text-right text-muted-foreground text-sm font-mono">
                                  {p.valorBase > 0 ? `R$ ${p.valorBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                                </TableCell>
                                <TableCell className="text-center text-xs font-mono text-muted-foreground">
                                  {p.valorBase > 0 ? `${(p.valorCorrigido / p.valorBase).toFixed(4)}x` : '-'}
                                </TableCell>
                                <TableCell className="text-right font-bold font-mono text-primary">
                                  R$ {p.valorCorrigido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      {/* Totals row */}
                      <div className="border-t bg-muted/30 px-4 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 text-xs sm:text-sm">
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground">Total Base:</span>
                          <span className="font-mono font-semibold">R$ {totalBaseObras.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-primary font-semibold">Total Corrigido:</span>
                          <span className="font-mono font-bold text-primary">R$ {totalPagoObrasCorrigido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="px-4 py-3">
                      <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                        <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span>Valores corrigidos mensalmente pelo índice <b>{indiceSelecionado}</b> à taxa de <b>{taxaAtiva.toFixed(3)}% a.m.</b> ({periodoMedia === 'projecao' ? 'projeção' : `média ${periodoMedia === '12m' ? '12' : '180'} meses`}). O fator de correção é aplicado progressivamente desde a assinatura até cada vencimento.</span>
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Card 3: Parcelamento Pós-Obra (only if enabled) */}
                {resultadoSimulacao.parcelasPosObra.length > 0 && (
                  <Card className="shadow-md border-0 bg-white/80 backdrop-blur dark:bg-slate-800/80">
                    <CardHeader className="bg-amber-50/50 dark:bg-amber-950/20 border-b border-amber-100 dark:border-amber-900">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                          <Home className="h-5 w-5" />
                          Parcelamento Pós-Obra (Tabela PRICE)
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 px-2 py-1 rounded-full font-medium">
                            {prazoPosObra} meses
                          </span>
                          <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-semibold">
                            R$ {resultadoSimulacao.prestacaoPosObra.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="border rounded-lg overflow-hidden">
                        <div className="max-h-[400px] overflow-y-auto">
                          <Table>
                            <TableHeader className="bg-amber-50/30 dark:bg-amber-950/10 sticky top-0 z-10">
                              <TableRow>
                                <TableHead className="w-[60px] text-center">Mês</TableHead>
                                <TableHead className="text-center">Vencimento</TableHead>
                                <TableHead className="text-right">Prestação</TableHead>
                                <TableHead className="text-right">Juros</TableHead>
                                <TableHead className="text-right">Amortização</TableHead>
                                <TableHead className="text-right font-bold">Saldo Devedor</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {resultadoSimulacao.parcelasPosObra.map((p) => (
                                <TableRow key={p.id} className="hover:bg-muted/30">
                                  <TableCell className="font-medium text-center text-muted-foreground">{p.mes}</TableCell>
                                  <TableCell className="text-sm text-center">{new Date(p.vencimento).toLocaleDateString('pt-BR')}</TableCell>
                                  <TableCell className="text-right font-mono font-semibold">
                                    R$ {p.parcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </TableCell>
                                  <TableCell className="text-right text-muted-foreground text-sm font-mono">
                                    R$ {p.juros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </TableCell>
                                  <TableCell className="text-right text-sm font-mono">
                                    R$ {p.amortizacao.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </TableCell>
                                  <TableCell className="text-right font-bold font-mono text-amber-700 dark:text-amber-400">
                                    R$ {p.saldoDevedor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                        {/* Totals row */}
                        <div className="border-t bg-muted/30 px-4 py-2.5 flex flex-wrap items-center justify-between gap-x-6 gap-y-1.5 text-xs sm:text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">Prestação × {prazoPosObra}:</span>
                            <span className="font-mono font-bold text-primary">R$ {totalPosObraPago.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="text-muted-foreground">
                              Juros: <span className="font-mono text-amber-700 dark:text-amber-400">R$ {(totalPosObraPago - resultadoSimulacao.saldoDevedor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </span>
                            <span className="text-muted-foreground">
                              Amort.: <span className="font-mono font-semibold">R$ {resultadoSimulacao.saldoDevedor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="px-4 py-3">
                        <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
                          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                          <span>Tabela PRICE com prestações fixas. Taxa de juros compostos: <b>IPCA + 1% a.m.</b> A prestação inclui juros decrescentes e amortização crescente até quitar o saldo devedor.</span>
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Parameters Alert */}
                <Alert variant="default" className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800">
                  <Info className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 ml-2">
                    <span className="font-semibold text-foreground">Parâmetros:</span>
                    <span>
                      {indiceSelecionado} ({taxaAtiva.toFixed(3)}% a.m. • {periodoMedia === 'projecao' ? 'Projeção' : `Média ${periodoMedia === '12m' ? '12' : '180'}m`})
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <span>Captação: {percentualCaptação}%</span>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <span>Entrega: {dataEntregaAtual ? new Date(dataEntregaAtual).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) : '-'}</span>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <span className={dadosIndiceAtivo?.isFallback ? 'text-amber-600' : 'text-green-600'}>{fonteDados}</span>
                    {habilitarPosObra && resultadoSimulacao.parcelasPosObra.length > 0 && (
                      <>
                        <span className="text-slate-300 dark:text-slate-700">|</span>
                        <span>Pós-obra: PRICE {prazoPosObra}m (IPCA+1%)</span>
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              </>
            ) : (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur dark:bg-slate-800/80">
                <CardContent className="min-h-[300px] flex flex-col items-center justify-center text-muted-foreground space-y-4">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
                  <p>Calculando melhores condições...</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
