'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { Switch } from '@/components/ui/switch';
import { Loader2, TrendingUp, DollarSign, AlertCircle, CheckCircle2, Info } from 'lucide-react';

// DATAS DE ENTREGA ATUALIZADAS
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
  valorBase: number;
  valorCorrigido: number;
  descricao: string;
}

interface ResultadoSimulacao {
  entrada: number;
  totalObras: number;
  saldoDevedor: number;
  parcelas: Parcela[];
}

export default function SimuladorUnidadePage() {
  const router = useRouter();
  const [unidade, setUnidade] = useState<Unidade | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados do Simulador
  const [valorVenda, setValorVenda] = useState(0);
  const [desconto, setDesconto] = useState(0);
  const [percentualCaptação, setPercentualCaptação] = useState(30);
  
  const [indiceSelecionado, setIndiceSelecionado] = useState<'INCC' | 'IPCA'>('INCC');
  const [periodoMedia, setPeriodoMedia] = useState<'180m' | '12m'>('12m');
  
  const [indicesData, setIndicesData] = useState<IndicesResponse | null>(null);
  const [loadingIndices, setLoadingIndices] = useState(true);
  
  // Parcelas Extras
  const [habilitarParcelasExtras, setHabilitarParcelasExtras] = useState(false);
  const [tipoParcelaExtra, setTipoParcelaExtra] = useState<'semestral' | 'anual'>('semestral');
  const [valorBaseParcelaExtra, setValorBaseParcelaExtra] = useState<number>(0);
  const [dataBaseParcelaExtra, setDataBaseParcelaExtra] = useState<string>('');
  
  const [valorPrimeiraMensal, setValorPrimeiraMensal] = useState<number | ''>('');
  const [resultadoSimulacao, setResultadoSimulacao] = useState<ResultadoSimulacao | null>(null);
  const [temEspacoSemestral, setTemEspacoSemestral] = useState(false);
  const [temEspacoAnual, setTemEspacoAnual] = useState(false);

  // Carregar Dados Iniciais
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        
        // Simulação de delay mínimo para UX se necessário, mas focado em carregar dados
        const slugParam = window.location.pathname.split('/').pop() || '';
        if (!slugParam) throw new Error('Unidade não especificada na URL.');

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

        // Configurar data base inicial
        const hoje = new Date();
        const dSemestral = new Date(hoje.getFullYear(), hoje.getMonth() + 6, hoje.getDate());
        setDataBaseParcelaExtra(dSemestral.toISOString().split('T')[0]);

        await carregarIndices();

      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Verificar espaço e recalcular
  useEffect(() => {
    if (!unidade || !indicesData) return;

    let dataEntrega = new Date('2027-01-01');
    if (getUnidadesByEmpreendimento('alto-da-aurora').includes(unidade)) dataEntrega = deliveryDates['alto-da-aurora'];
    else if (getUnidadesByEmpreendimento('alto-da-alvorada').includes(unidade)) dataEntrega = deliveryDates['alto-da-alvorada'];
    else if (getUnidadesByEmpreendimento('alto-do-horizonte').includes(unidade)) dataEntrega = deliveryDates['alto-do-horizonte'];

    const hoje = new Date();
    const limiteMinimoExtra = new Date(dataEntrega);
    limiteMinimoExtra.setMonth(limiteMinimoExtra.getMonth() - 3);

    const dataTesteSemestral = new Date(hoje);
    dataTesteSemestral.setMonth(dataTesteSemestral.getMonth() + 6);
    
    const dataTesteAnual = new Date(hoje);
    dataTesteAnual.setMonth(dataTesteAnual.getMonth() + 12);

    const espacoSemestral = dataTesteSemestral <= limiteMinimoExtra;
    const espacoAnual = dataTesteAnual <= limiteMinimoExtra;

    setTemEspacoSemestral(espacoSemestral);
    setTemEspacoAnual(espacoAnual);

    if (habilitarParcelasExtras) {
      if ((tipoParcelaExtra === 'semestral' && !espacoSemestral) || 
          (tipoParcelaExtra === 'anual' && !espacoAnual)) {
        setHabilitarParcelasExtras(false);
      }
    }

    calcularSimulacao(dataEntrega);
  }, [unidade, valorVenda, desconto, percentualCaptação, indiceSelecionado, periodoMedia, indicesData, habilitarParcelasExtras, tipoParcelaExtra, valorBaseParcelaExtra, dataBaseParcelaExtra, valorPrimeiraMensal]);

  async function carregarIndices() {
    setLoadingIndices(true);
    try {
      const res = await fetch('/api/incc-ipca');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: IndicesResponse = await res.json();
      
      // Validação extra no frontend
      const sanitize = (v: number) => (v > 0.05 && v < 3.0) ? v : 0; 
      
      const safeData = {
        incc: { ...data.incc, avg12: sanitize(data.incc.avg12), avg180: sanitize(data.incc.avg180) },
        ipca: { ...data.ipca, avg12: sanitize(data.ipca.avg12), avg180: sanitize(data.ipca.avg180) }
      };

      // Se o backend já marcou como fallback, mantemos. Se zerou na sanitização, marcamos aqui.
      if (safeData.incc.avg12 === 0) safeData.incc.isFallback = true;
      if (safeData.ipca.avg12 === 0) safeData.ipca.isFallback = true;

      setIndicesData(safeData);
    } catch (err) {
      console.warn('Falha na API, usando fallback local.', err);
      setIndicesData({
        incc: { avg180: 0.48, avg12: 0.46, source: 'Offline Fallback', indicator: 'INCC', isFallback: true },
        ipca: { avg180: 0.42, avg12: 0.39, source: 'Offline Fallback', indicator: 'IPCA', isFallback: true }
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

    const entrada = valorFinal * 0.10;
    const totalCaptação = valorFinal * (percentualCaptação / 100);
    let saldoParaObras = totalCaptação - entrada;
    if (saldoParaObras < 0) saldoParaObras = 0;

    const hoje = new Date();
    const diffTime = dataEntrega.getTime() - hoje.getTime();
    const mesesTotais = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30)); 
    const mesesValidos = Math.max(1, mesesTotais);

    const parcelas: Parcela[] = [];
    const primeiraMensalDefinida = typeof valorPrimeiraMensal === 'number' && valorPrimeiraMensal > 0 ? valorPrimeiraMensal : (saldoParaObras / mesesValidos);
    
    let saldoRestanteParaDivisao = saldoParaObras - primeiraMensalDefinida;
    if (saldoRestanteParaDivisao < 0) saldoRestanteParaDivisao = 0;
    
    const mesesRestantes = mesesValidos - 1;
    const valorMensalRestante = mesesRestantes > 0 ? saldoRestanteParaDivisao / mesesRestantes : 0;

    const dataAtualLoop = new Date(hoje);
    for (let i = 0; i < mesesValidos; i++) {
        const dataVencimento = new Date(dataAtualLoop);
        dataVencimento.setDate(10); 

        if (dataVencimento >= dataEntrega) break;

        const valorOriginal = i === 0 ? primeiraMensalDefinida : valorMensalRestante;
        const fatorCorrecao = Math.pow(1 + taxaMensalDecimal, i);
        const valorCorrigido = valorOriginal * fatorCorrecao;

        parcelas.push({
            id: `mensal-${i}`,
            tipo: 'mensal',
            vencimento: dataVencimento.toISOString().split('T')[0],
            valorBase: valorOriginal,
            valorCorrigido: parseFloat(valorCorrigido.toFixed(2)),
            descricao: `Mensal ${i + 1}`
        });

        dataAtualLoop.setMonth(dataAtualLoop.getMonth() + 1);
    }

    if (habilitarParcelasExtras) {
        const dataBase = new Date(dataBaseParcelaExtra);
        if (dataBase < hoje) dataBase.setTime(hoje.getTime());

        let dataProximaExtra = new Date(dataBase);
        // Ajuste inicial baseado no tipo selecionado para garantir que comece no futuro correto
        if (tipoParcelaExtra === 'semestral') {
             // Se a data base for hoje, pula para 6 meses. Se o usuário escolheu uma data, usa ela.
             // A lógica assume que dataBaseParcelaExtra já foi setada corretamente pelo UI (hoje + 6m)
        }

        while (dataProximaExtra < dataEntrega) {
            const diffMonths = (dataProximaExtra.getFullYear() - dataBase.getFullYear()) * 12 + (dataProximaExtra.getMonth() - dataBase.getMonth());
            const fatorCorrecaoExtra = Math.pow(1 + taxaMensalDecimal, diffMonths);
            const valorCorrigidoExtra = valorBaseParcelaExtra * fatorCorrecaoExtra;

            const limiteMinimo = new Date(dataEntrega);
            limiteMinimo.setMonth(limiteMinimo.getMonth() - 3);
            
            if (dataProximaExtra >= limiteMinimo) break;

            parcelas.push({
                id: `extra-${dataProximaExtra.getTime()}`,
                tipo: `extra-${tipoParcelaExtra}` as any,
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

    setResultadoSimulacao({
      entrada: parseFloat(entrada.toFixed(2)),
      totalObras: parseFloat(totalCaptação.toFixed(2)),
      saldoDevedor: parseFloat(saldoParaObras.toFixed(2)), // Saldo inicial antes das correções
      parcelas: parcelas
    });
  }

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin h-8 w-8"/></div>;
  if (error) return <div className="p-4 text-red-500">{error} <Button onClick={() => router.back()} variant="link">Voltar</Button></div>;
  if (!unidade) return <div>Unidade não encontrada</div>;

  const dadosIndiceAtivo = indicesData ? (indiceSelecionado === 'INCC' ? indicesData.incc : indicesData.ipca) : null;
  const fonteDisplay = dadosIndiceAtivo?.isFallback ? "Estimativa (Fallback)" : "Dados Oficiais (Bacen)";
  const corFonte = dadosIndiceAtivo?.isFallback ? "text-amber-600" : "text-green-600";

  return (
    <div className="min-h-screen bg-background font-sans">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="font-bold text-lg hidden sm:block">Simulador</Link>
            <span className="text-muted-foreground">|</span>
            <h1 className="text-lg font-semibold truncate max-w-[200px] sm:max-w-md">{unidade.bloco} - {unidade.unidade}</h1>
          </div>
          <ThemeToggleSimple />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">← Voltar para Empreendimento</Button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <Card>
              <CardHeader><CardTitle>Parâmetros</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Valor de Venda (R$)</Label>
                  <Input type="number" value={valorVenda} onChange={e => setValorVenda(Number(e.target.value))} />
                </div>
                <div>
                  <Label htmlFor="desconto">Desconto (R$)</Label>
                  <Input id="desconto" type="number" value={desconto} onChange={e => setDesconto(Number(e.target.value))} />
                </div>
                <div>
                  <Label>Captação (%)</Label>
                  <Select value={percentualCaptação.toString()} onValueChange={v => setPercentualCaptação(Number(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25%</SelectItem>
                      <SelectItem value="30">30%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                   <div>
                    <Label>Índice</Label>
                    <Select value={indiceSelecionado} onValueChange={v => setIndiceSelecionado(v as any)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INCC">INCC</SelectItem>
                        <SelectItem value="IPCA">IPCA</SelectItem>
                      </SelectContent>
                    </Select>
                   </div>
                   <div>
                    <Label>Período</Label>
                    <Select value={periodoMedia} onValueChange={v => setPeriodoMedia(v as any)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12m">12 Meses</SelectItem>
                        <SelectItem value="180m">180 Meses</SelectItem>
                      </SelectContent>
                    </Select>
                   </div>
                </div>
                
                <div className={`text-xs p-2 rounded border ${dadosIndiceAtivo?.isFallback ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                  <p className="font-semibold flex items-center gap-1">
                    {dadosIndiceAtivo?.isFallback ? <AlertCircle className="h-3 w-3"/> : <CheckCircle2 className="h-3 w-3"/>}
                    Fonte: <span className={corFonte}>{fonteDisplay}</span>
                  </p>
                  {dadosIndiceAtivo && (
                    <p className="mt-1">
                      Taxa Atual ({periodoMedia}): <strong>{(periodoMedia === '12m' ? dadosIndiceAtivo.avg12 : dadosIndiceAtivo.avg180).toFixed(3)}% a.m.</strong>
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="valorPrimeiraMensal">1ª Parcela Mensal (Opcional)</Label>
                  <Input id="valorPrimeiraMensal" type="number" value={valorPrimeiraMensal} onChange={e => setValorPrimeiraMensal(e.target.value === '' ? '' : Number(e.target.value))} placeholder="Padrão: rateio igual" />
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-base font-semibold">Parcelas Extras</Label>
                    <Switch 
                      checked={habilitarParcelasExtras} 
                      onCheckedChange={setHabilitarParcelasExtras}
                      disabled={!temEspacoSemestral && !temEspacoAnual}
                    />
                  </div>
                  {!temEspacoSemestral && !temEspacoAnual && (
                    <p className="text-xs text-muted-foreground mb-2">Sem prazo hábil (mínimo 3 meses antes da entrega).</p>
                  )}
                  
                  {habilitarParcelasExtras && (
                    <div className="space-y-3 bg-muted/50 p-3 rounded-md">
                      <div>
                        <Label>Tipo</Label>
                        <Select value={tipoParcelaExtra} onValueChange={v => setTipoParcelaExtra(v as any)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="semestral" disabled={!temEspacoSemestral}>Semestral</SelectItem>
                            <SelectItem value="anual" disabled={!temEspacoAnual}>Anual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Data Base (Início da Correção)</Label>
                        <Input type="date" value={dataBaseParcelaExtra} onChange={e => setDataBaseParcelaExtra(e.target.value)} />
                      </div>
                      <div>
                        <Label>Valor Base (R$)</Label>
                        <Input type="number" value={valorBaseParcelaExtra} onChange={e => setValorBaseParcelaExtra(Number(e.target.value))} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        O valor será corrigido pelo índice selecionado até a data de cada vencimento.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-7">
            <Card className="h-full">
              <CardHeader><CardTitle>Fluxo de Pagamentos</CardTitle></CardHeader>
              <CardContent>
                {resultadoSimulacao ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 bg-primary/10 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">Entrada</p>
                        <p className="text-xl font-bold text-primary">R$ {resultadoSimulacao.entrada.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                      </div>
                      <div className="p-4 bg-primary/10 rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">Total Obras</p>
                        <p className="text-xl font-bold text-primary">R$ {resultadoSimulacao.totalObras.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                      </div>
                      <div className="p-4 bg-muted rounded-lg text-center">
                        <p className="text-sm text-muted-foreground">Saldo Pós-Obra</p>
                        <p className="text-xl font-bold">R$ {resultadoSimulacao.saldoDevedor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                      </div>
                    </div>

                    <div className="border rounded-md overflow-hidden">
                      <div className="max-h-[500px] overflow-y-auto">
                        <Table>
                          <TableHeader className="sticky top-0 bg-background">
                            <TableRow>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Vencimento</TableHead>
                              <TableHead className="text-right">Valor Base</TableHead>
                              <TableHead className="text-right">Valor Corrigido</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {resultadoSimulacao.parcelas.map((p, i) => (
                              <TableRow key={p.id} className={p.tipo !== 'mensal' ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}>
                                <TableCell className="capitalize font-medium">{p.tipo.replace('extra-', '')} {p.tipo !== 'mensal' && '⭐'}</TableCell>
                                <TableCell>{new Date(p.vencimento).toLocaleDateString('pt-BR')}</TableCell>
                                <TableCell className="text-right text-muted-foreground text-sm">R$ {p.valorBase.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</TableCell>
                                <TableCell className="text-right font-bold">R$ {p.valorCorrigido.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Valores corrigidos mensalmente pelo {indiceSelecionado} ({(periodoMedia === '12m' ? dadosIndiceAtivo?.avg12 : dadosIndiceAtivo?.avg180)?.toFixed(3)}% a.m.). 
                        Parcelas extras só são permitidas até 3 meses antes da entrega ({deliveryDates[Object.keys(deliveryDates).find(k => getUnidadesByEmpreendimento(k).includes(unidade!)) || '']?.toLocaleDateString('pt-BR')}).
                      </AlertDescription>
                    </Alert>
                  </div>
                ) : (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">Aguardando dados...</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
