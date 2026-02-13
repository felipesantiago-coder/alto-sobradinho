import { NextResponse } from 'next/server'
import { getEmpreendimentos } from '@/data/static-data'

export async function GET() {
  const empreendimentos = getEmpreendimentos().map(emp => ({
    id: String(emp.id),
    nome: emp.nome,
    slug: emp.slug,
    descricao: emp.descricao,
    logo: emp.logo,
    _count: {
      unidades: emp.totalUnidades
    }
  }))

  return NextResponse.json(empreendimentos)
}
