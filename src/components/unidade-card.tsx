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

  // Calcular valores financeiros
  const calcularValores = () => {
    const avaliacaoNum = parseFloat(valorAvaliacao.replace(/[^\d,]/g, '').replace(',', '.'))
    const vendaNum = parseFloat(valorVenda.replace(/[^\d,]/g, '').replace(',', '.'))
    
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

  return (
    <Card className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-0 shadow-md overflow-hidden bg-white">
      {/* Header com status e unidade */}
      <CardHeader className="pb-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {unidade}
            </h3>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Building2 className="w-3 h-3" />
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
        {/* Características Principais */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-1">
              <Home className="w-3 h-3 text-slate-500" />
              <p className="text-xs text-muted-foreground font-medium">Área Privativa</p>
            </div>
            <p className="font-semibold text-sm text-slate-900 dark:text-white">{areaPrivativa}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-3 h-3 text-slate-500" />
              <p className="text-xs text-muted-foreground font-medium">Tipologia</p>
            </div>
            <p className="font-semibold text-sm text-slate-900 dark:text-white">{tipologia}</p>
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
          <Badge variant="outline" className="flex items-center gap-1 px-2 py-1 text-xs border-slate-200 dark:border-slate-700">
            <Car className="w-3 h-3" />
            {vaga} vaga{vaga > 1 ? 's' : ''}
          </Badge>
        </div>

        {/* Seção de Valores Financeiros */}
        <div className="space-y-3 border-t border-slate-200 dark:border-slate-700 pt-4">
          
          {/* Avaliação Bancária */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
                  <Building2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Avaliação Bancária</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Valor de referência</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                  {valores?.avaliacaoFormatada}
                </p>
              </div>
            </div>
          </div>

          {/* Valor de Venda */}
          <div className={cn(
            "rounded-lg p-4 border-2 transition-all duration-200",
            valores?.temBonus 
              ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-300 dark:from-green-900/20 dark:to-emerald-900/20 dark:border-green-700" 
              : "bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30"
          )}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Valor de Venda</p>
                {valores?.temBonus && (
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">Com bônus especial</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-slate-900 dark:text-white">
                  {valores?.vendaFormatada}
                </p>
              </div>
            </div>
          </div>

          {/* Bônus da Construtora */}
          {valores?.temBonus && (
            <div className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-lg p-3 border border-green-300 dark:border-green-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <Percent className="w-3 h-3 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-green-700 dark:text-green-300">Bônus da Construtora</p>
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Economia de {valores.percentualDiferenca}%
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-700 dark:text-green-300">
                    {valores.diferenca}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Indicador de disponibilidade */}
        {disponibilidade === 'Disponível' && (
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
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