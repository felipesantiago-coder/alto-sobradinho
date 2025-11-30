'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Search, Sun, Building, Home, Filter, Loader2 } from 'lucide-react';

// Interfaces
interface Empreendimento {
  id: string;
  nome: string;
  slug: string;
  descricao?: string;
  logo?: string;
  _count: {
    unidades: number;
  };
}

interface Unidade {
  id: string;
  unidade: string;
  andar: number;
  areaPrivativa: string;
  tipologia: string;
  posicaoSol: string;
  vaga: number;
  valorAvaliacao: string;
  valorVenda: string;
  disponibilidade: string;
  empreendimento: {
    nome: string;
    slug: string;
  };
}

interface ApiResponse {
  unidades: Unidade[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  filters: {
    blocos: string[];
    andares: number[];
    disponibilidades: string[];
    posicoesSol: string[];
  };
}

// Status colors
const STATUS_COLORS = {
  'Disponível': 'bg-green-500 text-white',
  'Vendida': 'bg-red-500 text-white',
  'Quitado': 'bg-blue-500 text-white',
  'Reservada': 'bg-yellow-500 text-white',
  'Reservada aguardando revisão de proposta': 'bg-orange-500 text-white',
  'Mirror': 'bg-purple-500 text-white',
  'Fora de Venda - Comercial': 'bg-gray-500 text-white'
};

const STATUS_BG_COLORS = {
  'Disponível': 'bg-green-50 border-green-200 hover:bg-green-100',
  'Vendida': 'bg-red-50 border-red-200 hover:bg-red-100',
  'Quitado': 'bg-blue-50 border-blue-200 hover:bg-blue-100',
  'Reservada': 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
  'Reservada aguardando revisão de proposta': 'bg-orange-50 border-orange-200 hover:bg-orange-100',
  'Mirror': 'bg-purple-50 border-purple-200 hover:bg-purple-100',
  'Fora de Venda - Comercial': 'bg-gray-50 border-gray-200 hover:bg-gray-100'
};

const SUN_ICONS = {
  'Nascente': '🌅',
  'Poente': '🌇'
};

export default function EspelhoVendas() {
  const [empreendimentos, setEmpreendimentos] = useState<Empreendimento[]>([]);
  const [empreendimentoSelecionado, setEmpreendimentoSelecionado] = useState<string>('');
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [filters, setFilters] = useState<ApiResponse['filters'] | null>(null);
  
  // Filter states
  const [blocoFilter, setBlocoFilter] = useState<string>('todos');
  const [andarFilter, setAndarFilter] = useState<string>('todos');
  const [disponibilidadeFilter, setDisponibilidadeFilter] = useState<string>('todos');
  const [posicaoSolFilter, setPosicaoSolFilter] = useState<string>('todos');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingEmpreendimentos, setLoadingEmpreendimentos] = useState<boolean>(true);

  // Load empreendimentos on mount
  useEffect(() => {
    const loadEmpreendimentos = async () => {
      try {
        setLoadingEmpreendimentos(true);
        const response = await fetch('/api/empreendimentos-static');
        if (!response.ok) throw new Error('Falha ao carregar empreendimentos');
        
        const data = await response.json();
        setEmpreendimentos(data);
        
        // Select first empreendimento by default
        if (data.length > 0) {
          setEmpreendimentoSelecionado(data[0].slug);
        }
      } catch (error) {
        console.error('Erro ao carregar empreendimentos:', error);
      } finally {
        setLoadingEmpreendimentos(false);
      }
    };

    loadEmpreendimentos();
  }, []);

  // Load units when empreendimento or filters change
  useEffect(() => {
    if (!empreendimentoSelecionado) return;

    const loadUnidades = async () => {
      try {
        setLoading(true);
        
        const params = new URLSearchParams({
          empreendimento: empreendimentoSelecionado,
          limit: '1000' // Load all units at once for better UX
        });

        // Add filters if not "todos"
        if (blocoFilter !== 'todos') params.append('bloco', blocoFilter);
        if (andarFilter !== 'todos') params.append('andar', andarFilter);
        if (disponibilidadeFilter !== 'todos') params.append('disponibilidade', disponibilidadeFilter);
        if (posicaoSolFilter !== 'todos') params.append('posicaoSol', posicaoSolFilter);

        const response = await fetch(`/api/unidades-static?${params}`);
        if (!response.ok) throw new Error('Falha ao carregar unidades');
        
        const data: ApiResponse = await response.json();
        setUnidades(data.unidades);
        setFilters(data.filters);
      } catch (error) {
        console.error('Erro ao carregar unidades:', error);
        setUnidades([]);
        setFilters(null);
      } finally {
        setLoading(false);
      }
    };

    loadUnidades();
  }, [empreendimentoSelecionado, blocoFilter, andarFilter, disponibilidadeFilter, posicaoSolFilter]);

  // Filter units based on search term
  const unidadesFiltradas = useMemo(() => {
    if (!searchTerm) return unidades;
    
    return unidades.filter(unidade => {
      const searchLower = searchTerm.toLowerCase();
      return (
        unidade.unidade.toLowerCase().includes(searchLower) ||
        unidade.tipologia.toLowerCase().includes(searchLower) ||
        unidade.valorVenda.toLowerCase().includes(searchLower) ||
        unidade.areaPrivativa.toLowerCase().includes(searchLower)
      );
    });
  }, [unidades, searchTerm]);

  // Group units by block
  const unidadesAgrupadas = useMemo(() => {
    const agrupadas: { [key: string]: Unidade[] } = {};
    
    unidadesFiltradas.forEach(unidade => {
      const bloco = unidade.unidade.split('-')[0];
      if (!agrupadas[bloco]) {
        agrupadas[bloco] = [];
      }
      agrupadas[bloco].push(unidade);
    });

    // Sort units within each block
    Object.keys(agrupadas).forEach(bloco => {
      agrupadas[bloco].sort((a, b) => {
        if (a.andar !== b.andar) {
          return a.andar - b.andar;
        }
        const numA = parseInt(a.unidade.split('-')[1]);
        const numB = parseInt(b.unidade.split('-')[1]);
        return numA - numB;
      });
    });

    return agrupadas;
  }, [unidadesFiltradas]);

  const clearFilters = () => {
    setBlocoFilter('todos');
    setAndarFilter('todos');
    setDisponibilidadeFilter('todos');
    setPosicaoSolFilter('todos');
    setSearchTerm('');
  };

  if (loadingEmpreendimentos) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Carregando empreendimentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-blue-800 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg">
                <img src="/logo-qb.png" alt="QB" className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Espelho Alto Sobradinho</h1>
                <p className="text-sm text-gray-500">Espelho de Vendas</p>
              </div>
            </div>
            
            {/* Empreendimento Selector */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              {empreendimentos.map((emp) => (
                <button
                  key={emp.id}
                  onClick={() => setEmpreendimentoSelecionado(emp.slug)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    empreendimentoSelecionado === emp.slug
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {emp.nome}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="mb-6 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Bloco Filter */}
              {filters && (
                <Select value={blocoFilter} onValueChange={setBlocoFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Bloco" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Blocos</SelectItem>
                    {filters.blocos.map(bloco => (
                      <SelectItem key={bloco} value={bloco}>Bloco {bloco}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Andar Filter */}
              {filters && (
                <Select value={andarFilter} onValueChange={setAndarFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Andar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os Andares</SelectItem>
                    {filters.andares.map(andar => (
                      <SelectItem key={andar} value={andar.toString()}>
                        {andar === 0 ? 'Térreo' : `${andar}º Andar`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Disponibilidade Filter */}
              {filters && (
                <Select value={disponibilidadeFilter} onValueChange={setDisponibilidadeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Disponibilidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    {filters.disponibilidades.map(disp => (
                      <SelectItem key={disp} value={disp}>{disp}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Posição Sol Filter */}
              {filters && (
                <Select value={posicaoSolFilter} onValueChange={setPosicaoSolFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Posição Sol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    {filters.posicoesSol.map(pos => (
                      <SelectItem key={pos} value={pos}>
                        <span className="flex items-center gap-2">
                          <span>{SUN_ICONS[pos as keyof typeof SUN_ICONS]}</span>
                          {pos}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* Clear Filters */}
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full"
              >
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
            <p className="text-gray-600">Carregando unidades...</p>
          </div>
        )}

        {/* Results Summary */}
        {!loading && (
          <div className="mb-6 flex items-center justify-between">
            <p className="text-gray-600">
              <span className="font-semibold text-lg">{unidadesFiltradas.length}</span> unidades encontradas
              {empreendimentoSelecionado && ` em ${empreendimentos.find(e => e.slug === empreendimentoSelecionado)?.nome}`}
            </p>
          </div>
        )}

        {/* Units Grid */}
        {!loading && unidadesFiltradas.length > 0 && (
          <div className="space-y-8">
            {Object.entries(unidadesAgrupadas).map(([bloco, unidadesBloco]) => (
              <div key={bloco} className="animate-in fade-in duration-500">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Building className="w-6 h-6 text-blue-600" />
                  Bloco {bloco}
                  <Badge variant="secondary" className="ml-2">
                    {unidadesBloco.length} unidades
                  </Badge>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {unidadesBloco.map((unidade) => (
                    <Card
                      key={unidade.id}
                      className={`transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer border-2 ${STATUS_BG_COLORS[unidade.disponibilidade as keyof typeof STATUS_BG_COLORS]}`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg font-bold">{unidade.unidade}</CardTitle>
                          <Badge className={`${STATUS_COLORS[unidade.disponibilidade as keyof typeof STATUS_COLORS]} text-xs`}>
                            {unidade.disponibilidade}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Home className="w-4 h-4" />
                          {unidade.andar === 0 ? 'Térreo' : `${unidade.andar}º Andar`}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Área:</span>
                          <span className="font-medium">{unidade.areaPrivativa}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Tipologia:</span>
                          <span className="font-medium">{unidade.tipologia}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Sol:</span>
                          <span className="flex items-center gap-1">
                            <span className="text-base">{SUN_ICONS[unidade.posicaoSol as keyof typeof SUN_ICONS]}</span>
                            <span className="font-medium">{unidade.posicaoSol}</span>
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Vagas:</span>
                          <span className="font-medium">{unidade.vaga}</span>
                        </div>
                        <div className="border-t pt-3">
                          <div className="text-center">
                            <p className="text-xs text-gray-500 mb-1">Valor de Venda</p>
                            <p className="text-lg font-bold text-blue-600">
                              {unidade.valorVenda}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && unidadesFiltradas.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma unidade encontrada</h3>
            <p className="text-gray-500">Tente ajustar os filtros ou o termo de busca</p>
          </div>
        )}
      </div>
    </div>
  );
}