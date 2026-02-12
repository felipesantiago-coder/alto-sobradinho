import { NextResponse } from 'next/server';
import { getEmpreendimentos } from '@/data/static-data';

export async function GET() {
  try {
    const empreendimentos = getEmpreendimentos();
    return NextResponse.json(empreendimentos);
  } catch (error) {
    console.error('Erro ao buscar empreendimentos:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar empreendimentos' },
      { status: 500 }
    );
  }
}