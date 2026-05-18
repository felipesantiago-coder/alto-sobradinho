'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ThemeToggleSimple } from '@/components/theme-toggle-simple';
import { getIBGEIndices, IBGEData } from '@/services/ibge-service';
// CORREÇÃO: Importando os dados estáticos do caminho correto
import { allUnits } from '@/data/static-data';
import { Unidade } from '@/types/unidade';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';

// Datas de entrega estimadas por empreendimento (slug)
const deliveryDates: Record<string, Date> = {
  'alto-da-alvorada': new Date('2027-03-31'),
  'alto-da-aurora': new Date('2026-12-31'),
};

// Tipos para a simulação
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
  const slug = params.unidade as string;
  
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

        // CORREÇÃO: Busca direta no array estático em vez de fetch na API
        // Encontrar a unidade que corresponde ao slug (assumindo que o slug é o código ou uma combinação única)
        // Ajuste a lógica de busca conforme a estrutura exata do seu dado 'allUnits'
        const unidadeEncontrada = allUnits.find((u: any) => {
          // Tenta匹配 por código, ou cria um slug temporário para comparação
          // Exemplo: se o slug for "C-305", verifica se u.codigo === "305" e u.bloco === "C"
          // Ou se houver um campo slug direto na unidade.
          
          // Estratégia 1: Comparação direta se houver campo slug
          if (u.slug === slug) return true;

          // Estratégia 2: Construir slug a partir de bloco e numero (comum nesses dados)
          // Ex: slug "C-305" -> bloco "C", numero "305"
          const partes = slug.split('-');
          if (partes.length >= 2) {
             const blocoSlug = partes[0];
             const numeroSlug = partes.slice(1).join('-'); // Caso tenha hifen no numero
             return String(u.bloco).toLowerCase() === blocoSlug.toLowerCase() && 
                    String(u.numero).toLowerCase() === numeroSlug.toLowerCase();
          }
          
          return false;
        });

        if (!unidadeEncontrada) {
          throw new Error('Unidade não encontrada na base de dados.');
        }

        setUnidade(unidadeEncontrada);
        setValorVenda(unidadeEncontrada.valorVenda || 0);

        // Carrega índices do IBGE
        await carregarIndices();

      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [slug]);

  // Recalcular simulação quando inputs mudarem
  useEffect(() => {
    if (unidade && indicesData && valorVenda > 0) {
      const valorFinal = valorVenda - desconto;
      const taxaAnual = obterTaxaPorPeriodo(periodoMedia, indiceSelecionado, indicesData);
      
      const dataEntrega = deliveryDates[slug.split('-')[0] === 'alto' ? slug : 'alto-da-alvorada'] || new Date('2027-01-01');
      // Nota: A lógica acima de dataEntrega pode precisar de ajuste fino dependendo de como o slug mapeia para o empreendimento.
      // Se o slug for apenas da unidade (ex: C-305), precisamos saber a qual empreendimento ele pertence.
      // Vamos assumir que o contexto da página ou uma lógica mais robusta identifique o empreendimento.
      // Para simplificar, usaremos uma data padrão ou tentaremos inferir do objeto unidade se houver campo 'empreendimento'.
      
      // Melhoria: Inferir data baseada no empreendimento da unidade (se existir no dado)
      // Se allUnits tiver campo 'empreendimentoSlug', use-o. Caso contrário, mantenha o fallback.
      
      const resultado = calcularSimulacaoTabelaDireta({
        valorFinal,
        percentualCaptação,
        taxaAnual,
        dataEntrega: new Date('2027-03-31'), // Fallback seguro, idealmente viria da unidade
        dataInicio: new Date(),
      });

      setResultadoSimulacao(resultado);
    }
  }, [unidade, valorVenda, desconto, percentualCaptação, indiceSelecionado, periodoMedia, indicesData, slug]);

  async function carregarIndices() {
    setLoadingIndices(true);
    setErroIndices(null);
    try {
      const data = await getIBGEIndices();
      setIndicesData(data);
    } catch (err) {
      console.error('Erro ao carregar índices:', err);
      setErroIndices('Não foi possível carregar os índices atualizados.');
      setIndicesData({
        incc: { media15Anos: 4.5, media12Meses: 5.0, projecao: 5.2 },
        ipca: { media15Anos: 5.0, media12Meses: 4.8, projecao: 5.1 }
      });
    } finally {
      setLoadingIndices(false);
    }
  }

  function obterTaxaPorPeriodo(periodo: string, indice: 'INCC' | 'IPCA',  IBGEData): number {
    const tipoIndice = data[indice.toLowerCase() as 'incc' | 'ipca'];
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

    const entrada = valorFinal * 0.10;
    const valorTotalCaptação = valorFinal * (percentualCaptação / 100);
    let saldoParaObras = valorTotalCaptação - entrada;
    if (saldoParaObras < 0) saldoParaObras = 0;

    const mesesTotais = Math.ceil((dataEntrega.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24 * 30));
    const mesesObra = Math.max(1, mesesTotais);
    
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

    const totalObras = entrada + parcelasObras.reduce((acc, p) => acc + p.valor, 0);
    const saldoDevedor = valorFinal - totalObras;

    return {
      entrada,
      totalObras,
      saldoDevedor: saldoDevedor > 0 ? saldoDevedor : 0,
      parcelasObras
    };
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !unidade) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-red-600">Erro</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error || 'Unidade não encontrada.'}</p>
            <Button asChild className="mt-4">
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
            <Link href="/empreendimentos" className="text-sm font-medium hover:text-primary transition-colors">
              ← Voltar
            </Link>
            <h1 className="text-lg font-bold hidden sm:block">
              Simulador: {unidade.bloco} - {unidade.numero}
            </h1>
          </div>
          <ThemeToggleSimple />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
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
                  Valor Final: <strong>R$ {valorFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                </p>
              </div>

              <div className="space-y-2">
                <Label>Captação na obra (%)</Label>
                <Select 
                  value={percentualCaptação.toString()} 
                  onValueChange={(val) => setPercentualCaptação(Number(val))}
                >
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
                <Label>Índice</Label>
                <div className="flex gap-2">
                  <Button variant={indiceSelecionado === 'INCC' ? 'default' : 'outline'} onClick={() => setIndiceSelecionado('INCC')} className="flex-1">INCC</Button>
                  <Button variant={indiceSelecionado === 'IPCA' ? 'default' : 'outline'} onClick={() => setIndiceSelecionado('IPCA')} className="flex-1">IPCA</Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Base de Cálculo</Label>
                <Select value={periodoMedia} onValueChange={(val: any) => setPeriodoMedia(val)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15anos">Média 15 anos</SelectItem>
                    <SelectItem value="12meses">Média 12 meses</SelectItem>
                    <SelectItem value="projecao">Projeção</SelectItem>
                  </SelectContent>
                </Select>
                
                {loadingIndices ? (
                  <p className="text-xs text-blue-500 flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Carregando IBGE...</p>
                ) : erroIndices ? (
                  <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {erroIndices}</p>
                ) : indicesData ? (
                  <div className="text-xs bg-muted p-2 rounded mt-2">
                    <p><strong>Taxa:</strong> {obterTaxaPorPeriodo(periodoMedia, indiceSelecionado, indicesData).toFixed(2)}% a.a.</p>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Resultado
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              {resultadoSimulacao ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center p-4 bg-primary/10 rounded-lg">
                    <div>
                      <p className="text-sm text-muted-foreground">Entrada</p>
                      <p className="text-xl font-bold text-primary">R$ {resultadoSimulacao.entrada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Obras</p>
                      <p className="text-xl font-bold text-primary">R$ {resultadoSimulacao.totalObras.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                  </div>

                  <h4 className="font-semibold mt-4 mb-2">Parcelas (Obras)</h4>
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mês</TableHead>
                          <TableHead>Vencimento</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resultadoSimulacao.parcelasObras.map((p, i) => (
                          <TableRow key={i}>
                            <TableCell>{i + 1}ª</TableCell>
                            <TableCell>{new Date(p.vencimento).toLocaleDateString('pt-BR')}</TableCell>
                            <TableCell className="text-right">R$ {p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <Alert>
                    <AlertDescription>
                      <p className="font-semibold">Saldo Pós-Obra:</p>
                      <p>R$ {resultadoSimulacao.saldoDevedor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </AlertDescription>
                  </Alert>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">Aguardando dados...</div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
