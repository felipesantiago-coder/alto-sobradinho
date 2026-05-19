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
import { Loader2, TrendingUp, DollarSign, AlertCircle, CheckCircle2, Calendar, Info } from 'lucide-react';

// --- DATAS DE ENTREGA ATUALIZADAS ---
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
  
  // Estados do Simulador
  const [valorVenda, setValorVenda] = useState(0);
  const [desconto, setDesconto] = useState(0);
  const [percentualCaptação, setPercentualCaptação] = useState(30);
  
  // Seleção de Índices
  const [indiceSelecionado, setIndiceSelecionado] = useState<'INCC' | 'IPCA'>('INCC');
  const [periodoMedia, setPeriodoMedia] = useState<'180m' | '12m'>('12m');
  
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

        // Busca unidade nos dados estáticos
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

        // Configura datas base para parcelas extras
        const hoje = new Date();
        const dSemestral = new Date(hoje.getFullYear(), hoje.getMonth() + 6, hoje.getDate());
        const dAnual = new Date(hoje.getFullYear(), hoje.getMonth() + 12, hoje.getDate());
        
        // Define padrão como semestral
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
    if (!unidade || !indicesData) return;

    // Determina data de entrega
    let dataEntrega = new Date('2027-01-01');
    if (getUnidadesByEmpreendimento('alto-da-aurora').includes(unidade)) dataEntrega = deliveryDates['alto-da-aurora'];
    else if (getUnidadesByEmpreendimento('alto-da-alvorada').includes(unidade)) dataEntrega = deliveryDates['alto-da-alvorada'];
    else if (getUnidadesByEmpreendimento('alto-do-horizonte').includes(unidade)) dataEntrega = deliveryDates['alto-do-horizonte'];

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

    // Desliga switch se não houver mais espaço para o tipo selecionado
    if (habilitarParcelasExtras) {
      if (tipoParcelaExtra === 'semestral' && !temEspacoSemestral) setHabilitarParcelasExtras(false);
      if (tipoParcelaExtra === 'anual' && !temEspacoAnual) setHabilitarParcelasExtras(false);
    }

    calcularSimulacao(dataEntrega);
  }, [unidade, valorVenda, desconto, percentualCaptação, indiceSelecionado, periodoMedia, indicesData, habilitarParcelasExtras, tipoParcelaExtra, valorBaseParcelaExtra, dataBaseParcelaExtra, valorPrimeiraMensal, temEspacoSemestral, temEspacoAnual]);

  async function carregarIndices() {
    setLoadingIndices(true);
    try {
      const res = await fetch('/api/incc-ipca');
      if (!res.ok) throw new Error('Falha na conexão');
      const data: IndicesResponse = await res.json();
      
      // Sanitização de segurança para evitar valores absurdos
      const sanitize = (v: number) => (v > 0.05 && v < 3.0) ? v : 0; 
      
      setIndicesData({
        incc: { ...data.incc, avg12: sanitize(data.incc.avg12), avg180: sanitize(data.incc.avg180) },
        ipca: { ...data.ipca, avg12: sanitize(data.ipca.avg12), avg180: sanitize(data.ipca.avg180) }
      });
    } catch (err) {
      console.warn('Usando fallback de índices.', err);
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

    // 1. Entrada (10%)
    const entrada = valorFinal * 0.10;

    // 2. Total Captação
    const totalCaptação = valorFinal * (percentualCaptação / 100);
    let saldoParaObras = totalCaptação - entrada;
    if (saldoParaObras < 0) saldoParaObras = 0;

    // 3. Prazo em Meses
    const hoje = new Date();
    // Cálculo preciso de diferença de meses
    const diffAnos = dataEntrega.getFullYear() - hoje.getFullYear();
    const diffMeses = diffAnos * 12 + (dataEntrega.getMonth() - hoje.getMonth());
    const mesesTotais = Math.max(1, diffMeses);

    const parcelas: Parcela[] = [];
    
    // Lógica da Primeira Mensal
    const valorMensalPadrao = saldoParaObras / mesesTotais;
    const primeiraMensalDefinida = typeof valorPrimeiraMensal === 'number' && valorPrimeiraMensal > 0 ? valorPrimeiraMensal : valorMensalPadrao;
    
    // Ajuste do saldo restante
    let saldoRestanteParaDivisao = saldoParaObras - primeiraMensalDefinida;
    if (saldoRestanteParaDivisao < 0) saldoRestanteParaDivisao = 0;
    
    const mesesRestantes = mesesTotais - 1;
    const valorMensalRestante = mesesRestantes > 0 ? saldoRestanteParaDivisao / mesesRestantes : 0;

    // Geração das Parcelas Mensais
    // REGRA: Começa no mês seguinte ao atual
    const dataAtualLoop = new Date(hoje);
    // Avança para o próximo mês primeiro
    dataAtualLoop.setMonth(dataAtualLoop.getMonth() + 1);
    // Define dia de vencimento (ex: dia 10)
    dataAtualLoop.setDate(10);

    for (let i = 0; i < mesesTotais; i++) {
      // Verifica se ultrapassou a data de entrega
      if (dataAtualLoop >= dataEntrega) break;

      const valorOriginal = i === 0 ? primeiraMensalDefinida : valorMensalRestante;
      // Correção monetária sobre o valor base desde o mês 0 até o mês do vencimento
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

      // Prepara data para próxima iteração
      dataAtualLoop.setMonth(dataAtualLoop.getMonth() + 1);
      // Garante consistência do dia caso o mês não tenha 30/31 dias
      if (dataAtualLoop.getDate() !== 10) {
         dataAtualLoop.setDate(10);
      }
    }

    // Geração de Parcelas Extras
    if (habilitarParcelasExtras && valorBaseParcelaExtra > 0) {
      const dataBase = new Date(dataBaseParcelaExtra);
      // Garante que data base não seja passada
      if (dataBase < hoje) dataBase.setTime(hoje.getTime());

      let dataProximaExtra = new Date(dataBase);
      // Ajuste inicial dependendo do tipo (se a data base já for o vencimento ou referência)
      // Assumindo que o usuário escolheu a data do PRIMEIRO vencimento extra
      
      while (dataProximaExtra < dataEntrega) {
        // Regra dos 3 meses antes da entrega
        const limiteMinimo = new Date(dataEntrega);
        limiteMinimo.setMonth(limiteMinimo.getMonth() - 3);
        
        if (dataProximaExtra >= limiteMinimo) break;

        // Calcular correção desde a "data de hoje" (valor base) até a data do vencimento
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

        // Próxima parcela
        if (tipoParcelaExtra === 'semestral') {
          dataProximaExtra.setMonth(dataProximaExtra.getMonth() + 6);
        } else {
          dataProximaExtra.setFullYear(dataProximaExtra.getFullYear() + 1);
        }
      }
    }

    // Ordenar todas por data
    parcelas.sort((a, b) => new Date(a.vencimento).getTime() - new Date(b.vencimento).getTime());

    setResultadoSimulacao({
      entrada: parseFloat(entrada.toFixed(2)),
      totalObras: parseFloat(totalCaptação.toFixed(2)),
      saldoDevedor: parseFloat(saldoParaObras.toFixed(2)), // Simplificado para exibição
      parcelas: parcelas
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando simulador...</p>
        </div>
      </div>
    );
  }

  if (error || !unidade) {
    return (
      <div className="container mx-auto py-10 px-4">
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" /> Erro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error || 'Unidade não encontrada.'}</p>
            <Button onClick={() => router.back()} className="mt-4">Voltar</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const dadosIndiceAtivo = indicesData ? (indiceSelecionado === 'INCC' ? indicesData.incc : indicesData.ipca) : null;
  const fonteDados = dadosIndiceAtivo?.isFallback ? "Estimados (Fallback)" : "Oficiais (Bacen/FGV)";

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
              <p className="text-lg font-bold text-foreground">R$ {valorVenda.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
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
          
          {/* Controles */}
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
                      <SelectItem value="180m">
                        Média 180 Meses {dadosIndiceAtivo && `(${dadosIndiceAtivo.avg180.toFixed(3)}% a.m.)`}
                      </SelectItem>
                      <SelectItem value="12m">
                        Média 12 Meses {dadosIndiceAtivo && `(${dadosIndiceAtivo.avg12.toFixed(3)}% a.m.)`}
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
                          {periodoMedia === '180m' ? dadosIndiceAtivo.avg180 : dadosIndiceAtivo.avg12}% a.m.
                        </span>
                      </div>
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
            <Card>
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
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-100 dark:border-green-900">
                        <p className="text-sm text-green-800 dark:text-green-200 font-medium mb-1">Entrada (Sinal)</p>
                        <p className="text-xl font-bold text-green-700 dark:text-green-400">
                          R$ {resultadoSimulacao.entrada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-100 dark:border-blue-900">
                        <p className="text-sm text-blue-800 dark:text-blue-200 font-medium mb-1">Total Obras</p>
                        <p className="text-xl font-bold text-blue-700 dark:text-blue-400">
                          R$ {resultadoSimulacao.totalObras.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                        <p className="text-sm text-slate-800 dark:text-slate-200 font-medium mb-1">Saldo Pós-Obra</p>
                        <p className="text-xl font-bold text-slate-700 dark:text-slate-400">
                          R$ {resultadoSimulacao.saldoDevedor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-lg">Fluxo de Pagamentos (Obras)</h4>
                        <span className="text-xs bg-muted px-2 py-1 rounded-full text-muted-foreground">
                          {resultadoSimulacao.parcelas.length} parcelas
                        </span>
                      </div>
                      
                      <div className="border rounded-lg overflow-hidden">
                        <div className="max-h-[500px] overflow-y-auto">
                          <Table>
                            <TableHeader className="bg-muted/50 sticky top-0 z-10">
                              <TableRow>
                                <TableHead className="w-[80px] text-center">#</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Vencimento</TableHead>
                                <TableHead className="text-right">Valor Base</TableHead>
                                <TableHead className="text-right font-bold text-primary">Valor Corrigido</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {resultadoSimulacao.parcelas.map((p, i) => (
                                <TableRow key={p.id} className="hover:bg-muted/30">
                                  <TableCell className="font-medium text-center text-muted-foreground">{i + 1}ª</TableCell>
                                  <TableCell className="capitalize text-xs font-semibold">
                                    {p.tipo === 'mensal' ? 'Mensal' : p.tipo.replace('extra-', '').replace('-', ' ')}
                                  </TableCell>
                                  <TableCell>{new Date(p.vencimento).toLocaleDateString('pt-BR')}</TableCell>
                                  <TableCell className="text-right text-muted-foreground text-sm font-mono">
                                    {p.valorBase > 0 ? `R$ ${p.valorBase.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '-'}
                                  </TableCell>
                                  <TableCell className="text-right font-bold font-mono text-primary">
                                    R$ {p.valorCorrigido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
                        <p className="font-semibold text-foreground">Resumo:</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Simulação baseada no índice {indiceSelecionado} ({periodoMedia === '180m' ? dadosIndiceAtivo?.avg180 : dadosIndiceAtivo?.avg12}% a.m.). 
                          Fonte: {fonteDados}.
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
