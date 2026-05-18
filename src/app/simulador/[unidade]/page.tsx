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
import { Loader2, TrendingUp, DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';

// Datas de entrega estimadas por empreendimento
const deliveryDates: Record<string, Date> = {
  'alto-da-alvorada': new Date('2027-03-31'),
  'alto-da-aurora': new Date('2026-12-31'),
  'alto-do-horizonte': new Date('2027-06-30'),
};

interface IndiceData {
  avg180: number; // Média 180 meses (% a.m.)
  avg12: number;  // Média 12 meses (% a.m.)
  source?: string;
  indicator?: string;
}

interface IndicesResponse {
  incc: IndiceData;
  ipca: IndiceData;
  lastUpdate?: string;
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

export default function SimuladorUnidadePage() {
  const params = useParams();
  const router = useRouter();
  const slugParam = params.unidade as string;
  
  const [unidade, setUnidade] = useState<Unidade | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados do Simulador
  const [valorVenda, setValorVenda] = useState(0);
  const [desconto, setDesconto] = useState(0);
  const [percentualCaptação, setPercentualCaptação] = useState(30);
  const [indiceSelecionado, setIndiceSelecionado] = useState<'INCC' | 'IPCA'>('INCC');
  const [periodoMedia, setPeriodoMedia] = useState<'180m' | '12m' | 'projection'>('12m');
  
  // Dados dos Índices (Vindo da API Local)
  const [indicesData, setIndicesData] = useState<IndicesResponse | null>(null);
  const [loadingIndices, setLoadingIndices] = useState(true);
  const [erroIndices, setErroIndices] = useState<string | null>(null);
  
  // Resultados
  const [resultadoSimulacao, setResultadoSimulacao] = useState<ResultadoSimulacao | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        if (!slugParam) {
          throw new Error('Nenhuma unidade especificada.');
        }

        // 1. Buscar Unidade nos dados estáticos
        let unidadeEncontrada: Unidade | undefined;
        const slugsConhecidos = ['alto-da-alvorada', 'alto-da-aurora', 'alto-do-horizonte'];
        const slugLower = slugParam.toLowerCase();
        
        // Tenta encontrar o prefixo do empreendimento
        const slugDetectado = slugsConhecidos.find(s => slugLower.startsWith(s));
        
        if (slugDetectado) {
          const codigoParte = slugParam.substring(slugDetectado.length).replace(/^[- ]+/, '');
          const unidades = getUnidadesByEmpreendimento(slugDetectado);
          unidadeEncontrada = unidades.find(u => 
            u.unidade?.trim().toLowerCase() === codigoParte.trim().toLowerCase() || 
            u.codigo?.toString() === codigoParte.trim()
          );
        } else {
          // Busca global se não houver prefixo claro
          for (const slug of slugsConhecidos) {
            const unidades = getUnidadesByEmpreendimento(slug);
            unidadeEncontrada = unidades.find(u => 
              u.unidade?.trim().toLowerCase() === slugParam.trim().toLowerCase()
            );
            if (unidadeEncontrada) break;
          }
        }

        if (!unidadeEncontrada) {
          throw new Error(`Unidade "${slugParam}" não encontrada.`);
        }

        setUnidade(unidadeEncontrada);
        setValorVenda(unidadeEncontrada.valorVenda || 0);

        // 2. Carregar Índices via API Local (Proxy seguro)
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

  // Recalcular simulação quando inputs mudarem
  useEffect(() => {
    if (unidade && indicesData && valorVenda > 0) {
      const valorFinal = valorVenda - desconto;
      
      // Selecionar a taxa correta baseada na escolha do usuário
      let taxaMensal = 0;
      const dadosIndice = indiceSelecionado === 'INCC' ? indicesData.incc : indicesData.ipca;

      if (periodoMedia === '180m') taxaMensal = dadosIndice.avg180;
      else if (periodoMedia === '12m') taxaMensal = dadosIndice.avg12;
      else taxaMensal = dadosIndice.avg12; // Projeção usa média recente

      // Determinar data de entrega
      let dataEntrega = new Date('2027-01-01');
      if (getUnidadesByEmpreendimento('alto-da-aurora').includes(unidade)) dataEntrega = deliveryDates['alto-da-aurora'];
      else if (getUnidadesByEmpreendimento('alto-da-alvorada').includes(unidade)) dataEntrega = deliveryDates['alto-da-alvorada'];
      else if (getUnidadesByEmpreendimento('alto-do-horizonte').includes(unidade)) dataEntrega = deliveryDates['alto-do-horizonte'];

      const resultado = calcularSimulacaoTabelaDireta({
        valorFinal,
        percentualCaptação,
        taxaMensal, // Agora passamos a taxa mensal direta
        dataEntrega,
        dataInicio: new Date(),
      });

      setResultadoSimulacao(resultado);
    }
  }, [unidade, valorVenda, desconto, percentualCaptação, indiceSelecionado, periodoMedia, indicesData]);

  async function carregarIndices() {
    setLoadingIndices(true);
    setErroIndices(null);
    try {
      // Chama a API LOCAL que faz o trabalho pesado de scraping/cache
      const res = await fetch('/api/incc-ipca');
      if (!res.ok) throw new Error('Falha na conexão com servidor de índices');
      
      const data: IndicesResponse = await res.json();
      setIndicesData(data);
    } catch (err) {
      console.warn('Erro ao buscar índices, usando fallback:', err);
      setErroIndices('Usando valores de referência (atualização indisponível).');
      // Fallback seguro manual
      setIndicesData({
        incc: { avg180: 0.46, avg12: 0.51, source: 'Fallback', indicator: 'INCC-M' },
        ipca: { avg180: 0.42, avg12: 0.39, source: 'Fallback', indicator: 'IPCA' }
      });
    } finally {
      setLoadingIndices(false);
    }
  }

  function calcularSimulacaoTabelaDireta(args: {
    valorFinal: number;
    percentualCaptação: number;
    taxaMensal: number; // Taxa em % ao mês (ex: 0.5)
    dataEntrega: Date;
    dataInicio: Date;
  }): ResultadoSimulacao {
    const { valorFinal, percentualCaptação, taxaMensal, dataEntrega, dataInicio } = args;

    // 1. Entrada (Sinal) = 10% do Valor Final
    const entrada = valorFinal * 0.10;

    // 2. Total a captar na obra
    const valorTotalCaptação = valorFinal * (percentualCaptação / 100);
    let saldoParaObras = valorTotalCaptação - entrada;
    if (saldoParaObras < 0) saldoParaObras = 0;

    // 3. Meses até a entrega
    const diffTime = Math.abs(dataEntrega.getTime() - dataInicio.getTime());
    const mesesTotais = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30)); 
    const mesesObra = Math.max(1, mesesTotais);

    // 4. Cálculo das Parcelas com Correção Mensal (Juros Compostos sobre o saldo)
    // Lógica: O saldo devedor da obra é corrigido todo mês pelo índice, depois subtrai a parcela fixa inicial
    // Para simplificar a "Tabela Direta" comum: Calcula-se uma parcela base e aplica-se a correção no saldo restante
    
    const parcelasObras: Parcela[] = [];
    let saldoDevedorObra = saldoParaObras;
    let dataAtual = new Date(dataInicio);

    // Valor base da parcela (sem correção ainda)
    const parcelaBase = saldoParaObras / mesesObra;

    for (let i = 0; i < mesesObra; i++) {
      dataAtual.setMonth(dataAtual.getMonth() + 1);
      
      // Aplica correção no saldo atual antes de pagar
      const correcaoMonetaria = saldoDevedorObra * (taxaMensal / 100);
      saldoDevedorObra += correcaoMonetaria;
      
      // Paga a parcela (considerando que a parcela nominal também pode ser reajustada ou fixa)
      // Em muitos contratos de tabela direta, a parcela é fixa e o saldo que aumenta.
      // Aqui vamos assumir que o usuário paga a parcela base calculada inicialmente.
      const valorPago = parcelaBase;
      saldoDevedorObra -= valorPago;

      if (saldoDevedorObra < 0) saldoDevedorObra = 0;

      parcelasObras.push({
        vencimento: dataAtual.toISOString(),
        valor: valorPago, // Pode ser alterado para valorPago + correcao se o contrato exigir
        descricao: `Parcela ${i + 1}/${mesesObra}`
      });
    }

    const totalPagoObras = entrada + parcelasObras.reduce((acc, p) => acc + p.valor, 0);
    const saldoDevedorFinal = valorFinal - totalPagoObras;

    return {
      entrada,
      totalObras: totalPagoObras,
      saldoDevedor: saldoDevedorFinal > 0 ? saldoDevedorFinal : 0,
      parcelasObras
    };
  }

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
              <AlertCircle className="h-5 w-5" />
              Erro ao carregar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{error || 'Unidade não encontrada.'}</p>
            <Button asChild className="w-full">
              <Link href="/empreendimentos">Voltar aos Empreendimentos</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const valorFinal = valorVenda - desconto;
  const dadosIndiceAtuais = indiceSelecionado === 'INCC' ? indicesData?.incc : indicesData?.ipca;

  return (
    <div className="min-h-screen bg-background font-sans">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/empreendimentos" className="text-sm font-medium hover:text-primary transition-colors">
              ← Voltar
            </Link>
            <h1 className="text-lg font-bold hidden sm:block truncate">
              {unidade.bloco} - {unidade.unidade}
            </h1>
          </div>
          <ThemeToggleSimple />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        
        {/* Resumo da Unidade */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <DollarSign className="h-5 w-5 text-primary" />
              Detalhes da Unidade
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Valor de Venda</p>
              <p className="text-xl font-bold text-foreground">R$ {valorVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Área Útil</p>
              <p className="text-lg font-semibold text-foreground">{unidade.areaUtil} m²</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Configuração</p>
              <p className="text-lg font-semibold text-foreground">{unidade.quartos} Quartos • {unidade.banheiros} Banheiros</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Controles da Simulação */}
          <div className="lg:col-span-5 space-y-6">
            <Card>
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
                    placeholder="0"
                    className="font-mono"
                  />
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Valor Final:</span>
                    <span className="font-semibold">R$ {valorFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
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
                      <SelectItem value="40">40%</SelectItem>
                      <SelectItem value="50">50%</SelectItem>
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
                      <SelectItem value="180m">
                        Média 180 Meses {dadosIndiceAtuais && `(${dadosIndiceAtuais.avg180.toFixed(3)}% a.m.)`}
                      </SelectItem>
                      <SelectItem value="12m">
                        Média 12 Meses {dadosIndiceAtuais && `(${dadosIndiceAtuais.avg12.toFixed(3)}% a.m.)`}
                      </SelectItem>
                      <SelectItem value="projection">Projeção Futura</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {loadingIndices ? (
                    <div className="text-xs text-blue-500 flex items-center gap-2 mt-2">
                      <Loader2 className="h-3 w-3 animate-spin" /> Atualizando índices...
                    </div>
                  ) : erroIndices ? (
                    <div className="text-xs text-amber-500 flex items-center gap-2 mt-2 bg-amber-50 p-2 rounded">
                      <AlertCircle className="h-3 w-3" /> {erroIndices}
                    </div>
                  ) : dadosIndiceAtuais ? (
                    <div className="text-xs bg-muted/50 p-3 rounded-md border mt-2 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Fonte:</span>
                        <span className="font-medium">{dadosIndiceAtuais.source || 'Dados Oficiais'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Indicador:</span>
                        <span className="font-medium">{dadosIndiceAtuais.indicator}</span>
                      </div>
                      <div className="pt-2 border-t flex justify-between items-center">
                        <span className="font-semibold">Taxa Aplicada:</span>
                        <span className="font-bold text-primary">
                          {periodoMedia === '180m' ? dadosIndiceAtuais.avg180 : dadosIndiceAtuais.avg12}% a.m.
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Resultados */}
          <div className="lg:col-span-7">
            <Card className="h-full flex flex-col shadow-lg border-primary/20">
              <CardHeader className="bg-primary/5 border-b border-primary/10">
                <CardTitle className="flex items-center gap-2 text-primary">
                  <TrendingUp className="h-5 w-5" />
                  Resultado da Simulação
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-auto p-6 space-y-6">
                {resultadoSimulacao ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-100 dark:border-green-900">
                        <p className="text-sm text-green-800 dark:text-green-200 font-medium mb-1">Entrada (Sinal)</p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                          R$ {resultadoSimulacao.entrada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900">
                        <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-1">Total nas Obras</p>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                          R$ {resultadoSimulacao.totalObras.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-lg">Fluxo de Pagamentos (Obras)</h4>
                        <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                          {resultadoSimulacao.parcelasObras.length} parcelas
                        </span>
                      </div>
                      
                      <div className="border rounded-lg overflow-hidden">
                        <div className="max-h-[400px] overflow-y-auto">
                          <Table>
                            <TableHeader className="bg-muted/50 sticky top-0">
                              <TableRow>
                                <TableHead className="w-[80px] text-center">#</TableHead>
                                <TableHead>Vencimento</TableHead>
                                <TableHead className="text-right">Valor</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {resultadoSimulacao.parcelasObras.map((p, i) => (
                                <TableRow key={i} className="hover:bg-muted/30">
                                  <TableCell className="font-medium text-center text-muted-foreground">{i + 1}ª</TableCell>
                                  <TableCell>{new Date(p.vencimento).toLocaleDateString('pt-BR')}</TableCell>
                                  <TableCell className="text-right font-mono">
                                    R$ {p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    </div>
                    
                    <Alert className="bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <AlertDescription className="ml-2">
                        <p className="font-semibold text-foreground">Pós-Obra (Financiamento Bancário):</p>
                        <p className="text-lg font-bold text-primary mt-1">
                          Saldo Devedor: R$ {resultadoSimulacao.saldoDevedor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          *Valores sujeitos a alteração contratual. Correção aplicada: {indiceSelecionado} ({periodoMedia === '180m' ? dadosIndiceAtuais?.avg180 : dadosIndiceAtuais?.avg12}% a.m.).
                        </p>
                      </AlertDescription>
                    </Alert>
                  </>
                ) : (
                  <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-muted-foreground space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/50" />
                    <p>Calculando melhores condições...</p>
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
