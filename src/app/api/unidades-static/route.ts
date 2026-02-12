import { NextRequest, NextResponse } from 'next/server';
import { getUnidadesByEmpreendimento, getFiltrosDisponiveis } from '@/data/static-data';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const empreendimento = searchParams.get('empreendimento');
    const limit = searchParams.get('limit') || '100';
    const page = searchParams.get('page') || '1';
    
    if (!empreendimento) {
      return NextResponse.json(
        { error: 'Parâmetro empreendimento é obrigatório' },
        { status: 400 }
      );
    }

    const unidades = getUnidadesByEmpreendimento(empreendimento);
    const filtros = getFiltrosDisponiveis(empreendimento);

    // Aplicar filtros da query string
    let filteredUnidades = unidades;
    
    const bloco = searchParams.get('bloco');
    const andar = searchParams.get('andar');
    const disponibilidade = searchParams.get('disponibilidade');
    const posicaoSol = searchParams.get('posicaoSol');
    const searchTerm = searchParams.get('search');

    if (bloco && bloco !== 'todos') {
      filteredUnidades = filteredUnidades.filter(u => u.unidade.startsWith(bloco));
    }
    
    if (andar && andar !== 'todos') {
      filteredUnidades = filteredUnidades.filter(u => u.andar === parseInt(andar));
    }
    
    if (disponibilidade && disponibilidade !== 'todos') {
      // Para status "Reservada", incluir todas as variantes
      if (disponibilidade === 'Reservada') {
        filteredUnidades = filteredUnidades.filter(u => u.disponibilidade.includes('Reservada'));
      } else {
        filteredUnidades = filteredUnidades.filter(u => u.disponibilidade === disponibilidade);
      }
    }
    
    if (posicaoSol && posicaoSol !== 'todos') {
      filteredUnidades = filteredUnidades.filter(u => u.posicaoSol === posicaoSol);
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filteredUnidades = filteredUnidades.filter(u => 
        u.unidade.toLowerCase().includes(term) ||
        u.tipologia.toLowerCase().includes(term) ||
        u.valorVenda.toLowerCase().includes(term) ||
        u.areaPrivativa.toLowerCase().includes(term)
      );
    }

    // Paginação
    const limitNum = parseInt(limit);
    const pageNum = parseInt(page);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    
    const paginatedUnidades = filteredUnidades.slice(startIndex, endIndex);

    const response = {
      unidades: paginatedUnidades,
      pagination: {
        total: filteredUnidades.length,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(filteredUnidades.length / limitNum)
      },
      filters: filtros
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Erro ao buscar unidades:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar unidades' },
      { status: 500 }
    );
  }
}
