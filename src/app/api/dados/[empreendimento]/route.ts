import { NextRequest, NextResponse } from 'next/server';
import { ALTO_DA_ALVORADA, ALTO_DO_HORIZONTE } from '@/data/static-data';

export async function GET(request: NextRequest, { params }: { params: Promise<{ empreendimento: string }> }) {
  const { empreendimento } = await params;

  try {
    switch (empreendimento) {
      case 'alvorada':
        return NextResponse.json(ALTO_DA_ALVORADA);
      case 'horizonte':
        return NextResponse.json(ALTO_DO_HORIZONTE);
      default:
        return NextResponse.json({ error: 'Empreendimento não encontrado' }, { status: 404 });
    }
  } catch (error) {
    console.error('Erro ao carregar dados do empreendimento:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}