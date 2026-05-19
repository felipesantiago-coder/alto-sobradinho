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
import { Loader2, TrendingUp, DollarSign, AlertCircle, CheckCircle2, Calendar, Plus, Trash2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch'; // Certifique-se de ter este componente ou use um checkbox

// DATAS DE ENTREGA ATUALIZADAS
const deliveryDates: Record<string, Date> = {
  'alto-da-alvorada': new Date('2027-03-31'),
  'alto-da-aurora': new Date('2029-02-28'),
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

interface ParcelaExtra {
  id: string;
  tipo: 'semestral' | 'anual';
  valorBase: number; // Valor informado pelo usuário (na data de hoje)
  dataVencimento: string; // Data do primeiro vencimento
  valorCorrigido: number; // Valor calculado com INCC até a data
}

interface Parcela {
  vencimento: string;
  valor: number;
  descricao?: string;
  tipo: 'mensal' | 'extra';
  id?: string;
}

interface ResultadoSimulacao {
  entrada: number;
  totalObras: number;
  saldoDevedor: number;
  parcelasObras: Parcela[];
  taxaMensalAplicada: number;
}

export default function SimuladorUnidadePage() {
  const params = useParams();
  const router = useRouter();
  const slugParam = params.unidade as string;
  
  const [unidade, setUnidade] = useState<Unidade | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [empreendimentoSlug, setEmpreendimentoSlug] = useState<string>('');
  
  // Estados do Simulador
  const [valorVenda, setValorVenda] = useState(0);
  const [desconto, setDesconto] = useState(0);
  const [percentualCaptação, setPercentualCaptação] = useState(30); // Default 30%
  const [indiceSelecionado, setIndiceSelecionado] = useState<'INCC' | 'IPCA'>('INCC');
  const [periodoMedia, setPeriodoMedia] = useState<'180m' | '12m'>('12m');
  
  // Novos Estados para Personalização
  const [valorPrimeiraParcelaMensal, setValorPrimeiraParcelaMensal] = useState<number | ''>('');
  const [usarParcelasExtras, setUsarParcelasExtras] = useState(false);
  const [tipoParcelaExtra, setTipoParcelaExtra] = useState<'semestral' | 'anual'>('semestral');
  const [valorPrimeiraParcelaExtra, setValorPrimeiraParcelaExtra] = useState<number | ''>('');
  const [dataPrimeiraParcelaExtra, setDataPrimeiraParcelaExtra] = useState<string>('');

  // Dados dos Índices
  const [indicesData, setIndicesData] = useState<IndicesResponse | null>(null);
  const [loadingIndices, setLoadingIndices] = useState(true);
  
  // Resultados
  const [resultadoSimulacao, setResultadoSimulacao] = useState<ResultadoSimulacao | null>(null);

  // Carregar Unidade e Configuração Inicial
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        if (!slugParam) throw new Error('Nenhuma unidade especificada.');

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
          if (unidadeEncontrada) setEmpreendimentoSlug(slugDetectado);
        } else {
          for (const slug of slugsConhecidos) {
            const unidades = getUnidadesByEmpreendimento(slug);
            unidadeEncontrada = unidades.find(u => u.unidade?.trim().toLowerCase() === slugParam.trim().toLowerCase());
            if (unidadeEncontrada) {
              setEmpreendimentoSlug(slug);
              break;
            }
          }
        }

        if (!unidadeEncontrada) throw new Error(`Unidade "${slugParam}" não encontrada.`);

        setUnidade(unidadeEncontrada);
        setValorVenda(unidadeEncontrada.valorVenda || 0);

        // Configurar data padrão para parcela extra baseada no tipo
        const hoje = new Date();
        if (tipoParcelaExtra === 'semestral') {
          hoje.setMonth(hoje.getMonth() + 6);
        } else {
          hoje.setMonth(hoje.getMonth() + 12);
        }
        setDataPrimeiraParcelaExtra(hoje.toISOString().split('T')[0]);

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

  // Atualizar data padrão se mudar o tipo de parcela extra
  useEffect(() => {
    if (!unidade) return;
    const hoje = new Date();
    if (tipoParcelaExtra === 'semestral') {
      hoje.setMonth(hoje.getMonth() + 6);
    } else {
      hoje.setMonth(hoje.getMonth() + 12);
    }
    // Só atualiza se não tiver sido manualmente alterada (lógica simplificada: atualiza sempre que troca o tipo)
    setDataPrimeiraParcelaExtra(hoje.toISOString().split('T')[0]);
  }, [tipoParcelaExtra, unidade]);

  // Carregar Índices
  async function carregarIndices() {
    setLoadingIndices(true);
    try {
      const res = await fetch('/api/incc-ipca');
      if (!res.ok) throw new Error('Falha na conexão');
      const data: IndicesResponse = await res.json();
      
      // Validação de sanidade para evitar valores absurdos ou zerados indevidamente
      // Se vier algo como 175%, algo está errado no parsing. Vamos limitar a um teto razoável (ex: 5% a.m.)
      const sanitize = (val: number) => (val > 0 && val < 5) ? val : 0;

      setIndicesData({
        incc: { ...data.incc, avg12: sanitize(data.incc.avg12), avg180: sanitize(data.incc.avg180) },
        ipca: { ...data.ipca, avg12: sanitize(data.ipca.avg12), avg180: sanitize(data.ipca.avg180) }
      });
    } catch (err) {
      console.warn('Erro índices, usando fallback:', err);
      setIndicesData({
        incc: { avg180: 0.48, avg12: 0.46, source: 'Fallback', indicator: 'INCC' },
        ipca: { avg180: 0.42, avg12: 0.38, source: 'Fallback', indicator: 'IPCA' }
      });
    } finally {
      setLoadingIndices(false);
    }
  }

  // Calcular Simulação
  useEffect(() => {
    if (!unidade || !indicesData || valorVenda <= 0 || !empreendimentoSlug) return;

    const valorFinal = valorVenda - desconto;
    const dadosIndice = indiceSelecionado === 'INCC' ? indicesData.incc : indicesData.ipca;
    
    // Selecionar taxa baseada no período (garantindo que não seja zero se tiver fallback)
    let taxaMensal = periodoMedia === '180m' ? dadosIndice.avg180 : dadosIndice.avg12;
    if (taxaMensal === 0) taxaMensal = 0.45; // Segurança extrema

    const dataEntrega = deliveryDates[empreendimentoSlug];
    const dataInicio = new Date();
    
    // Meses totais até entrega
    const diffTime = Math.abs(dataEntrega.getTime() - dataInicio.getTime());
    const mesesTotais = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
    
    // Cálculos Financeiros
    const entrada = valorFinal * 0.10;
    const valorTotalCaptação = valorFinal * (percentualCaptação / 100);
    let saldoParaObras = valorTotalCaptação - entrada;
    if (saldoParaObras < 0) saldoParaObras = 0;

    const parcelasObras: Parcela[] = [];
    let saldoDevedorObra = saldoParaObras;
    let dataAtual = new Date(dataInicio);
    
    // Definir valor base da parcela mensal
    let valorBaseMensal = saldoParaObras / mesesTotais;
    if (valorPrimeiraParcelaMensal !== '' && Number(valorPrimeiraParcelaMensal) > 0) {
      valorBaseMensal = Number(valorPrimeiraParcelaMensal);
    }

    // Preparar parcelas extras se ativado
    let proximaDataExtra = dataPrimeiraParcelaExtra ? new Date(dataPrimeiraParcelaExtra) : null;
    const intervaloExtraMeses = tipoParcelaExtra === 'semestral' ? 6 : 12;
    let valorBaseExtra = (valorPrimeiraParcelaExtra !== '' && Number(valorPrimeiraParcelaExtra) > 0) ? Number(valorPrimeiraParcelaExtra) : 0;

    // Loop mês a mês
    for (let i = 0; i < mesesTotais; i++) {
      dataAtual.setMonth(dataAtual.getMonth() + 1);
      
      // 1. Aplicar correção no saldo
      const correcao = saldoDevedorObra * (taxaMensal / 100);
      saldoDevedorObra += correcao;

      // 2. Verificar se há parcela extra neste mês
      let valorPagoExtra = 0;
      if (usarParcelasExtras && proximaDataExtra && valorBaseExtra > 0) {
        // Verifica se o mês atual bate com a data da parcela extra (tolerância de dias)
        const diffDias = Math.abs(dataAtual.getTime() - proximaDataExtra.getTime());
        if (diffDias < 15 * 24 * 60 * 60 * 1000) { // Dentro de 15 dias da data alvo
          
          // Calcular valor corrigido da parcela extra
          const mesesDesdeHoje = (dataAtual.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24 * 30);
          const fatorCorrecao = Math.pow(1 + (taxaMensal / 100), mesesDesdeHoje);
          const valorCorrigido = valorBaseExtra * fatorCorrecao;
          
          valorPagoExtra = valorCorrigido;
          
          parcelasObras.push({
            vencimento: dataAtual.toISOString(),
            valor: valorCorrigido,
            descricao: `Parcela ${tipoParcelaExtra === 'semestral' ? 'Semestral' : 'Anual'} (Corrigida)`,
            tipo: 'extra',
            id: `extra-${i}`
          });

          // Agendar próxima parcela extra
          proximaDataExtra.setMonth(proximaDataExtra.getMonth() + intervaloExtraMeses);
          // Se a próxima extrapolar a entrega, nullifica
          if (proximaDataExtra >= dataEntrega) proximaDataExtra = null;
        }
      }

      // 3. Pagar parcela mensal (se ainda houver saldo)
      // Lógica: Se tiver parcela extra, ela abate o saldo. A mensal também abate.
      // Se o saldo for menor que a parcela, paga o restante.
      
      let valorPagoMensal = 0;
      if (saldoDevedorObra > 0) {
        // Se o usuário definiu um valor manual, usa ele, senão usa o rateado
        // Nota: Em tabela direta clássica, a parcela nominal é fixa, o saldo que cresce.
        // Aqui vamos seguir a lógica de amortização mista: paga-se o valor nominal definido.
        valorPagoMensal = valorBaseMensal;
        
        if (valorPagoMensal > saldoDevedorObra) valorPagoMensal = saldoDevedorObra;
        
        saldoDevedorObra -= valorPagoMensal;
        if (saldoDevedorObra < 0) saldoDevedorObra = 0;

        parcelasObras.push({
          vencimento: dataAtual.toISOString(),
          valor: valorPagoMensal,
          descricao: `Parcela Mensal ${i + 1}`,
          tipo: 'mensal',
          id: `mensal-${i}`
        });
      }
    }

    const totalPagoObras = entrada + parcelasObras.reduce((acc, p) => acc + p.valor, 0);
    const saldoDevedorFinal = valorFinal - totalPagoObras;

    setResultadoSimulacao({
      entrada,
      totalObras: totalPagoObras,
      saldoDevedor: saldoDevedorFinal > 0 ? saldoDevedorFinal : 0,
      parcelasObras,
      taxaMensalAplicada: taxaMensal
    });

  }, [unidade, valorVenda, desconto, percentualCaptação, indiceSelecionado, periodoMedia, indicesData, empreendimentoSlug, valorPrimeiraParcelaMensal, usarParcelasExtras, tipoParcelaExtra, valorPrimeiraParcelaExtra, dataPrimeiraParcelaExtra]);

  // Helpers de UI
  const formatCurrency = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  
  const handleBack = () => {
    if (empreendimentoSlug) {
      router.push(`/empreendimentos/${empreendimentoSlug}`);
    } else {
      router.push('/empreendimentos');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !unidade) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader><CardTitle className="text-destructive">Erro</CardTitle></CardHeader>
          <CardContent>
            <p className="mb-4">{error}</p>
            <Button onClick={handleBack} className="w-full">Voltar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const valorFinal = valorVenda - desconto;
  const dadosIndiceAtuais = indiceSelecionado === 'INCC' ? indicesData?.incc : indicesData?.ipca;
  const taxaExibida = periodoMedia === '180m' ? dadosIndiceAtuais?.avg180 : dadosIndiceAtuais?.avg12;

  // Verificar se há tempo para parcelas extras
  const dataInicio = new Date();
  const dataEntrega = deliveryDates[empreendimentoSlug];
  const mesesRestantes = Math.ceil((dataEntrega.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24 * 30));
  const permiteSemestral = mesesRestantes >= 6;
  const permiteAnual = mesesRestantes >= 12;

  return (
    <div className="min-h-screen bg-background font-sans pb-20">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50 shadow-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2">
              ← Voltar
            </Button>
            <div className="h-6 w-px bg-border mx-2 hidden sm:block"></div>
            <h1 className="text-lg font-bold truncate hidden sm:block">
              {unidade.bloco} - {unidade.unidade} <span className="font-normal text-muted-foreground text-sm">({empreendimentoSlug.replace(/-/g, ' ').toUpperCase()})</span>
            </h1>
          </div>
          <ThemeToggleSimple />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        
        {/* Card de Resumo */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Valor de Tabela</p>
                <p className="text-3xl font-bold text-primary">{formatCurrency(valorVenda)}</p>
                <p className="text-xs text-muted-foreground mt-1">{unidade.areaUtil} m² • {unidade.quartos} Quartos</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Entrega Estimada</p>
                <p className="text-lg font-semibold">{dataEntrega.toLocaleDateString('pt-BR')}</p>
                <p className="text-xs text-green-600 font-medium mt-1">{mesesRestantes} meses restantes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Controles */}
          <div className="lg:col-span-5 space-y-6">
            <Card>
              <CardHeader><CardTitle>Parâmetros</CardTitle></CardHeader>
              <CardContent className="space-y-5">
                
                <div className="space-y-2">
                  <Label htmlFor="desconto">Desconto (R$)</Label>
                  <Input id="desconto" type="number" value={desconto} onChange={(e) => setDesconto(Number(e.target.value))} className="font-mono" />
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-muted-foreground">Valor Final:</span>
                    <span>{formatCurrency(valorFinal)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Captação na Obra</Label>
                  <Select value={percentualCaptação.toString()} onValueChange={(v) => setPercentualCaptação(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25% (Padrão)</SelectItem>
                      <SelectItem value="30">30% (Padrão)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Índice de Correção</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant={indiceSelecionado === 'INCC' ? 'default' : 'outline'} onClick={() => setIndiceSelecionado('INCC')} className={indiceSelecionado === 'INCC' ? 'bg-primary' : ''}>INCC</Button>
                    <Button variant={indiceSelecionado === 'IPCA' ? 'default' : 'outline'} onClick={() => setIndiceSelecionado('IPCA')} className={indiceSelecionado === 'IPCA' ? 'bg-primary' : ''}>IPCA</Button>
                  </div>
                  <div className="flex justify-between items-center text-xs bg-muted p-2 rounded">
                    <span>Média {periodoMedia === '180m' ? '180m' : '12m'}:</span>
                    <span className="font-bold">{taxaExibida?.toFixed(3)}% a.m.</span>
                  </div>
                  <Select value={periodoMedia} onValueChange={(v: any) => setPeriodoMedia(v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12m">Últimos 12 Meses</SelectItem>
                      <SelectItem value="180m">Últimos 180 Meses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-4 border-t space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="parcelaMensal">1ª Parcela Mensal (Opcional)</Label>
                    <Input id="parcelaMensal" type="number" placeholder="Valor padrão rateado" value={valorPrimeiraParcelaMensal} onChange={(e) => setValorPrimeiraParcelaMensal(e.target.value === '' ? '' : Number(e.target.value))} />
                    <p className="text-[10px] text-muted-foreground">Deixe em branco para calcular automaticamente.</p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <Label className="cursor-pointer" htmlFor="toggle-extras">Adicionar Parcelas Extras?</Label>
                      <Switch id="toggle-extras" checked={usarParcelasExtras} onCheckedChange={setUsarParcelasExtras} disabled={!permiteSemestral && !permiteAnual} />
                    </div>
                    
                    {(!permiteSemestral && !permiteAnual) && usarParcelasExtras && (
                      <p className="text-xs text-red-500">Prazo insuficiente para parcelas extras até a entrega.</p>
                    )}

                    {usarParcelasExtras && (permiteSemestral || permiteAnual) && (
                      <div className="bg-muted/50 p-3 rounded-md space-y-3 animate-in fade-in slide-in-from-top-2">
                        <div className="flex gap-2">
                          <Button variant={tipoParcelaExtra === 'semestral' ? 'default' : 'outline'} size="sm" onClick={() => setTipoParcelaExtra('semestral')} disabled={!permiteSemestral} className="flex-1 text-xs">Semestral</Button>
                          <Button variant={tipoParcelaExtra === 'anual' ? 'default' : 'outline'} size="sm" onClick={() => setTipoParcelaExtra('anual')} disabled={!permiteAnual} className="flex-1 text-xs">Anual</Button>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="text-xs">Valor Base da 1ª Parcela Extra</Label>
                          <Input type="number" placeholder="R$ 0,00" value={valorPrimeiraParcelaExtra} onChange={(e) => setValorPrimeiraParcelaExtra(e.target.value === '' ? '' : Number(e.target.value))} />
                        </div>

                        <div className="space-y-2">
                          <Label className="text-xs">Data do 1º Vencimento</Label>
                          <Input type="date" value={dataPrimeiraParcelaExtra} onChange={(e) => setDataPrimeiraParcelaExtra(e.target.value)} />
                        </div>
                        <p className="text-[10px] text-muted-foreground">O valor será corrigido pelo {indiceSelecionado} até a data do vencimento.</p>
                      </div>
                    )}
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Resultados */}
          <div className="lg:col-span-7">
            <Card className="h-full border-primary/20 shadow-lg">
              <CardHeader className="bg-primary/5 border-b border-primary/10">
                <CardTitle className="flex items-center gap-2 text-primary"><TrendingUp className="h-5 w-5" />Simulação</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {resultadoSimulacao ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-100">
                        <p className="text-xs text-green-800 dark:text-green-200 font-bold uppercase">Entrada (Sinal)</p>
                        <p className="text-2xl font-bold text-green-700">{formatCurrency(resultadoSimulacao.entrada)}</p>
                      </div>
                      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-100">
                        <p className="text-xs text-blue-800 dark:text-blue-200 font-bold uppercase">Total nas Obras</p>
                        <p className="text-2xl font-bold text-blue-700">{formatCurrency(resultadoSimulacao.totalObras)}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-sm uppercase text-muted-foreground">Fluxo de Pagamentos</h4>
                        <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">{resultadoSimulacao.parcelasObras.length} lanços</span>
                      </div>
                      
                      <div className="border rounded-lg overflow-hidden max-h-[500px] overflow-y-auto">
                        <Table>
                          <TableHeader className="bg-muted/50 sticky top-0 z-10">
                            <TableRow>
                              <TableHead className="w-16 text-center">#</TableHead>
                              <TableHead>Vencimento</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead className="text-right">Valor</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {resultadoSimulacao.parcelasObras.map((p, i) => (
                              <TableRow key={i} className={p.tipo === 'extra' ? 'bg-orange-50 dark:bg-orange-950/10' : ''}>
                                <TableCell className="text-center text-xs text-muted-foreground">{i + 1}</TableCell>
                                <TableCell className="text-sm">{new Date(p.vencimento).toLocaleDateString('pt-BR')}</TableCell>
                                <TableCell className="text-xs">
                                  {p.tipo === 'extra' ? (
                                    <span className="inline-flex items-center gap-1 text-orange-600 font-medium bg-orange-100 px-2 py-0.5 rounded-full">
                                      <Calendar className="h-3 w-3" /> Extra
                                    </span>
                                  ) : (
                                    <span className="text-muted-foreground">Mensal</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-mono text-sm font-semibold">
                                  {formatCurrency(p.valor)}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                    
                    <Alert className="bg-slate-50 dark:bg-slate-900 border-slate-200">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <AlertDescription className="ml-2">
                        <p className="font-semibold">Saldo para Financiamento Pós-Obra:</p>
                        <p className="text-xl font-bold text-primary mt-1">{formatCurrency(resultadoSimulacao.saldoDevedor)}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">*Cálculo baseado em {indiceSelecionado} ({resultadoSimulacao.taxaMensalAplicada.toFixed(3)}% a.m.). Valores das parcelas extras já incluem projeção de correção.</p>
                      </AlertDescription>
                    </Alert>
                  </>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin" />
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
