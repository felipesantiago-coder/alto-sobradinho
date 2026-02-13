import { NextRequest, NextResponse } from 'next/server'

// API que redireciona para a API de simulação principal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { renda, dataNascimento, valorImovel, sistemaAmortizacao, prazoObra } = body

    if (!renda || !dataNascimento || !valorImovel || !sistemaAmortizacao) {
      return NextResponse.json({ error: 'Faltam dados obrigatórios.' }, { status: 400 })
    }

    // Chamar a API de simulação principal
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/simulacao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ renda, dataNascimento, valorImovel, sistemaAmortizacao, prazoObra })
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro ao processar simulação.'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
