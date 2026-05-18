'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ThemeToggleSimple } from '@/components/theme-toggle-simple';
import { getIBGEIndices, IBGEData } from '@/services/ibge-service';
import { getUnidadesByEmpreendimento } from '@/data/static-data';
import { Unidade } from '@/types/unidade';

// Componentes de UI (Certifique-se que estes caminhos existem no seu projeto)
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
    async function fetchData() {
      try {
        setLoading(true);
        if (!slugParam) throw new Error('Unidade não especificada.');

        let unidadeEncontrada: Unidade | undefined;
        const slugs = ['alto-da-alvorada', 'alto-da-aurora', 'alto-do-horizonte'];
        const slugLower = slugParam.toLowerCase();

        // Tenta encontrar a unidade
        for (const slug of slugs) {
          if (slugLower.startsWith(slug)) {
            const codigo = slugParam.substring(slug.length).replace(/^[- ]+/, '');
            const lista = getUnidadesByEmpreendimento(slug);
            unidadeEncontrada = lista.find(u => u.unidade?.trim().toLowerCase() === codigo.toLowerCase());
            if (unidadeEncontrada) break;
          }
        }
        
        // Fallback: busca global se o prefixo falhar
        if (!unidadeEncontrada) {
           for (const slug of slugs) {
            const lista = getUnidadesByEmpreendimento(slug);
            unidadeEncontrada = lista.find(u => u.unidade?.trim().toLowerCase() === slugParam.toLowerCase());
            if (unidadeEncontrada) break;
           }
        }

        if (!unidadeEncontrada) throw new Error('Unidade não encontrada nos dados estáticos.');

        setUnidade(unidadeEncontrada);
        setValorVenda(unidadeEncontrada.valorVenda || 0);
        
        // Carrega índices (não bloqueia a renderização da página se falhar)
        carregarIndices();

      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slugParam]);

  async function carregarIndices() {
    setLoadingIndices(true);
    try {
      const data = await getIBGEIndices();
      setIndicesData(data);
    } catch (e) {
      console.error("Erro IBGE", e);
    } finally {
      setLoadingIndices(false);
    }
  }

  useEffect(() => {
    if (unidade && indicesData && valorVenda > 0) {
      const valorFinal = valorVenda - desconto;
      const taxa = obterTaxa(periodoMedia, indiceSelecionado, indicesData);
      
      let dataEntrega = deliveryDates['alto-da-alvorada']; // Default
      if (getUnidadesByEmpreendimento('alto-da-aurora').includes(unidade)) dataEntrega = deliveryDates['alto-da-aurora'];
      else if (getUnidadesByEmpreendimento('alto-do-horizonte').includes(unidade)) dataEntrega = deliveryDates['alto-do-horizonte'];

      const resultado = calcularSimulacao(valorFinal, percentualCaptação, taxa, dataEntrega);
      setResultadoSimulacao(resultado);
    }
  }, [unidade, valorVenda, desconto, percentualCaptação, indiceSelecionado, periodoMedia, indicesData]);

  function obterTaxa(periodo: string, indice: 'INCC'|'IPCA',  IBGEData): number {
    const d = data[indice.toLowerCase() as 'incc'|'ipca'];
    if (!d) return 0;
    if (periodo === '15anos') return d.media15Anos;
    if (periodo === 'projecao') return d.projecao;
    return d.media12Meses;
  }

  function calcularSimulacao(valorFinal: number, pctCap: number, taxaAnual: number, dataEntrega: Date): ResultadoSimulacao {
    const entrada = valorFinal * 0.10;
    const totalCap = valorFinal * (pctCap / 100);
    const saldoObras = Math.max(0, totalCap - entrada);
    
    const meses = Math.ceil((dataEntrega.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24 * 30)) || 1;
    const valParcela = saldoObras / meses;
    
    const parcelas: Parcela[] = [];
    let dt = new Date();
    for(let i=0; i<meses; i++) {
      dt.setMonth(dt.getMonth() + 1);
      parcelas.push({ vencimento: dt.toISOString(), valor: valParcela });
    }

    return {
      entrada,
      totalObras: entrada + (valParcela * meses),
      saldoDevedor: valorFinal - (entrada + (valParcela * meses)),
      parcelasObras: parcelas
    };
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin h-8 w-8 text-primary"/></div>
  );

  if (error || !unidade) return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="max-w-md w-full">
        <CardHeader><CardTitle className="text-red-600">Erro</CardTitle></CardHeader>
        <CardContent>
          <p>{error}</p>
          <Button asChild className="mt-4 w-full"><Link href="/empreendimentos">Voltar</Link></Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-background font-sans text-foreground">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/empreendimentos" className="flex items-center text-sm font-medium hover:text-primary">
              <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
            </Link>
            <h1 className="text-lg font-bold hidden sm:block">{unidade.bloco} - {unidade.unidade}</h1>
          </div>
          <ThemeToggleSimple />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Card Resumo */}
        <Card>
          <CardHeader><CardTitle>Detalhes da Unidade</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><p className="text-sm text-muted-foreground">Valor</p><p className="font-semibold">R$ {valorVenda.toLocaleString('pt-BR')}</p></div>
            <div><p className="text-sm text-muted-foreground">Área</p><p className="font-semibold">{unidade.areaUtil} m²</p></div>
            <div><p className="text-sm text-muted-foreground">Quartos</p><p className="font-semibold">{unidade.quartos}</p></div>
            <div><p className="text-sm text-muted-foreground">Banheiros</p><p className="font-semibold">{unidade.banheiros}</p></div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Controles */}
          <Card>
            <CardHeader><CardTitle>Parâmetros</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Desconto (R$)</Label>
                <Input type="number" value={desconto} onChange={e => setDesconto(Number(e.target.value))} />
                <p className="text-xs text-muted-foreground mt-1">Final: R$ {(valorVenda - desconto).toLocaleString('pt-BR')}</p>
              </div>
              
              <div>
                <Label>Captação na Obra (%)</Label>
                <Select value={String(percentualCaptação)} onValueChange={v => setPercentualCaptação(Number(v))}>
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
                <div className="flex gap-2">
                  <Button variant={indiceSelecionado === 'INCC' ? 'default' : 'outline'} onClick={() => setIndiceSelecionado('INCC')} className="flex-1">INCC</Button>
                  <Button variant={indiceSelecionado === 'IPCA' ? 'default' : 'outline'} onClick={() => setIndiceSelecionado('IPCA')} className="flex-1">IPCA</Button>
                </div>
              </div>

              <div>
                <Label>Período de Referência</Label>
                <Select value={periodoMedia} onValueChange={v => setPeriodoMedia(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12meses">Média 12 Meses</SelectItem>
                    <SelectItem value="15anos">Média 15 Anos</SelectItem>
                    <SelectItem value="projecao">Projeção</SelectItem>
                  </SelectContent>
                </Select>
                {loadingIndices && <p className="text-xs text-blue-500 mt-1">Atualizando índices...</p>}
                {!loadingIndices && indicesData && (
                  <p className="text-xs text-green-600 mt-1 font-medium">
                    Taxa aplicada: {obterTaxa(periodoMedia, indiceSelecionado, indicesData).toFixed(2)}% a.a.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Resultados */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><TrendingUp className="h-5 w-5"/> Simulação</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {resultadoSimulacao ? (
                <>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Entrada</p>
                      <p className="font-bold text-lg text-primary">R$ {resultadoSimulacao.entrada.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Total Obras</p>
                      <p className="font-bold text-lg text-primary">R$ {resultadoSimulacao.totalObras.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                    </div>
                  </div>
                  
                  <div className="border rounded-md max-h-60 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow><TableHead>Mês</TableHead><TableHead>Vencimento</TableHead><TableHead className="text-right">Valor</TableHead></TableRow>
                      </TableHeader>
                      <TableBody>
                        {resultadoSimulacao.parcelasObras.map((p, i) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium">{i+1}ª</TableCell>
                            <TableCell>{new Date(p.vencimento).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell className="text-right">R$ {p.valor.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <Alert>
                    <AlertDescription>
                      <strong>Saldo Pós-Obra:</strong> R$ {Math.max(0, resultadoSimulacao.saldoDevedor).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                    </AlertDescription>
                  </Alert>
                </>
              ) : (
                <div className="h-40 flex items-center justify-center text-muted-foreground">Aguardando dados...</div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
