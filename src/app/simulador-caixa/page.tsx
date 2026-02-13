'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import {
  Calculator,
  AlertCircle,
  Loader2,
  CheckCircle,
  Info,
  Landmark,
  Shield,
  Calendar,
  DollarSign,
  Home,
  User,
  TrendingUp,
  Building2,
  ArrowLeft
} from 'lucide-react'

interface SimulacaoResult {
  sucesso: boolean
  mensagem: string
  dados: {
    Sistema_Amortizacao: string
    Prazo_Amortizacao: string
    Prazo_Obra: string
    Prazo_Total: string
    Valor_Imovel: string
    Valor_Entrada: string
    Percentual_Entrada: string
    Valor_Total_Financiado: string
    Primeira_Prestacao: string
    Ultima_Prestacao: string
    Prestacao_Base: string
    Amortizacao_Mensal: string
    Juros_Primeira_Parcela: string
    Seguro_MIP: string
    Seguro_DFI: string
    Taxa_Operacional: string
    Taxa_Juros_Nominal: string
    Taxa_Juros_Efetivos: string
    Percentual_Renda: string
    Idade_Calculada: string
    Fator_MIP: string
    LTV_Maximo: string
    Limite_Renda: string
    Fonte: string
  }
}

function SimuladorCaixaContent() {
  const searchParams = useSearchParams()
  const [isClient, setIsClient] = useState(false)

  const valorImovelParam = searchParams.get('valorImovel') || ''
  const unidadeParam = searchParams.get('unidade') || ''
  const tipologiaParam = searchParams.get('tipologia') || ''
  const areaParam = searchParams.get('area') || ''

  const [valorImovel, setValorImovel] = useState(valorImovelParam || '')
  const [renda, setRenda] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [sistemaAmortizacao, setSistemaAmortizacao] = useState('PRICE TR')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resultados, setResultados] = useState<SimulacaoResult | null>(null)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  const parseValorMonetario = (valor: string): number => {
    const limpo = valor.replace(/[R$\s]/g, '')
    if (limpo.includes('.') && limpo.includes(',')) {
      return parseFloat(limpo.replace(/\./g, '').replace(',', '.'))
    } else if (limpo.includes(',')) {
      return parseFloat(limpo.replace(',', '.'))
    }
    return parseFloat(limpo)
  }

  const simularFinanciamento = async () => {
    setError('')
    setResultados(null)

    if (!renda || !dataNascimento || !valorImovel) {
      setError('Por favor, preencha todos os campos obrigatórios.')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/simulacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ renda, dataNascimento, valorImovel, sistemaAmortizacao })
      })

      const data = await response.json()

      if (!response.ok) throw new Error(data.error || 'Erro ao realizar simulação')

      setResultados(data)
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao realizar simulação.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  if (!isClient) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <Link href="/">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
              <Landmark className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                Simulador de Financiamento CAIXA
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                Simulação corrigida baseada em PDF oficial - Modalidade PRICE/SAC
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Formulário */}
          <div className="space-y-6">
            {/* Dados da Unidade */}
            {(unidadeParam || tipologiaParam || areaParam) && (
              <Card className="shadow-md border-0 bg-white/80 backdrop-blur dark:bg-slate-800/80">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Home className="w-5 h-5 text-blue-600" />
                    Dados da Unidade
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {unidadeParam && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Unidade</Label>
                        <p className="font-semibold">{unidadeParam}</p>
                      </div>
                    )}
                    {tipologiaParam && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Tipologia</Label>
                        <p className="font-semibold">{tipologiaParam}</p>
                      </div>
                    )}
                    {areaParam && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Área</Label>
                        <p className="font-semibold">{areaParam}</p>
                      </div>
                    )}
                    {valorImovelParam && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Valor</Label>
                        <p className="font-semibold text-blue-600">{formatCurrency(parseValorMonetario(valorImovelParam))}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Dados do Imóvel */}
            <Card className="shadow-md border-0 bg-white/80 backdrop-blur dark:bg-slate-800/80">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Home className="w-5 h-5 text-blue-600" />
                  Dados do Imóvel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="valorImovel">Valor do Imóvel *</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input
                        id="valorImovel"
                        placeholder="Ex: 598000"
                        value={valorImovel}
                        onChange={(e) => setValorImovel(e.target.value)}
                        disabled={loading}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dados Pessoais */}
            <Card className="shadow-md border-0 bg-white/80 backdrop-blur dark:bg-slate-800/80">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  Dados Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="renda">Renda Familiar Mensal *</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="renda"
                      placeholder="Ex: 10000"
                      value={renda}
                      onChange={(e) => setRenda(e.target.value)}
                      disabled={loading}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataNascimento">Data de Nascimento *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      id="dataNascimento"
                      type="date"
                      value={dataNascimento}
                      onChange={(e) => setDataNascimento(e.target.value)}
                      disabled={loading}
                      max={new Date().toISOString().split('T')[0]}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sistemaAmortizacao">Sistema de Amortização *</Label>
                  <Select value={sistemaAmortizacao} onValueChange={setSistemaAmortizacao} disabled={loading}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SAC TR">SAC TR (Prestações Decrescentes)</SelectItem>
                      <SelectItem value="PRICE TR">PRICE TR (Prestações Fixas)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Informações */}
            <Card className="shadow-md border-0 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <h4 className="font-semibold text-sm mb-3 text-blue-900 dark:text-blue-100 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  Regras de Financiamento
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-2">
                    <p className="font-medium text-blue-800 dark:text-blue-200">SAC</p>
                    <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                      <li>• Entrada mínima: 10%</li>
                      <li>• Limite de renda: 30%</li>
                      <li>• Prazo máximo: 420 meses</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium text-blue-800 dark:text-blue-200">PRICE</p>
                    <ul className="space-y-1 text-blue-700 dark:text-blue-300">
                      <li>• Entrada mínima: 20%</li>
                      <li>• Limite de renda: 25%</li>
                      <li>• Prazo máximo: 360 meses</li>
                    </ul>
                  </div>
                </div>
                <Separator className="my-3 bg-blue-200 dark:bg-blue-700" />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  Taxa: 10,9259% a.a. (nominal) | 11,49% a.a. (efetiva)
                </p>
              </CardContent>
            </Card>

            {/* Erro */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              </div>
            )}

            {/* Botão */}
            <Button
              onClick={simularFinanciamento}
              disabled={loading}
              className="w-full gap-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-500/25"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Simulando...
                </>
              ) : (
                <>
                  <Calculator className="w-5 h-5" />
                  Simular Financiamento
                </>
              )}
            </Button>
          </div>

          {/* Resultados */}
          <div>
            {resultados ? (
              <Card className="shadow-lg border-0 bg-white/90 backdrop-blur dark:bg-slate-800/90 sticky top-4">
                <CardHeader className="border-b bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <div>
                      <CardTitle className="text-xl text-green-900 dark:text-green-100">
                        Simulação Concluída
                      </CardTitle>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        {resultados.dados.Sistema_Amortizacao} - {resultados.dados.Idade_Calculada}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  {/* Valor Financiado */}
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-5 text-white shadow-lg">
                    <p className="text-sm text-blue-100 mb-1">Valor Total Financiado</p>
                    <p className="text-3xl font-bold">{resultados.dados.Valor_Total_Financiado}</p>
                    <div className="flex gap-4 mt-3 text-sm">
                      <div>
                        <span className="text-blue-200">Entrada: </span>
                        <span className="font-medium">{resultados.dados.Valor_Entrada} ({resultados.dados.Percentual_Entrada})</span>
                      </div>
                    </div>
                  </div>

                  {/* Prazos */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 border text-center">
                      <p className="text-xs text-muted-foreground mb-1">Prazo Amort.</p>
                      <p className="text-lg font-bold">{resultados.dados.Prazo_Amortizacao}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 border text-center">
                      <p className="text-xs text-muted-foreground mb-1">Prazo Obra</p>
                      <p className="text-lg font-bold">{resultados.dados.Prazo_Obra}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 border text-center">
                      <p className="text-xs text-muted-foreground mb-1">Prazo Total</p>
                      <p className="text-lg font-bold">{resultados.dados.Prazo_Total}</p>
                    </div>
                  </div>

                  {/* Prestações */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
                      <p className="text-xs text-muted-foreground mb-1">1ª Prestação</p>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                        {resultados.dados.Primeira_Prestacao}
                      </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-4 border">
                      <p className="text-xs text-muted-foreground mb-1">Última Prestação</p>
                      <p className="text-2xl font-bold">{resultados.dados.Ultima_Prestacao}</p>
                    </div>
                  </div>

                  {/* Composição da Prestação */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-600" />
                      Composição da Prestação
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between items-center py-2 px-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <DollarSign className="w-3 h-3" />
                          Prestação Base
                        </span>
                        <span className="font-medium">{resultados.dados.Prestacao_Base}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 px-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Shield className="w-3 h-3" />
                          Seguro MIP
                        </span>
                        <span className="font-medium">{resultados.dados.Seguro_MIP}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 px-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Shield className="w-3 h-3" />
                          Seguro DFI
                        </span>
                        <span className="font-medium">{resultados.dados.Seguro_DFI}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 px-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                        <span className="text-muted-foreground flex items-center gap-2">
                          <Building2 className="w-3 h-3" />
                          Taxa Oper.
                        </span>
                        <span className="font-medium">{resultados.dados.Taxa_Operacional}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Detalhes */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm flex items-center gap-2">
                      <Info className="w-4 h-4 text-blue-600" />
                      Detalhes do Financiamento
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700">
                        <span className="text-muted-foreground">Sistema</span>
                        <span className="font-medium">{resultados.dados.Sistema_Amortizacao}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700">
                        <span className="text-muted-foreground">LTV Máx.</span>
                        <span className="font-medium">{resultados.dados.LTV_Maximo}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700">
                        <span className="text-muted-foreground">Juros Efetivos</span>
                        <span className="font-medium">{resultados.dados.Taxa_Juros_Efetivos}</span>
                      </div>
                      <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-700">
                        <span className="text-muted-foreground">Comprometimento</span>
                        <span className="font-medium">{resultados.dados.Percentual_Renda}</span>
                      </div>
                    </div>
                  </div>

                  {/* Fator MIP */}
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-amber-800 dark:text-amber-200">Seguro MIP por Idade</p>
                        <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                          Para {resultados.dados.Idade_Calculada}, o fator MIP aplicado é <strong>{resultados.dados.Fator_MIP}x</strong> a taxa base.
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                          {resultados.dados.Fonte}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-3 pt-2">
                    <Button
                      onClick={simularFinanciamento}
                      disabled={loading}
                      variant="outline"
                      className="flex-1"
                    >
                      Nova Simulação
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-md border-0 bg-white/80 backdrop-blur dark:bg-slate-800/80">
                <CardContent className="pt-12 pb-12">
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto mb-6 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                      <Calculator className="w-10 h-10 text-slate-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Aguardando Simulação</h3>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      Preencha os dados ao lado e clique em &quot;Simular Financiamento&quot; para ver os resultados.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SimuladorCaixaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <SimuladorCaixaContent />
    </Suspense>
  )
}
