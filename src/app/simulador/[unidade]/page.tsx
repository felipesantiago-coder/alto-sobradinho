'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ThemeToggleSimple } from '@/components/theme-toggle-simple';
import { getIBGEIndices, IBGEData } from '@/services/ibge-service';
import { getUnidadesByEmpreendimento } from '@/data/static-data';
import { Unidade } from '@/types/unidade';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, TrendingUp, DollarSign, AlertCircle, ArrowLeft } from 'lucide-react';

const deliveryDates: Record<string, Date> = {
  'alto-da-alvorada': new Date('2027-03-31'),
  'alto-da-aurora': new Date('2026-12-31'),
  'alto-do-horizonte': new Date('2027-06-30'),
};

interface Parcela {
  vencimento: string;
  valor: number;
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
  const slugParam = params.unidade as string;
  
  const [unidade, setUnidade] = useState<Unidade | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [valorVenda, setValorVenda] = useState(0);
  const [desconto, setDesconto] = useState(0);
  const [percentualCaptação, setPercentualCaptação] = useState(30);
  const [indiceSelecionado, setIndiceSelecionado] = useState<'INCC' | 'IPCA'>('INCC');
  const [periodoMedia, setPeriodoMedia] = useState<'15anos' | '12meses' | 'projecao'>('12meses');
  
  const [indicesData, setIndicesData] = useState<IBGEData | null>(null);
  const [loadingIndices, setLoadingIndices] = useState(true);
  const [resultadoSimulacao, setResultadoSimulacao] = useState<ResultadoSimulacao | null>(null);

  useEffect(() => {
    async function init() {
      try {
        if (!slugParam) throw new Error('Unidade não especificada.');

        let unidadeEncontrada: Unidade | undefined;
        const slugs = ['alto-da-aurora', 'alto-da-alvorada', 'alto-do-horizonte'];
        
        // Tenta encontrar a unidade
        for (const slug of slugs) {
          if (slugParam.toLowerCase().startsWith(slug)) {
            const codigo = slugParam.substring(slug.length).replace(/^[- ]+/, '');
            const lista = getUnidadesByEmpreendimento(slug);
            unidadeEncontrada = lista.find(u => 
              u.unidade?.toLowerCase() === codigo.toLowerCase() || 
              u.codigo?.toString() === codigo
            );
            if (unidadeEncontrada) break;
          }
        }

        // Fallback: busca em todas as listas se o prefixo falhar
        if (!unidadeEncontrada) {
          for (const slug of slugs) {
            const lista = getUnidadesByEmpreendimento(slug);
            unidadeEncontrada = lista.find(u => 
              u.unidade?.toLowerCase() === slugParam.toLowerCase() || 
              u.codigo?.toString() === slugParam
            );
            if (unidadeEncontrada) break;
          }
        }

        if (!unidadeEncontrada) throw new Error('Unidade não encontrada na base local.');

        setUnidade(unidadeEncontrada);
        setValorVenda(unidadeEncontrada.valorVenda || 0);
        
        // Carrega índices
        const indices = await getIBGEIndices();
        setIndicesData(indices);

      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Erro ao carregar.');
        // Fallback de índices em caso de erro geral
        setIndicesData({
          incc: { media15Anos: 4.85, media12Meses: 5.12, projecao: 5.20 },
          ipca: { media15Anos: 5.40, media12Meses: 4.60, projecao: 4.75 }
        });
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [slugParam]);

  useEffect(() => {
    if (unidade && indicesData && valorVenda > 0) {
      const valorFinal = valorVenda - desconto;
      
      // CORREÇÃO CRÍTICA: Passando 'indicesData' explicitamente como 'ibgeData'
      const taxa = obterTaxaPorPeriodo(periodoMedia, indiceSelecionado, indicesData);
      
      let dataEntrega = deliveryDates['alto-da-alvorada']; // Default
      if (getUnidadesByEmpreendimento('alto-da-aurora').includes(unidade)) dataEntrega = deliveryDates['alto-da-aurora'];
      else if (getUnidadesByEmpreendimento('alto-do-horizonte').includes(unidade)) dataEntrega = deliveryDates['alto-do-horizonte'];

      const res = calcularSimulacao(valorFinal, percentualCaptação, taxa, dataEntrega);
      setResultadoSimulacao(res);
    }
  }, [unidade, valorVenda, desconto, percentualCaptação, indiceSelecionado, periodoMedia, indicesData]);

  // Função auxiliar com nomes de parâmetros seguros
  function obterTaxaPorPeriodo(periodo: string, indice: 'INCC' | 'IPCA', ibgeData: IBGEData): number {
    const dadosIndice = ibgeData[indice.toLowerCase() as 'incc' | 'ipca'];
    if (!dadosIndice) return 0;

    switch (periodo) {
      case '15anos': return dadosIndice.media15Anos;
      case '12meses': return dadosIndice.media12Meses;
      case 'projecao': return dadosIndice.projecao;
      default: return dadosIndice.media12Meses;
    }
  }

  function calcularSimulacao(valorFinal: number, pctCaptacao: number, taxaAnual: number, dataEntrega: Date): ResultadoSimulacao {
    const entrada = valorFinal * 0.10;
    const totalCaptacao = valorFinal * (pctCaptacao / 100);
    const saldoObras = Math.max(0, totalCaptacao - entrada);
    
    const meses = Math.max(1, Math.ceil((dataEntrega.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30)));
    const valorParcela = saldoObras / meses;
    
    const parcelas: Parcela[] = [];
    const dataAtual = new Date();
    
    for (let i = 0; i < meses; i++) {
      dataAtual.setMonth(dataAtual.getMonth() + 1);
      parcelas.push({
        vencimento: dataAtual.toISOString(),
        valor: valorParcela
      });
    }

    const totalPago = entrada + parcelas.reduce((acc, p) => acc + p.valor, 0);
    
    return {
      entrada,
      totalObras: totalPago,
      saldoDevedor: Math.max(0, valorFinal - totalPago),
      parcelasObras: parcelas
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
      <div className="min-h-screen flex items-center justify-center p-4 bg-background">
        <Card className="w-full max-w-md border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{error}</p>
            <Button asChild variant="outline" className="w-full">
              <Link href="/">← Voltar ao Início</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const valorFinal = valorVenda - desconto;
  const taxaAtual = indicesData ? obterTaxaPorPeriodo(periodoMedia, indiceSelecionado, indicesData) : 0;

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
              </Link>
            </Button>
            <h1 className="text-lg font-bold hidden sm:block">
              {unidade.bloco} - {unidade.unidade}
            </h1>
          </div>
          <ThemeToggleSimple />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        <Card>
          <CardHeader><CardTitle>Detalhes</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><p className="text-sm text-muted-foreground">Valor</p><p className="font-semibold">R$ {valorVenda.toLocaleString('pt-BR')}</p></div>
            <div><p className="text-sm text-muted-foreground">Área</p><p className="font-semibold">{unidade.areaUtil} m²</p></div>
            <div><p className="text-sm text-muted-foreground">Quartos</p><p className="font-semibold">{unidade.quartos}</p></div>
            <div><p className="text-sm text-muted-foreground">Banheiros</p><p className="font-semibold">{unidade.banheiros}</p></div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Parâmetros</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Desconto (R$)</Label>
                <Input type="number" value={desconto} onChange={e => setDesconto(Number(e.target.value))} />
                <p className="text-xs text-muted-foreground mt-1">Final: R$ {valorFinal.toLocaleString('pt-BR')}</p>
              </div>
              
              <div>
                <Label>Captação (%)</Label>
                <Select value={percentualCaptação.toString()} onValueChange={v => setPercentualCaptação(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="25">25%</SelectItem>
                    <SelectItem value="30">30%</SelectItem>
                    <SelectItem value="40">40%</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Índice</Label>
                <div className="flex gap-2 mt-1">
                  <Button variant={indiceSelecionado === 'INCC' ? 'default' : 'outline'} onClick={() => setIndiceSelecionado('INCC')} className="flex-1">INCC</Button>
                  <Button variant={indiceSelecionado === 'IPCA' ? 'default' : 'outline'} onClick={() => setIndiceSelecionado('IPCA')} className="flex-1">IPCA</Button>
                </div>
              </div>

              <div>
                <Label>Período</Label>
                <Select value={periodoMedia} onValueChange={(v: any) => setPeriodoMedia(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12meses">Média 12 Meses</SelectItem>
                    <SelectItem value="15anos">Média Histórica (5 anos)</SelectItem>
                    <SelectItem value="projecao">Projeção</SelectItem>
                  </SelectContent>
                </Select>
                {indicesData && (
                  <div className="mt-2 text-xs bg-muted p-2 rounded">
                    Taxa: <strong>{taxaAtual.toFixed(2)}% a.a.</strong>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Resultado</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {resultadoSimulacao ? (
                <>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-primary/10 rounded-lg text-center">
                    <div>
                      <p className="text-xs text-muted-foreground">Entrada</p>
                      <p className="font-bold text-lg">R$ {resultadoSimulacao.entrada.toLocaleString('pt-BR')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total Obras</p>
                      <p className="font-bold text-lg">R$ {resultadoSimulacao.totalObras.toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                  
                  <div className="max-h-60 overflow-y-auto border rounded">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mês</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resultadoSimulacao.parcelasObras.map((p, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-xs">{i + 1}ª</TableCell>
                            <TableCell className="text-right text-xs">R$ {p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <Alert>
                    <AlertDescription>
                      Saldo Pós-Obra: <strong>R$ {resultadoSimulacao.saldoDevedor.toLocaleString('pt-BR')}</strong>
                    </AlertDescription>
                  </Alert>
                </>
              ) : (
                <p className="text-muted-foreground text-center py-8">Aguardando cálculos...</p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
