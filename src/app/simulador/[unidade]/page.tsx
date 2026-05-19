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
import { Switch } from '@/components/ui/switch'; // Certifique-se de ter este componente ou use checkbox
import { Loader2, TrendingUp, DollarSign, AlertCircle, CheckCircle2, Calendar, Plus, Trash2 } from 'lucide-react';

// --- DATAS DE ENTREGA ATUALIZADAS ---
const deliveryDates: Record<string, Date> = {
  'alto-da-alvorada': new Date('2027-03-31'),
  'alto-da-aurora': new Date('2029-02-28'),      // Corrigido: 28/02/2029
  'alto-do-horizonte': new Date('2026-07-31'),   // Corrigido: 31/07/2026
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

interface ParcelaExtra {
  id: string;
  tipo: 'semestral' | 'anual';
  dataVencimento: string; // ISO String
  valorBase: number;      // Valor informado pelo usuário
  valorCorrigido: number; // Valor após correção do índice
}

interface Parcela {
  vencimento: string;
  valor: number;
  descricao?: string;
  tipo: 'mensal' | 'extra';
  idExtra?: string;
}

interface ResultadoSimulacao {
  entrada: number;
  totalObras: number;
  saldoDevedor: number;
  parcelasObras: Parcela[];
  resumoExtras: {
    totalSemestrais: number;
    totalAnuais: number;
    qtdSemestrais: number;
    qtdAnuais: number;
  };
}

export default function SimuladorUnidadePage() {
  const params = useParams();
  const router = useRouter();
  const slugParam = params.unidade as string;
  
  const [unidade, setUnidade] = useState<Unidade | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados Financeiros Básicos
  const [valorVenda, setValorVenda] = useState(0);
  const [desconto, setDesconto] = useState(0);
  const [percentualCaptação, setPercentualCaptação] = useState(30);
  
  // Estados de Índice
  const [indiceSelecionado, setIndiceSelecionado] = useState<'INCC' | 'IPCA'>('INCC');
  const [periodoMedia, setPeriodoMedia] = useState<'180m' | '12m' | 'projection'>('12m');
  const [indicesData, setIndicesData] = useState<IndicesResponse | null>(null);
  const [loadingIndices, setLoadingIndices] = useState(true);

  // Novos Estados para Personalização
  const [valorPrimeiraMensal, setValorPrimeiraMensal] = useState<number | ''>('');
  const [usarParcelasExtras, setUsarParcelasExtras] = useState(false);
  const [tipoExtra, setTipoExtra] = useState<'semestral' | 'anual'>('semestral');
  const [valorPrimeiroExtra, setValorPrimeiroExtra] = useState<number | ''>('');
  const [dataPrimeiroExtra, setDataPrimeiroExtra] = useState<string>('');

  // Resultados
  const [resultadoSimulacao, setResultadoSimulacao] = useState<ResultadoSimulacao | null>(null);
  const [empreendimentoSlug, setEmpreendimentoSlug] = useState<string>('');

  // Carregamento Inicial
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        if (!slugParam) throw new Error('Unidade não especificada.');

        let unidadeEncontrada: Unidade | undefined;
        let slugEmp = '';
        const slugsConhecidos = ['alto-da-alvorada', 'alto-da-aurora', 'alto-do-horizonte'];
        
        // Busca robusta da unidade
        for (const slug of slugsConhecidos) {
          const unidades = getUnidadesByEmpreendimento(slug);
          const found = unidades.find(u => 
            u.unidade?.trim().toLowerCase() === slugParam.replace(slug, '').replace(/^[- ]+/, '').trim().toLowerCase() ||
            u.codigo?.toString() === slugParam
          );
          if (found) {
            unidadeEncontrada = found;
            slugEmp = slug;
            break;
          }
        }

        if (!unidadeEncontrada) throw new Error('Unidade não encontrada.');

        setUnidade(unidadeEncontrada);
        setEmpreendimentoSlug(slugEmp);
        setValorVenda(unidadeEncontrada.valorVenda || 0);

        // Configurações iniciais de datas extras baseadas na data atual
        const hoje = new Date();
        const dataSemestral = new Date(hoje.setMonth(hoje.getMonth() + 6));
        const dataAnual = new Date(hoje.setMonth(hoje.getMonth() + 6)); // Reset e +12
        
        // Ajuste fino para anual
        const hojeReset = new Date();
        const dataAnualCorreta = new Date(hojeReset.setMonth(hojeReset.getMonth() + 12));

        setDataPrimeiroExtra(tipoExtra === 'semestral' ? dataSemestral.toISOString().split('T')[0] : dataAnualCorreta.toISOString().split('T')[0]);

        await carregarIndices();

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slugParam]);

  // Atualiza data padrão quando troca o tipo de extra
  useEffect(() => {
    if (!unidade) return;
    const hoje = new Date();
    if (tipoExtra === 'semestral') {
      const d = new Date(hoje.setMonth(hoje.getMonth() + 6));
      setDataPrimeiroExtra(d.toISOString().split('T')[0]);
    } else {
      const d = new Date(hoje.setMonth(hoje.getMonth() + 12)); // Cuidado com overflow de mês no JS, ideal usar biblioteca date-fns
      // Correção simples de overflow
      const hojeBase = new Date();
      const dAnual = new Date(hojeBase.getFullYear() + 1, hojeBase.getMonth(), hojeBase.getDate());
      setDataPrimeiroExtra(dAnual.toISOString().split('T')[0]);
    }
  }, [tipoExtra, unidade]);

  // Recálculo da Simulação
  useEffect(() => {
    if (unidade && indicesData && valorVenda > 0) {
      const valorFinal = valorVenda - desconto;
      
      // Seleção da Taxa
      let taxaMensal = 0;
      const dadosIndice = indiceSelecionado === 'INCC' ? indicesData.incc : indicesData.ipca;
      if (periodoMedia === '180m') taxaMensal = dadosIndice.avg180;
      else if (periodoMedia === '12m') taxaMensal = dadosIndice.avg12;
      else taxaMensal = dadosIndice.avg12;

      const dataEntrega = deliveryDates[empreendimentoSlug] || new Date('2027-01-01');

      const resultado = calcularSimulacaoCompleto({
        valorFinal,
        percentualCaptação,
        taxaMensal,
        dataEntrega,
        dataInicio: new Date(),
        valorPrimeiraMensal: valorPrimeiraMensal === '' ? 0 : Number(valorPrimeiraMensal),
        configuracaoExtras: usarParcelasExtras ? {
          tipo: tipoExtra,
          valorBase: valorPrimeiroExtra === '' ? 0 : Number(valorPrimeiroExtra),
          dataPrimeira: new Date(dataPrimeiroExtra)
        } : null
      });

      setResultadoSimulacao(resultado);
    }
  }, [unidade, valorVenda, desconto, percentualCaptação, indiceSelecionado, periodoMedia, indicesData, empreendimentoSlug, valorPrimeiraMensal, usarParcelasExtras, tipoExtra, valorPrimeiroExtra, dataPrimeiroExtra]);

  async function carregarIndices() {
    setLoadingIndices(true);
    try {
      const res = await fetch('/api/incc-ipca');
      if (!res.ok) throw new Error('Falha API Índices');
      const data = await res.json();
      setIndicesData(data);
    } catch (err) {
      console.warn('Fallback índices:', err);
      setIndicesData({
        incc: { avg180: 0.46, avg12: 0.51 },
        ipca: { avg180: 0.42, avg12: 0.39 }
      });
    } finally {
      setLoadingIndices(false);
    }
  }

  function calcularSimulacaoCompleto(args: {
    valorFinal: number;
    percentualCaptação: number;
    taxaMensal: number;
    dataEntrega: Date;
    dataInicio: Date;
    valorPrimeiraMensal: number;
    configuracaoExtras: { tipo: 'semestral' | 'anual', valorBase: number, dataPrimeira: Date } | null;
  }): ResultadoSimulacao {
    const { valorFinal, percentualCaptação, taxaMensal, dataEntrega, dataInicio, valorPrimeiraMensal, configuracaoExtras } = args;

    const entrada = valorFinal * 0.10;
    const valorTotalCaptação = valorFinal * (percentualCaptação / 100);
    let saldoParaObras = valorTotalCaptação - entrada;
    if (saldoParaObras < 0) saldoParaObras = 0;

    const diffTime = Math.abs(dataEntrega.getTime() - dataInicio.getTime());
    const mesesTotais = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    const mesesObra = Math.max(1, mesesTotais);

    // Preparação das Parcelas Extras
    const parcelasExtrasMap: Map<number, ParcelaExtra> = new Map(); // Key: mês relativo (1-based)
    
    if (configuracaoExtras && configuracaoExtras.valorBase > 0) {
      const mesesInicioExtra = Math.round((configuracaoExtras.dataPrimeira.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24 * 30));
      const intervalo = configuracaoExtras.tipo === 'semestral' ? 6 : 12;
      
      let mesAtual = mesesInicioExtra;
      let count = 0;
      
      while (mesAtual <= mesesObra) {
        if (mesAtual >= 1) {
          // Cálculo da correção composta até o mês X
          const fatorCorrecao = Math.pow(1 + (taxaMensal / 100), mesAtual);
          const valorCorrigido = configuracaoExtras.valorBase * fatorCorrecao;
          
          parcelasExtrasMap.set(mesAtual, {
            id: `extra-${count}`,
            tipo: configuracaoExtras.tipo,
            dataVencimento: new Date(dataInicio.getTime() + (mesAtual * 30 * 24 * 60 * 60 * 1000)).toISOString(),
            valorBase: configuracaoExtras.valorBase,
            valorCorrigido
          });
        }
        mesAtual += intervalo;
        count++;
      }
    }

    // Geração das Parcelas Mensais e Integração
    const parcelasObras: Parcela[] = [];
    let saldoDevedorObra = saldoParaObras;
    let dataAtual = new Date(dataInicio);
    
    // Define o valor base das mensais (se não houver personalização, divide o saldo restante proporcionalmente)
    // Nota: Lógica simplificada. Em cenário real com extras, o valor das mensais pode precisar ser recalculado para bater o saldo exato.
    // Aqui assumimos que o usuário define a primeira e as outras seguem um padrão ou o saldo é amortecido.
    // Para este simulador: Se definir valor manual, usa ele. Se não, rateio simples do saldo disponível (ignorando correção futura para simplificar o input inicial).
    
    let valorMensalBase = 0;
    if (valorPrimeiraMensal > 0) {
      valorMensalBase = valorPrimeiraMensal;
    } else {
      // Rateio simples se não houver input manual
      valorMensalBase = saldoParaObras / mesesObra;
    }

    for (let i = 1; i <= mesesObra; i++) {
      dataAtual.setMonth(dataAtual.getMonth() + 1);
      
      // 1. Aplica Correção no Saldo Anterior
      const correcao = saldoDevedorObra * (taxaMensal / 100);
      saldoDevedorObra += correcao;
      
      // 2. Verifica se há parcela extra neste mês
      const extra = parcelasExtrasMap.get(i);
      if (extra) {
        saldoDevedorObra -= extra.valorCorrigido;
        parcelasObras.push({
          vencimento: extra.dataVencimento,
          valor: extra.valorCorrigido,
          descricao: `Parcela ${extra.tipo} (${i}º mês)`,
          tipo: 'extra',
          idExtra: extra.id
        });
      }

      // 3. Paga Parcela Mensal
      // Se for a primeira e houver valor manual, usa ele. Senão, usa o base calculado.
      // Nas subsequentes, mantém o valor nominal da primeira (comum em tabela direta) ou reajusta?
      // Vamos manter o valor nominal constante para a parcela mensal padrão, salvo se fosse um modelo de amortização.
      const valorPagoMensal = (i === 1 && valorPrimeiraMensal > 0) ? valorPrimeiraMensal : valorMensalBase;
      
      saldoDevedorObra -= valorPagoMensal;
      if (saldoDevedorObra < 0) saldoDevedorObra = 0;

      parcelasObras.push({
        vencimento: dataAtual.toISOString(),
        valor: valorPagoMensal,
        descricao: `Mensal ${i}/${mesesObra}`,
        tipo: 'mensal'
      });
    }

    const totalPagoObras = entrada + parcelasObras.reduce((acc, p) => acc + p.valor, 0);
    const saldoDevedorFinal = valorFinal - totalPagoObras;

    const extrasList = Array.from(parcelasExtrasMap.values());
    
    return {
      entrada,
      totalObras: totalPagoObras,
      saldoDevedor: saldoDevedorFinal > 0 ? saldoDevedorFinal : 0,
      parcelasObras,
      resumoExtras: {
        totalSemestrais: extrasList.filter(e => e.tipo === 'semestral').reduce((acc, e) => acc + e.valorCorrigido, 0),
        totalAnuais: extrasList.filter(e => e.tipo === 'anual').reduce((acc, e) => acc + e.valorCorrigido, 0),
        qtdSemestrais: extrasList.filter(e => e.tipo === 'semestral').length,
        qtdAnuais: extrasList.filter(e => e.tipo === 'anual').length,
      }
    };
  }

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto h-8 w-8"/></div>;
  if (error || !unidade) return (
    <Card className="m-4 border-destructive">
      <CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader>
      <CardContent>
        <p>{error}</p>
        <Button asChild className="mt-4"><Link href="/empreendimentos">Voltar</Link></Button>
      </CardContent>
    </Card>
  );

  const valorFinal = valorVenda - desconto;
  const dadosIndiceAtuais = indiceSelecionado === 'INCC' ? indicesData?.incc : indicesData?.ipca;
  const taxaAtual = periodoMedia === '180m' ? dadosIndiceAtuais?.avg180 : dadosIndiceAtuais?.avg12;

  // Cálculo de viabilidade de extras
  const dataEntregaReal = deliveryDates[empreendimentoSlug];
  const hoje = new Date();
  const mesesRestantes = Math.ceil((dataEntregaReal.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24 * 30));
  const permiteSemestral = mesesRestantes >= 6;
  const permiteAnual = mesesRestantes >= 12;

  return (
    <div className="min-h-screen bg-background font-sans pb-20">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Link corrigido para o espelho específico */}
            <Link href={`/empreendimentos#${empreendimentoSlug}`} className="text-sm font-medium hover:text-primary transition-colors flex items-center gap-1">
              ← Voltar para {empreendimentoSlug.replace(/-/g, ' ').toUpperCase()}
            </Link>
            <div className="h-6 w-px bg-border hidden sm:block"></div>
            <h1 className="text-lg font-bold hidden sm:block truncate">
              {unidade.bloco} - {unidade.unidade}
            </h1>
          </div>
          <ThemeToggleSimple />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        
        {/* Cabeçalho da Unidade */}
        <Card className="bg-gradient-to-r from-primary/5 to-transparent border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">{unidade.bloco} • Unidade {unidade.unidade}</h2>
                <p className="text-muted-foreground mt-1">{unidade.areaUtil} m² • {unidade.quartos} Quartos • {unidade.banheiros} Banheiros</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Valor de Tabela</p>
                <p className="text-3xl font-bold text-primary">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorVenda)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Painel de Controle */}
          <div className="lg:col-span-5 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" /> Parâmetros
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                
                <div className="space-y-2">
                  <Label htmlFor="desconto">Desconto (R$)</Label>
                  <Input id="desconto" type="number" value={desconto} onChange={(e) => setDesconto(Number(e.target.value))} className="font-mono" />
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Valor Final:</span>
                    <span className="text-primary">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valorFinal)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Captação na Obra (%)</Label>
                  <Select value={percentualCaptação.toString()} onValueChange={(v) => setPercentualCaptação(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25%</SelectItem>
                      <SelectItem value="30">30%</SelectItem>
                      <SelectItem value="40">40%</SelectItem>
                      <SelectItem value="50">50%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 bg-muted/50 rounded-lg space-y-4 border">
                  <div className="space-y-2">
                    <Label>Índice de Correção</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant={indiceSelecionado === 'INCC' ? 'default' : 'outline'} size="sm" onClick={() => setIndiceSelecionado('INCC')}>INCC</Button>
                      <Button variant={indiceSelecionado === 'IPCA' ? 'default' : 'outline'} size="sm" onClick={() => setIndiceSelecionado('IPCA')}>IPCA</Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Período Base</Label>
                    <Select value={periodoMedia} onValueChange={(v: any) => setPeriodoMedia(v)}>
                      <SelectTrigger className="text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="180m">180 Meses ({dadosIndiceAtuais?.avg180.toFixed(3)}% a.m.)</SelectItem>
                        <SelectItem value="12m">12 Meses ({dadosIndiceAtuais?.avg12.toFixed(3)}% a.m.)</SelectItem>
                        <SelectItem value="projection">Projeção</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-4 border-t space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="mensal-custom" className="font-semibold">Personalizar 1ª Mensal</Label>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">R$</span>
                    <Input 
                      id="mensal-custom" 
                      type="number" 
                      placeholder="Padrão (Rateio)" 
                      className="pl-10 font-mono"
                      value={valorPrimeiraMensal}
                      onChange={(e) => setValorPrimeiraMensal(e.target.value ? Number(e.target.value) : '')}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">As demais manterão o valor nominal ou seguirão a correção do saldo.</p>
                </div>

                <div className="pt-4 border-t space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch checked={usarParcelasExtras} onCheckedChange={setUsarParcelasExtras} id="extras-switch" />
                      <Label htmlFor="extras-switch" className="font-semibold cursor-pointer">Adicionar Parcelas Extras</Label>
                    </div>
                  </div>

                  {usarParcelasExtras && (
                    <div className="space-y-4 p-4 bg-primary/5 rounded-lg border border-primary/20 animate-in fade-in slide-in-from-top-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant={tipoExtra === 'semestral' ? 'default' : 'outline'} 
                          size="sm" 
                          onClick={() => setTipoExtra('semestral')}
                          disabled={!permiteSemestral}
                        >
                          Semestral
                        </Button>
                        <Button 
                          variant={tipoExtra === 'anual' ? 'default' : 'outline'} 
                          size="sm" 
                          onClick={() => setTipoExtra('anual')}
                          disabled={!permiteAnual}
                        >
                          Anual
                        </Button>
                      </div>
                      
                      {!permiteSemestral && tipoExtra === 'semestral' && <p className="text-xs text-red-500">Prazo insuficiente para semestrais.</p>}
                      {!permiteAnual && tipoExtra === 'anual' && <p className="text-xs text-red-500">Prazo insuficiente para anuais.</p>}

                      <div className="space-y-2">
                        <Label>Valor da 1ª Parcela Extra</Label>
                        <Input 
                          type="number" 
                          value={valorPrimeiroExtra} 
                          onChange={(e) => setValorPrimeiroExtra(e.target.value ? Number(e.target.value) : '')}
                          placeholder="0.00"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Data de Vencimento (1ª)</Label>
                        <Input 
                          type="date" 
                          value={dataPrimeiroExtra} 
                          onChange={(e) => setDataPrimeiroExtra(e.target.value)}
                          min={hoje.toISOString().split('T')[0]}
                          max={dataEntregaReal.toISOString().split('T')[0]}
                        />
                        <p className="text-xs text-muted-foreground">As próximas ocorrerão a cada {tipoExtra === 'semestral' ? '6' : '12'} meses.</p>
                      </div>
                    </div>
                  )}
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Resultados */}
          <div className="lg:col-span-7">
            <Card className="h-full flex flex-col shadow-lg border-primary/20">
              <CardHeader className="bg-primary/5 border-b border-primary/10">
                <CardTitle className="flex items-center gap-2 text-primary">
                  <TrendingUp className="h-5 w-5" /> Simulação Detalhada
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto p-6 space-y-6">
                {resultadoSimulacao ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-100">
                        <p className="text-xs text-green-800 font-medium mb-1">Entrada (Sinal)</p>
                        <p className="text-xl font-bold text-green-700">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resultadoSimulacao.entrada)}</p>
                      </div>
                      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-100">
                        <p className="text-xs text-blue-800 font-medium mb-1">Total nas Obras</p>
                        <p className="text-xl font-bold text-blue-700">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resultadoSimulacao.totalObras)}</p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200">
                        <p className="text-xs text-slate-800 font-medium mb-1">Saldo Pós-Obra</p>
                        <p className="text-xl font-bold text-slate-700">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resultadoSimulacao.saldoDevedor)}</p>
                      </div>
                    </div>

                    {resultadoSimulacao.resumoExtras.qtdSemestrais > 0 || resultadoSimulacao.resumoExtras.qtdAnuais > 0 ? (
                      <Alert className="bg-indigo-50 border-indigo-200">
                        <CheckCircle2 className="h-4 w-4 text-indigo-600" />
                        <AlertDescription className="ml-2 text-indigo-900">
                          Foram incluídas <strong>{resultadoSimulacao.resumoExtras.qtdSemestrais} parcelas semestrais</strong> e <strong>{resultadoSimulacao.resumoExtras.qtdAnuais} anuais</strong> com correção aplicada.
                        </AlertDescription>
                      </Alert>
                    ) : null}

                    <div>
                      <h4 className="font-semibold text-lg mb-3 flex items-center justify-between">
                        Fluxo de Pagamentos
                        <span className="text-xs bg-muted px-2 py-1 rounded-full">{resultadoSimulacao.parcelasObras.length} lançamentos</span>
                      </h4>
                      <div className="border rounded-lg overflow-hidden">
                        <div className="max-h-[500px] overflow-y-auto">
                          <Table>
                            <TableHeader className="bg-muted/50 sticky top-0 z-10">
                              <TableRow>
                                <TableHead className="w-[100px] text-center">Tipo</TableHead>
                                <TableHead>Vencimento</TableHead>
                                <TableHead className="text-right">Valor</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {resultadoSimulacao.parcelasObras.map((p, i) => (
                                <TableRow key={i} className={p.tipo === 'extra' ? 'bg-indigo-50/50 dark:bg-indigo-950/10' : ''}>
                                  <TableCell className="text-center">
                                    <span className={`text-xs px-2 py-1 rounded-full ${p.tipo === 'extra' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-600'}`}>
                                      {p.tipo === 'extra' ? 'Extra' : 'Mensal'}
                                    </span>
                                  </TableCell>
                                  <TableCell>{new Date(p.vencimento).toLocaleDateString('pt-BR')}</TableCell>
                                  <TableCell className="text-right font-mono font-medium">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.valor)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <Loader2 className="animate-spin h-8 w-8" />
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
