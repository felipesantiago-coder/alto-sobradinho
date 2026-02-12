'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Landmark, Calculator, AlertCircle, Loader2, CheckCircle, Info } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

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
    Amortizacao_Mensal: string
    Juros_Primeira_Parcela: string
    Seguro_MIP: string
    Seguro_DFI: string
    Taxa_Juros_Nominal: string
    Taxa_Juros_Efetivos: string
    Percentual_Renda: string
    Idade_Calculada: string
    LTV_Maximo: string
    Limite_Renda: string
    Fonte: string
  }
}

function SimuladorCaixaContent() {
  const searchParams = useSearchParams()
  const [isClient, setIsClient] = useState(false)

  const valorImovel = searchParams.get('valorImovel') || ''
  const unidade = searchParams.get('unidade') || ''
  const tipologia = searchParams.get('tipologia') || ''
  const area = searchParams.get('area') || ''

  const [renda, setRenda] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
  const [sistemaAmortizacao, setSistemaAmortizacao] = useState('SAC TR')
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
    } else if (limpo.includes('.')) {
      const partes = limpo.split('.')
      if (partes[partes.length - 1].length === 2) return parseFloat(limpo)
      return parseFloat(limpo.replace(/\./g, ''))
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
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <Link href="/"><Button variant="ghost" className="gap-2"><ArrowLeft className="w-4 h-4" />Voltar</Button></Link>
        </div>

        <Card className="mb-6 dark:bg-background bg-white shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                <Landmark className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-2xl">Simulador de Financiamento CAIXA</CardTitle>
                <CardDescription className="text-sm">Simulação baseada nas regras do programa SBPE da Caixa Econômica Federal</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Card className="dark:bg-background bg-white shadow-md">
              <CardHeader><CardTitle className="text-lg">Dados da Unidade</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label className="text-sm text-muted-foreground">Unidade</Label><p className="font-semibold">{unidade || '-'}</p></div>
                  <div><Label className="text-sm text-muted-foreground">Tipologia</Label><p className="font-semibold">{tipologia || '-'}</p></div>
                  <div><Label className="text-sm text-muted-foreground">Área</Label><p className="font-semibold">{area || '-'}</p></div>
                  <div><Label className="text-sm text-muted-foreground">Valor</Label><p className="font-semibold text-blue-600">{valorImovel ? formatCurrency(parseValorMonetario(valorImovel)) : '-'}</p></div>
                </div>
              </CardContent>
            </Card>

            <Card className="dark:bg-background bg-white shadow-md">
              <CardHeader><CardTitle className="text-lg">Dados para Simulação</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="renda">Renda Familiar Mensal *</Label>
                  <Input id="renda" placeholder="Ex: 10000" value={renda} onChange={(e) => setRenda(e.target.value)} disabled={loading} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dataNascimento">Data de Nascimento *</Label>
                  <Input id="dataNascimento" type="date" value={dataNascimento} onChange={(e) => setDataNascimento(e.target.value)} disabled={loading} max={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sistemaAmortizacao">Sistema de Amortização *</Label>
                  <Select value={sistemaAmortizacao} onValueChange={setSistemaAmortizacao} disabled={loading}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SAC TR">SAC TR (Prestações Decrescentes)</SelectItem>
                      <SelectItem value="PRICE TR">PRICE TR (Prestações Fixas)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                      <p className="text-sm text-red-800">{error}</p>
                    </div>
                  </div>
                )}
                <Button onClick={simularFinanciamento} disabled={loading} className="w-full gap-2 bg-blue-600 hover:bg-blue-700" size="lg">
                  {loading ? <><Loader2 className="w-5 h-5 animate-spin" />Simulando...</> : <><Calculator className="w-5 h-5" />Simular</>}
                </Button>
              </CardContent>
            </Card>

            <Card className="dark:bg-background bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <h4 className="font-semibold text-sm mb-2 text-blue-900">Informações</h4>
                <ul className="text-xs space-y-1 text-blue-800">
                  <li>• <strong>SAC:</strong> Entrada mínima 10%, até 30% da renda, prazo até 420 meses</li>
                  <li>• <strong>PRICE:</strong> Entrada mínima 20%, até 25% da renda, prazo até 360 meses</li>
                  <li>• Taxa: 10,9259% a.a. (nominal) | 11,49% a.a. (efetiva)</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div>
            {resultados ? (
              <Card className="dark:bg-background bg-white shadow-md sticky top-4">
                <CardHeader className="border-b bg-green-50 dark:bg-green-900/20 border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <CardTitle className="text-xl text-green-900">Simulação Concluída</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 rounded-lg p-4 border border-blue-200">
                    <p className="text-sm text-muted-foreground mb-1">Valor Total Financiado</p>
                    <p className="text-2xl font-bold text-blue-900">{resultados.dados.Valor_Total_Financiado}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border">
                      <p className="text-xs text-muted-foreground mb-1">Entrada</p>
                      <p className="text-lg font-bold">{resultados.dados.Valor_Entrada}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border">
                      <p className="text-xs text-muted-foreground mb-1">Prazo Total</p>
                      <p className="text-lg font-bold">{resultados.dados.Prazo_Total}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border">
                      <p className="text-xs text-muted-foreground mb-1">1ª Prestação</p>
                      <p className="text-lg font-bold">{resultados.dados.Primeira_Prestacao}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border">
                      <p className="text-xs text-muted-foreground mb-1">Última Prestação</p>
                      <p className="text-lg font-bold">{resultados.dados.Ultima_Prestacao}</p>
                    </div>
                  </div>
                  <div className="space-y-3 border-t pt-4">
                    <h4 className="font-semibold text-sm flex items-center gap-2"><Info className="w-4 h-4" />Detalhes</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Sistema:</span><span className="font-medium">{resultados.dados.Sistema_Amortizacao}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">LTV Máx:</span><span className="font-medium">{resultados.dados.LTV_Maximo}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Juros Efetivos:</span><span className="font-medium">{resultados.dados.Taxa_Juros_Efetivos}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Comprometimento:</span><span className="font-medium">{resultados.dados.Percentual_Renda}</span></div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Idade</span>
                    <span className="font-medium">{resultados.dados.Idade_Calculada}</span>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">{resultados.dados.Fonte}</p>
                  <div className="space-y-2 pt-4">
                    <Button onClick={simularFinanciamento} disabled={loading} variant="outline" className="w-full">Nova Simulação</Button>
                    <Link href="/" className="block"><Button variant="ghost" className="w-full">Voltar</Button></Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="dark:bg-background bg-white shadow-md">
                <CardContent className="pt-6">
                  <div className="text-center py-12">
                    <Calculator className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-lg font-semibold mb-2">Aguardando Simulação</h3>
                    <p className="text-sm text-muted-foreground">Preencha os dados e clique em &quot;Simular&quot;</p>
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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>}>
      <SimuladorCaixaContent />
    </Suspense>
  )
}
