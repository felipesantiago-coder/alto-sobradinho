'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ThemeToggleSimple } from '@/components/theme-toggle-simple';
import { getIBGEIndices, IBGEData } from '@/services/ibge-service';
// Importação corrigida das funções estáticas
import { getUnidadesByEmpreendimento, getUnidadeByCode } from '@/data/static-data';
import { Unidade } from '@/types/unidade';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';

// Datas de entrega estimadas por empreendimento (slug base)
const deliveryDates: Record<string, Date> = {
  'alto-da-alvorada': new Date('2027-03-31'),
  'alto-da-aurora': new Date('2026-12-31'),
  'alto-do-horizonte': new Date('2027-06-30'),
};

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
  const slugParam = params.unidade as string; // Ex: "alto-da-aurora-C-305" ou apenas o código
  
  const [unidade, setUnidade] = useState<Unidade | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados do Simulador
  const [valorVenda, setValorVenda] = useState(0);
  const [desconto, setDesconto] = useState(0);
  const [percentualCaptação, setPercentualCaptação] = useState(30);
  const [indiceSelecionado, setIndiceSelecionado] = useState<'INCC' | 'IPCA'>('INCC');
  const [periodoMedia, setPeriodoMedia] = useState<'15anos' | '12meses' | 'projecao'>('12meses');
  
  // Dados dos Índices
  const [indicesData, setIndicesData] = useState<IBGEData | null>(null);
  const [loadingIndices, setLoadingIndices] = useState(true);
  const [erroIndices, setErroIndices] = useState<string | null>(null);
  
  // Resultados da Simulação
  const [resultadoSimulacao, setResultadoSimulacao] = useState<ResultadoSimulacao | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);

        if (!slugParam) {
          throw new Error('Nenhuma unidade especificada na URL.');
        }

        // Lógica para separar o slug do empreendimento e o código da unidade
        // Assumindo formato: "nome-do-empreendimento-CODIGO" ou apenas "CODIGO" se o contexto vier de outro lugar
        // Vamos tentar encontrar a unidade em todos os empreendimentos se o formato não for claro
        
        let unidadeEncontrada: Unidade | undefined;
        let empreendimentoSlug = '';

        // Tenta identificar o empreendimento pelo prefixo comum nos slugs
        const slugsConhecidos = ['alto-da-alvorada', 'alto-da-aurora', 'alto-do-horizonte'];
        const slugLower = slugParam.toLowerCase();

        const slugDetectado = slugsConhecidos.find(s => slugLower.startsWith(s));
        
        if (slugDetectado) {
          empreendimentoSlug = slugDetectado;
          // O código da unidade é o restante da string após o slug e possíveis hífens/separadores
          // Ex: alto-da-aurora-C-305 -> código "C-305"
          const codigoParte = slugParam.substring(slugDetectado.length);
          const unidadeCode = codigoParte.replace(/^[- ]+/, ''); // Remove hífens ou espaços iniciais
          
          const unidadesDoEmpreendimento = getUnidadesByEmpreendimento(empreendimentoSlug);
          unidadeEncontrada = unidadesDoEmpreendimento.find(u => 
            u.unidade?.trim().toLowerCase() === unidadeCode.trim().toLowerCase() || 
            u.codigo?.toString() === unidadeCode.trim()
          );
        } else {
          // Se não detectou o prefixo, busca em todos (fallback)
          for (const slug of slugsConhecidos) {
            const unidades = getUnidadesByEmpreendimento(slug);
            unidadeEncontrada = unidades.find(u => 
              u.unidade?.trim().toLowerCase() === slugParam.trim().toLowerCase() ||
              u.codigo?.toString() === slugParam.trim()
            );
            if (unidadeEncontrada) {
              empreendimentoSlug = slug;
              break;
            }
          }
        }

        if (!unidadeEncontrada) {
          throw new Error(`Unidade "${slugParam}" não encontrada.`);
        }

        setUnidade(unidadeEncontrada);
        setValorVenda(unidadeEncontrada.valorVenda || 0);

        // Carrega índices do IBGE
        await carregarIndices();

      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados da unidade.');
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
      const taxaAnual = obterTaxaPorPeriodo(periodoMedia, indiceSelecionado, indicesData);
      
      // Determina a data de entrega baseada no empreendimento da unidade
      // Precisamos descobrir o slug do empreendimento novamente ou passar isso na unidade
      // Vamos usar uma lógica simples baseada no valor ou buscar no static data novamente se necessário
      // Para simplificar, vamos assumir Alto da Aurora como default se não detectar, mas o ideal é ter o slug na unidade
      let dataEntrega = new Date('2027-01-01');
      
      // Tentativa de detectar empreendimento pela área ou valor (gambiarra segura se não tiver slug na unidade)
      // Melhor: verificar qual lista contém esta unidade
      if (getUnidadesByEmpreendimento('alto-da-aurora').includes(unidade)) {
        dataEntrega = deliveryDates['alto-da-aurora'];
      } else if (getUnidadesByEmpreendimento('alto-da-alvorada').includes(unidade)) {
        dataEntrega = deliveryDates['alto-da-alvorada'];
      } else if (getUnidadesByEmpreendimento('alto-do-horizonte').includes(unidade)) {
        dataEntrega = deliveryDates['alto-do-horizonte'];
      }

      const resultado = calcularSimulacaoTabelaDireta({
        valorFinal,
        percentualCaptação,
        taxaAnual,
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
      const data = await getIBGEIndices();
      setIndicesData(data);
    } catch (err) {
      console.error('Erro ao carregar índices:', err);
      setErroIndices('Não foi possível carregar os índices atualizados do IBGE. Usando estimativas.');
      // Fallback seguro
      setIndicesData({
        incc: { media15Anos: 4.85, media12Meses: 5.12, projecao: 5.20 },
        ipca: { media15Anos: 5.40, media12Meses: 4.60, projecao: 4.75 }
      });
    } finally {
      setLoadingIndices(false);
    }
  }

  // CORREÇÃO: Renomeado parâmetro 'data' para 'ibgeData' para evitar conflito com variáveis globais ou escopo
  function obterTaxaPorPeriodo(periodo: string, indice: 'INCC' | 'IPCA', ibgeData: IBGEData): number {
    const tipoIndice = ibgeData[indice.toLowerCase() as 'incc' | 'ipca'];
    if (!tipoIndice) return 0;

    switch (periodo) {
      case '15anos': return tipoIndice.media15Anos;
      case '12meses': return tipoIndice.media12Meses;
      case 'projecao': return tipoIndice.projecao;
      default: return tipoIndice.media12Meses;
    }
  }

  function calcularSimulacaoTabelaDireta(args: {
    valorFinal: number;
    percentualCaptação: number;
    taxaAnual: number;
    dataEntrega: Date;
    dataInicio: Date;
  }): ResultadoSimulacao {
    const { valorFinal, percentualCaptação, taxaAnual, dataEntrega, dataInicio } = args;

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

    // 4. Parcelas mensais (Divisão simples do saldo pelo prazo)
    const valorParcelaMensal = saldoParaObras / mesesObra;

    const parcelasObras: Parcela[] = [];
    let dataAtual = new Date(dataInicio);

    for (let i = 0; i < mesesObra; i++) {
      dataAtual.setMonth(dataAtual.getMonth() + 1);
      parcelasObras.push({
        vencimento: dataAtual.toISOString(),
        valor: valorParcelaMensal,
        descricao: `Parcela ${i + 1}/${mesesObra}`
      });
    }

    const totalPagoObras = entrada + parcelasObras.reduce((acc, p) => acc + p.valor, 0);
    const saldoDevedor = valorFinal - totalPagoObras;

    return {
      entrada,
      totalObras: totalPagoObras,
      saldoDevedor: saldoDevedor > 0 ? saldoDevedor : 0,
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

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href={`/empreendimentos`} className="text-sm font-medium hover:text-primary transition-colors">
              ← Voltar
            </Link>
            <h1 className="text-lg font-bold hidden sm:block">
              Simulador: {unidade.bloco} - {unidade.unidade}
            </h1>
          </div>
          <ThemeToggleSimple />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        
        {/* Resumo da Unidade */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Detalhes da Unidade
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Valor de Venda</p>
              <p className="text-lg font-semibold">R$ {valorVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Área Útil</p>
              <p className="text-lg font-semibold">{unidade.areaUtil} m²</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Quartos / Banheiros</p>
              <p className="text-lg font-semibold">{unidade.quartos} / {unidade.banheiros}</p>
            </div>
          </CardContent>
        </Card>

        {/* Controles da Simulação */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Parâmetros Financeiros</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              <div className="space-y-2">
                <Label htmlFor="desconto">Desconto (R$)</Label>
                <Input
                  id="desconto"
                  type="number"
                  value={desconto}
                  onChange={(e) => setDesconto(Number(e.target.value))}
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Valor Final com Desconto: <strong>R$ {valorFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="captacao">Captação durante a obra (%)</Label>
                <Select 
                  value={percentualCaptação.toString()} 
                  onValueChange={(val) => setPercentualCaptação(Number(val))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione %" />
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
                <div className="flex gap-2">
                  <Button
                    variant={indiceSelecionado === 'INCC' ? 'default' : 'outline'}
                    onClick={() => setIndiceSelecionado('INCC')}
                    className="flex-1"
                  >
                    INCC
                  </Button>
                  <Button
                    variant={indiceSelecionado === 'IPCA' ? 'default' : 'outline'}
                    onClick={() => setIndiceSelecionado('IPCA')}
                    className="flex-1"
                  >
                    IPCA
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Base de Cálculo do Índice</Label>
                <Select 
                  value={periodoMedia} 
                  onValueChange={(val: any) => setPeriodoMedia(val)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15anos">Média Histórica (15 anos)</SelectItem>
                    <SelectItem value="12meses">Média Recente (12 meses)</SelectItem>
                    <SelectItem value="projecao">Projeção até Entrega</SelectItem>
                  </SelectContent>
                </Select>
                
                {loadingIndices ? (
                  <p className="text-xs text-blue-500 flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Buscando dados no IBGE...
                  </p>
                ) : erroIndices ? (
                  <p className="text-xs text-amber-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {erroIndices}
                  </p>
                ) : indicesData ? (
                  <div className="text-xs bg-muted p-2 rounded mt-2 border">
                    <p className="font-semibold mb-1">Dados Atualizados:</p>
                    <p><strong>Taxa Aplicada:</strong> {obterTaxaPorPeriodo(periodoMedia, indiceSelecionado, indicesData).toFixed(2)}% a.a.</p>
                    <div className="mt-2 grid grid-cols-2 gap-2 pt-2 border-t">
                      <div>
                        <span className="block text-muted-foreground">Média 15a:</span>
                        <span>{indicesData[indiceSelecionado.toLowerCase() as 'incc'|'ipca']?.media15Anos.toFixed(2)}%</span>
                      </div>
                      <div>
                        <span className="block text-muted-foreground">Média 12m:</span>
                        <span>{indicesData[indiceSelecionado.toLowerCase() as 'incc'|'ipca']?.media12Meses.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

            </CardContent>
          </Card>

          {/* Resultados */}
          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Resultado da Simulação
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              {resultadoSimulacao ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center p-4 bg-primary/10 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Entrada (Sinal)</p>
                      <p className="text-xl font-bold text-primary">
                        R$ {resultadoSimulacao.entrada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total nas Obras</p>
                      <p className="text-xl font-bold text-primary">
                        R$ {resultadoSimulacao.totalObras.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>

                  <h4 className="font-semibold mt-4 mb-2">Fluxo de Pagamentos (Obras)</h4>
                  <div className="border rounded-md max-h-[300px] overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[80px]">Mês</TableHead>
                          <TableHead>Vencimento</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resultadoSimulacao.parcelasObras.length > 0 ? (
                          resultadoSimulacao.parcelasObras.map((p, i) => (
                            <TableRow key={i}>
                              <TableCell className="font-medium">{i + 1}ª</TableCell>
                              <TableCell>{new Date(p.vencimento).toLocaleDateString('pt-BR')}</TableCell>
                              <TableCell className="text-right">
                                R$ {p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground py-4">Nenhuma parcela calculada</TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <Alert className="mt-4">
                    <AlertDescription>
                      <p className="font-semibold">Pós-Obra (Financiamento):</p>
                      <p>Saldo Devedor Estimado: <strong>R$ {resultadoSimulacao.saldoDevedor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></p>
                      <p className="text-xs text-muted-foreground mt-1">
                        *Simulação baseada no índice {indiceSelecionado} ({obterTaxaPorPeriodo(periodoMedia, indiceSelecionado, indicesData!).toFixed(2)}% a.a.)
                      </p>
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  Ajuste os parâmetros para ver a simulação
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
