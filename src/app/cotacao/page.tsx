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
  Shield,
  RefreshCw
} from 'lucide-react'
import { ThemeToggleSimple } from '@/components/theme-toggle-simple'

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

  // Estados para controle de excedente na entrada
  const [excedenteEntrada, setExcedenteEntrada] = useState<number>(0)
  const [recalculando, setRecalculando] = useState(false)
  const [novaSimulacao, setNovaSimulacao] = useState<{
    valorFinanciado: number
    primeiraPrestacao: number
    ultimaPrestacao: number
  } | null>(null)
  const [financiamentoAtualizado, setFinanciamentoAtualizado] = useState(false)
  const [valorFinanciadoAtual, setValorFinanciadoAtual] = useState(valorFinanciado)
  const [primeiraPrestacaoAtual, setPrimeiraPrestacaoAtual] = useState(primeiraPrestacao)
  const [ultimaPrestacaoAtual, setUltimaPrestacaoAtual] = useState(ultimaPrestacao)

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

  const formatPercent = (val: number): string => {
    return val.toFixed(2) + '%'
  }

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('pt-BR')
  }

  // Função para converter string monetária brasileira para número
  const parseBrazilianCurrency = (val: string): number => {
    if (!val) return 0
    // Remove símbolo R$, espaços e outros caracteres não numéricos (exceto , e .)
    let cleaned = val.replace(/[R$\s]/g, '')
    // Remove todos os pontos (separadores de milhar)
    cleaned = cleaned.replace(/\./g, '')
    // Substitui vírgula por ponto (separador decimal)
    cleaned = cleaned.replace(',', '.')
    return parseFloat(cleaned) || 0
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
  const podeMostrarProSoluto = sinalAtoItem && parseValue(sinalAtoItem.valorEditavel) > 0 && valorFinanciadoAtual > 0

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

  // Função para limpar todos os campos e restaurar valores originais
  const limparCamposERestaurar = () => {
    // Restaurar valores originais do financiamento (dos searchParams)
    setValorFinanciadoAtual(valorFinanciado)
    setPrimeiraPrestacaoAtual(primeiraPrestacao)
    setUltimaPrestacaoAtual(ultimaPrestacao)

    // Resetar estados de controle
    setFinanciamentoAtualizado(false)
    setNovaSimulacao(null)
    setExcedenteEntrada(0)

    // Restaurar fluxo de pagamento para o estado inicial (apenas financiamento e bônus)
    const dataPosEntrega = getDataPosEntrega()
    const fluxoInicial: FluxoItem[] = [
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
      fluxoInicial.push({
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

    setFluxoPagamento(fluxoInicial)

    // Resetar parcelas do pró-soluto
    setParcelasProSoluto(0)
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

  // =============================================================================
  // CÁLCULO DO EXCEDENTE NA ENTRADA DO FINANCIAMENTO
  // =============================================================================
  // A entrada do financiamento é: max(valorAvaliacao, valorVenda) - valorFinanciado
  // Se a soma dos valores do fluxo (exceto financiamento) exceder a entrada,
  // o excedente deve ser retirado do valor a ser financiado.

  const valorImovelParaCalculo = Math.max(valorAvaliacao, valorVenda)
  const entradaFinanciamento = valorImovelParaCalculo - valorFinanciadoAtual

  // Calcular soma dos valores do fluxo EXCETO o financiamento
  const calcularSomaFluxoSemFinanciamento = (): number => {
    return fluxoPagamento.reduce((acc, item) => {
      if (item.id === 'financiamento') return acc // Ignorar financiamento
      if (item.editavel) {
        return acc + parseValue(item.valorEditavel)
      }
      return acc + item.valor
    }, 0)
  }

  const somaFluxoSemFinanciamento = calcularSomaFluxoSemFinanciamento()
  const excedenteCalculado = Math.max(0, somaFluxoSemFinanciamento - entradaFinanciamento)

  // Atualizar estado do excedente
  useEffect(() => {
    setExcedenteEntrada(excedenteCalculado)
  }, [excedenteCalculado])

  // Resetar o estado de excedente quando o financiamento é atualizado
  useEffect(() => {
    if (financiamentoAtualizado) {
      // Recalcular o excedente com o novo valor financiado
      const novaEntrada = valorImovelParaCalculo - valorFinanciadoAtual
      const novoExcedente = Math.max(0, somaFluxoSemFinanciamento - novaEntrada)
      if (novoExcedente === 0) {
        setExcedenteEntrada(0)
        setNovaSimulacao(null)
      }
    }
  }, [financiamentoAtualizado, valorFinanciadoAtual, somaFluxoSemFinanciamento, valorImovelParaCalculo])

  // Função para recalcular o financiamento
  const recalcularFinanciamento = async () => {
    if (!renda || !dataNascimento || excedenteEntrada <= 0) return

    setRecalculando(true)

    try {
      // Novo valor financiado = valor atual - excedente
      const novoValorFinanciado = valorFinanciadoAtual - excedenteEntrada

      const response = await fetch('/api/simulacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          renda,
          dataNascimento,
          valorImovel: valorImovelParaCalculo,
          sistemaAmortizacao
        })
      })

      const data = await response.json()

      if (data.sucesso) {
        // Extrair valores numéricos
        const parseCurrencyString = (str: string): number => {
          const limpo = str.replace(/[R$\s.]/g, '').replace(',', '.')
          return parseFloat(limpo) || 0
        }

        // Calcular nova prestação proporcional ao novo valor financiado
        const vfOriginal = parseCurrencyString(data.dados.Valor_Total_Financiado)
        const prestacaoOriginal = parseCurrencyString(data.dados.Primeira_Prestacao)
        const fatorProporcao = novoValorFinanciado / vfOriginal
        const novaPrestacao = prestacaoOriginal * fatorProporcao

        setNovaSimulacao({
          valorFinanciado: novoValorFinanciado,
          primeiraPrestacao: novaPrestacao,
          ultimaPrestacao: sistemaAmortizacao.includes('SAC') ? novaPrestacao * 0.3 : novaPrestacao
        })
      }
    } catch (error) {
      console.error('Erro ao recalcular financiamento:', error)
    } finally {
      setRecalculando(false)
    }
  }

  // Função para aplicar o novo valor do financiamento ao fluxo
  const aplicarNovoFinanciamento = () => {
    if (!novaSimulacao) return

    // Atualizar o valor financiado atual
    setValorFinanciadoAtual(novaSimulacao.valorFinanciado)

    // Atualizar os valores das prestações
    setPrimeiraPrestacaoAtual(formatCurrency(novaSimulacao.primeiraPrestacao))
    setUltimaPrestacaoAtual(formatCurrency(novaSimulacao.ultimaPrestacao))

    // Atualizar o item de financiamento no fluxo de pagamento
    setFluxoPagamento(prev => prev.map(item => {
      if (item.id === 'financiamento') {
        return {
          ...item,
          valor: novaSimulacao.valorFinanciado
        }
      }
      return item
    }))

    // Marcar que o financiamento foi atualizado
    setFinanciamentoAtualizado(true)
  }

  if (!isClient) return null

  const proSoluto = podeMostrarProSoluto ? calcularProSolutoBase() : 0
  const somaTotal = calcularSomaFluxo() + proSoluto

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/simulador-caixa">
            <Button variant="ghost" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Simulador
            </Button>
          </Link>
          <ThemeToggleSimple />
        </div>

        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-3">
            <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-lg sm:rounded-2xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 flex-shrink-0">
              <FileText className="w-5 h-5 sm:w-7 sm:h-7" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white leading-tight">
                Cotação de Condição de Pagamento
              </h1>
              <p className="text-xs sm:text-base text-slate-600 dark:text-slate-400 mt-1">
                Monte a condição de pagamento para a unidade selecionada
              </p>
            </div>
          </div>

          {/* Seletor de Perfil */}
          <div className="flex flex-col xs:flex-row xs:items-center gap-2 sm:gap-3">
            <Label className="text-xs sm:text-sm font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">Perfil do Cliente:</Label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className={`w-full xs:w-auto justify-between ${PERFIS[perfilSelecionado].bg} ${PERFIS[perfilSelecionado].border} border`}>
                  <div className="flex items-center gap-2">
                    <span className={PERFIS[perfilSelecionado].cor}>
                      {PERFIS[perfilSelecionado].icon}
                    </span>
                    <span className={`font-semibold text-sm ${PERFIS[perfilSelecionado].cor}`}>
                      {PERFIS[perfilSelecionado].nome}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 ml-2 text-slate-400 flex-shrink-0" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 sm:w-56">
                {Object.entries(PERFIS).map(([key, perfil]) => (
                  <DropdownMenuItem
                    key={key}
                    onClick={() => setPerfilSelecionado(key as PerfilType)}
                    className={`flex items-center gap-2 sm:gap-3 cursor-pointer ${perfilSelecionado === key ? 'bg-slate-100 dark:bg-slate-800' : ''}`}
                  >
                    <span className={perfil.cor}>{perfil.icon}</span>
                    <div className="min-w-0">
                      <p className={`font-medium text-sm ${perfil.cor}`}>{perfil.nome}</p>
                      <p className="text-xs text-muted-foreground truncate">{perfil.descricao}</p>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Coluna da Esquerda - Resumo */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6">
            {/* Dados da Unidade */}
            <Card className="shadow-md border-0 bg-white/80 backdrop-blur dark:bg-slate-800/80">
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Home className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  Dados da Unidade
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 sm:space-y-3 text-sm">
                  {/* Perfil do Cliente */}
                  <div className={`flex justify-between items-center ${PERFIS[perfilSelecionado].bg} -mx-2 px-2 py-1.5 sm:py-2 rounded-lg border ${PERFIS[perfilSelecionado].border}`}>
                    <span className="text-muted-foreground flex items-center gap-2 text-xs sm:text-sm">
                      {PERFIS[perfilSelecionado].icon}
                      Perfil
                    </span>
                    <span className={`font-semibold text-xs sm:text-sm ${PERFIS[perfilSelecionado].cor}`}>
                      {PERFIS[perfilSelecionado].nome}
                    </span>
                  </div>

                  {unidade && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-xs sm:text-sm">Unidade</span>
                      <span className="font-semibold text-xs sm:text-sm">{unidade}</span>
                    </div>
                  )}
                  {tipologia && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-xs sm:text-sm">Tipologia</span>
                      <span className="font-semibold text-xs sm:text-sm">{tipologia}</span>
                    </div>
                  )}
                  {area && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-xs sm:text-sm">Área</span>
                      <span className="font-semibold text-xs sm:text-sm">{area}</span>
                    </div>
                  )}
                  {dataEntrega && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1 text-xs sm:text-sm">
                        <Calendar className="w-3 h-3" />
                        Previsão de Entrega
                      </span>
                      <span className="font-semibold text-xs sm:text-sm">{formatDate(dataEntrega)}</span>
                    </div>
                  )}

                  <Separator />

                  {/* Valor de Venda */}
                  {valorVenda > 0 && (
                    <div className={`flex flex-col xs:flex-row xs:justify-between gap-1 ${bonusConstrutora === 0 ? 'bg-blue-50 dark:bg-blue-900/20 -mx-2 px-2 py-1.5 rounded' : ''}`}>
                      <span className="text-muted-foreground text-xs sm:text-sm">Valor de Venda</span>
                      <span className={`font-semibold text-xs sm:text-sm ${bonusConstrutora === 0 ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>
                        {formatCurrency(valorVenda)}
                        {bonusConstrutora === 0 && <span className="ml-1 text-xs font-normal">(base)</span>}
                      </span>
                    </div>
                  )}

                  {/* Valor de Avaliação */}
                  {valorAvaliacao > 0 && (
                    <div className={`flex flex-col xs:flex-row xs:justify-between gap-1 ${bonusConstrutora > 0 ? 'bg-emerald-50 dark:bg-emerald-900/20 -mx-2 px-2 py-1.5 rounded' : ''}`}>
                      <span className="text-muted-foreground text-xs sm:text-sm">Valor de Avaliação</span>
                      <span className={`font-semibold text-xs sm:text-sm ${bonusConstrutora > 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-300'}`}>
                        {formatCurrency(valorAvaliacao)}
                        {bonusConstrutora > 0 && <span className="ml-1 text-xs font-normal">(base)</span>}
                      </span>
                    </div>
                  )}

                  {/* Bônus Construtora */}
                  {bonusConstrutora > 0 && (
                    <div className="flex flex-col xs:flex-row xs:justify-between gap-1 bg-amber-50 dark:bg-amber-900/20 -mx-2 px-2 py-1.5 rounded">
                      <span className="text-muted-foreground text-xs sm:text-sm">Bônus Construtora</span>
                      <span className="font-semibold text-amber-700 dark:text-amber-300 text-xs sm:text-sm">{formatCurrency(bonusConstrutora)}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Dados do Financiamento */}
            <Card className={`shadow-md border-0 bg-white/80 backdrop-blur dark:bg-slate-800/80 ${financiamentoAtualizado ? 'ring-2 ring-green-400' : ''}`}>
              <CardHeader className="pb-2 sm:pb-4">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                  Financiamento Caixa
                  {financiamentoAtualizado && (
                    <span className="text-xs bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full ml-auto">
                      Atualizado
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                  <div className={`rounded-lg sm:rounded-xl p-3 sm:p-4 text-white -mx-1 ${financiamentoAtualizado ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'}`}>
                    <p className="text-xs opacity-90 mb-1">Valor Financiado</p>
                    <p className="text-xl sm:text-2xl font-bold">{formatCurrency(valorFinanciadoAtual)}</p>
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
                    <span className="font-semibold text-green-600">{primeiraPrestacaoAtual}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Última Prestação</span>
                    <span className="font-semibold">{ultimaPrestacaoAtual}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Entrada</span>
                    <span className="font-semibold">
                      {financiamentoAtualizado
                        ? formatPercent((valorImovelParaCalculo - valorFinanciadoAtual) / valorImovelParaCalculo * 100)
                        : percentualEntrada}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Aviso de Excedente na Entrada */}
            {excedenteEntrada > 0 && (
              <Card className="shadow-md border-2 border-amber-400 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30">
                <CardContent className="pt-4 sm:pt-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-amber-100 dark:bg-amber-800 rounded-full flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-amber-800 dark:text-amber-200 text-sm sm:text-base">
                        Atenção: Valores excedem a entrada do financiamento
                      </h3>
                      <div className="mt-2 text-xs sm:text-sm text-amber-700 dark:text-amber-300 space-y-1">
                        <p>A soma dos pagamentos adicionados ({formatCurrency(somaFluxoSemFinanciamento)}) excede a entrada do financiamento ({formatCurrency(entradaFinanciamento)}).</p>
                        <p className="font-medium">
                          <span className="text-amber-900 dark:text-amber-100">Excedente: </span>
                          {formatCurrency(excedenteEntrada)}
                        </p>
                        <p className="mt-2 text-xs">
                          Este excedente será descontado do valor financiado, resultando em uma nova prestação.
                        </p>
                      </div>
                      
                      <div className="mt-4 flex flex-col sm:flex-row gap-2">
                        <Button
                          onClick={recalcularFinanciamento}
                          disabled={recalculando}
                          className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                        >
                          {recalculando ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Recalculando...
                            </>
                          ) : (
                            <>
                              <Calculator className="w-4 h-4" />
                              Recalcular Financiamento
                            </>
                          )}
                        </Button>
                      </div>

                      {/* Resultado do novo cálculo */}
                      {novaSimulacao && !financiamentoAtualizado && (
                        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/30 rounded-lg border border-green-200 dark:border-green-700">
                          <p className="text-xs text-green-600 dark:text-green-400 font-medium mb-2">Novo financiamento calculado:</p>
                          <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm mb-3">
                            <div>
                              <span className="text-muted-foreground">Valor Financiado:</span>
                              <p className="font-bold text-green-700 dark:text-green-300">{formatCurrency(novaSimulacao.valorFinanciado)}</p>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Nova Prestação:</span>
                              <p className="font-bold text-green-700 dark:text-green-300">{formatCurrency(novaSimulacao.primeiraPrestacao)}</p>
                            </div>
                          </div>
                          <Button
                            onClick={aplicarNovoFinanciamento}
                            className="w-full gap-2 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Aplicar Novo Valor
                          </Button>
                        </div>
                      )}

                      {/* Mensagem de sucesso após aplicar */}
                      {financiamentoAtualizado && (
                        <div className="mt-4 p-3 bg-green-100 dark:bg-green-800/50 rounded-lg border border-green-300 dark:border-green-600">
                          <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                            <CheckCircle className="w-4 h-4" />
                            <span className="font-medium text-sm">Financiamento atualizado com sucesso!</span>
                          </div>
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            O novo valor foi aplicado ao fluxo de pagamento. Continue com a cotação.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Coluna Direita - Fluxo de Pagamento */}
          <div className="lg:col-span-2">
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur dark:bg-slate-800/90">
              <CardHeader className="border-b">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                        <Button variant="outline" className="gap-2 w-full sm:w-auto">
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
              <CardContent className="pt-4 sm:pt-6 space-y-3 sm:space-y-4">
                {/* Lista do Fluxo de Pagamento */}
                <div className="space-y-2 sm:space-y-3">
                  {fluxoPagamento.map((item) => (
                    <div
                      key={item.id}
                      className={`p-2.5 sm:p-4 rounded-lg sm:rounded-xl border ${
                        item.editavel
                          ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700'
                      }`}
                    >
                      {/* Layout Mobile: Stack vertical / Desktop: horizontal */}
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                        {/* Header com ícone e tipo */}
                        <div className="flex items-center gap-2 sm:gap-3 sm:flex-shrink-0">
                          <div className="flex-shrink-0">{item.icon}</div>
                          <span className="font-medium text-sm sm:text-base">{item.tipo}</span>
                        </div>

                        {/* Campos de Data e Valor - Stack no mobile */}
                        <div className="flex flex-col xs:flex-row gap-2 xs:gap-3 sm:gap-4 xs:items-center sm:ml-auto flex-1 sm:flex-none">
                          {/* Campo de Data */}
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            {item.dataEditavel ? (
                              <Input
                                type="date"
                                value={item.data}
                                onChange={(e) => atualizarData(item.id, e.target.value)}
                                min={getDataMinima(item.id)}
                                className="flex-1 xs:w-28 sm:w-32 text-xs sm:text-sm h-9"
                              />
                            ) : (
                              <span className="text-xs sm:text-sm text-muted-foreground">
                                {new Date(item.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </div>

                          {/* Campo de Valor */}
                          {item.editavel ? (
                            <div className="flex items-center gap-2">
                              <div className="relative flex-1 xs:flex-none">
                                <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                                <Input
                                  value={item.valorEditavel}
                                  onChange={(e) => atualizarValor(item.id, e.target.value)}
                                  placeholder="0,00"
                                  className="pl-8 sm:pl-10 xs:w-28 sm:w-32 text-right text-xs sm:text-sm h-9"
                                />
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removerCampo(item.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0 h-9 w-9"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <span className={`font-bold text-sm sm:text-base ${item.id === 'financiamento' ? 'text-blue-700 dark:text-blue-300' : 'text-amber-700 dark:text-amber-300'}`}>
                              {formatCurrency(item.valor)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Pró-Soluto com Slider de Parcelas */}
                  {podeMostrarProSoluto && (
                    <div className="space-y-3 sm:space-y-4">
                      <div className="flex flex-col xs:flex-row xs:items-center gap-2 xs:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-emerald-200 dark:border-emerald-800 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20">
                        <div className="flex items-center gap-2 xs:gap-4">
                          <div className="flex-shrink-0">
                            <Calculator className="w-4 h-4 text-emerald-600" />
                          </div>
                          <div className="flex-1">
                            <span className="font-medium text-sm sm:text-base text-emerald-700 dark:text-emerald-300">Pró-Soluto</span>
                            <span className="text-xs text-emerald-600 dark:text-emerald-400 ml-1 sm:ml-2">(valor restante)</span>
                          </div>
                        </div>
                        <span className={`font-bold text-base sm:text-lg xs:ml-auto ${proSoluto >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-600'}`}>
                          {formatCurrency(proSoluto >= 0 ? proSoluto : 0)}
                        </span>
                      </div>

                      {/* Seção de Parcelamento do Pró-Soluto */}
                      {proSoluto > 0 && (
                        <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-600 p-3 sm:p-4 space-y-3 sm:space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-primary" />
                              <span className="font-semibold text-xs sm:text-sm">Parcelar Pró-Soluto</span>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2">
                              <span className="text-xl sm:text-2xl font-bold text-primary">{parcelasProSoluto}</span>
                              <span className="text-xs sm:text-sm text-muted-foreground">parcelas</span>
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
                              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-2.5 sm:p-3">
                                <div className="flex flex-col xs:flex-row xs:justify-between xs:items-center gap-1">
                                  <span className="text-xs sm:text-sm font-medium text-emerald-700 dark:text-emerald-300">Valor da Parcela:</span>
                                  <span className="text-lg sm:text-xl font-bold text-emerald-700 dark:text-emerald-300">{formatCurrency(proSolutoDetalhes.parcelaMensal)}</span>
                                </div>
                                <div className="mt-2 flex flex-col xs:flex-row gap-1 xs:gap-4 text-xs text-emerald-600 dark:text-emerald-400">
                                  <span>Antes: {proSolutoDetalhes.parcelasAntesEntrega}x (0,5% a.m.)</span>
                                  <span>Após: {proSolutoDetalhes.parcelasAposEntrega}x (1,5% a.m.)</span>
                                </div>
                              </div>

                              {/* Tabela de parcelas (colapsável) */}
                              <details className="group">
                                <summary className="cursor-pointer text-xs sm:text-sm text-primary hover:underline flex items-center gap-1">
                                  <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 transition-transform group-open:rotate-180" />
                                  Ver cronograma de parcelas
                                </summary>
                                <div className="mt-3 max-h-48 sm:max-h-64 overflow-y-auto -mx-1 sm:mx-0">
                                  <table className="w-full text-xs">
                                    <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800">
                                      <tr>
                                        <th className="px-2 py-1 text-left">#</th>
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
                        <span className="ml-auto text-xs text-muted-foreground font-normal">
                          Limites perfil {PERFIS[perfilSelecionado].nome}
                        </span>
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {/* Comprometimento de Renda */}
                        {(() => {
                          const rendaNum = parseBrazilianCurrency(renda)
                          const prestacaoFinanciamento = parseBrazilianCurrency(primeiraPrestacao)
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
                                {excedido && <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                              </div>
                              <div className={`text-xl font-bold ${excedido ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                {percentual.toFixed(2)}%
                              </div>
                              <div className={`text-xs mt-1 ${excedido ? 'text-red-600 dark:text-red-400 font-medium' : 'text-muted-foreground'}`}>
                                {excedido ? `Limite: ${limite.toFixed(2)}%` : 'Financiamento + Pró-Soluto'}
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
                                {excedido && <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                              </div>
                              <div className={`text-xl font-bold ${excedido ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                {percentual.toFixed(2)}%
                              </div>
                              <div className={`text-xs mt-1 ${excedido ? 'text-red-600 dark:text-red-400 font-medium' : 'text-muted-foreground'}`}>
                                {excedido ? `Limite: ${limite.toFixed(2)}%` : 'do valor do imóvel (corrigido)'}
                              </div>
                            </div>
                          )
                        })()}

                        {/* Comprometimento Pró-Soluto */}
                        {(() => {
                          const rendaNum = parseBrazilianCurrency(renda)
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
                                {excedido && <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />}
                              </div>
                              <div className={`text-xl font-bold ${excedido ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                {percentual.toFixed(2)}%
                              </div>
                              <div className={`text-xs mt-1 ${excedido ? 'text-red-600 dark:text-red-400 font-medium' : 'text-muted-foreground'}`}>
                                {excedido ? `Limite: ${limite.toFixed(2)}%` : 'da renda mensal'}
                              </div>
                            </div>
                          )
                        })()}
                      </div>

                      {/* Aviso geral se algum limite for excedido */}
                      {(() => {
                        const rendaNum = parseBrazilianCurrency(renda)
                        const prestacaoFinanciamento = parseBrazilianCurrency(primeiraPrestacao)
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
                  <div className="text-center py-4 sm:py-8 text-muted-foreground">
                    <p className="text-xs sm:text-sm">Clique em "Adicionar" para incluir sinais, desconto ou FGTS no fluxo</p>
                  </div>
                )}

                <Separator className="my-2 sm:my-0" />

                {/* Validação */}
                <div className={`rounded-lg sm:rounded-xl p-3 sm:p-4 ${
                  validacao === 'ok'
                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                    : validacao === 'erro'
                    ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                    : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                }`}>
                  <div className="flex items-start gap-2 sm:gap-3">
                    {validacao === 'ok' ? (
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 mt-0.5 flex-shrink-0" />
                    ) : validacao === 'erro' ? (
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 mt-0.5 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-2 sm:mb-3">
                        <span className={`font-semibold text-sm sm:text-base ${
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

                      <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground truncate">
                            Valor Base ({bonusConstrutora > 0 ? 'Avaliação' : 'Venda'}):
                          </span>
                          <span className="font-semibold flex-shrink-0">{formatCurrency(valorBase)}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-muted-foreground truncate">Soma do Fluxo:</span>
                          <span className="font-semibold flex-shrink-0">{formatCurrency(somaTotal)}</span>
                        </div>
                        <div className="flex justify-between gap-2 border-t pt-1.5 sm:pt-2 mt-1.5 sm:mt-2">
                          <span className="text-muted-foreground truncate">Diferença:</span>
                          <span className={`font-bold flex-shrink-0 ${Math.abs(diferenca) < 0.01 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(diferenca)}
                          </span>
                        </div>
                      </div>

                      {validacao === 'erro' && (
                        <p className="text-xs sm:text-sm text-red-700 dark:text-red-300 mt-2 sm:mt-3">
                          A soma dos valores deve ser igual ao valor de {bonusConstrutora > 0 ? 'avaliação' : 'venda'} do imóvel.
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Botões */}
                <div className="flex flex-col xs:flex-row gap-2 sm:gap-3 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1 text-xs sm:text-sm h-9 sm:h-10"
                    onClick={limparCamposERestaurar}
                  >
                    <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    Limpar e Restaurar
                  </Button>
                  <Button
                    className="flex-1 gap-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-xs sm:text-sm h-9 sm:h-10"
                    disabled={validacao !== 'ok'}
                  >
                    <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4" />
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
