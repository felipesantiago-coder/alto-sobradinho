'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Calculator, AlertCircle } from 'lucide-react'
import Link from 'next/link'

const deliveryDates: Record<string, Date> = {
  'alto-da-alvorada': new Date('2027-03-31'),
  'alto-do-horizonte': new Date('2026-07-31')
}

export default function SimuladorPage({ params }: { params: { unidade: string } }) {
  const [isClient, setIsClient] = useState(false)
  const [saleValue, setSaleValue] = useState<string>('')
  const [discountValue, setDiscountValue] = useState<string>('0')
  const [capturePct, setCapturePct] = useState<number>(30)
  const [deliveryDate, setDeliveryDate] = useState<string>('')
  const [downPayment, setDownPayment] = useState<string>('')
  const [inccRate, setInccRate] = useState<number>(5)
  const [ipcaRate, setIpcaRate] = useState<number>(4)
  const [customIntermediaria, setCustomIntermediaria] = useState<string>('')
  const [customMensal, setCustomMensal] = useState<string>('')
  const [sinalWarning, setSinalWarning] = useState<string>('')
  const [schedule, setSchedule] = useState<Array<{
    mes: string
    data: string
    tipo: string
    pagamento?: number
    pagamentoTotal?: number
    saldo: number
  }>>([])
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

  function generateTable(baseMensalValue: number, baseInterValue: number, monthlyIncc: number, intermediarias: number[], deliveryDateObj: Date, finalValue: number, finalDownPayment: number) {
    const newSchedule: Array<{
      mes: string
      data: string
      tipo: string
      pagamento?: number
      pagamentoTotal?: number
      saldo: number
    }> = []
    let currentBalance = finalValue
    const currentDate = new Date()

    newSchedule.push({ mes: '0 (Ato)', data: currentDate.toLocaleDateString('pt-BR'), tipo: 'Sinal', pagamento: finalDownPayment, saldo: currentBalance })
    currentBalance -= finalDownPayment
    currentDate.setMonth(currentDate.getMonth() + 1)

    for (let i = 1; i <= getMonthsDifference(new Date(), deliveryDateObj); i++) {
      currentBalance += currentBalance * monthlyIncc
      const currentMensalPmt = baseMensalValue * Math.pow(1 + monthlyIncc, i - 1)
      let interPmt = 0
      let tipo = 'Mensal'
      if (intermediarias.includes(i)) { interPmt = baseInterValue * Math.pow(1 + monthlyIncc, i); tipo = 'Mensal + Intermediária' }
      const totalPmt = currentMensalPmt + interPmt
      currentBalance -= totalPmt
      newSchedule.push({ mes: i.toString(), data: currentDate.toLocaleDateString('pt-BR'), tipo, pagamentoTotal: totalPmt, saldo: currentBalance })
      currentDate.setMonth(currentDate.getMonth() + 1)
    }

    const financingPrincipal = currentBalance
    setSummaryValues(prev => ({ ...prev, correctedPostDeliveryBalance: financingPrincipal }))

    newSchedule.push({ mes: 'ENTREGA', data: currentDate.toLocaleDateString('pt-BR'), tipo: 'Início Financiamento', saldo: financingPrincipal })
    currentDate.setMonth(currentDate.getMonth() + 1)

    const n = 120
    const monthlyIpca = Math.pow(1 + (ipcaRate / 100), 1 / 12) - 1
    const iRate = monthlyIpca + 0.01
    const pmt = financingPrincipal * (iRate * Math.pow(1 + iRate, n)) / (Math.pow(1 + iRate, n) - 1)
    let balanceLoop = financingPrincipal

    for (let x = 1; x <= n; x++) {
      balanceLoop += balanceLoop * iRate
      const payThisMonth = x === n ? balanceLoop : pmt
      balanceLoop -= payThisMonth
      newSchedule.push({ mes: x.toString(), data: currentDate.toLocaleDateString('pt-BR'), tipo: 'Parcela Financiamento', pagamentoTotal: payThisMonth, saldo: Math.max(0, balanceLoop) })
      currentDate.setMonth(currentDate.getMonth() + 1)
    }

    setSchedule(newSchedule)
  }

  useEffect(() => {
    if (saleValue && deliveryDate && !isEditingSinal) calculate()
  }, [saleValue, discountValue, capturePct, deliveryDate, inccRate, ipcaRate, customIntermediaria, customMensal, isEditingSinal])

  if (!isClient) return null

  const finalValue = (parseFloat(saleValue) || 0) - (parseFloat(discountValue) || 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <Link href="/"><Button variant="ghost" className="gap-2"><ArrowLeft className="w-4 h-4" />Voltar</Button></Link>
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
                <Input type="number" value={saleValue} onChange={(e) => setSaleValue(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Desconto (Opcional)</Label>
                <Input type="number" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />
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
                <Input type="number" value={downPayment} onChange={(e) => { setDownPayment(e.target.value); setIsEditingSinal(true) }} onBlur={() => setIsEditingSinal(false)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>INCC (Obra)</Label>
                  <Select value={inccRate.toString()} onValueChange={(v) => setInccRate(parseInt(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5% a.a.</SelectItem>
                      <SelectItem value="6">6% a.a.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>IPCA (Pós-Obra)</Label>
                  <Select value={ipcaRate.toString()} onValueChange={(v) => setIpcaRate(parseInt(v))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">4% a.a.</SelectItem>
                      <SelectItem value="5">5% a.a.</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-6 dark:bg-background bg-white shadow-md">
          <CardHeader><CardTitle className="text-lg">Resumo</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border-l-4 border-primary">
                <h4 className="text-sm text-muted-foreground mb-2">Valor Final</h4>
                <div className="text-xl font-bold">{formatCurrency(finalValue)}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border-l-4 border-primary">
                <h4 className="text-sm text-muted-foreground mb-2">Sinal Ato</h4>
                <div className="text-xl font-bold">{formatCurrency(summaryValues.sinalAto)}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border-l-4 border-primary">
                <h4 className="text-sm text-muted-foreground mb-2">Captação (Sem Juros)</h4>
                <div className="text-xl font-bold">{formatCurrency(finalValue * (capturePct / 100))}</div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg border-l-4 border-primary">
                <h4 className="text-sm text-muted-foreground mb-2">Saldo Pós-Obra</h4>
                <div className="text-xl font-bold">{formatCurrency(summaryValues.correctedPostDeliveryBalance)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-background bg-white shadow-md">
          <CardHeader><CardTitle className="text-lg">Simulação Mensal</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold border-b">Mês</th>
                    <th className="px-4 py-3 text-left font-semibold border-b">Data</th>
                    <th className="px-4 py-3 text-left font-semibold border-b">Tipo</th>
                    <th className="px-4 py-3 text-left font-semibold border-b">Pagamento</th>
                    <th className="px-4 py-3 text-left font-semibold border-b">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((row, index) => (
                    <tr key={index} className={`${index % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                      <td className="px-4 py-3 border-b">{row.mes}</td>
                      <td className="px-4 py-3 border-b">{row.data}</td>
                      <td className="px-4 py-3 border-b">{row.tipo}</td>
                      <td className="px-4 py-3 border-b">{row.pagamentoTotal ? formatCurrency(row.pagamentoTotal) : row.pagamento ? formatCurrency(row.pagamento) : '-'}</td>
                      <td className="px-4 py-3 border-b font-semibold">{formatCurrency(row.saldo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
