import { NextRequest, NextResponse } from 'next/server'
import { getUnidadesByEmpreendimento, Unidade } from '@/data/static-data'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const empreendimento = searchParams.get('empreendimento')
  const limit = parseInt(searchParams.get('limit') || '1000')

  if (!empreendimento) {
    return NextResponse.json({ error: 'Empreendimento não especificado' }, { status: 400 })
  }

  // Buscar unidades pelo slug do empreendimento
  const unidadesData = getUnidadesByEmpreendimento(empreendimento)

  if (!unidadesData || unidadesData.length === 0) {
    return NextResponse.json({ error: 'Empreendimento não encontrado' }, { status: 404 })
  }

  // Converter formato para o esperado pela página
  const unidades = unidadesData.slice(0, limit).map((u: Unidade) => ({
    id: String(u.id),
    unidade: u.unidade,
    andar: u.andar,
    areaPrivativa: u.areaPrivativa,
    tipologia: u.tipologia,
    posicaoSol: u.posicaoSol,
    vaga: u.vaga,
    valorAvaliacao: u.valorAvaliacao,
    valorVenda: u.valorVenda,
    disponibilidade: u.disponibilidade,
    empreendimento: {
      nome: empreendimento === 'alto-da-alvorada' ? 'Alto da Alvorada' : 'Alto do Horizonte',
      slug: empreendimento
    }
  }))

  return NextResponse.json(unidades)
}
