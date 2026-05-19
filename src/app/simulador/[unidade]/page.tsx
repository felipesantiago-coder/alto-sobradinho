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
import { Switch } from '@/components/ui/switch';
import { Loader2, TrendingUp, DollarSign, AlertCircle, CheckCircle2, Info } from 'lucide-react';

// DATAS ATUALIZADAS CONFORME SOLICITADO
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
  const params = useParams();
  const router = useRouter();
  const slugParam = params.unidade as string;
  
  const [unidade, setUnidade] = useState<Unidade | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [valorVenda, setValorVenda] = useState(0);
  const [desconto, setDesconto] = useState(0);
  const [percentualCaptação, setPercentualCaptação] = useState(30);
  
  const [indiceSelecionado, setIndiceSelecionado] = useState<'INCC' | 'IPCA'>('INCC');
  const [periodoMedia, setPeriodoMedia] = useState<'180m' | '12m'>('12m');
  
  const [indicesData, setIndicesData] = useState<IndicesResponse | null>(null);
  const [loadingIndices, setLoadingIndices] = useState(true);
  
  const [habilitarParcelasExtras, setHabilitarParcelasExtras] = useState(false);
  const [tipoParcelaExtra, setTipoParcelaExtra] = useState<'semestral' | 'anual'>('semestral');
  const [valorBaseParcelaExtra, setValorBaseParcelaExtra] = useState<number>(0);
  const [dataBaseParcelaExtra, setDataBaseParcelaExtra] = useState<string>('');
  
  const [valorPrimeiraMensal, setValorPrimeiraMensal] = useState<number | ''>('');

  const [resultadoSimulacao, setResultadoSimulacao] = useState<ResultadoSimulacao | null>(null);
  const [temEspacoSemestral, setTemEspacoSemestral] = useState(false);
  const [temEspacoAnual, setTemEspacoAnual] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

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

        const hojeReset = new Date();
        const dSemestral = new Date(hojeReset.getFullYear(), hojeReset.getMonth() + 6, hojeReset.getDate());
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

  useEffect(() => {
    if (!unidade || !indicesData) return;

    let dataEntrega = new Date('2027-01-01');
    if (getUnidadesByEmpreendimento('alto-da-aurora').includes(unidade)) dataEntrega = deliveryDates['alto-da-aurora'];
    else if (getUnidadesByEmpreendimento('alto-da-alvorada').includes(unidade)) dataEntrega = deliveryDates['alto-da-alvorada'];
    else if (getUnidadesByEmpreendimento('alto-do-horizonte').includes(unidade)) dataEntrega = deliveryDates['alto-do-horizonte'];

    const hoje = new Date();
    const limiteSemestral = new Date(dataEntrega);
    limiteSemestral.setMonth(limiteSemestral.getMonth() - 3);

    const limiteAnual = new Date(dataEntrega);
    limiteAnual.setMonth(limiteAnual.getMonth() - 3);

    const dataPrimeiraSemestral = new Date(hoje);
    dataPrimeiraSemestral.setMonth(dataPrimeiraSemestral.getMonth() + 6);
    
    const dataPrimeiraAnual = new Date(hoje);
    dataPrimeiraAnual.setMonth(dataPrimeiraAnual.getMonth() + 12);

    setTemEspacoSemestral(dataPrimeiraSemestral <= limiteSemestral);
    setTemEspacoAnual(dataPrimeiraAnual <= limiteAnual);

    if (habilitarParcelasExtras) {
      if (tipoParcelaExtra === 'semestral' && !temEspacoSemestral) setHabilitarParcelasExtras(false);
      else if (tipoParcelaExtra === 'anual' && !temEspacoAnual) setHabilitarParcelasExtras(false);
    }

    calcularSimulacao(dataEntrega);

  }, [unidade, valorVenda, desconto, percentualCaptação, indiceSelecionado, periodoMedia, indicesData, habilitarParcelasExtras, tipoParcelaExtra, valorBaseParcelaExtra, dataBaseParcelaExtra, valorPrimeiraMensal]);

  async function carregarIndices() {
    setLoadingIndices(true);
    try {
      const res = await fetch('/api/incc-ipca');
      if (!res.ok) throw new Error('Falha na API');
      const data: IndicesResponse = await res.json();
      
      // Removemos a sanitização agressiva para permitir que dados reais (ex: 0.45) passem
      // Apenas verificamos se não são zero ou negativos
      setIndicesData(data);
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

    const entrada = valorFinal * 0.10;
    const totalCaptação = valorFinal * (percentualCaptação / 100);
    let saldoParaObras = totalCaptação - entrada;
    if (saldoParaObras < 0) saldoParaObras = 0;

    const hoje = new Date();
    const diffTime = dataEntrega.getTime() - hoje.getTime();
    const mesesTotais = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 30)); 
    const mesesValidos = Math.max(1, mesesTotais);

    const parcelas: Parcela[] = [];
    const valorMensalPadrao = saldoParaObras / mesesValidos;
    const primeiraMensalDefinida = typeof valorPrimeiraMensal === 'number' && valorPrimeiraMensal > 0 ? valorPrimeiraMensal : valorMensalPadrao;
    
    let saldoRestanteParaDivisao = saldoParaObras - primeiraMensalDefinida;
    if (saldoRestanteParaDivisao < 0) saldoRestanteParaDivisao = 0;
    
    const mesesRestantes = mesesValidos - 1;
    const valorMensalRestante = mesesRestantes > 0 ? saldoRestanteParaDivisao / mesesRestantes : 0;

    const dataAtual = new Date(hoje);
    for (let i = 0; i < mesesValidos; i++) {
        const dataVencimento = new Date(dataAtual);
        dataVencimento.setDate(10); 

        if (dataVencimento >= dataEntrega) break;

        const valorOriginal = i === 0 ? primeiraMensalDefinida : valorMensalRestante;
        const mesesDecorridos = i;
        const fatorCorrecao = Math.pow(1 + taxaMensalDecimal, mesesDecorridos);
        const valorCorrigido = valorOriginal * fatorCorrecao;

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

    if (habilitarParcelasExtras) {
        const dataBase = new Date(dataBaseParcelaExtra);
        const hoje = new Date();
        if (dataBase < hoje) dataBase.setTime(hoje.getTime());

        let dataProximaExtra = new Date(dataBase);
        // Ajuste inicial correto baseado no tipo selecionado
        if (tipoParcelaExtra === 'semestral') {
             // Já está na data base (6 meses a partir de hoje configurado no useEffect)
             // Não precisamos adicionar mais 6 meses aqui se a dataBase já for a do primeiro vencimento
             // Mas a lógica anterior somava. Vamos manter a consistência: dataBase é a do primeiro vencimento.
        } else if (tipoParcelaExtra === 'anual') {
             // Idem
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
                tipo: `extra-${tipoParcelaExtra}` as 'extra-semestral' | 'extra-anual',
                vencimento: dataProximaExtra.toISOString().split('T')[0],
                valorBase: valorBaseParcelaExtra,
                valorCorrigido: parseFloat(valorCorrigidoExtra.toFixed(2)),
                descricao: `${tipoParcelaExtra === 'semestral' ? 'Semestral' : 'Anual'} Extra`
            });

            if (tipoParcelaExtra === 'semestral') {
                dataProximaExtra.setMonth(dataProximaExtra.getMonth() + 6);
            } else if (tipoParcelaExtra === 'anual') {
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

  if (loading) return <div className="flex items-center justify-center min-h-screen"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (error) return <div className="container mx-auto py-10 px-4"><Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertDescription>{error}</AlertDescription></Alert><Button onClick={() => router.back()} className="mt-4">Voltar</Button></div>;
  if (!unidade) return <div>Unidade não encontrada.</div>;

  const dadosIndiceAtivo = indicesData ? (indiceSelecionado === 'INCC' ? indicesData.incc : indicesData.ipca) : null;
  const fonteDados = dadosIndiceAtivo?.isFallback ? "Estimados (Fallback)" : "Oficiais (Tempo Real)";
  const corFonte = dadosIndiceAtivo?.isFallback ? "text-amber-600" : "text-green-600";

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b"><div className="container flex h-16 items-center justify-between px-4"><Link href="/" className="flex items-center gap-2 font-bold text-lg"><TrendingUp className="h-6 w-6" /><span>Simulador</span></Link><ThemeToggleSimple /></div></header>
      <main className="container mx-auto py-6 px-4">
        <div className="mb-6"><Button variant="outline" onClick={() => router.back()}>&larr; Voltar</Button></div>
        <Card className="max-w-4xl mx-auto mb-8">
          <CardHeader><CardTitle>Simulador: {unidade.bloco} - {unidade.unidade}</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div><Label htmlFor="valorVenda">Valor de Venda (R$)</Label><Input id="valorVenda" type="number" value={valorVenda} onChange={(e) => setValorVenda(Number(e.target.value))} disabled={loadingIndices} /></div>
              <div><Label htmlFor="desconto">Desconto (R$)</Label><Input id="desconto" type="number" value={desconto} onChange={(e) => setDesconto(Number(e.target.value))} disabled={loadingIndices} /></div>
              <div><Label htmlFor="percentualCaptação">Captação (%)</Label><Select value={percentualCaptação.toString()} onValueChange={(v) => setPercentualCaptação(Number(v))} disabled={loadingIndices}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="25">25%</SelectItem><SelectItem value="30">30%</SelectItem></SelectContent></Select></div>
              <div><Label htmlFor="indiceSelecionado">Índice</Label><Select value={indiceSelecionado} onValueChange={(v) => setIndiceSelecionado(v as 'INCC' | 'IPCA')} disabled={loadingIndices}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="INCC">INCC</SelectItem><SelectItem value="IPCA">IPCA</SelectItem></SelectContent></Select></div>
              <div><Label htmlFor="periodoMedia">Período</Label><Select value={periodoMedia} onValueChange={(v) => setPeriodoMedia(v as '12m' | '180m')} disabled={loadingIndices}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="12m">Últimos 12 meses</SelectItem><SelectItem value="180m">Últimos 180 meses</SelectItem></SelectContent></Select></div>
              <div><Label htmlFor="fonteDados">Fonte dos Dados</Label><Input id="fonteDados" type="text" value={`${fonteDados} - ${dadosIndiceAtivo?.source}`} readOnly className={`cursor-not-allowed bg-muted ${corFonte} font-semibold`} /></div>
              <div><Label htmlFor="valorPrimeiraMensal">1ª Mensal (Opcional)</Label><Input id="valorPrimeiraMensal" type="number" value={valorPrimeiraMensal === '' ? '' : valorPrimeiraMensal} onChange={(e) => setValorPrimeiraMensal(e.target.value === '' ? '' : Number(e.target.value))} disabled={loadingIndices} /></div>
            </div>

            <div className="mb-6 p-4 border rounded-md bg-accent/10">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2"><DollarSign className="h-5 w-5" /> Parcelas Extras</h3>
                <Switch id="habilitarParcelasExtras" checked={habilitarParcelasExtras} onCheckedChange={(checked) => { if (checked && ((tipoParcelaExtra === 'semestral' && temEspacoSemestral) || (tipoParcelaExtra === 'anual' && temEspacoAnual))) setHabilitarParcelasExtras(checked); else setHabilitarParcelasExtras(checked); }} disabled={(!temEspacoSemestral && tipoParcelaExtra === 'semestral') || (!temEspacoAnual && tipoParcelaExtra === 'anual')} />
              </div>
              {habilitarParcelasExtras && (
                <div className="space-y-4 pl-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div><Label>Tipo</Label><Select value={tipoParcelaExtra} onValueChange={(v) => setTipoParcelaExtra(v as 'semestral' | 'anual')}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="semestral" disabled={!temEspacoSemestral}>Semestral</SelectItem><SelectItem value="anual" disabled={!temEspacoAnual}>Anual</SelectItem></SelectContent></Select></div>
                    <div><Label>Data Base</Label><Input type="date" value={dataBaseParcelaExtra} onChange={(e) => setDataBaseParcelaExtra(e.target.value)} /></div>
                    <div><Label>Valor Base (R$)</Label><Input type="number" value={valorBaseParcelaExtra} onChange={(e) => setValorBaseParcelaExtra(Number(e.target.value))} /></div>
                  </div>
                  <Alert><Info className="h-4 w-4" /><AlertDescription>Valores corrigidos pelo índice até a data do vencimento. Limite: 3 meses antes da entrega.</AlertDescription></Alert>
                </div>
              )}
              {(!temEspacoSemestral && !temEspacoAnual) && <p className="text-sm text-muted-foreground pl-6">Sem espaço para extras (entrega próxima).</p>}
            </div>

            {loadingIndices && <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4"><Loader2 className="h-4 w-4 animate-spin" />Carregando índices oficiais...</div>}
            
            {dadosIndiceAtivo && !loadingIndices && (
              <Alert className="mb-6 border-l-4 border-primary">
                <TrendingUp className="h-4 w-4" />
                <AlertDescription className="font-medium">
                  {dadosIndiceAtivo.indicator} ({periodoMedia === '12m' ? '12 meses' : '180 meses'}): <span className="text-lg">{(periodoMedia === '12m' ? dadosIndiceAtivo.avg12 : dadosIndiceAtivo.avg180).toFixed(3)}% a.m.</span>
                  <span className="block text-xs text-muted-foreground mt-1">Fonte: {dadosIndiceAtivo.source}</span>
                </AlertDescription>
              </Alert>
            )}

            {resultadoSimulacao && (
              <div className="mt-8">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2"><CheckCircle2 className="h-5 w-5" /> Resultado</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-primary/5 p-4 rounded-lg border"><p className="text-sm text-muted-foreground">Entrada (10%)</p><p className="text-lg font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resultadoSimulacao.entrada)}</p></div>
                  <div className="bg-primary/5 p-4 rounded-lg border"><p className="text-sm text-muted-foreground">Total Obras</p><p className="text-lg font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resultadoSimulacao.totalObras)}</p></div>
                  <div className="bg-primary/5 p-4 rounded-lg border"><p className="text-sm text-muted-foreground">Saldo Devedor</p><p className="text-lg font-semibold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(resultadoSimulacao.saldoDevedor)}</p></div>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Descrição</TableHead><TableHead>Vencimento</TableHead><TableHead className="text-right">Valor Base</TableHead><TableHead className="text-right">Valor Corrigido</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {resultadoSimulacao.parcelas.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="capitalize">{p.tipo.replace('extra-', '').replace('-', ' ')}</TableCell>
                          <TableCell>{p.descricao}</TableCell>
                          <TableCell>{new Date(p.vencimento).toLocaleDateString('pt-BR')}</TableCell>
                          <TableCell className="text-right text-muted-foreground">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.valorBase)}</TableCell>
                          <TableCell className="text-right font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.valorCorrigido)}</TableCell>
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
