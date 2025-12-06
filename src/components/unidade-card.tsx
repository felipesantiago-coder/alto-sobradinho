'use client'

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { TrendingUp, Home, Car, Sun, Building2, Percent } from "lucide-react"

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
  'Disponível': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 border-green-200 dark:border-green-700 hover:bg-green-200 dark:hover:bg-green-800',
  'Vendida': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100 border-red-200 dark:border-red-700 hover:bg-red-200 dark:hover:bg-red-800',
  'Quitado': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-700 hover:bg-blue-200 dark:hover:bg-blue-800',
  'Reservada': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100 border-yellow-200 dark:border-yellow-700 hover:bg-yellow-200 dark:hover:bg-yellow-800',
  'Reservada aguardando revisão de proposta': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100 border-orange-200 dark:border-orange-700 hover:bg-orange-200 dark:hover:bg-orange-800',
  'Mirror': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100 border-purple-200 dark:border-purple-700 hover:bg-purple-200 dark:hover:bg-purple-800',
  'Fora de Venda - Comercial': 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-800'
}

const posicaoSolColors = {
  'Nascente': 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-100 border-yellow-200 dark:border-yellow-700',
  'Poente': 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-700'
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

  // Calcular valores financeiros
  const calcularValores = () => {
    // Remove "R$" e espaços, depois substitui pontos por nada e vírgulas por ponto
    // Isso funciona para ambos os formatos: "R$ 829.000" e "R$ 791.347,00"
    const parseValor = (valor: string) => {
      const limpo = valor.replace(/[R$\s]/g, '')
      // Se tiver ponto e vírgula, formato brasileiro: "R$ 791.347,00"
      if (limpo.includes('.') && limpo.includes(',')) {
        return parseFloat(limpo.replace(/\./g, '').replace(',', '.'))
      }
      // Se tiver apenas ponto, pode ser "R$ 829.000" ou "R$ 791347.00"
      else if (limpo.includes('.')) {
        // Se o último ponto tiver 2 dígitos depois, é centavo
        const partes = limpo.split('.')
        if (partes[partes.length - 1].length === 2) {
          return parseFloat(limpo)
        }
        // Senão, é separador de milhar
        return parseFloat(limpo.replace(/\./g, ''))
      }
      // Se não tiver ponto, é um número simples
      return parseFloat(limpo)
    }

    const avaliacaoNum = parseValor(valorAvaliacao)
    const vendaNum = parseValor(valorVenda)
    
    if (!isNaN(avaliacaoNum) && !isNaN(vendaNum)) {
      const temBonus = avaliacaoNum > vendaNum
      const diferenca = Math.abs(avaliacaoNum - vendaNum)
      
      return {
        temBonus,
        diferenca: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(diferenca),
        percentualDiferenca: avaliacaoNum > 0 ? ((diferenca / avaliacaoNum) * 100).toFixed(1) : '0',
        avaliacaoFormatada: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(avaliacaoNum),
        vendaFormatada: new Intl.NumberFormat('pt-BR', {
          style: 'currency',
          currency: 'BRL'
        }).format(vendaNum)
      }
    }
    
    return null
  }

  const valores = calcularValores()

  // Definir cor do card baseada no status com suporte a temas
  const getCardColorClass = () => {
    switch (disponibilidade) {
      case 'Disponível':
        return 'border-green-400 shadow-green-100 dark:shadow-green-900/20 dark:border-green-600';
      case 'Vendida':
        return 'border-red-400 shadow-red-100 dark:shadow-red-900/20 dark:border-red-600';
      case 'Quitado':
        return 'border-blue-400 shadow-blue-100 dark:shadow-blue-900/20 dark:border-blue-600';
      case 'Reservada':
        return 'border-yellow-400 shadow-yellow-100 dark:shadow-yellow-900/20 dark:border-yellow-600';
      case 'Reservada aguardando revisão de proposta':
        return 'border-orange-400 shadow-orange-100 dark:shadow-orange-900/20 dark:border-orange-600';
      case 'Mirror':
        return 'border-purple-400 shadow-purple-100 dark:shadow-purple-900/20 dark:border-purple-600';
      case 'Fora de Venda - Comercial':
        return 'border-gray-400 shadow-gray-100 dark:shadow-gray-900/20 dark:border-gray-600';
      default:
        return 'border-gray-300 shadow-gray-50 dark:shadow-gray-900/10 dark:border-gray-700';
    }
  }

  return (
    <Card className={cn(
      "group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden bg-background",
      getCardColorClass()
    )}>
      {/* Header com status e unidade */}
      <CardHeader className={cn(
        "pb-2 bg-gradient-to-r from-card to-background dark:from-muted dark:to-card",
        disponibilidade === 'Disponível' && 'bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/20',
        disponibilidade === 'Vendida' && 'bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/20',
        disponibilidade === 'Quitado' && 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/20',
        disponibilidade === 'Reservada' && 'bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-900/30 dark:to-yellow-800/20',
        disponibilidade === 'Reservada aguardando revisão de proposta' && 'bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/20',
        disponibilidade === 'Mirror' && 'bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/20',
        disponibilidade === 'Fora de Venda - Comercial' && 'bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900/30 dark:to-gray-800/20'
      )}>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-foreground mb-1 tracking-tight">
              {unidade}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 className="w-3 h-3" />
              <span className="font-medium">{andar === 0 ? 'Térreo' : `${andar}º Andar`}</span>
            </div>
          </div>
          <Badge 
            className={cn(
              "px-2 py-1 text-xs font-semibold border transition-colors",
              statusColor
            )}
          >
            {disponibilidade}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-3 space-y-3">
        {/* Características Principais */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-card rounded-lg p-2 border shadow-sm">
            <div className="flex items-center gap-1 mb-1">
              <Home className="w-3 h-3 text-muted-foreground" />
              <p className="text-xs font-semibold text-foreground">Área</p>
            </div>
            <p className="text-sm font-bold text-foreground">{areaPrivativa}</p>
          </div>
          <div className="bg-card rounded-lg p-2 border shadow-sm">
            <div className="flex items-center gap-1 mb-1">
              <TrendingUp className="w-3 h-3 text-muted-foreground" />
              <p className="text-xs font-semibold text-foreground">Tipologia</p>
            </div>
            <p className="text-sm font-bold text-foreground">{tipologia}</p>
          </div>
        </div>

        {/* Detalhes Adicionais */}
        <div className="flex gap-2">
          <Badge 
            variant="outline" 
            className={cn(
              "flex items-center gap-1 px-2 py-1 text-xs border",
              solColor
            )}
          >
            <Sun className="w-3 h-3" />
            {posicaoSol}
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1 px-2 py-1 text-xs border border-muted">
            <Car className="w-3 h-3" />
            {vaga} vaga{vaga > 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Seção de Valores Financeiros */}
        <div className="space-y-2 border-t border-border pt-3">
          
          {/* Bônus da Construtora - aparece primeiro quando existe */}
          {valores?.temBonus && (
            <div className="bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-900/40 dark:to-yellow-900/30 rounded-lg p-2 border border-amber-400 dark:border-amber-600 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-br from-amber-500 to-yellow-500 rounded-lg flex items-center justify-center shadow">
                    <Percent className="w-2 h-2 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-300">Bônus Construtora</p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">Economia</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-300">
                    {valores.diferenca}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Valor de Venda - sempre principal */}
          <div className={cn(
            "rounded-lg p-3 border transition-all duration-200 shadow-md",
            valores?.temBonus 
              ? "bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/30 dark:to-emerald-800/20 border-green-400 dark:border-green-600 ring-2 ring-green-200 dark:ring-green-800" 
              : "bg-card border border-border"
          )}>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className={cn(
                    "w-5 h-5 rounded-lg flex items-center justify-center shadow",
                    valores?.temBonus 
                      ? "bg-green-500 dark:bg-green-600" 
                      : "bg-muted-foreground"
                  )}>
                    <TrendingUp className="w-2.5 h-2.5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Valor de Venda</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  "font-bold tracking-tight text-sm",
                  valores?.temBonus 
                    ? "text-green-700 dark:text-green-300" 
                    : "text-foreground"
                )}>
                  {valores?.vendaFormatada}
                </p>
              </div>
            </div>
          </div>

          {/* Avaliação Bancária - aparece por último */}
          <div className="bg-card rounded-lg p-2 border border-border shadow-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-muted-foreground rounded-lg flex items-center justify-center shadow">
                  <Building2 className="w-2 h-2 text-background" />
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">Avaliação Bancária</p>
                  <p className="text-xs text-muted-foreground">Referência</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs font-bold text-foreground">
                  {valores?.avaliacaoFormatada}
                </p>
              </div>
            </div>
          </div>
        </div>

  
      </CardContent>
    </Card>
  )
}