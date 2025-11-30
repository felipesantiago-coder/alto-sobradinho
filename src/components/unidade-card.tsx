'use client'

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface UnidadeCardProps {
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

const statusColors = {
  'Disponível': 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200',
  'Vendida': 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200',
  'Quitado': 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200',
  'Reservada': 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200',
  'Reservada aguardando revisão de proposta': 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-200',
  'Mirror': 'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-200',
  'Fora de Venda - Comercial': 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200'
}

const posicaoSolColors = {
  'Nascente': 'bg-yellow-50 text-yellow-700 border-yellow-200',
  'Poente': 'bg-blue-50 text-blue-700 border-blue-200'
}

export function UnidadeCard({
  unidade,
  andar,
  areaPrivativa,
  tipologia,
  posicaoSol,
  vaga,
  valorAvaliacao,
  valorVenda,
  disponibilidade
}: UnidadeCardProps) {
  const statusColor = statusColors[disponibilidade as keyof typeof statusColors] || 'bg-gray-100 text-gray-800'
  const solColor = posicaoSolColors[posicaoSol as keyof typeof posicaoSolColors] || 'bg-gray-50 text-gray-700'

  // Calcular economia
  const calcularEconomia = () => {
    const avaliacaoNum = parseFloat(valorAvaliacao.replace(/[^\d,]/g, '').replace(',', '.'))
    const vendaNum = parseFloat(valorVenda.replace(/[^\d,]/g, '').replace(',', '.'))
    
    if (!isNaN(avaliacaoNum) && !isNaN(vendaNum) && avaliacaoNum > vendaNum) {
      const economia = avaliacaoNum - vendaNum
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(economia)
    }
    return null
  }

  const economia = calcularEconomia()

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-0 shadow-md overflow-hidden">
      {/* Header com status e unidade */}
      <CardHeader className="pb-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {unidade}
            </h3>
            <p className="text-sm text-muted-foreground">
              {andar === 0 ? 'Térreo' : `${andar}º Andar`}
            </p>
          </div>
          <Badge 
            className={cn(
              "px-3 py-1 text-xs font-semibold border transition-colors",
              statusColor
            )}
          >
            {disponibilidade}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {/* Área e Tipologia */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Área Privativa</p>
            <p className="font-semibold text-sm">{areaPrivativa}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-1">Tipologia</p>
            <p className="font-semibold text-sm">{tipologia}</p>
          </div>
        </div>

        {/* Posição do Sol e Vagas */}
        <div className="flex gap-3">
          <Badge 
            variant="outline" 
            className={cn(
              "flex items-center gap-1 px-2 py-1 text-xs",
              solColor
            )}
          >
            {posicaoSol === 'Nascente' ? '☀️' : '🌅'} {posicaoSol}
          </Badge>
          <Badge variant="outline" className="px-2 py-1 text-xs">
            🚗 {vaga} vaga{vaga > 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Valores */}
        <div className="space-y-3 border-t pt-3">
          <div className="flex justify-between items-center mb-3 p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground font-medium">Valor de Avaliação:</span>
            </div>
            <div className="text-base font-semibold text-gray-700 dark:text-gray-300 line-through">
              {valorAvaliacao}
            </div>
          </div>
          <div className="bg-gradient-to-r from-primary/15 to-primary/10 rounded-lg p-4 -mx-3 border border-primary/20">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-primary">Valor de Venda:</span>
              </div>
              <div className="text-2xl font-black text-primary">
                {valorVenda}
              </div>
            </div>
            {/* Desconto */}
            {economia && (
              <div className="mt-2 text-right">
                <span className="text-sm text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                  Economia: {economia}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Indicador de disponibilidade */}
        {disponibilidade === 'Disponível' && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex items-center justify-center">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
              <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                Disponível para venda
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}