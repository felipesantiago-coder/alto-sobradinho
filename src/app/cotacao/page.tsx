'use client'

import { useState, useEffect, Suspense, useMemo, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Slider } from '@/components/ui/slider'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ArrowLeft,
  FileText,
  Home,
  DollarSign,
  Building2,
  Calculator,
  Plus,
  Trash2,
  CheckCircle,
  AlertCircle,
  Banknote,
  PiggyBank,
  Percent,
  Wallet,
  Loader2,
  ChevronDown,
  TrendingUp,
  Calendar,
  Gem,
  Crown,
  Medal,
  Shield
} from 'lucide-react'

interface FluxoItem {
  id: string
  tipo: string
  valor: number
  valorEditavel: string
  editavel: boolean
  icon: React.ReactNode
  data: string // Data no formato YYYY-MM-DD
  dataEditavel: boolean // Se o usuário pode editar a data
}

// Configuração dos perfis de cliente com limites
const PERFIS = {
  diamante: {
    nome: 'Diamante',
    icon: <Gem className="w-4 h-4" />,
    cor: 'text-cyan-600',
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    border: 'border-cyan-200 dark:border-cyan-800',
    descricao: 'Cliente premium com benefícios exclusivos',
    limites: {
      comprometimentoRenda: 50,
      percentualParcelado: 25,
      comprometimentoProSoluto: 20
    }
  },
  ouro: {
    nome: 'Ouro',
    icon: <Medal className="w-4 h-4 text-amber-500" />,
    cor: 'text-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    border: 'border-amber-200 dark:border-amber-800',
    descricao: 'Cliente com condições especiais',
    limites: {
      comprometimentoRenda: 50,
      percentualParcelado: 20,
      comprometimentoProSoluto: 20
    }
  },
  prata: {
    nome: 'Prata',
    icon: <Medal className="w-4 h-4 text-slate-400" />,
    cor: 'text-slate-500',
    bg: 'bg-slate-50 dark:bg-slate-900/20',
    border: 'border-slate-200 dark:border-slate-700',
    descricao: 'Cliente com benefícios padrão',
    limites: {
      comprometimentoRenda: 48,
      percentualParcelado: 18,
      comprometimentoProSoluto: 18
    }
  },
  bronze: {
    nome: 'Bronze',
    icon: <Medal className="w-4 h-4 text-orange-600" />,
    cor: 'text-orange-600',
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800',
    descricao: 'Cliente em desenvolvimento',
    limites: {
      comprometimentoRenda: 45,
      percentualParcelado: 15,
      comprometimentoProSoluto: 15
    }
  },
  aco: {
    nome: 'Aço',
    icon: <Shield className="w-4 h-4" />,
    cor: 'text-zinc-500',
    bg: 'bg-zinc-50 dark:bg-zinc-900/20',
    border: 'border-zinc-200 dark:border-zinc-700',
    descricao: 'Cliente inicial',
    limites: {
      comprometimentoRenda: 40,
      percentualParcelado: 12,
      comprometimentoProSoluto: 10
    }
  }
} as const

type PerfilType = keyof typeof PERFIS

// Datas de entrega por empreendimento
const DATAS_ENTREGA: Record<string, string> = {
  'alto-da-alvorada': '2027-03-31',
  'alto-do-horizonte': '2026-07-31'
}

// Interface para os detalhes do pró-soluto
interface ProSolutoDetalhes {
  valorBase: number
  valorCorrigido: number
  taxaCorrecao: number
  parcelaMensal: number
  parcelasAntesEntrega: number
  parcelasAposEntrega: number
  tabela: Array<{ parcela: number; data: string; valor: number; saldo: number; periodo: 'antes' | 'apos' }>
}

function CotacaoContent() {
  const searchParams = useSearchParams()
  const [isClient, setIsClient] = useState(false)

  // Dados da unidade
  const unidade = searchParams.get('unidade') || ''
  const tipologia = searchParams.get('tipologia') || ''
  const area = searchParams.get('area') || ''
  const empreendimento = searchParams.get('empreendimento') || ''
  const valorVenda = parseFloat(searchParams.get('valorVenda') || '0')
  const valorAvaliacao = parseFloat(searchParams.get('valorAvaliacao') || '0')
  const bonusConstrutora = parseFloat(searchParams.get('bonusConstrutora') || '0')

  // Dados da simulação
  const valorFinanciado = parseFloat(searchParams.get('valorFinanciado') || '0')
  const sistemaAmortizacao = searchParams.get('sistemaAmortizacao') || ''
  const prazoAmortizacao = searchParams.get('prazoAmortizacao') || ''
  const primeiraPrestacao = searchParams.get('primeiraPrestacao') || ''
  const ultimaPrestacao = searchParams.get('ultimaPrestacao') || ''
  const percentualEntrada = searchParams.get('percentualEntrada') || ''
  const renda = searchParams.get('renda') || ''
  const dataNascimento = searchParams.get('dataNascimento') || ''

  // Data de entrega do empreendimento
  const dataEntregaStr = empreendimento ? (DATAS_ENTREGA[empreendimento] || '') : ''
  const dataEntrega = dataEntregaStr ? new Date(dataEntregaStr + 'T00:00:00') : null

  // Fluxo de pagamento
  const [fluxoPagamento, setFluxoPagamento] = useState<FluxoItem[]>([])

  // Estado de validação
  const [validacao, setValidacao] = useState<'ok' | 'erro' | 'pendente'>('pendente')
  const [diferenca, setDiferenca] = useState<number>(0)

  // Estado para o Slider de Parcelas
  const [parcelasProSoluto, setParcelasProSoluto] = useState(0)

  // Perfil do cliente
  const [perfilSelecionado, setPerfilSelecionado] = useState<PerfilType>('prata')

  // Flag para controlar inicialização
  const [initialized, setInitialized] = useState(false)

  // Campos disponíveis para adicionar
  const camposDisponiveis = [
    { id: 'sinalAto', tipo: 'Sinal Ato', icon: <Wallet className="w-4 h-4 text-green-600" /> },
    { id: 'sinal1', tipo: 'Sinal 1', icon: <Wallet className="w-4 h-4 text-green-600" /> },
    { id: 'sinal2', tipo: 'Sinal 2', icon: <Wallet className="w-4 h-4 text-green-600" /> },
    { id: 'sinal3', tipo: 'Sinal 3', icon: <Wallet className="w-4 h-4 text-green-600" /> },
    { id: 'desconto', tipo: 'Desconto', icon: <Percent className="w-4 h-4 text-red-600" /> },
    { id: 'fgts', tipo: 'FGTS', icon: <Banknote className="w-4 h-4 text-purple-600" /> },
  ]

  // Calcular deslocamento do mês de início do pró-soluto baseado nos sinais adicionados
  const calcularDeslocamentoInicioProSoluto = (): number => {
    const temSinal1 = fluxoPagamento.some(f => f.id === 'sinal1')
    const temSinal2 = fluxoPagamento.some(f => f.id === 'sinal2')
    const temSinal3 = fluxoPagamento.some(f => f.id === 'sinal3')
    
    // O deslocamento é baseado no maior sinal adicionado
    if (temSinal3) return 3
    if (temSinal2) return 2
    if (temSinal1) return 1
    return 0
  }

  // Campos que ainda podem ser adicionados (com lógica condicional para sinais)
  const camposParaAdicionar = camposDisponiveis.filter(c => {
    // Se já existe no fluxo, não mostrar
    if (fluxoPagamento.find(f => f.id === c.id)) return false
    
    // Sinal 2 e 3 só aparecem se Sinal 1 foi adicionado
    if (c.id === 'sinal2' || c.id === 'sinal3') {
      const temSinal1 = fluxoPagamento.some(f => f.id === 'sinal1')
      if (!temSinal1) return false
    }
    
    // Sinal 3 só aparece se Sinal 1 e Sinal 2 foram adicionados
    if (c.id === 'sinal3') {
      const temSinal2 = fluxoPagamento.some(f => f.id === 'sinal2')
      if (!temSinal2) return false
    }
    
    return true
  })

  // Função auxiliar para obter último dia do mês seguinte à entrega
  const getDataPosEntrega = (): string => {
    if (!dataEntrega) {
      const hoje = new Date()
      const dataFutura = new Date(hoje.getFullYear(), hoje.getMonth() + 2, 0)
      return dataFutura.toISOString().split('T')[0]
    }
    const mesSeguinte = new Date(dataEntrega.getFullYear(), dataEntrega.getMonth() + 2, 0)
    return mesSeguinte.toISOString().split('T')[0]
  }

  // Inicialização única do fluxo
  useEffect(() => {
    setIsClient(true)
    
    if (initialized) return
    
    const dataPosEntrega = getDataPosEntrega()
    
    const inicial: FluxoItem[] = [
      {
        id: 'financiamento',
        tipo: 'Financiamento',
        valor: valorFinanciado,
        valorEditavel: '',
        editavel: false,
        icon: <Building2 className="w-4 h-4 text-blue-600" />,
        data: dataPosEntrega,
        dataEditavel: false
      }
    ]

    if (bonusConstrutora > 0) {
      inicial.push({
        id: 'bonus',
        tipo: 'Bônus Construtora',
        valor: bonusConstrutora,
        valorEditavel: '',
        editavel: false,
        icon: <PiggyBank className="w-4 h-4 text-amber-600" />,
        data: dataPosEntrega,
        dataEditavel: false
      })
    }

    setFluxoPagamento(inicial)
    setInitialized(true)
  }, [initialized, valorFinanciado, bonusConstrutora, dataEntrega])

  const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('pt-BR')
  }

  const parseValue = (val: string): number => {
    if (!val) return 0
    const limpo = val.replace(/[R$\s.]/g, '').replace(',', '.')
    return parseFloat(limpo) || 0
  }

  // Valor base para verificação
  const valorBase = bonusConstrutora > 0 ? valorAvaliacao : valorVenda

  // Calcular soma do fluxo
  const calcularSomaFluxo = (): number => {
    return fluxoPagamento.reduce((acc, item) => {
      if (item.editavel) {
        return acc + parseValue(item.valorEditavel)
      }
      return acc + item.valor
    }, 0)
  }

  // Verificar se pode mostrar pró-soluto
  const sinalAtoItem = fluxoPagamento.find(f => f.id === 'sinalAto')
  const podeMostrarProSoluto = sinalAtoItem && parseValue(sinalAtoItem.valorEditavel) > 0 && valorFinanciado > 0

  // Calcular pró-soluto base
  const calcularProSolutoBase = (): number => {
    if (!podeMostrarProSoluto) return 0
    const somaAtual = calcularSomaFluxo()
    return valorBase - somaAtual
  }

  // Calcular meses até a entrega a partir de hoje
  const calcularMesesAteEntrega = (): number => {
    if (!dataEntrega) return 0
    const hoje = new Date()
    const meses = (dataEntrega.getFullYear() - hoje.getFullYear()) * 12 + (dataEntrega.getMonth() - hoje.getMonth())
    return Math.max(0, meses)
  }

  // Cálculo do pró-soluto parcelado com correção por período - usando useMemo para evitar loops
  const proSolutoDetalhes = useMemo<ProSolutoDetalhes | null>(() => {
    const valorBaseProSoluto = calcularProSolutoBase()
    
    if (parcelasProSoluto === 0 || valorBaseProSoluto <= 0) {
      return null
    }

    const mesesAteEntrega = calcularMesesAteEntrega()
    const hoje = new Date()
    
    // Calcular deslocamento baseado nos sinais adicionados
    const deslocamento = calcularDeslocamentoInicioProSoluto()

    // Determinar taxa de correção inicial baseada no primeiro mês do parcelamento
    // Primeira parcela = mês seguinte ao ato (índice 1) + deslocamento dos sinais
    // O mês da primeira parcela = 1 + deslocamento
    // Se (1 + deslocamento) < mesesAteEntrega, a primeira parcela será ANTES da entrega → 0,5%
    // Se (1 + deslocamento) >= mesesAteEntrega, a primeira parcela será NA ENTREGA ou DEPOIS → 1,5%
    const primeiroMesParcela = 1 + deslocamento
    const primeiraParcelaAntesEntrega = primeiroMesParcela < mesesAteEntrega
    const taxaCorrecao = primeiraParcelaAntesEntrega ? 0.005 : 0.015

    // Aplicar correção inicial:
    // - 1x correção padrão
    // - + deslocamento correções adicionais (1 para sinal1, 2 para sinal2, 3 para sinal3)
    // Total de correções = 1 + deslocamento
    const totalCorrecoes = 1 + deslocamento
    const valorCorrigido = valorBaseProSoluto * Math.pow(1 + taxaCorrecao, totalCorrecoes)

    // Calcular parcelas antes e depois da entrega
    // Parcelas antes da entrega = meses até a entrega - deslocamento - 1
    const parcelasAntesEntrega = Math.min(parcelasProSoluto, Math.max(0, mesesAteEntrega - deslocamento - 1))
    const parcelasAposEntrega = parcelasProSoluto - parcelasAntesEntrega

    // Taxas de juros mensais
    const i1 = 0.005 // 0,5% a.m. antes da entrega
    const i2 = 0.015 // 1,5% a.m. após a entrega

    // Calcular PMT usando o método PRICE modificado para dois períodos
    let pmt: number

    if (parcelasAntesEntrega === 0) {
      // Todas as parcelas após a entrega - PRICE tradicional com i2
      pmt = valorCorrigido * (i2 * Math.pow(1 + i2, parcelasProSoluto)) / (Math.pow(1 + i2, parcelasProSoluto) - 1)
    } else if (parcelasAposEntrega === 0) {
      // Todas as parcelas antes da entrega - PRICE tradicional com i1
      pmt = valorCorrigido * (i1 * Math.pow(1 + i1, parcelasProSoluto)) / (Math.pow(1 + i1, parcelasProSoluto) - 1)
    } else {
      // Parcelas em ambos os períodos
      const fator1 = (1 - Math.pow(1 + i1, -parcelasAntesEntrega)) / i1
      const fatorPosEntregaNaEntrega = (1 - Math.pow(1 + i2, -parcelasAposEntrega)) / i2
      const fator2 = fatorPosEntregaNaEntrega / Math.pow(1 + i1, parcelasAntesEntrega)
      const fatorTotal = fator1 + fator2
      pmt = valorCorrigido / fatorTotal
    }

    // Gerar tabela de amortização
    const tabela: Array<{ parcela: number; data: string; valor: number; saldo: number; periodo: 'antes' | 'apos' }> = []
    let saldoDevedor = valorCorrigido

    for (let i = 1; i <= parcelasProSoluto; i++) {
      const taxaAtual = i <= parcelasAntesEntrega ? i1 : i2
      const juros = saldoDevedor * taxaAtual
      let amortizacao = pmt - juros
      let valorParcela = pmt
      
      if (i === parcelasProSoluto) {
        valorParcela = saldoDevedor + juros
        amortizacao = saldoDevedor
      }
      
      saldoDevedor = Math.max(0, saldoDevedor - amortizacao)

      // Data da parcela = mês atual + índice da parcela + deslocamento dos sinais
      const dataParcela = new Date(hoje.getFullYear(), hoje.getMonth() + i + deslocamento, 20)
      const periodo = i <= parcelasAntesEntrega ? 'antes' : 'apos'

      tabela.push({
        parcela: i,
        data: formatDate(dataParcela),
        valor: valorParcela,
        saldo: saldoDevedor,
        periodo
      })
    }

    return {
      valorBase: valorBaseProSoluto,
      valorCorrigido,
      taxaCorrecao: taxaCorrecao * 100,
      parcelaMensal: pmt,
      parcelasAntesEntrega,
      parcelasAposEntrega,
      tabela
    }
  }, [parcelasProSoluto, fluxoPagamento, valorBase, dataEntrega, podeMostrarProSoluto])

  // Atualizar cálculo quando fluxo mudar
  useEffect(() => {
    const somaAtual = calcularSomaFluxo()
    const proSoluto = podeMostrarProSoluto ? calcularProSolutoBase() : 0
    const somaComProSoluto = somaAtual + proSoluto
    const diff = valorBase - somaComProSoluto

    setDiferenca(diff)

    if (Math.abs(diff) < 0.01 && fluxoPagamento.some(f => f.id === 'sinalAto')) {
      setValidacao('ok')
    } else if (somaAtual > 0) {
      setValidacao('erro')
    } else {
      setValidacao('pendente')
    }
  }, [fluxoPagamento, valorBase, podeMostrarProSoluto])

  // Adicionar campo ao fluxo
  const adicionarCampo = (campoId: string) => {
    const campo = camposDisponiveis.find(c => c.id === campoId)
    if (campo && !fluxoPagamento.find(f => f.id === campoId)) {
      
      // Calcular data padrão baseada no tipo de campo
      let dataPadrao = ''
      let dataEditavel = true
      
      const hoje = new Date()
      
      if (campoId === 'sinalAto') {
        // Data atual
        dataPadrao = hoje.toISOString().split('T')[0]
        dataEditavel = true
      } else if (campoId === 'sinal1') {
        // Dia 20 do mês seguinte ao sinal ato
        const sinalAto = fluxoPagamento.find(f => f.id === 'sinalAto')
        if (sinalAto && sinalAto.data) {
          const dataSinalAto = new Date(sinalAto.data + 'T00:00:00')
          dataPadrao = new Date(dataSinalAto.getFullYear(), dataSinalAto.getMonth() + 1, 20).toISOString().split('T')[0]
        } else {
          dataPadrao = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 20).toISOString().split('T')[0]
        }
        dataEditavel = true
      } else if (campoId === 'sinal2') {
        // Dia 20 do mês seguinte ao sinal 1
        const sinal1 = fluxoPagamento.find(f => f.id === 'sinal1')
        if (sinal1 && sinal1.data) {
          const dataSinal1 = new Date(sinal1.data + 'T00:00:00')
          dataPadrao = new Date(dataSinal1.getFullYear(), dataSinal1.getMonth() + 1, 20).toISOString().split('T')[0]
        } else {
          dataPadrao = new Date(hoje.getFullYear(), hoje.getMonth() + 2, 20).toISOString().split('T')[0]
        }
        dataEditavel = true
      } else if (campoId === 'sinal3') {
        // Dia 20 do mês seguinte ao sinal 2
        const sinal2 = fluxoPagamento.find(f => f.id === 'sinal2')
        if (sinal2 && sinal2.data) {
          const dataSinal2 = new Date(sinal2.data + 'T00:00:00')
          dataPadrao = new Date(dataSinal2.getFullYear(), dataSinal2.getMonth() + 1, 20).toISOString().split('T')[0]
        } else {
          dataPadrao = new Date(hoje.getFullYear(), hoje.getMonth() + 3, 20).toISOString().split('T')[0]
        }
        dataEditavel = true
      } else if (campoId === 'desconto' || campoId === 'fgts') {
        // Último dia do mês seguinte à entrega
        if (dataEntrega) {
          const mesSeguinte = new Date(dataEntrega.getFullYear(), dataEntrega.getMonth() + 2, 0)
          dataPadrao = mesSeguinte.toISOString().split('T')[0]
        } else {
          const mesSeguinte = new Date(hoje.getFullYear(), hoje.getMonth() + 2, 0)
          dataPadrao = mesSeguinte.toISOString().split('T')[0]
        }
        dataEditavel = false
      }
      
      setFluxoPagamento([...fluxoPagamento, {
        id: campo.id,
        tipo: campo.tipo,
        valor: 0,
        valorEditavel: '',
        editavel: true,
        icon: campo.icon,
        data: dataPadrao,
        dataEditavel
      }])
    }
  }

  // Remover campo do fluxo
  const removerCampo = (id: string) => {
    setFluxoPagamento(fluxoPagamento.filter(f => f.id !== id))
  }

  // Atualizar valor de campo editável
  const atualizarValor = (id: string, valor: string) => {
    setFluxoPagamento(fluxoPagamento.map(item =>
      item.id === id ? { ...item, valorEditavel: valor } : item
    ))
  }

  // Atualizar data de campo editável
  const atualizarData = (id: string, data: string) => {
    setFluxoPagamento(fluxoPagamento.map(item =>
      item.id === id ? { ...item, data } : item
    ))
  }

  // Obter data mínima permitida para um campo
  const getDataMinima = (id: string): string => {
    const hoje = new Date()
    const hojeStr = hoje.toISOString().split('T')[0]
    
    if (id === 'sinalAto') {
      // Apenas datas futuras (incluindo hoje)
      return hojeStr
    } else if (id === 'sinal1') {
      // Após o sinal ato
      const sinalAto = fluxoPagamento.find(f => f.id === 'sinalAto')
      if (sinalAto && sinalAto.data) {
        // Dia seguinte ao sinal ato
        const dataSinalAto = new Date(sinalAto.data + 'T00:00:00')
        dataSinalAto.setDate(dataSinalAto.getDate() + 1)
        return dataSinalAto.toISOString().split('T')[0]
      }
      return hojeStr
    } else if (id === 'sinal2') {
      // Após o sinal 1
      const sinal1 = fluxoPagamento.find(f => f.id === 'sinal1')
      if (sinal1 && sinal1.data) {
        const dataSinal1 = new Date(sinal1.data + 'T00:00:00')
        dataSinal1.setDate(dataSinal1.getDate() + 1)
        return dataSinal1.toISOString().split('T')[0]
      }
      return hojeStr
    } else if (id === 'sinal3') {
      // Após o sinal 2
      const sinal2 = fluxoPagamento.find(f => f.id === 'sinal2')
      if (sinal2 && sinal2.data) {
        const dataSinal2 = new Date(sinal2.data + 'T00:00:00')
        dataSinal2.setDate(dataSinal2.getDate() + 1)
        return dataSinal2.toISOString().split('T')[0]
      }
      return hojeStr
    }
    return hojeStr
  }

  if (!isClient) return null

  const proSoluto = podeMostrarProSoluto ? calcularProSolutoBase() : 0
  const somaTotal = calcularSomaFluxo() + proSoluto

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <Link href="/simulador-caixa">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Simulador
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-2">
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
              <FileText className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
                Cotação de Condição de Pagamento
              </h1>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">
                Monte a condição de pagamento para a unidade selecionada
              </p>
            </div>
          </div>

          {/* Seletor de Perfil */}
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Perfil do Cliente:</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className={`w-full sm:w-auto justify-between ${PERFIS[perfilSelecionado].bg} ${PERFIS[perfilSelecionado].border} border`}>
                  <div className="flex items-center gap-2">
                    <span className={PERFIS[perfilSelecionado].cor}>
                      {PERFIS[perfilSelecionado].icon}
                    </span>
                    <span className={`font-semibold ${PERFIS[perfilSelecionado].cor}`}>
                      {PERFIS[perfilSelecionado].nome}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 ml-2 text-slate-400" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                {Object.entries(PERFIS).map(([key, perfil]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => setPerfilSelecionado(key as PerfilType)}
                    className={`flex items-center gap-3 cursor-pointer ${perfilSelecionado === key ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
                  >
                    <span className={perfil.cor}>{perfil.icon}</span>
                    <div>
                      <p className={`font-medium ${perfil.cor}`}>{perfil.nome}</p>
                      <p className="text-xs text-muted-foreground">{perfil.descricao}</p>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Coluna da Esquerda - Resumo */}
          <div className="lg:col-span-1 space-y-6">
            {/* Dados da Unidade */}
            <Card className="shadow-md border-0 bg-white/80 backdrop-blur dark:bg-slate-800/80">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Home className="w-5 h-5 text-blue-600" />
                  Dados da Unidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Perfil do Cliente */}
                  <div className={`flex justify-between items-center ${PERFIS[perfilSelecionado].bg} -mx-2 px-2 py-2 rounded-lg border ${PERFIS[perfilSelecionado].border}`}>
                    <span className="text-muted-foreground flex items-center gap-2">
                      {PERFIS[perfilSelecionado].icon}
                      Perfil
                    </span>
                    <span className={`font-semibold ${PERFIS[perfilSelecionado].cor}`}>
                      {PERFIS[perfilSelecionado].nome}
                    </span>
                  </div>

                  {unidade && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Unidade</span>
                      <span className="font-semibold">{unidade}</span>
                    </div>
                  )}
                  {tipologia && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipologia</span>
                      <span className="font-semibold">{tipologia}</span>
                    </div>
                  )}
                  {area && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Área</span>
                      <span className="font-semibold">{area}</span>
                    </div>
                  )}
                  {dataEntrega && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Previsão de Entrega
                      </span>
                      <span className="font-semibold">{formatDate(dataEntrega)}</span>
                    </div>
                  )}

                  <Separator />

                  {/* Valor de Venda */}
                  {valorVenda > 0 && (
                    <div className={`flex justify-between ${bonusConstrutora === 0 ? 'bg-blue-50 dark:bg-blue-900/20 -mx-2 px-2 py-1.5 rounded' : ''}`}>
                      <span className="text-muted-foreground">Valor de Venda</span>
                      <span className={`font-semibold ${bonusConstrutora === 0 ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>
                        {formatCurrency(valorVenda)}
                        {bonusConstrutora === 0 && <span className="ml-2 text-xs font-normal">(base)</span>}
                      </span>
                    </div>
                  )}

                  {/* Valor de Avaliação */}
                  {valorAvaliacao > 0 && (
                    <div className={`flex justify-between ${bonusConstrutora > 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 -mx-2 px-2 py-1.5 rounded' : ''}`}>
                      <span className="text-muted-foreground">Valor de Avaliação</span>
                      <span className={`font-semibold ${bonusConstrutora > 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>
                        {formatCurrency(valorAvaliacao)}
                        {bonusConstrutora > 0 && <span className="ml-2 text-xs font-normal">(base)</span>}
                      </span>
                    </div>
                  )}

                  {/* Bônus Construtora */}
                  {bonusConstrutora > 0 && (
                    <div className="flex justify-between bg-amber-50 dark:bg-amber-900/20 -mx-2 px-2 py-1.5 rounded">
                      <span className="text-muted-foreground">Bônus Construtora</span>
                      <span className="font-semibold text-amber-700 dark:text-amber-300">{formatCurrency(bonusConstrutora)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Dados do Financiamento */}
            <Card className="shadow-md border-0 bg-white/80 backdrop-blur dark:bg-slate-800/80">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  Financiamento Caixa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white -mx-1">
                    <p className="text-xs text-blue-100 mb-1">Valor Financiado</p>
                    <p className="text-2xl font-bold">{formatCurrency(valorFinanciado)}</p>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sistema</span>
                    <span className="font-semibold">{sistemaAmortizacao}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prazo</span>
                    <span className="font-semibold">{prazoAmortizacao} meses</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">1ª Prestação</span>
                    <span className="font-semibold text-green-600">{primeiraPrestacao}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Última Prestação</span>
                    <span className="font-semibold">{ultimaPrestacao}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entrada</span>
                    <span className="font-semibold">{percentualEntrada}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Coluna Direita - Fluxo de Pagamento */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur dark:bg-slate-800/90">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calculator className="w-5 h-5 text-emerald-600" />
                      Fluxo de Pagamento
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Adicione os componentes do fluxo de pagamento
                    </p>
                  </div>

                  {/* Botão para adicionar campos */}
                  {camposParaAdicionar.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2">
                          <Plus className="w-4 h-4" />
                          Adicionar
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {camposParaAdicionar.map(campo => (
                          <DropdownMenuItem
                            key={campo.id}
                            onClick={() => adicionarCampo(campo.id)}
                            className="gap-2 cursor-pointer"
                          >
                            {campo.icon}
                            {campo.tipo}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {/* Lista do Fluxo de Pagamento */}
                <div className="space-y-3">
                  {fluxoPagamento.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-xl border ${
                        item.editavel
                          ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">{item.icon}</div>

                        <div className="flex-1">
                          <span className="font-medium">{item.tipo}</span>
                        </div>

                        {/* Campo de Data */}
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {item.dataEditavel ? (
                            <Input
                              type="date"
                              value={item.data}
                              onChange={(e) => atualizarData(item.id, e.target.value)}
                              min={getDataMinima(item.id)}
                              className="w-36 text-sm"
                            />
                          ) : (
                            <span className="text-sm text-muted-foreground min-w-[100px]">
                              {new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>

                        {/* Campo de Valor */}
                        {item.editavel ? (
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <Input
                                value={item.valorEditavel}
                                onChange={(e) => atualizarValor(item.id, e.target.value)}
                                placeholder="0,00"
                                className="pl-10 w-36 text-right"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removerCampo(item.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <span className={`font-bold ${item.id === 'financiamento' ? 'text-blue-700 dark:text-blue-300' : 'text-amber-700 dark:text-amber-300'}`}>
                            {formatCurrency(item.valor)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {/* Pró-Soluto com Slider de Parcelas */}
                  {podeMostrarProSoluto && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20">
                        <div className="flex-shrink-0">
                          <Calculator className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <span className="font-medium text-emerald-700 dark:text-emerald-300">Pró-Soluto</span>
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 ml-2">(valor restante)</span>
                        </div>
                        <span className={`font-bold text-lg ${proSoluto >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-600'}`}>
                          {formatCurrency(proSoluto >= 0 ? proSoluto : 0)}
                        </span>
                      </div>

                      {/* Seção de Parcelamento do Pró-Soluto */}
                      {proSoluto > 0 && (
                        <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 p-4 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-primary" />
                              <span className="font-semibold text-sm">Parcelar Pró-Soluto</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-2xl font-bold text-primary">{parcelasProSoluto}</span>
                              <span className="text-sm text-muted-foreground">parcelas</span>
                            </div>
                          </div>

                          <Slider
                            value={[parcelasProSoluto]}
                            onValueChange={(value) => setParcelasProSoluto(value[0])}
                            max={84}
                            min={0}
                            step={1}
                            className="w-full"
                          />

                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>À vista (0)</span>
                            <span>84 parcelas</span>
                          </div>

                          {/* Detalhes do parcelamento */}
                          {proSolutoDetalhes && parcelasProSoluto > 0 && (
                            <div className="space-y-3 pt-3 border-t">
                              {/* Valor da parcela */}
                              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Valor da Parcela:</span>
                                  <span className="text-xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(proSolutoDetalhes.parcelaMensal)}</span>
                                </div>
                                <div className="mt-2 flex gap-4 text-xs text-emerald-600 dark:text-emerald-400">
                                  <span>Antes da entrega: {proSolutoDetalhes.parcelasAntesEntrega}x (0,5% a.m.)</span>
                                  <span>Após entrega: {proSolutoDetalhes.parcelasAposEntrega}x (1,5% a.m.)</span>
                                </div>
                              </div>

                              {/* Tabela de parcelas (colapsável) */}
                              <details className="group">
                                <summary className="cursor-pointer text-sm text-primary hover:underline flex items-center gap-1">
                                  <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                                  Ver cronograma de parcelas
                                </summary>
                                <div className="mt-3 max-h-64 overflow-y-auto">
                                  <table className="w-full text-xs">
                                    <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800">
                                      <tr>
                                        <th className="px-2 py-1 text-left">Parcela</th>
                                        <th className="px-2 py-1 text-left">Data</th>
                                        <th className="px-2 py-1 text-right">Valor</th>
                                        <th className="px-2 py-1 text-right">Saldo</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {proSolutoDetalhes.tabela.map((row) => (
                                        <tr 
                                          key={row.parcela} 
                                          className={`border-t border-slate-200 dark:border-slate-600 ${
                                            row.periodo === 'antes' 
                                              ? 'bg-amber-50/50 dark:bg-amber-900/10' 
                                              : 'bg-blue-50/50 dark:bg-blue-900/10'
                                          }`}
                                        >
                                          <td className="px-2 py-1.5">{row.parcela}</td>
                                          <td className="px-2 py-1.5">{row.data}</td>
                                          <td className="px-2 py-1.5 text-right font-medium">{formatCurrency(row.valor)}</td>
                                          <td className="px-2 py-1.5 text-right">{formatCurrency(row.saldo)}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </details>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Seção de Resultados - Indicadores Financeiros */}
                  {proSolutoDetalhes && parcelasProSoluto > 0 && renda && (
                    <div className="bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 p-4 space-y-4">
                      <h4 className="font-semibold text-sm flex items-center gap-2 text-slate-700 dark:text-slate-200">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        Indicadores Financeiros
                        <span className="ml-auto text-xs text-muted-font-normal font-normal">
                          Limites perfil {PERFIS[perfilSelecionado].nome}
                        </span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Comprometimento de Renda */}
                        {(() => {
                          const rendaNum = parseFloat(renda.replace(',', '.').replace(/[^\d.]/g, '')) || 0
                          const prestacaoFinanciamento = parseFloat(primeiraPrestacao.replace(/[R$\s.]/g, '').replace(',', '.')) || 0
                          const parcelaProSoluto = proSolutoDetalhes.parcelaMensal
                          const totalParcelas = prestacaoFinanciamento + parcelaProSoluto
                          const percentual = rendaNum > 0 ? (totalParcelas / rendaNum) * 100 : 0
                          const limite = PERFIS[perfilSelecionado].limites.comprometimentoRenda
                          const excedido = percentual > limite
                          
                          return (
                            <div className={`rounded-lg p-3 border ${
                              excedido 
                                ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700' 
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600'
                            }`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-muted-foreground">Comprometimento de Renda</span>
                                {excedido && <AlertCircle className="w-4 h-4 text-red-500" />}
                              </div>
                              <div className={`text-xl font-bold ${excedido ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                {percentual.toFixed(2)}%
                              </div>
                              <div className={`text-xs mt-1 ${excedido ? 'text-red-600 dark:text-red-400 font-medium' : 'text-muted-foreground'}`}>
                                {excedido ? `Limite: até ${limite.toFixed(2)}%` : 'Financiamento + Pró-Soluto'}
                              </div>
                            </div>
                          )
                        })()}

                        {/* Percentual Parcelado */}
                        {(() => {
                          const percentual = (proSolutoDetalhes.valorCorrigido / valorBase) * 100
                          const limite = PERFIS[perfilSelecionado].limites.percentualParcelado
                          const excedido = percentual > limite
                          
                          return (
                            <div className={`rounded-lg p-3 border ${
                              excedido 
                                ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700' 
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600'
                            }`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-muted-foreground">Percentual Parcelado</span>
                                {excedido && <AlertCircle className="w-4 h-4 text-red-500" />}
                              </div>
                              <div className={`text-xl font-bold ${excedido ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {percentual.toFixed(2)}%
                              </div>
                              <div className={`text-xs mt-1 ${excedido ? 'text-red-600 dark:text-red-400 font-medium' : 'text-muted-foreground'}`}>
                                {excedido ? `Limite: até ${limite.toFixed(2)}%` : 'do valor do imóvel (corrigido)'}
                              </div>
                            </div>
                          )
                        })()}

                        {/* Comprometimento Pró-Soluto */}
                        {(() => {
                          const rendaNum = parseFloat(renda.replace(',', '.').replace(/[^\d.]/g, '')) || 0
                          const parcelaProSoluto = proSolutoDetalhes.parcelaMensal
                          const percentual = rendaNum > 0 ? (parcelaProSoluto / rendaNum) * 100 : 0
                          const limite = PERFIS[perfilSelecionado].limites.comprometimentoProSoluto
                          const excedido = percentual > limite
                          
                          return (
                            <div className={`rounded-lg p-3 border ${
                              excedido 
                                ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700' 
                                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600'
                            }`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-muted-foreground">Comprometimento Pró-Soluto</span>
                                {excedido && <AlertCircle className="w-4 h-4 text-red-500" />}
                              </div>
                              <div className={`text-xl font-bold ${excedido ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                {percentual.toFixed(2)}%
                              </div>
                              <div className={`text-xs mt-1 ${excedido ? 'text-red-600 dark:text-red-400 font-medium' : 'text-muted-foreground'}`}>
                                {excedido ? `Limite: até ${limite.toFixed(2)}%` : 'da renda mensal'}
                              </div>
                            </div>
                          )
                        })()}
                      </div>

                      {/* Aviso geral se algum limite for excedido */}
                      {(() => {
                        const rendaNum = parseFloat(renda.replace(',', '.').replace(/[^\d.]/g, '')) || 0
                        const prestacaoFinanciamento = parseFloat(primeiraPrestacao.replace(/[R$\s.]/g, '').replace(',', '.')) || 0
                        const parcelaProSoluto = proSolutoDetalhes.parcelaMensal
                        const totalParcelas = prestacaoFinanciamento + parcelaProSoluto
                        
                        const comprometimentoRenda = rendaNum > 0 ? (totalParcelas / rendaNum) * 100 : 0
                        const percentualParcelado = (proSolutoDetalhes.valorCorrigido / valorBase) * 100
                        const comprometimentoProSoluto = rendaNum > 0 ? (parcelaProSoluto / rendaNum) * 100 : 0
                        
                        const limites = PERFIS[perfilSelecionado].limites
                        const algumExcedido = comprometimentoRenda > limites.comprometimentoRenda || 
                                              percentualParcelado > limites.percentualParcelado || 
                                              comprometimentoProSoluto > limites.comprometimentoProSoluto
                        
                        return algumExcedido ? (
                          <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-3 border border-red-300 dark:border-red-700">
                            <div className="flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                              <div className="text-xs text-red-700 dark:text-red-300">
                                <span className="font-semibold">Atenção: </span>
                                Um ou mais indicadores excedem os limites do perfil {PERFIS[perfilSelecionado].nome}. 
                                Considere ajustar o número de parcelas ou rever a condição de pagamento.
                              </div>
                            </div>
                          </div>
                        ) : null
                      })()}
                    </div>
                  )}
                </div>

                {fluxoPagamento.length === 2 && bonusConstrutora === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">Clique em "Adicionar" para incluir sinais, desconto ou FGTS no fluxo</p>
                  </div>
                )}

                <Separator />

                {/* Validação */}
                <div className={`rounded-xl p-4 ${
                  validacao === 'ok'
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : validacao === 'erro'
                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                    : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                }`}>
                  <div className="flex items-start gap-3">
                    {validacao === 'ok' ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                    ) : validacao === 'erro' ? (
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-slate-400 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-3">
                        <span className={`font-semibold ${
                          validacao === 'ok'
                            ? 'text-green-800 dark:text-green-200'
                            : validacao === 'erro'
                            ? 'text-red-800 dark:text-red-200'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}>
                          {validacao === 'ok'
                            ? 'Fluxo Validado!'
                            : validacao === 'erro'
                            ? 'Divergência no Fluxo'
                            : 'Aguardando Sinal Ato'}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Valor Base ({bonusConstrutora > 0 ? 'Avaliação' : 'Venda'}):
                          </span>
                          <span className="font-semibold">{formatCurrency(valorBase)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Soma do Fluxo:</span>
                          <span className="font-semibold">{formatCurrency(somaTotal)}</span>
                        </div>
                        <div className="flex justify-between border-t pt-2 mt-2">
                          <span className="text-muted-foreground">Diferença:</span>
                          <span className={`font-bold ${Math.abs(diferenca) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(diferenca)}
                          </span>
                        </div>
                      </div>

                      {validacao === 'erro' && (
                        <p className="text-sm text-red-700 dark:text-red-300 mt-3">
                          A soma dos valores deve ser igual ao valor de {bonusConstrutora > 0 ? 'avaliação' : 'venda'} do imóvel.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setFluxoPagamento(fluxoPagamento.filter(f => !f.editavel))
                    }}
                  >
                    Limpar Campos
                  </Button>
                  <Button
                    className="flex-1 gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                    disabled={validacao !== 'ok'}
                  >
                    <CheckCircle className="w-4 h-4" />
                    Salvar Cotação
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CotacaoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    }>
      <CotacaoContent />
    </Suspense>
  )
}
