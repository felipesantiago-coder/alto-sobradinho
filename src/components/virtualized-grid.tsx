'use client'

import { useState, useEffect, useRef, useMemo } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

interface VirtualizedGridProps {
  items: any[]
  renderItem: (item: any, index: number) => React.ReactNode
  itemHeight: number
  columns: number
  gap: number
  containerHeight: number
}

interface VirtualizedItem {
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

export function VirtualizedGrid({ 
  items, 
  renderItem, 
  itemHeight, 
  columns, 
  gap, 
  containerHeight 
}: VirtualizedGridProps) {
  const [scrollTop, setScrollTop] = useState(0)
  const [actualColumns, setActualColumns] = useState(columns)
  const containerRef = useRef<HTMLDivElement>(null)
  const rowHeight = itemHeight + gap

  // Calcular colunas responsivas
  useEffect(() => {
    const updateColumns = () => {
      if (containerRef.current) {
        const width = containerRef.current.clientWidth
        const calculatedColumns = Math.max(1, Math.floor(width / (itemHeight + gap)))
        setActualColumns(calculatedColumns)
      }
    }

    updateColumns()
    window.addEventListener('resize', updateColumns)
    return () => window.removeEventListener('resize', updateColumns)
  }, [itemHeight, gap])

  // Calcular quais itens estão visíveis
  const visibleRange = useMemo(() => {
    if (items.length === 0) return { startIndex: 0, endIndex: 0 }
    
    const rowsCount = Math.ceil(items.length / actualColumns)
    const startRow = Math.floor(scrollTop / rowHeight)
    const visibleRowCount = Math.ceil(containerHeight / rowHeight)
    const endRow = Math.min(startRow + visibleRowCount + 1, rowsCount)
    
    const startIndex = startRow * actualColumns
    const endIndex = Math.min(endRow * actualColumns, items.length)
    
    return { startIndex, endIndex }
  }, [scrollTop, items.length, actualColumns, rowHeight, containerHeight])

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }

  const totalHeight = Math.ceil(items.length / actualColumns) * rowHeight

  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Nenhum item para exibir</p>
      </div>
    )
  }

  return (
    <div 
      ref={containerRef}
      className="relative overflow-auto"
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            position: 'absolute',
            top: Math.floor(visibleRange.startIndex / actualColumns) * rowHeight,
            left: 0,
            right: 0,
          }}
        >
          <div 
            className="grid gap-4"
            style={{ 
              gridTemplateColumns: `repeat(${actualColumns}, minmax(0, 1fr))`,
              width: '100%'
            }}
          >
            {items.slice(visibleRange.startIndex, visibleRange.endIndex).map((item, index) => (
              <div key={item.id || visibleRange.startIndex + index}>
                {renderItem(item, visibleRange.startIndex + index)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Componente de Skeleton para loading
export function UnidadeCardSkeleton() {
  return (
    <Card className="border-0 shadow-md overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-6 w-24" />
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="space-y-2 border-t pt-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-6 w-full" />
        </div>
      </CardContent>
    </Card>
  )
}