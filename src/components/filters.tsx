'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Filter, ChevronDown, ChevronUp, X, RotateCcw, Search, Building, Layers, MapPin, Home, Sun } from "lucide-react"

interface FiltersProps {
  onFiltersChange: (filters: {
    search: string
    disponibilidade: string
    bloco: string
    andar: string
    tipologia: string
    posicaoSol: string
  }) => void
  disponibilidadeOptions: string[]
  blocoOptions: string[]
  andarOptions: string[]
  tipologiaOptions: string[]
  posicaoSolOptions: string[]
  filters?: {
    search: string
    disponibilidade: string
    bloco: string
    andar: string
    tipologia: string
    posicaoSol: string
  }
}

const filterDescriptions = {
  search: {
    label: 'Buscar Unidade',
    placeholder: 'Unidade...',
    description: 'Digite o código exato da unidade',
    icon: Search
  },
  disponibilidade: {
    label: 'Status de Disponibilidade',
    description: 'Filtre por situação atual da unidade',
    icon: Home
  },
  bloco: {
    label: 'Bloco do Edifício',
    description: 'Selecione o bloco (A, B, C, D...)',
    icon: Building
  },
  andar: {
    label: 'Andar',
    description: 'Escolha o andar desejado',
    icon: Layers
  },
  tipologia: {
    label: 'Tipologia do Imóvel',
    description: 'Número de quartos e suítes',
    icon: MapPin
  },
  posicaoSol: {
    label: 'Orientação Solar',
    description: 'Sol da manhã (Nascente) ou da tarde (Poente)',
    icon: Sun
  }
}

export function Filters({
  onFiltersChange,
  disponibilidadeOptions,
  blocoOptions,
  andarOptions,
  tipologiaOptions,
  posicaoSolOptions,
  filters: externalFilters
}: FiltersProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [internalFilters, setInternalFilters] = useState({
    search: '',
    disponibilidade: '',
    bloco: '',
    andar: '',
    tipologia: '',
    posicaoSol: ''
  })

  // Usar filtros externos se fornecidos, senão usar estado interno
  const filters = externalFilters || internalFilters

  const activeFiltersCount = Object.values(filters).filter(value => value !== '').length

  const updateFilter = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value === 'all' ? '' : value }

    // Se estiver usando filtros externos, apenas chamar o callback
    if (externalFilters) {
      onFiltersChange(newFilters)
    } else {
      // Senão, atualizar o estado interno
      setInternalFilters(newFilters)
      onFiltersChange(newFilters)
    }
  }

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      disponibilidade: '',
      bloco: '',
      andar: '',
      tipologia: '',
      posicaoSol: ''
    }

    if (externalFilters) {
      onFiltersChange(clearedFilters)
    } else {
      setInternalFilters(clearedFilters)
      onFiltersChange(clearedFilters)
    }
  }

  const removeFilter = (key: string) => {
    updateFilter(key, '')
  }

  return (
    <Card className="mb-6 border-0 dark:bg-background bg-white shadow-md">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Filter className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">Filtros</CardTitle>
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {activeFiltersCount} ativo{activeFiltersCount > 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0">
            {/* Filtros Ativos */}
            {activeFiltersCount > 0 && (
              <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Filtros ativos:</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-xs h-6 px-2"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Limpar todos
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {filters.search && (
                    <Badge variant="outline" className="gap-1">
                      Busca: {filters.search}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-red-500" 
                        onClick={() => removeFilter('search')}
                      />
                    </Badge>
                  )}
                  {filters.disponibilidade && (
                    <Badge variant="outline" className="gap-1">
                      Status: {filters.disponibilidade}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-red-500" 
                        onClick={() => removeFilter('disponibilidade')}
                      />
                    </Badge>
                  )}
                  {filters.bloco && (
                    <Badge variant="outline" className="gap-1">
                      Bloco: {filters.bloco}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-red-500" 
                        onClick={() => removeFilter('bloco')}
                      />
                    </Badge>
                  )}
                  {filters.andar && (
                    <Badge variant="outline" className="gap-1">
                      Andar: {filters.andar}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-red-500" 
                        onClick={() => removeFilter('andar')}
                      />
                    </Badge>
                  )}
                  {filters.tipologia && (
                    <Badge variant="outline" className="gap-1">
                      Tipologia: {filters.tipologia}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-red-500" 
                        onClick={() => removeFilter('tipologia')}
                      />
                    </Badge>
                  )}
                  {filters.posicaoSol && (
                    <Badge variant="outline" className="gap-1">
                      Sol: {filters.posicaoSol}
                      <X 
                        className="h-3 w-3 cursor-pointer hover:text-red-500" 
                        onClick={() => removeFilter('posicaoSol')}
                      />
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Campos de Filtro */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Busca */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Search className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">
                    {filterDescriptions.search.label}
                  </h4>
                </div>
                <Input
                  placeholder={filterDescriptions.search.placeholder}
                  value={filters.search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  className="h-9"
                />
                <p className="text-xs text-muted-foreground">
                  {filterDescriptions.search.description}
                </p>
              </div>

              {/* Disponibilidade */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Home className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">
                    {filterDescriptions.disponibilidade.label}
                  </h4>
                </div>
                <Select value={filters.disponibilidade} onValueChange={(value) => updateFilter('disponibilidade', value)}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {(disponibilidadeOptions || []).map((option) => (
                      <SelectItem key={option} value={option}>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            option === 'Disponível' ? 'bg-green-500' :
                            option === 'Vendida' ? 'bg-red-500' :
                            option === 'Reservada' || option.includes('Reservada') ? 'bg-yellow-500' :
                            option === 'Quitado' ? 'bg-blue-500' :
                            option === 'Mirror' ? 'bg-purple-500' : 'bg-gray-500'
                          }`}></div>
                          {option}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {filterDescriptions.disponibilidade.description}
                </p>
              </div>

              {/* Bloco */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Building className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">
                    {filterDescriptions.bloco.label}
                  </h4>
                </div>
                <Select value={filters.bloco} onValueChange={(value) => updateFilter('bloco', value)}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {(blocoOptions || []).map((option) => (
                      <SelectItem key={option} value={option}>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded flex items-center justify-center text-xs font-bold">
                            {option}
                          </div>
                          Bloco {option}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {filterDescriptions.bloco.description}
                </p>
              </div>

              {/* Andar */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Layers className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">
                    {filterDescriptions.andar.label}
                  </h4>
                </div>
                <Select value={filters.andar} onValueChange={(value) => updateFilter('andar', value)}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {(andarOptions || []).map((option) => (
                      <SelectItem key={option} value={option}>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gray-100 text-gray-600 rounded flex items-center justify-center text-xs font-medium">
                            {option === 'Térreo' ? 'T' : option.replace('º Andar', '')}
                          </div>
                          {option}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {filterDescriptions.andar.description}
                </p>
              </div>

              {/* Tipologia */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">
                    {filterDescriptions.tipologia.label}
                  </h4>
                </div>
                <Select value={filters.tipologia} onValueChange={(value) => updateFilter('tipologia', value)}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {(tipologiaOptions || []).map((option) => (
                      <SelectItem key={option} value={option}>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-purple-100 text-purple-600 rounded flex items-center justify-center text-xs font-bold">
                            {option.split('Q')[0]}
                          </div>
                          {option}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {filterDescriptions.tipologia.description}
                </p>
              </div>

              {/* Posição do Sol */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <Sun className="h-4 w-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">
                    {filterDescriptions.posicaoSol.label}
                  </h4>
                </div>
                <Select value={filters.posicaoSol} onValueChange={(value) => updateFilter('posicaoSol', value)}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    {(posicaoSolOptions || []).map((option) => (
                      <SelectItem key={option} value={option}>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-orange-100 text-orange-600 rounded flex items-center justify-center text-xs">
                            {option === 'Nascente' ? '🌅' : '🌇'}
                          </div>
                          {option}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {filterDescriptions.posicaoSol.description}
                </p>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}