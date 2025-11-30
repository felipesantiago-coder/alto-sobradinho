'use client'

import { useState, useEffect, useMemo, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { UnidadeCard } from "@/components/unidade-card"
import { Filters } from "@/components/filters"
import { StatusSummary } from "@/components/status-summary"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowLeft, Building2, Home, TrendingUp, Users, Loader2 } from "lucide-react"

interface Unidade {
  id: string
  unidade: string
  andar: number
  areaPrivativa: string
  tipologia: string
  posicaoSol: string
  vaga: number
  valorAvaliacao: string
  valorVenda: string
  disponibilidade: string
}

const empreendimentoInfo = {
  'alto-da-alvorada': {
    nome: 'Alto da Alvorada',
    descricao: 'Conforto e bem-estar para sua família',
    cor: 'from-blue-600 to-cyan-600'
  },
  'alto-do-horizonte': {
    nome: 'Alto do Horizonte',
    descricao: 'A melhor localização para sua nova vida',
    cor: 'from-emerald-600 to-teal-600'
  }
}

export default function EmpreendimentoPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  
  const [unidades, setUnidades] = useState<Unidade[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState('unidade')
  const [filters, setFilters] = useState({
    search: '',
    disponibilidade: '',
    bloco: '',
    andar: '',
    tipologia: '',
    posicaoSol: ''
  })

  const empreendimento = empreendimentoInfo[slug as keyof typeof empreendimentoInfo]

  useEffect(() => {
    if (!empreendimento) {
      router.push('/')
      return
    }

    carregarUnidades()
  }, [slug, empreendimento, router])

  const carregarUnidades = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/unidades-static?empreendimento=${slug}&limit=1000`)
      if (!response.ok) throw new Error('Erro ao carregar unidades')
      
      const data = await response.json()
      setUnidades(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
      console.error('Erro ao carregar unidades:', err)
    } finally {
      setLoading(false)
    }
  }, [slug])

  // Opções para filtros - memoizadas para performance
  const filterOptions = useMemo(() => {
    if (unidades.length === 0) {
      return {
        disponibilidadeOptions: [],
        blocoOptions: [],
        andarOptions: [],
        tipologiaOptions: [],
        posicaoSolOptions: []
      }
    }

    const disponibilidades = [...new Set(unidades.map(u => u.disponibilidade))]
    const blocos = [...new Set(unidades.map(u => u.unidade.split('-')[0]))].sort()
    const andares = [...new Set(unidades.map(u => u.andar))].sort((a, b) => a - b)
    const tipologias = [...new Set(unidades.map(u => u.tipologia))]
    const posicoesSol = [...new Set(unidades.map(u => u.posicaoSol))]

    return {
      disponibilidadeOptions: disponibilidades,
      blocoOptions: blocos,
      andarOptions: andares.map(a => a === 0 ? 'Térreo' : `${a}º Andar`),
      tipologiaOptions: tipologias,
      posicaoSolOptions: posicoesSol
    }
  }, [unidades])

  // Unidades filtradas e ordenadas - memoizadas
  const filteredAndSortedUnidades = useMemo(() => {
    if (unidades.length === 0) return []

    let filtered = unidades.filter(unidade => {
      if (filters.search && !unidade.unidade.toLowerCase().includes(filters.search.toLowerCase())) {
        return false
      }
      if (filters.disponibilidade && unidade.disponibilidade !== filters.disponibilidade) {
        return false
      }
      if (filters.bloco && !unidade.unidade.startsWith(filters.bloco)) {
        return false
      }
      if (filters.andar) {
        const andarNum = filters.andar === 'Térreo' ? 0 : parseInt(filters.andar)
        if (unidade.andar !== andarNum) return false
      }
      if (filters.tipologia && unidade.tipologia !== filters.tipologia) {
        return false
      }
      if (filters.posicaoSol && unidade.posicaoSol !== filters.posicaoSol) {
        return false
      }
      return true
    })

    // Ordenação otimizada
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'unidade':
          return a.unidade.localeCompare(b.unidade)
        case 'andar':
          return a.andar - b.andar || a.unidade.localeCompare(b.unidade)
        case 'valor':
          const valorA = parseFloat(a.valorVenda.replace(/[^\d,]/g, '').replace(',', '.'))
          const valorB = parseFloat(b.valorVenda.replace(/[^\d,]/g, '').replace(',', '.'))
          return valorA - valorB
        case 'area':
          const areaA = parseFloat(a.areaPrivativa.replace(/[^\d,]/g, '').replace(',', '.'))
          const areaB = parseFloat(b.areaPrivativa.replace(/[^\d,]/g, '').replace(',', '.'))
          return areaB - areaA
        default:
          return 0
      }
    })

    return filtered
  }, [unidades, filters, sortBy])

  // Estatísticas - memoizadas
  const estatisticas = useMemo(() => {
    if (unidades.length === 0) {
      return { 
        total: 0, 
        disponiveis: 0, 
        vendidas: 0, 
        reservadas: 0,
        quitadas: 0,
        mirror: 0,
        foraDeVenda: 0
      }
    }

    const total = unidades.length
    const disponiveis = unidades.filter(u => u.disponibilidade === 'Disponível').length
    const vendidas = unidades.filter(u => u.disponibilidade === 'Vendida').length
    const reservadas = unidades.filter(u => u.disponibilidade.includes('Reservada')).length
    const quitadas = unidades.filter(u => u.disponibilidade === 'Quitado').length
    const mirror = unidades.filter(u => u.disponibilidade === 'Mirror').length
    const foraDeVenda = unidades.filter(u => u.disponibilidade.includes('Fora')).length

    return { 
      total, 
      disponiveis, 
      vendidas, 
      reservadas,
      quitadas,
      mirror,
      foraDeVenda
    }
  }, [unidades])

  // Render de item para virtualização
  const renderUnidadeCard = useCallback((unidade: Unidade, index: number) => (
    <UnidadeCard
      key={unidade.id}
      unidade={unidade.unidade}
      andar={unidade.andar}
      areaPrivativa={unidade.areaPrivativa}
      tipologia={unidade.tipologia}
      posicaoSol={unidade.posicaoSol}
      vaga={unidade.vaga}
      valorAvaliacao={unidade.valorAvaliacao}
      valorVenda={unidade.valorVenda}
      disponibilidade={unidade.disponibilidade}
    />
  ), [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-lg text-muted-foreground">Carregando unidades...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !empreendimento) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error || 'Empreendimento não encontrado'}</p>
            <Link href="/">
              <Button>Voltar para Home</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-2" />
            <div className="flex items-center space-x-2">
              <img src="/logo-qb.png" alt="QB" className="w-6 h-6" />
              <span>Voltar para Home</span>
            </div>
          </Link>
          
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border-0">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  {empreendimento.nome}
                </h1>
                <p className="text-lg text-muted-foreground">
                  {empreendimento.descricao}
                </p>
              </div>
              
              {/* Estatísticas */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="text-center">
                  <CardContent className="p-4">
                    <Home className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                    <div className="text-2xl font-bold">{estatisticas.total}</div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="p-4">
                    <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-600" />
                    <div className="text-2xl font-bold">{estatisticas.disponiveis}</div>
                    <div className="text-xs text-muted-foreground">Disponíveis</div>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="p-4">
                    <Users className="h-6 w-6 mx-auto mb-2 text-red-600" />
                    <div className="text-2xl font-bold">{estatisticas.vendidas}</div>
                    <div className="text-xs text-muted-foreground">Vendidas</div>
                  </CardContent>
                </Card>
                <Card className="text-center">
                  <CardContent className="p-4">
                    <Building2 className="h-6 w-6 mx-auto mb-2 text-yellow-600" />
                    <div className="text-2xl font-bold">{estatisticas.reservadas}</div>
                    <div className="text-xs text-muted-foreground">Reservadas</div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </header>

        {/* Resumo de Status */}
        <StatusSummary
          total={estatisticas.total}
          disponiveis={estatisticas.disponiveis}
          vendidas={estatisticas.vendidas}
          reservadas={estatisticas.reservadas}
          quitadas={estatisticas.quitadas}
          mirror={estatisticas.mirror}
          foraDeVenda={estatisticas.foraDeVenda}
        />

        {/* Filtros */}
        <Filters
          onFiltersChange={setFilters}
          {...filterOptions}
        />

        {/* Controles */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Unidades Disponíveis
            </h2>
            <p className="text-muted-foreground">
              {filteredAndSortedUnidades.length} de {unidades.length} unidades
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Ordenar por:</span>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unidade">Unidade</SelectItem>
                <SelectItem value="andar">Andar</SelectItem>
                <SelectItem value="valor">Menor Valor</SelectItem>
                <SelectItem value="area">Maior Área</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Grid de Unidades com Virtualização */}
        {filteredAndSortedUnidades.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma unidade encontrada</h3>
              <p className="text-muted-foreground mb-4">
                Tente ajustar os filtros para encontrar unidades disponíveis.
              </p>
              <Button onClick={() => setFilters({
                search: '',
                disponibilidade: '',
                bloco: '',
                andar: '',
                tipologia: '',
                posicaoSol: ''
              })}>
                Limpar Filtros
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedUnidades.map((unidade) => (
              <UnidadeCard
                key={unidade.id}
                unidade={unidade.unidade}
                andar={unidade.andar}
                areaPrivativa={unidade.areaPrivativa}
                tipologia={unidade.tipologia}
                posicaoSol={unidade.posicaoSol}
                vaga={unidade.vaga}
                valorAvaliacao={unidade.valorAvaliacao}
                valorVenda={unidade.valorVenda}
                disponibilidade={unidade.disponibilidade}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}