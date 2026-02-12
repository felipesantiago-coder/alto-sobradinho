'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useIsMobile } from "@/hooks/use-mobile"

interface StatusSummaryProps {
  total: number
  disponiveis: number
  vendidas: number
  reservadas: number
  quitadas: number
  mirror: number
  foraDeVenda: number
  onFilterClick?: (disponibilidade: string | null) => void
  activeFilter?: string | null
}

const statusConfig = {
  disponiveis: {
    label: 'Disponíveis',
    color: 'bg-green-100 text-green-800 border-green-200',
    activeColor: 'bg-green-500 text-white border-green-600',
    description: 'Prontas para compra',
    filterValue: 'Disponível'
  },
  vendidas: {
    label: 'Vendidas',
    color: 'bg-red-100 text-red-800 border-red-200',
    activeColor: 'bg-red-500 text-white border-red-600',
    description: 'Negócio fechado',
    filterValue: 'Vendida'
  },
  reservadas: {
    label: 'Reservadas',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    activeColor: 'bg-yellow-500 text-white border-yellow-600',
    description: 'Em processo de venda',
    filterValue: 'Reservada'
  },
  quitadas: {
    label: 'Quitadas',
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    activeColor: 'bg-blue-500 text-white border-blue-600',
    description: 'Pagamento concluído',
    filterValue: 'Quitado'
  },
  mirror: {
    label: 'Mirror',
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    activeColor: 'bg-purple-500 text-white border-purple-600',
    description: 'Espelho comercial',
    filterValue: 'Mirror'
  },
  foraDeVenda: {
    label: 'Fora de Venda',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    activeColor: 'bg-gray-500 text-white border-gray-600',
    description: 'Indisponíveis',
    filterValue: 'Fora de Venda'
  }
}

export function StatusSummary({
  total,
  disponiveis,
  vendidas,
  reservadas,
  quitadas,
  mirror,
  foraDeVenda,
  onFilterClick,
  activeFilter
}: StatusSummaryProps) {
  const isMobile = useIsMobile()

  const statusData = [
    { key: 'disponiveis', count: disponiveis },
    { key: 'vendidas', count: vendidas },
    { key: 'reservadas', count: reservadas },
    { key: 'quitadas', count: quitadas },
    { key: 'mirror', count: mirror },
    { key: 'foraDeVenda', count: foraDeVenda }
  ]

  const handleCardClick = (filterValue: string) => {
    // Se já está filtrando por este status, limpa o filtro (toggle)
    if (activeFilter === filterValue && onFilterClick) {
      onFilterClick(null)
    } else if (onFilterClick) {
      onFilterClick(filterValue)
    }
  }

  return (
    <Card className="mb-6 border-0 dark:bg-background bg-white shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Resumo de Disponibilidade
          </h3>
          <Badge variant="outline" className="text-sm px-3 py-1">
            Total: {total} unidades
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {(statusData || []).map(({ key, count }) => {
            const config = statusConfig[key as keyof typeof statusConfig]
            const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0'
            const isActive = activeFilter === config.filterValue

            return (
              <div
                key={key}
                onClick={() => handleCardClick(config.filterValue)}
                className={`
                  relative group cursor-pointer transition-all duration-200 touch-action-manipulation
                  ${isActive ? 'scale-105 shadow-xl' : 'hover:scale-105'}
                `}
                style={{ touchAction: 'manipulation' }}
              >
                <div className={`
                  p-4 rounded-lg border-2 transition-all duration-200
                  ${isActive ? `${config.activeColor} shadow-xl scale-105` : `${config.color} bg-opacity-10 hover:shadow-lg`}
                `}>
                  <div className="flex items-center justify-center mb-3">
                    <span className={`text-3xl font-bold ${isActive ? 'text-white' : ''}`}>{count}</span>
                  </div>
                  <div className={`text-sm font-medium mb-1 text-center ${isActive ? 'text-white' : ''}`}>{config.label}</div>
                  <div className={`text-xs text-center ${isActive ? 'text-white/90' : 'opacity-75'}`}>{percentage}% do total</div>
                </div>

                {/* Tooltip - OCULTO EM MOBILE para evitar interferência com cliques */}
                {!isMobile && (
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-4 py-3 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-20 shadow-xl pointer-events-none">
                    <div className="font-semibold text-sm mb-1">{config.label}</div>
                    <div className="text-gray-300 mb-1">{config.description}</div>
                    <div className="text-gray-400">{count} unidade{count !== 1 ? 's' : ''}</div>
                    <div className="text-green-400 font-medium">{percentage}% do total</div>
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-2">
                      <div className="border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Barra de Progresso Visual Melhorada */}
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">Distribuição Visual</div>
            <div className="text-xs text-gray-500">100% das unidades</div>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden shadow-inner">
            <div className="flex h-full">
              {disponiveis > 0 && (
                <div
                  className="bg-green-500 hover:bg-green-600 transition-colors"
                  style={{ width: `${(disponiveis / total) * 100}%` }}
                  title={`Disponíveis: ${disponiveis} (${((disponiveis / total) * 100).toFixed(1)}%)`}
                />
              )}
              {vendidas > 0 && (
                <div
                  className="bg-red-500 hover:bg-red-600 transition-colors"
                  style={{ width: `${(vendidas / total) * 100}%` }}
                  title={`Vendidas: ${vendidas} (${((vendidas / total) * 100).toFixed(1)}%)`}
                />
              )}
              {reservadas > 0 && (
                <div
                  className="bg-yellow-500 hover:bg-yellow-600 transition-colors"
                  style={{ width: `${(reservadas / total) * 100}%` }}
                  title={`Reservadas: ${reservadas} (${((reservadas / total) * 100).toFixed(1)}%)`}
                />
              )}
              {quitadas > 0 && (
                <div
                  className="bg-blue-500 hover:bg-blue-600 transition-colors"
                  style={{ width: `${(quitadas / total) * 100}%` }}
                  title={`Quitadas: ${quitadas} (${((quitadas / total) * 100).toFixed(1)}%)`}
                />
              )}
              {mirror > 0 && (
                <div
                  className="bg-purple-500 hover:bg-purple-600 transition-colors"
                  style={{ width: `${(mirror / total) * 100}%` }}
                  title={`Mirror: ${mirror} (${((mirror / total) * 100).toFixed(1)}%)`}
                />
              )}
              {foraDeVenda > 0 && (
                <div
                  className="bg-gray-500 hover:bg-gray-600 transition-colors"
                  style={{ width: `${(foraDeVenda / total) * 100}%` }}
                  title={`Fora de Venda: ${foraDeVenda} (${((foraDeVenda / total) * 100).toFixed(1)}%)`}
                />
              )}
            </div>
          </div>

          {/* Legenda da barra */}
          <div className="flex flex-wrap gap-3 mt-3 justify-center">
            {disponiveis > 0 && (
              <div className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>Disponíveis ({disponiveis})</span>
              </div>
            )}
            {vendidas > 0 && (
              <div className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>Vendidas ({vendidas})</span>
              </div>
            )}
            {reservadas > 0 && (
              <div className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span>Reservadas ({reservadas})</span>
              </div>
            )}
            {quitadas > 0 && (
              <div className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                <span>Quitadas ({quitadas})</span>
              </div>
            )}
            {mirror > 0 && (
              <div className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 bg-purple-500 rounded"></div>
                <span>Mirror ({mirror})</span>
              </div>
            )}
            {foraDeVenda > 0 && (
              <div className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 bg-gray-500 rounded"></div>
                <span>Fora de Venda ({foraDeVenda})</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
