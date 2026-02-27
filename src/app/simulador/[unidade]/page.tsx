'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CurrencyInput } from '@/components/ui/currency-input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Calculator, AlertCircle, Building2, Wallet, TrendingUp, Clock } from 'lucide-react'
import Link from 'next/link'
import { ThemeToggleSimple } from '@/components/theme-toggle-simple'

const deliveryDates: Record<string, Date> = {
  'alto-da-alvorada': new Date('2027-03-31'),
  'alto-do-horizonte': new Date('2026-07-31')
}

// Interface para as linhas da tabela unificada
interface ScheduleRow {
  mes: number | string
  data: string
  tipo: 'sinal' | 'mensal' | 'pos-obra'
  mensal?: number
  intermediaria?: number
  total: number
  saldo: number
  periodo?: 'obra' | 'entrega' | 'pos-obra'
}

export default function SimuladorPage({ params }: { params: { unidade: string } }) {
  const [isClient, setIsClient] = useState(false)
  const [saleValue, setSaleValue] = useState<string>('')
  const [discountValue, setDiscountValue] = useState<string>('0')
  const [capturePct, setCapturePct] = useState<number>(30)
  const [deliveryDate, setDeliveryDate] = useState<string>('')
  const [downPayment, setDownPayment] = useState<string>('')
  const [inccRate, setInccRate] = useState<number>(7.44)
  const [ipcaRate, setIpcaRate] = useState<number>(5.72)
  const [customIntermediaria, setCustomIntermediaria] = useState<string>('')
  const [customMensal, setCustomMensal] = useState<string>('')
  const [sinalWarning, setSinalWarning] = useState<string>('')
  const [schedule, setSchedule] = useState<ScheduleRow[]>([])
  const [summaryValues, setSummaryValues] = useState({
    nominalMensalSum: 0, nominalInterSum: 0, correctedMensalSum: 0, correctedInterSum: 0,
    nominalTotalConstruction: 0, correctedTotalConstruction: 0, baseMensalValue: 0, baseInterValue: 0,
    nominalPostDeliveryBalance: 0, correctedPostDeliveryBalance: 0, sinalAto: 0
  })
  const [intermediariaCustomizada, setIntermediariaCustomizada] = useState(false)
  const [mensalCustomizada, setMensalCustomizada] = useState(false)
  const [isEditingSinal, setIsEditingSinal] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const urlParams = new URLSearchParams(window.location.search)
    const valorVenda = urlParams.get('valorVenda')
    const empreendimento = urlParams.get('empreendimento')

    if (valorVenda) {
      setSaleValue(valorVenda)
      const defaultSinal = parseFloat(valorVenda) * 0.10
      setDownPayment(defaultSinal.toFixed(2))
    }

    if (empreendimento && deliveryDates[empreendimento]) {
      setDeliveryDate(deliveryDates[empreendimento].toISOString().split('T')[0])
    } else {
      const defaultDelivery = new Date()
      defaultDelivery.setFullYear(defaultDelivery.getFullYear() + 2)
      setDeliveryDate(defaultDelivery.toISOString().split('T')[0])
    }
  }, [])

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  const getMonthsDifference = (start: Date, end: Date) => Math.max(0, (end.getFullYear() - start.getFullYear()) * 12 - start.getMonth() + end.getMonth())

  const calculate = () => {
    const saleValueNum = parseFloat(saleValue) || 0
    const discountValueNum = parseFloat(discountValue) || 0
    const finalValue = saleValueNum - discountValueNum
    const deliveryDateObj = deliveryDate ? new Date(deliveryDate + 'T00:00:00') : null
    if (!deliveryDateObj) return

    const today = new Date()
    const monthsToDelivery = getMonthsDifference(today, deliveryDateObj)
    const monthlyIncc = Math.pow(1 + (inccRate / 100), 1 / 12) - 1

    const intermediarias: number[] = []
    for (let m = 6; m <= Math.max(0, monthsToDelivery - 3); m += 6) intermediarias.push(m)

    const nominalCaptureTarget = finalValue * (capturePct / 100)
    const defaultInterBaseValue = finalValue * 0.04
    const MIN_MENSAL = 1000

    let baseInterValue = defaultInterBaseValue
    let baseMensalValue = 0
    const finalDownPayment = parseFloat(downPayment) || 0

    if (intermediariaCustomizada) {
      baseInterValue = parseFloat(customIntermediaria) || 0
      const remainingForMensais = nominalCaptureTarget - finalDownPayment - (baseInterValue * intermediarias.length)
      baseMensalValue = Math.max(MIN_MENSAL, remainingForMensais / monthsToDelivery)
    } else if (mensalCustomizada) {
      baseMensalValue = Math.max(MIN_MENSAL, parseFloat(customMensal) || 0)
      if (!intermediariaCustomizada) baseInterValue = defaultInterBaseValue
    } else {
      const remainingForMensais = nominalCaptureTarget - finalDownPayment - (baseInterValue * intermediarias.length)
      baseMensalValue = Math.max(MIN_MENSAL, remainingForMensais / monthsToDelivery)
    }

    const nominalMensalSum = baseMensalValue * monthsToDelivery
    const nominalInterSum = baseInterValue * intermediarias.length
    const nominalTotalConstruction = finalDownPayment + nominalMensalSum + nominalInterSum

    const correctedMensalSum = baseMensalValue * (Math.pow(1 + monthlyIncc, monthsToDelivery) - 1) / monthlyIncc
    const correctedInterSum = intermediarias.reduce((s, m) => s + baseInterValue * Math.pow(1 + monthlyIncc, m), 0)
    const correctedTotalConstruction = finalDownPayment + correctedMensalSum + correctedInterSum

    setSummaryValues({
      nominalMensalSum, nominalInterSum, correctedMensalSum, correctedInterSum,
      nominalTotalConstruction, correctedTotalConstruction, baseMensalValue, baseInterValue,
      nominalPostDeliveryBalance: 0, correctedPostDeliveryBalance: 0, sinalAto: finalDownPayment
    })

    const minSinal = finalValue * 0.10
    setSinalWarning(finalDownPayment < minSinal ? `Sinal mínimo: ${formatCurrency(minSinal)} (10%)` : '')

    generateTable(baseMensalValue, baseInterValue, monthlyIncc, intermediarias, deliveryDateObj, finalValue, finalDownPayment)
  }

  // Helper para obter data formatada no dia 20 de um mês
  function getDataDia20(baseDate: Date, mesesAdiantados: number): string {
    const data = new Date(baseDate.getFullYear(), baseDate.getMonth() + mesesAdiantados, 20)
    return data.toLocaleDateString('pt-BR')
  }

  function generateTable(baseMensalValue: number, baseInterValue: number, monthlyIncc: number, intermediarias: number[], deliveryDateObj: Date, finalValue: number, finalDownPayment: number) {
    const newSchedule: ScheduleRow[] = []
    let currentBalance = finalValue
    const today = new Date()

    // Sinal no ato - período obra (data atual)
    newSchedule.push({ 
      mes: 'Ato', 
      data: today.toLocaleDateString('pt-BR'), 
      tipo: 'sinal',
      total: finalDownPayment, 
      saldo: currentBalance, 
      periodo: 'obra' 
    })
    currentBalance -= finalDownPayment

    const monthsToDelivery = getMonthsDifference(today, deliveryDateObj)

    // Parcelas mensais durante a obra - sempre dia 20
    for (let i = 1; i <= monthsToDelivery; i++) {
      currentBalance += currentBalance * monthlyIncc
      const currentMensalPmt = baseMensalValue * Math.pow(1 + monthlyIncc, i - 1)
      const hasIntermediaria = intermediarias.includes(i)
      const interPmt = hasIntermediaria ? baseInterValue * Math.pow(1 + monthlyIncc, i) : 0
      
      // Primeiro desconta a mensal
      currentBalance -= currentMensalPmt
      
      // Se tem intermediária, desconta também
      if (hasIntermediaria) {
        currentBalance -= interPmt
      }
      
      const totalPmt = currentMensalPmt + interPmt
      
      newSchedule.push({ 
        mes: i, 
        data: getDataDia20(today, i), 
        tipo: 'mensal',
        mensal: currentMensalPmt,
        intermediaria: hasIntermediaria ? interPmt : undefined,
        total: totalPmt, 
        saldo: currentBalance, 
        periodo: 'obra' 
      })
    }

    const financingPrincipal = currentBalance
    
    // Calcular saldo pós-obra base sem juros (valor nominal)
    const nominalPostDeliveryBalance = finalValue - finalDownPayment - (baseMensalValue * monthsToDelivery) - (baseInterValue * intermediarias.length)
    
    setSummaryValues(prev => ({ 
      ...prev, 
      correctedPostDeliveryBalance: financingPrincipal,
      nominalPostDeliveryBalance: Math.max(0, nominalPostDeliveryBalance)
    }))

    // Parcelas pós-obra - iniciar no mês seguinte à entrega, sempre dia 20
    const n = 120
    const monthlyIpca = Math.pow(1 + (ipcaRate / 100), 1 / 12) - 1
    const iRate = monthlyIpca + 0.01
    const pmt = financingPrincipal * (iRate * Math.pow(1 + iRate, n)) / (Math.pow(1 + iRate, n) - 1)
    let balanceLoop = financingPrincipal

    for (let x = 1; x <= n; x++) {
      balanceLoop += balanceLoop * iRate
      const payThisMonth = x === n ? balanceLoop : pmt
      balanceLoop -= payThisMonth
      
      newSchedule.push({ 
        mes: x, 
        data: getDataDia20(deliveryDateObj, x), 
        tipo: 'pos-obra',
        total: payThisMonth, 
        saldo: Math.max(0, balanceLoop), 
        periodo: 'pos-obra' 
      })
    }

    setSchedule(newSchedule)
  }

  useEffect(() => {
    if (saleValue && deliveryDate && !isEditingSinal) calculate()
  }, [saleValue, discountValue, capturePct, deliveryDate, inccRate, ipcaRate, customIntermediaria, customMensal, isEditingSinal])

  if (!isClient) return null

  const finalValue = (parseFloat(saleValue) || 0) - (parseFloat(discountValue) || 0)
  
  // Calcular captação total durante obra
  const captacaoObraNominal = summaryValues.sinalAto + summaryValues.nominalMensalSum + summaryValues.nominalInterSum
  const captacaoObraCorrigida = summaryValues.sinalAto + summaryValues.correctedMensalSum + summaryValues.correctedInterSum

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/"><Button variant="ghost" className="gap-2"><ArrowLeft className="w-4 h-4" />Voltar</Button></Link>
          <ThemeToggleSimple />
        </div>

        <Card className="mb-6 dark:bg-background bg-white shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Calculator className="w-8 h-8 text-primary" />
              <div>
                <CardTitle className="text-2xl">Calculadora Tabela Direta</CardTitle>
                <p className="text-sm text-muted-foreground">Simulação de condição de pagamento direta com a construtora</p>
              </div>
            </div>
          </CardHeader>
        </Card>

        {sinalWarning && (
          <Card className="mb-6 border-red-400 bg-red-50 dark:bg-red-900/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <p className="text-red-800">{sinalWarning}</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="dark:bg-background bg-white shadow-md">
            <CardHeader><CardTitle className="text-lg">Dados do Imóvel</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Valor de Venda</Label>
                <CurrencyInput value={saleValue} onChange={(value) => setSaleValue(value)} placeholder="0,00" />
              </div>
              <div className="space-y-2">
                <Label>Desconto (Opcional)</Label>
                <CurrencyInput value={discountValue} onChange={(value) => setDiscountValue(value)} placeholder="0,00" />
              </div>
              <div className="space-y-2">
                <Label>Captação na Obra (%)</Label>
                <Select value={capturePct.toString()} onValueChange={(v) => setCapturePct(parseInt(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30%</SelectItem>
                    <SelectItem value="25">25%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Data de Entrega</Label>
                <Input type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-background bg-white shadow-md">
            <CardHeader><CardTitle className="text-lg">Condições de Pagamento</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Sinal Ato (Mínimo 10%)</Label>
                <CurrencyInput 
                  value={downPayment} 
                  onChange={(value) => { setDownPayment(value); setIsEditingSinal(true) }} 
                  onBlur={() => setIsEditingSinal(false)} 
                  placeholder="0,00"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>INCC (Obra)</Label>
                  <Select value={inccRate.toString()} onValueChange={(v) => setInccRate(parseFloat(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6.17">6,17% a.a.</SelectItem>
                      <SelectItem value="7.44">7,44% a.a.</SelectItem>
                      <SelectItem value="8.73">8,73% a.a.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>IPCA (Pós-Obra)</Label>
                  <Select value={ipcaRate.toString()} onValueChange={(v) => setIpcaRate(parseFloat(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4.5">4,50% a.a.</SelectItem>
                      <SelectItem value="5.72">5,72% a.a.</SelectItem>
                      <SelectItem value="7.5">7,50% a.a.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Seção de Resumo da Operação */}
        <Card className="mb-6 dark:bg-background bg-white shadow-md">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Resumo da Operação
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Valor Final */}
            <div className="mb-6">
              <div className="bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 p-4 rounded-lg border-l-4 border-primary">
                <h4 className="text-sm text-muted-foreground mb-1">Valor Final do Imóvel</h4>
                <div className="text-2xl font-bold text-primary">{formatCurrency(finalValue)}</div>
              </div>
            </div>

            {/* Grid de resumo principal */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Sinal Ato */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20 p-5 rounded-xl border-2 border-green-300 dark:border-green-700 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-800 dark:text-green-200">Sinal no Ato</h4>
                    <p className="text-xs text-green-600 dark:text-green-400">Pagamento imediato</p>
                  </div>
                </div>
                <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                  {formatCurrency(summaryValues.sinalAto)}
                </div>
                <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                  {((summaryValues.sinalAto / finalValue) * 100).toFixed(1)}% do valor
                </div>
              </div>

              {/* Captação Durante a Obra */}
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20 p-5 rounded-xl border-2 border-amber-300 dark:border-amber-700 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-amber-800 dark:text-amber-200">Captação Durante a Obra</h4>
                    <p className="text-xs text-amber-600 dark:text-amber-400">Mensais + Intermediárias</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-amber-700 dark:text-amber-300">Valor Base (sem juros):</span>
                    <span className="font-semibold text-amber-800 dark:text-amber-200">{formatCurrency(captacaoObraNominal - summaryValues.sinalAto)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-amber-700 dark:text-amber-300">Valor Corrigido (INCC):</span>
                    <span className="font-bold text-lg text-amber-900 dark:text-amber-100">{formatCurrency(captacaoObraCorrigida - summaryValues.sinalAto)}</span>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-700">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-amber-800 dark:text-amber-200">Total com Sinal:</span>
                    <span className="font-bold text-amber-900 dark:text-amber-100">{formatCurrency(captacaoObraCorrigida)}</span>
                  </div>
                </div>
              </div>

              {/* Saldo Pós-Obra */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20 p-5 rounded-xl border-2 border-blue-300 dark:border-blue-700 shadow-sm md:col-span-2">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200">Saldo Restante para Pós-Obra</h4>
                    <p className="text-xs text-blue-600 dark:text-blue-400">Valor a ser financiado após a entrega</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white/50 dark:bg-white/10 p-3 rounded-lg">
                    <div className="text-sm text-blue-700 dark:text-blue-300 mb-1">Valor Base (sem juros)</div>
                    <div className="text-xl font-bold text-blue-800 dark:text-blue-200">{formatCurrency(summaryValues.nominalPostDeliveryBalance)}</div>
                  </div>
                  <div className="bg-white/50 dark:bg-white/10 p-3 rounded-lg">
                    <div className="text-sm text-blue-700 dark:text-blue-300 mb-1">Valor Corrigido (INCC)</div>
                    <div className="text-xl font-bold text-blue-800 dark:text-blue-200">{formatCurrency(summaryValues.correctedPostDeliveryBalance)}</div>
                  </div>
                </div>
                
                <div className="mt-3 text-xs text-blue-600 dark:text-blue-400">
                  Este saldo será financiado em 120 parcelas com taxa IPCA + 1% a.a.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Pagamentos - Layout Intuitivo */}
        <Card className="dark:bg-background bg-white shadow-md">
          <CardHeader>
            <CardTitle className="text-lg">Simulação Mensal</CardTitle>
            <p className="text-sm text-muted-foreground">Cronograma de pagamentos durante e após a obra</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 z-10">
                  <tr className="bg-slate-200 dark:bg-slate-700">
                    <th className="px-3 py-3 text-left font-semibold border-b-2 border-slate-300 dark:border-slate-600">Mês</th>
                    <th className="px-3 py-3 text-left font-semibold border-b-2 border-slate-300 dark:border-slate-600">Data</th>
                    <th className="px-3 py-3 text-right font-semibold border-b-2 border-green-400 dark:border-green-600 bg-green-100/50 dark:bg-green-900/30">Mensal</th>
                    <th className="px-3 py-3 text-right font-semibold border-b-2 border-amber-400 dark:border-amber-600 bg-amber-100/50 dark:bg-amber-900/30">Intermediária</th>
                    <th className="px-3 py-3 text-right font-semibold border-b-2 border-slate-400 dark:border-slate-500 bg-slate-100 dark:bg-slate-800">Total</th>
                    <th className="px-3 py-3 text-right font-semibold border-b-2 border-slate-300 dark:border-slate-600">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Período Durante a Obra (Sinal + Mensais + Intermediárias) */}
                  {schedule.filter(s => s.periodo === 'obra').map((row, index) => {
                    const isSinal = row.tipo === 'sinal'
                    const hasIntermediaria = row.intermediaria !== undefined
                    
                    // Determinar cores da linha
                    let rowClass = ''
                    if (isSinal) {
                      rowClass = 'bg-green-100/70 dark:bg-green-900/20'
                    } else if (hasIntermediaria) {
                      rowClass = 'bg-amber-50/70 dark:bg-amber-900/10'
                    } else {
                      rowClass = index % 2 === 0 ? 'bg-green-50/30 dark:bg-green-900/5' : 'bg-white dark:bg-slate-800/50'
                    }
                    
                    return (
                      <tr key={`obra-${index}`} className={`${rowClass} hover:bg-slate-100/50 dark:hover:bg-slate-700/30 transition-colors`}>
                        <td className="px-3 py-2.5 border-b border-slate-200/50 dark:border-slate-700/50">
                          <span className={`font-medium ${isSinal ? 'text-green-700 dark:text-green-300' : ''}`}>
                            {isSinal ? 'Ato' : `${row.mes}º`}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 border-b border-slate-200/50 dark:border-slate-700/50 text-muted-foreground">
                          {row.data}
                        </td>
                        <td className="px-3 py-2.5 border-b border-green-200/30 dark:border-green-800/30 text-right bg-green-50/30 dark:bg-green-900/10">
                          {row.mensal ? (
                            <span className="font-medium text-green-700 dark:text-green-300">{formatCurrency(row.mensal)}</span>
                          ) : isSinal ? (
                            <span className="text-xs text-muted-foreground italic">sinal</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 border-b border-amber-200/30 dark:border-amber-800/30 text-right bg-amber-50/30 dark:bg-amber-900/10">
                          {row.intermediaria ? (
                            <span className="font-medium text-amber-700 dark:text-amber-300">{formatCurrency(row.intermediaria)}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 border-b border-slate-200/50 dark:border-slate-700/50 text-right font-semibold">
                          <span className={isSinal ? 'text-green-700 dark:text-green-300' : ''}>
                            {formatCurrency(row.total)}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 border-b border-slate-200/50 dark:border-slate-700/50 text-right font-semibold text-slate-700 dark:text-slate-300">
                          {formatCurrency(row.saldo)}
                        </td>
                      </tr>
                    )
                  })}
                  
                  {/* Linha de Entrega - Separador */}
                  <tr className="bg-gradient-to-r from-amber-100 to-amber-200 dark:from-amber-900/50 dark:to-amber-800/50">
                    <td colSpan={6} className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <div className="h-px bg-amber-400 dark:bg-amber-600 flex-1"></div>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span className="font-bold text-amber-800 dark:text-amber-200 text-sm">ENTREGA DO EMPREENDIMENTO</span>
                        </div>
                        <div className="h-px bg-amber-400 dark:bg-amber-600 flex-1"></div>
                      </div>
                      <div className="text-xs text-amber-700 dark:text-amber-300 font-semibold mt-1">
                        Saldo a financiar: {formatCurrency(summaryValues.correctedPostDeliveryBalance)}
                      </div>
                    </td>
                  </tr>
                  
                  {/* Período Pós-Obra (Financiamento) */}
                  {schedule.filter(s => s.periodo === 'pos-obra').map((row, index) => {
                    const rowClass = index % 2 === 0 ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'bg-blue-100/30 dark:bg-blue-900/5'
                    
                    return (
                      <tr key={`pos-obra-${index}`} className={`${rowClass} hover:bg-blue-100/50 dark:hover:bg-blue-900/20 transition-colors`}>
                        <td className="px-3 py-2.5 border-b border-blue-200/50 dark:border-blue-800/50">
                          <span className="font-medium text-blue-700 dark:text-blue-300">{row.mes}º</span>
                        </td>
                        <td className="px-3 py-2.5 border-b border-blue-200/50 dark:border-blue-800/50 text-muted-foreground">
                          {row.data}
                        </td>
                        <td className="px-3 py-2.5 border-b border-blue-200/50 dark:border-blue-800/50 text-right">
                          <span className="text-muted-foreground">-</span>
                        </td>
                        <td className="px-3 py-2.5 border-b border-blue-200/50 dark:border-blue-800/50 text-right">
                          <span className="text-muted-foreground">-</span>
                        </td>
                        <td className="px-3 py-2.5 border-b border-blue-200/50 dark:border-blue-800/50 text-right font-semibold">
                          <span className="text-blue-700 dark:text-blue-300">{formatCurrency(row.total)}</span>
                        </td>
                        <td className="px-3 py-2.5 border-b border-blue-200/50 dark:border-blue-800/50 text-right font-semibold text-slate-700 dark:text-slate-300">
                          {formatCurrency(row.saldo)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Legenda */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex flex-wrap gap-4 justify-center">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100 dark:bg-green-900/50 rounded border border-green-300 dark:border-green-700"></div>
                  <span className="text-sm text-muted-foreground">Mensal</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-amber-100 dark:bg-amber-900/50 rounded border border-amber-300 dark:border-amber-700"></div>
                  <span className="text-sm text-muted-foreground">Intermediária</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900/50 rounded border border-blue-300 dark:border-blue-700"></div>
                  <span className="text-sm text-muted-foreground">Pós-Obra (Financiamento)</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
