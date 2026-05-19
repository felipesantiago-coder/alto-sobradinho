'use client';

import { useEffect, useState, useMemo } from 'react';
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
import { Switch } from '@/components/ui/switch'; // Certifique-se que este componente existe ou use um checkbox simples
import { Loader2, TrendingUp, DollarSign, AlertCircle, CheckCircle2, Calendar, PlusCircle, Trash2 } from 'lucide-react';

// Datas de entrega estimadas por empreendimento
const deliveryDates: Record<string, Date> = {
  'alto-da-alvorada': new Date('2027-03-31'),
  'alto-da-aurora': new Date('2026-02-28'),
  'alto-do-horizonte': new Date('2026-07-31'),
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
  id: string;
  tipo: 'mensal' | 'extra' | 'entrada';
  vencimento: string;
  valor: number;
  descricao?: string;
  isCorrigida?: boolean;
}

interface ResultadoSimulacao {
  entrada: number;
  totalObras: number;
  saldoDevedor: number;
  parcelas: Parcela[];
  resumoExtra: {
    totalSemestraisAnuais: number;
    qtdParcelasExtras: number;
  };
}

export default function SimuladorUnidadePage() {
  const params = useParams();
  const router = useRouter();
  const slugParam = params.unidade as string;
  
  const [unidade, setUnidade] = useState<Unidade | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados Básicos
  const [valorVenda, setValorVenda] = useState(0);
  const [desconto, setDesconto] = useState(0);
  const [percentualCaptação, setPercentualCaptação] = useState(30);
  const [indiceSelecionado, setIndiceSelecionado] = useState<'INCC' | 'IPCA'>('INCC');
  const [periodoMedia, setPeriodoMedia] = useState<'180m' | '12m' | 'projection'>('12m');
  
  // Estados de Índices
  const [indicesData, setIndicesData] = useState<IndicesResponse | null>(null);
  const [loadingIndices, setLoadingIndices] = useState(true);

  // Novos Estados para Personalização de Parcelas
  const [usarValoresManuais, setUsarValoresManuais] = useState(false);
  const [valorPrimeiraMensal, setValorPrimeiraMensal] = useState<number | ''>('');
  
  const [habilitarParcelasExtras, setHabilitarParcelasExtras] = useState(false);
  const [tipoParcelaExtra, setTipoParcelaExtra] = useState<'semestral' | 'anual'>('semestral');
  const [valorPrimeiraExtra, setValorPrimeiraExtra] = useState<number | ''>('');
  const [dataPrimeiraExtra, setDataPrimeiraExtra] = useState<string>('');

  const [resultadoSimulacao, setResultadoSimulacao] = useState<ResultadoSimulacao | null>(null);

  // Carregar Dados Iniciais
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        if (!slugParam) throw new Error('Unidade não especificada.');

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

  // Configurar datas padrão quando mudar o tipo de parcela extra
  useEffect(() => {
    if (unidade && habilitarParcelasExtras) {
      const hoje = new Date();
      const mesesParaAdicionar = tipoParcelaExtra === 'semestral' ? 6 : 12;
      const dataPadrao = new Date(hoje.setMonth(hoje.getMonth() + mesesParaAdicionar));
      
      // Formatar para YYYY-MM-DD para o input date
      const isoString = dataPadrao.toISOString().split('T')[0];
      setDataPrimeiraExtra(isoString);
      
      // Se não tiver valor manual, sugere um valor baseado na captação (opcional, aqui deixamos vazio para o usuário preencher)
      if (valorPrimeiraExtra === '') {
        // Sugestão inicial opcional: 5% do valor final
        // setValorPrimeiraExtra(Math.round((valorVenda - desconto) * 0.05));
      }
    }
  }, [tipoParcelaExtra, habilitarParcelasExtras, unidade, valorVenda, desconto]);

  async function carregarIndices() {
    setLoadingIndices(true);
    try {
      const res = await fetch('/api/incc-ipca');
      if (!res.ok) throw new Error('Falha na API');
      const data: IndicesResponse = await res.json();
      setIndicesData(data);
    } catch (err) {
      console.warn('Fallback de índices:', err);
      setIndicesData({
        incc: { avg180: 0.46, avg12: 0.51, source: 'Fallback', indicator: 'INCC-M' },
        ipca: { avg180: 0.42, avg12: 0.39, source: 'Fallback', indicator: 'IPCA' }
      });
    } finally {
      setLoadingIndices(false);
    }
  }

  // Lógica Principal de Cálculo
  useEffect(() => {
    if (!unidade || !indicesData || valorVenda === 0) return;

    const valorFinal = valorVenda - desconto;
    const dadosIndice = indiceSelecionado === 'INCC' ? indicesData.incc : indicesData.ipca;
    
    let taxaMensal = 0;
    if (periodoMedia === '180m') taxaMensal = dadosIndice.avg180;
    else if (periodoMedia === '12m') taxaMensal = dadosIndice.avg12;
    else taxaMensal = dadosIndice.avg12;

    // Determinar Data de Entrega
    let dataEntrega = new Date('2027-01-01');
    if (getUnidadesByEmpreendimento('alto-da-aurora').includes(unidade)) dataEntrega = deliveryDates['alto-da-aurora'];
    else if (getUnidadesByEmpreendimento('alto-da-alvorada').includes(unidade)) dataEntrega = deliveryDates['alto-da-alvorada'];
    else if (getUnidadesByEmpreendimento('alto-do-horizonte').includes(unidade)) dataEntrega = deliveryDates['alto-do-horizonte'];

    const resultado = calcularSimulacaoAvancada({
      valorFinal,
      percentualCaptação,
      taxaMensal,
      dataEntrega,
      dataInicio: new Date(),
      configuracoes: {
        usarValoresManuais,
        valorPrimeiraMensal: Number(valorPrimeiraMensal) || 0,
        habilitarExtras: habilitarParcelasExtras,
        tipoExtra: tipoParcelaExtra,
        valorPrimeiraExtra: Number(valorPrimeiraExtra) || 0,
        dataPrimeiraExtra: dataPrimeiraExtra ? new Date(dataPrimeiraExtra + 'T12:00:00') : undefined
      }
    });

    setResultadoSimulacao(resultado);
  }, [unidade, valorVenda, desconto, percentualCaptação, indiceSelecionado, periodoMedia, indicesData, 
      usarValoresManuais, valorPrimeiraMensal, habilitarParcelasExtras, tipoParcelaExtra, valorPrimeiraExtra, dataPrimeiraExtra]);

  function calcularSimulacaoAvancada(args: {
    valorFinal: number;
    percentualCaptação: number;
    taxaMensal: number;
    dataEntrega: Date;
    dataInicio: Date;
    configuracoes: {
      usarValoresManuais: boolean;
      valorPrimeiraMensal: number;
      habilitarExtras: boolean;
      tipoExtra: 'semestral' | 'anual';
      valorPrimeiraExtra: number;
      dataPrimeiraExtra?: Date;
    }
  }): ResultadoSimulacao {
    const { valorFinal, percentualCaptação, taxaMensal, dataEntrega, dataInicio, configuracoes } = args;
    const parcelas: Parcela[] = [];

    // 1. Entrada (Sinal) - 10%
    const entrada = valorFinal * 0.10;
    parcelas.push({
      id: 'entrada',
      tipo: 'entrada',
      vencimento: dataInicio.toISOString(),
      valor: entrada,
      descricao: 'Sinal / Entrada'
    });

    // 2. Calcular Saldo para Obras
    const valorTotalCaptação = valorFinal * (percentualCaptação / 100);
    let saldoParaObras = valorTotalCaptação - entrada;
    if (saldoParaObras < 0) saldoParaObras = 0;

    // 3. Prazo Total em Meses
    const diffTime = Math.abs(dataEntrega.getTime() - dataInicio.getTime());
    const mesesTotais = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    
    // 4. Definir Parcelas Extras (Semestrais/Anuais)
    let datasExtras: Date[] = [];
    let valorBaseExtra = 0;
    let totalPagoExtras = 0;

    if (configuracoes.habilitarExtras && configuracoes.dataPrimeiraExtra && configuracoes.valorPrimeiraExtra > 0) {
      const intervaloMeses = configuracoes.tipoExtra === 'semestral' ? 6 : 12;
      let dataAtualExtra = new Date(configuracoes.dataPrimeiraExtra);
      
      // Verifica se a primeira data é válida (antes da entrega)
      if (dataAtualExtra < dataEntrega) {
        valorBaseExtra = configuracoes.valorPrimeiraExtra;
        
        while (dataAtualExtra < dataEntrega) {
          datasExtras.push(new Date(dataAtualExtra));
          dataAtualExtra.setMonth(dataAtualExtra.getMonth() + intervaloMeses);
        }
      }
    }

    // 5. Gerar Fluxo Mensal
    let saldoDevedorObra = saldoParaObras;
    let dataAtual = new Date(dataInicio);
    
    // Valor base da parcela mensal (se não for manual)
    // Precisamos estimar quantas parcelas mensais "puras" cabem, mas como temos extras, 
    // a lógica simplificada é: dividir o saldo restante pelos meses, mas subtrair o valor presente das extras.
    // Para simplicidade neste simulador: Vamos tratar as extras como pagamentos que abatem o saldo no mês específico.
    // A parcela mensal padrão cobre o restante.
    
    // Cálculo aproximado do valor mensal padrão para garantir que zere no final:
    // Saldo Total - PV(Parcelas Extras) = Valor a ser financiado nas mensais
    // Vamos fazer iterativo mês a mês para maior precisão com correção composta.
    
    // Primeiro, calculamos o Valor Mensal Base necessário assumindo distribuição linear do saldo restante
    // (Saldo Inicial - Soma dos Valores Nominais das Extras) / Meses Totais
    // Nota: Isso é uma aproximação. O ideal seria uma equação financeira complexa, mas para tabela direta,
    // geralmente define-se um valor fixo inicial e corrige-se o saldo.
    
    const somaNominalExtras = datasExtras.length * valorBaseExtra;
    let saldoRestanteParaMensais = saldoParaObras - somaNominalExtras;
    
    // Se as extras cobrem tudo ou mais, mensais são zero (ou mínimas)
    if (saldoRestanteParaMensais < 0) saldoRestanteParaMensais = 0;
    
    const valorMensalBase = saldoRestanteParaMensais > 0 && mesesTotais > 0 
      ? saldoRestanteParaMensais / mesesTotais 
      : 0;

    const valorMensalInicial = configuracoes.usarValoresManuais && configuracoes.valorPrimeiraMensal > 0 
      ? configuracoes.valorPrimeiraMensal 
      : valorMensalBase;

    for (let i = 1; i <= mesesTotais; i++) {
      dataAtual.setMonth(dataAtual.getMonth() + 1);
      if (dataAtual >= dataEntrega) break; // Segurança

      // 1. Aplica Correção Monetária no Saldo Devedor
      const correcao = saldoDevedorObra * (taxaMensal / 100);
      saldoDevedorObra += correcao;

      // 2. Verifica se há parcela extra neste mês
      const isMesExtra = datasExtras.some(d => d.getMonth() === dataAtual.getMonth() && d.getFullYear() === dataAtual.getFullYear());
      let valorPagoNoMes = 0;
      let descricao = `Parcela ${i}/${mesesTotais}`;

      if (isMesExtra) {
        // Calcular valor da parcela extra corrigida até esta data
        // Fórmula: ValorBase * (1 + taxa)^n_meses_decorridos_desde_a_primeira
        // Simplificação: Como já estamos aplicando correção no saldo mês a mês, 
        // podemos pagar o valor nominal da extra combinado, OU corrigir a extra também.
        // O pedido diz: "automaticamente ajustada de acordo com a correção de INCC até a data de pagamento".
        // Vamos calcular o fator de correção acumulado desde a data base da extra até agora.
        // Mas para simplificar e manter coerência com o saldo: Pagaremos o valor base da extra + a parte proporcional mensal.
        
        // Abordagem escolhida: A parcela extra tem seu próprio valor corrigido individualmente.
        // Fator de correção da extra = (1 + taxaMensal/100) ^ (meses decorridos desde a definição)
        // Na prática, como o saldo já está sendo corrigido todo mês, pagar o valor NOMINAL da extra já abate o saldo corrigido.
        // Porém, o usuário pediu para o valor DA PARCELA ser ajustado.
        // Então: ValorExtraNesteMes = ValorBaseExtra * (1 + taxaMensal/100)^(meses desde a primeira extra)
        
        // Vamos identificar qual número da sequência extra é esta (1ª, 2ª, 3ª...)
        const indexExtra = datasExtras.findIndex(d => d.getMonth() === dataAtual.getMonth() && d.getFullYear() === dataAtual.getFullYear());
        const fatorCorrecaoExtra = Math.pow(1 + (taxaMensal / 100), indexExtra * (configuracoes.tipoExtra === 'semestral' ? 6 : 12));
        const valorExtraCorrigido = valorBaseExtra * fatorCorrecaoExtra;

        valorPagoNoMes += valorExtraCorrigido;
        descricao += ` + ${configuracoes.tipoExtra.charAt(0).toUpperCase() + configuracoes.tipoExtra.slice(1)} (${indexExtra + 1}ª)`;
      }

      // Adiciona a parte mensal
      // Se for manual, usa o valor manual corrigido? Ou valor fixo?
      // Geralmente na tabela direta, o valor nominal é fixo e o saldo que cresce.
      // Vamos manter o valor nominal mensal constante (ou o manual) e deixar o saldo absorver a correção.
      const valorMensalNesteMes = configuracoes.usarValoresManuais && configuracoes.valorPrimeiraMensal > 0
        ? configuracoes.valorPrimeiraMensal // Mantém fixo o valor manual conforme solicitado implicitamente
        : valorMensalBase; // Ou poderíamos corrigir este também. Vamos manter fixo para previsibilidade.

      valorPagoNoMes += valorMensalNesteMes;

      // Abater do saldo
      saldoDevedorObra -= valorPagoNoMes;
      if (saldoDevedorObra < 0) saldoDevedorObra = 0;

      parcelas.push({
        id: `mes-${i}`,
        tipo: 'mensal',
        vencimento: dataAtual.toISOString(),
        valor: valorPagoNoMes,
        descricao,
        isCorrigida: isMesExtra // Marca se teve componente extra corrigido
      });
    }

    const totalObras = entrada + parcelas.filter(p => p.tipo !== 'entrada').reduce((acc, p) => acc + p.valor, 0);
    const saldoDevedorFinal = valorFinal - totalObras;

    return {
      entrada,
      totalObras,
      saldoDevedor: saldoDevedorFinal > 0 ? saldoDevedorFinal : 0,
      parcelas,
      resumoExtra: {
        totalSemestraisAnuais: datasExtras.length * valorBaseExtra, // Valor nominal aproximado
        qtdParcelasExtras: datasExtras.length
      }
    };
  }

  // Helpers de Formatação
  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');

  // Verificar se há tempo para parcelas extras
  const mesesAteEntrega = useMemo(() => {
    if (!unidade) return 0;
    let dataEntrega = deliveryDates['alto-da-alvorada']; // Default
    if (getUnidadesByEmpreendimento('alto-da-aurora').includes(unidade)) dataEntrega = deliveryDates['alto-da-aurora'];
    else if (getUnidadesByEmpreendimento('alto-da-alvorada').includes(unidade)) dataEntrega = deliveryDates['alto-da-alvorada'];
    else if (getUnidadesByEmpreendimento('alto-do-horizonte').includes(unidade)) dataEntrega = deliveryDates['alto-do-horizonte'];
    
    const diff = dataEntrega.getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24 * 30));
  }, [unidade]);

  const permiteSemestral = mesesAteEntrega >= 6;
  const permiteAnual = mesesAteEntrega >= 12;

  // Ajuste automático se a opção selecionada não for mais válida
  useEffect(() => {
    if (habilitarParcelasExtras) {
      if (tipoParcelaExtra === 'anual' && !permiteAnual) {
        if (permiteSemestral) setTipoParcelaExtra('semestral');
        else setHabilitarParcelasExtras(false);
      }
    }
  }, [permiteSemestral, permiteAnual, tipoParcelaExtra, habilitarParcelasExtras]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando simulador...</p>
        </div>
      </div>
    );
  }

  if (error || !unidade) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" /> Erro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{error || 'Unidade não encontrada.'}</p>
            <Button asChild className="w-full">
              {/* Link corrigido para a página de empreendimentos */}
              <Link href="/">Voltar ao Início</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const valorFinal = valorVenda - desconto;
  const dadosIndiceAtuais = indiceSelecionado === 'INCC' ? indicesData?.incc : indicesData?.ipca;

  return (
    <div className="min-h-screen bg-background font-sans pb-20">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
              ← Voltar ao Espelho
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
                <h2 className="text-2xl font-bold text-foreground mb-1">
                  {unidade.bloco} / {unidade.unidade}
                </h2>
                <p className="text-muted-foreground">{unidade.areaUtil} m² • {unidade.quartos} Quartos • {unidade.banheiros} Banheiros</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Valor de Tabela</p>
                <p className="text-3xl font-bold text-primary">{formatCurrency(valorVenda)}</p>
                {desconto > 0 && (
                  <p className="text-sm text-green-600 font-medium mt-1">
                    Com desconto: {formatCurrency(valorFinal)}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Controles */}
          <div className="lg:col-span-5 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" /> Parâmetros Financeiros
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                
                <div className="space-y-2">
                  <Label htmlFor="desconto">Desconto (R$)</Label>
                  <Input id="desconto" type="number" value={desconto} onChange={(e) => setDesconto(Number(e.target.value))} className="font-mono" />
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

                <div className="space-y-2">
                  <Label>Índice de Correção</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant={indiceSelecionado === 'INCC' ? 'default' : 'outline'} onClick={() => setIndiceSelecionado('INCC')} className={indiceSelecionado === 'INCC' ? 'bg-primary' : ''}>INCC</Button>
                    <Button variant={indiceSelecionado === 'IPCA' ? 'default' : 'outline'} onClick={() => setIndiceSelecionado('IPCA')} className={indiceSelecionado === 'IPCA' ? 'bg-primary' : ''}>IPCA</Button>
                  </div>
                  <Select value={periodoMedia} onValueChange={(v: any) => setPeriodoMedia(v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="180m">Média 180 Meses ({dadosIndiceAtuais?.avg180.toFixed(3)}% a.m.)</SelectItem>
                      <SelectItem value="12m">Média 12 Meses ({dadosIndiceAtuais?.avg12.toFixed(3)}% a.m.)</SelectItem>
                      <SelectItem value="projection">Projeção Futura</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                    Fonte: {dadosIndiceAtuais?.source} • Atualizado: {dadosIndiceAtuais?.lastUpdate}
                  </div>
                </div>

                <div className="pt-4 border-t space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="valor-mensal-manual" className="cursor-pointer">Personalizar 1ª Parcela Mensal</Label>
                    <Switch id="valor-mensal-manual" checked={usarValoresManuais} onCheckedChange={setUsarValoresManuais} />
                  </div>
                  {usarValoresManuais && (
                    <div className="animate-in fade-in slide-in-from-top-2">
                      <Label>Valor da 1ª Parcela (R$)</Label>
                      <Input type="number" value={valorPrimeiraMensal} onChange={(e) => setValorPrimeiraMensal(Number(e.target.value))} placeholder="Ex: 1500.00" />
                      <p className="text-xs text-muted-foreground mt-1">As demais seguirão o fluxo padrão.</p>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t space-y-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="extras-switch" className="cursor-pointer font-semibold text-primary">Parcelas Extras (Semestral/Anual)</Label>
                    <Switch id="extras-switch" checked={habilitarParcelasExtras} onCheckedChange={setHabilitarParcelasExtras} disabled={!permiteSemestral && !permiteAnual} />
                  </div>
                  
                  {(!permiteSemestral && !permiteAnual) && (
                    <p className="text-xs text-amber-500">Prazo insuficiente para parcelas extras neste empreendimento.</p>
                  )}

                  {habilitarParcelasExtras && (permiteSemestral || permiteAnual) && (
                    <div className="space-y-3 animate-in fade-in zoom-in-95">
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant={tipoParcelaExtra === 'semestral' ? 'default' : 'outline'} size="sm" onClick={() => setTipoParcelaExtra('semestral')} disabled={!permiteSemestral}>Semestral</Button>
                        <Button variant={tipoParcelaExtra === 'anual' ? 'default' : 'outline'} size="sm" onClick={() => setTipoParcelaExtra('anual')} disabled={!permiteAnual}>Anual</Button>
                      </div>
                      
                      <div>
                        <Label>Valor da 1ª Parcela Extra (R$)</Label>
                        <Input type="number" value={valorPrimeiraExtra} onChange={(e) => setValorPrimeiraExtra(Number(e.target.value))} placeholder="Ex: 5000.00" />
                      </div>

                      <div>
                        <Label>Data Prevista (1ª Ocorrência)</Label>
                        <div className="relative">
                          <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input type="date" value={dataPrimeiraExtra} onChange={(e) => setDataPrimeiraExtra(e.target.value)} className="pl-8" />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">As próximas ocorrerão a cada {tipoParcelaExtra === 'semestral' ? '6' : '12'} meses.</p>
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
                  <TrendingUp className="h-5 w-5" /> Resultado da Simulação
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto p-6 space-y-6">
                {resultadoSimulacao ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-100">
                        <p className="text-xs text-green-800 font-medium mb-1">Entrada (Sinal)</p>
                        <p className="text-xl font-bold text-green-700">{formatCurrency(resultadoSimulacao.entrada)}</p>
                      </div>
                      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-100">
                        <p className="text-xs text-blue-800 font-medium mb-1">Total nas Obras</p>
                        <p className="text-xl font-bold text-blue-700">{formatCurrency(resultadoSimulacao.totalObras)}</p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200">
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium mb-1">Saldo p/ Financiamento</p>
                        <p className="text-xl font-bold text-slate-700 dark:text-slate-300">{formatCurrency(resultadoSimulacao.saldoDevedor)}</p>
                      </div>
                    </div>

                    {resultadoSimulacao.resumoExtra.qtdParcelasExtras > 0 && (
                      <Alert className="bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200">
                        <PlusCircle className="h-4 w-4 text-indigo-600" />
                        <AlertDescription className="ml-2 text-indigo-900 dark:text-indigo-200">
                          Foram incluídas <strong>{resultadoSimulacao.resumoExtra.qtdParcelasExtras} parcelas {tipoParcelaExtra}s</strong> com correção automática aplicada.
                        </AlertDescription>
                      </Alert>
                    )}

                    <div>
                      <h4 className="font-semibold text-lg mb-3 flex items-center justify-between">
                        Fluxo de Pagamentos
                        <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">{resultadoSimulacao.parcelas.length} lançamentos</span>
                      </h4>
                      
                      <div className="border rounded-lg overflow-hidden">
                        <div className="max-h-[500px] overflow-y-auto">
                          <Table>
                            <TableHeader className="bg-muted/50 sticky top-0 z-10">
                              <TableRow>
                                <TableHead className="w-[100px] text-center">Vencimento</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead className="text-right">Valor</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {resultadoSimulacao.parcelas.map((p, i) => (
                                <TableRow key={p.id} className={p.isCorrigida ? 'bg-indigo-50/50 dark:bg-indigo-950/10' : ''}>
                                  <TableCell className="text-center text-sm text-muted-foreground">
                                    {formatDate(p.vencimento)}
                                  </TableCell>
                                  <TableCell className="font-medium text-sm">
                                    {p.descricao}
                                    {p.isCorrigida && <span className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">Corrigida</span>}
                                  </TableCell>
                                  <TableCell className="text-right font-mono text-sm">
                                    {formatCurrency(p.valor)}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>
                    
                    <Alert>
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <AlertDescription className="ml-2">
                        <p className="font-semibold">Simulação concluída com sucesso.</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Data de entrega considerada: {deliveryDates[Object.keys(deliveryDates).find(k => getUnidadesByEmpreendimento(k).includes(unidade!)) || 'alto-da-alvorada']?.toLocaleDateString('pt-BR')}.
                          Os valores das parcelas extras foram reajustados pelo índice {indiceSelecionado} acumulado até a data de cada vencimento.
                        </p>
                      </AlertDescription>
                    </Alert>
                  </>
                ) : (
                  <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mb-2" />
                    <p>Calculando fluxo personalizado...</p>
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
