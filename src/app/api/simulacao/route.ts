import { NextRequest, NextResponse } from 'next/server'

// =============================================================================
// SIMULADOR CAIXA - CÁLCULOS BASEADOS NOS PDFS OFICIAIS
// =============================================================================

const TAXA_JUROS_NOMINAL_ANUAL = 0.109259
const TAXA_JUROS_MENSAL = TAXA_JUROS_NOMINAL_ANUAL / 12
const TAXA_JUROS_EFETIVA_ANUAL = Math.pow(1 + TAXA_JUROS_MENSAL, 12) - 1

const TAXA_MIP_MENSAL = 0.000116
const TAXA_DFI_MENSAL = 0.000066

const PARAMETROS = {
  SAC: {
    ltvMaximo: 0.90,
    limiteRenda: 0.30,
    prazoMaximoAmortizacao: 420,
  },
  PRICE: {
    ltvMaximo: 0.80,
    limiteRenda: 0.25,
    prazoMaximoAmortizacao: 360,
  }
}

const PRAZO_OBRA_PADRAO = 36
const PRAZO_MINIMO_AMORTIZACAO = 120 // 10 anos em meses
const IDADE_MAXIMA = 67.54
const IDADE_MINIMA_REDUCAO = 45

// Função para ajustar valor para 1 centavo a menos (truncar e subtrair 0.01)
function ajustarParcela(valor: number): number {
  const truncado = Math.floor(valor * 100) / 100
  return truncado - 0.01
}

function calcularIdadePrecisa(dataNasc: string): number {
  const hoje = new Date()
  const nascimento = new Date(dataNasc)
  let anos = hoje.getFullYear() - nascimento.getFullYear()
  let meses = hoje.getMonth() - nascimento.getMonth()
  const dias = hoje.getDate() - nascimento.getDate()
  if (meses < 0 || (meses === 0 && dias < 0)) {
    anos--
    meses += 12
  }
  return anos + (meses / 12)
}

function calcularPrazoMaximo(idade: number, sistema: 'SAC' | 'PRICE'): number {
  const prazoBase = PARAMETROS[sistema].prazoMaximoAmortizacao
  if (idade < IDADE_MINIMA_REDUCAO) return prazoBase
  const faixaReducao = IDADE_MAXIMA - IDADE_MINIMA_REDUCAO
  const fatorReducao = (idade - IDADE_MINIMA_REDUCAO) / faixaReducao
  return Math.max(PRAZO_MINIMO_AMORTIZACAO, Math.floor(prazoBase * (1 - fatorReducao)))
}

function calcularSeguroMIP(saldoDevedor: number, idade: number): number {
  let fatorIdade = 1
  if (idade > 35) fatorIdade = 1.2
  if (idade > 40) fatorIdade = 1.5
  if (idade > 45) fatorIdade = 2.0
  if (idade > 50) fatorIdade = 2.5
  if (idade > 55) fatorIdade = 3.0
  if (idade > 60) fatorIdade = 4.0
  if (idade > 65) fatorIdade = 5.0
  if (idade > 70) fatorIdade = 6.0
  return saldoDevedor * TAXA_MIP_MENSAL * fatorIdade
}

function calcularSeguroDFI(valorImovel: number): number {
  return valorImovel * TAXA_DFI_MENSAL
}

function calcularPrestacaoPRICE(valorFinanciado: number, taxaMensal: number, prazoAmortizacao: number): number {
  const n = prazoAmortizacao
  const i = taxaMensal
  if (i === 0) return valorFinanciado / n
  const fator = Math.pow(1 + i, n)
  return valorFinanciado * (i * fator) / (fator - 1)
}

// Calcular valor financiado a partir da prestação (inverso da fórmula PRICE)
function calcularValorFinanciadoFromPrestacao(prestacao: number, taxaMensal: number, prazoAmortizacao: number): number {
  const n = prazoAmortizacao
  const i = taxaMensal
  if (i === 0) return prestacao * n
  const fator = Math.pow(1 + i, n)
  return prestacao * (fator - 1) / (i * fator)
}

function calcularValorFinanciadoPRICE(rendaMensal: number, taxaMensal: number, prazoAmortizacao: number, valorImovel: number, idade: number) {
  const limiteRenda = PARAMETROS.PRICE.limiteRenda
  const ltvMaximo = PARAMETROS.PRICE.ltvMaximo
  const prestacaoMaxima = rendaMensal * limiteRenda
  const valorFinanciadoMaximoPorLTV = valorImovel * ltvMaximo

  let valorFinanciado = Math.min(valorFinanciadoMaximoPorLTV, prestacaoMaxima / 0.01)
  let iteracao = 0
  let diferenca = 1

  while (iteracao < 20 && diferenca > 0.01) {
    const seguroMIP = calcularSeguroMIP(valorFinanciado, idade)
    const seguroDFI = calcularSeguroDFI(valorImovel)
    const prestacaoBaseMaxima = prestacaoMaxima - seguroMIP - seguroDFI
    const novoValorFinanciado = Math.min(
      valorFinanciadoMaximoPorLTV,
      prestacaoBaseMaxima > 0
        ? prestacaoBaseMaxima * (Math.pow(1 + taxaMensal, prazoAmortizacao) - 1) / (taxaMensal * Math.pow(1 + taxaMensal, prazoAmortizacao))
        : 0
    )
    diferenca = Math.abs(novoValorFinanciado - valorFinanciado)
    valorFinanciado = novoValorFinanciado
    iteracao++
  }

  // Calcular prestação base (PMT)
  let prestacaoBase = calcularPrestacaoPRICE(valorFinanciado, taxaMensal, prazoAmortizacao)
  const seguroMIP = calcularSeguroMIP(valorFinanciado, idade)
  const seguroDFI = calcularSeguroDFI(valorImovel)
  
  // Prestação total calculada
  let prestacaoTotal = prestacaoBase + seguroMIP + seguroDFI
  
  // Ajustar prestação para 1 centavo a menos
  const prestacaoAjustada = ajustarParcela(prestacaoTotal)
  
  // Recalcular prestação base ajustada
  const prestacaoBaseAjustada = prestacaoAjustada - seguroMIP - seguroDFI
  
  // Recalcular valor financiado com a prestação ajustada
  const valorFinanciadoAjustado = calcularValorFinanciadoFromPrestacao(prestacaoBaseAjustada, taxaMensal, prazoAmortizacao)

  return { 
    valorFinanciado: valorFinanciadoAjustado, 
    prestacao: prestacaoAjustada, 
    seguroMIP, 
    seguroDFI 
  }
}

function calcularValorFinanciadoSAC(rendaMensal: number, taxaMensal: number, prazoAmortizacao: number, valorImovel: number, idade: number) {
  const limiteRenda = PARAMETROS.SAC.limiteRenda
  const ltvMaximo = PARAMETROS.SAC.ltvMaximo
  const prestacaoMaxima = rendaMensal * limiteRenda
  const valorFinanciadoMaximoPorLTV = valorImovel * ltvMaximo

  let valorFinanciado = Math.min(valorFinanciadoMaximoPorLTV, prestacaoMaxima / 0.01)
  let iteracao = 0
  let diferenca = 1

  while (iteracao < 20 && diferenca > 0.01) {
    const seguroMIP = calcularSeguroMIP(valorFinanciado, idade)
    const seguroDFI = calcularSeguroDFI(valorImovel)
    const prestacaoBaseMaxima = prestacaoMaxima - seguroMIP - seguroDFI
    const novoValorFinanciado = Math.min(
      valorFinanciadoMaximoPorLTV,
      prestacaoBaseMaxima > 0 ? prestacaoBaseMaxima / (1 / prazoAmortizacao + taxaMensal) : 0
    )
    diferenca = Math.abs(novoValorFinanciado - valorFinanciado)
    valorFinanciado = novoValorFinanciado
    iteracao++
  }

  // Calcular amortização e juros
  let amortizacaoMensal = valorFinanciado / prazoAmortizacao
  let jurosPrimeira = valorFinanciado * taxaMensal
  let seguroMIP = calcularSeguroMIP(valorFinanciado, idade)
  let seguroDFI = calcularSeguroDFI(valorImovel)
  
  // Prestação inicial calculada
  let prestacaoInicial = amortizacaoMensal + jurosPrimeira + seguroMIP + seguroDFI
  
  // Ajustar prestação inicial para 1 centavo a menos
  const prestacaoInicialAjustada = ajustarParcela(prestacaoInicial)
  
  // Recalcular valor financiado com a prestação ajustada
  const prestacaoBaseAjustada = prestacaoInicialAjustada - seguroMIP - seguroDFI
  const valorFinanciadoAjustado = prestacaoBaseAjustada / (1 / prazoAmortizacao + taxaMensal)
  
  // Recalcular valores com valor financiado ajustado
  amortizacaoMensal = valorFinanciadoAjustado / prazoAmortizacao
  jurosPrimeira = valorFinanciadoAjustado * taxaMensal
  seguroMIP = calcularSeguroMIP(valorFinanciadoAjustado, idade)
  
  // Prestação final (última parcela)
  const jurosUltima = amortizacaoMensal * taxaMensal
  const prestacaoFinal = amortizacaoMensal + jurosUltima + seguroMIP + seguroDFI

  return {
    valorFinanciado: valorFinanciadoAjustado,
    prestacaoInicial: prestacaoInicialAjustada,
    prestacaoFinal: ajustarParcela(prestacaoFinal),
    amortizacao: amortizacaoMensal,
    seguroMIP,
    seguroDFI
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { renda, dataNascimento, valorImovel, sistemaAmortizacao, prazoObra } = body

    if (!renda || !dataNascimento || !valorImovel || !sistemaAmortizacao) {
      return NextResponse.json({ error: 'Faltam dados obrigatórios para a simulação.' }, { status: 400 })
    }

    const rendaNum = typeof renda === 'string' ? parseFloat(renda.replace(/[^\d,.-]/g, '').replace(',', '.')) : renda
    const valorImovelNum = typeof valorImovel === 'string' ? parseFloat(valorImovel.replace(/[^\d,.-]/g, '').replace(',', '.')) : valorImovel
    const prazoObraNum = prazoObra ? parseInt(prazoObra) : PRAZO_OBRA_PADRAO

    if (isNaN(rendaNum) || isNaN(valorImovelNum)) {
      return NextResponse.json({ error: 'Valores inválidos para renda ou valor do imóvel.' }, { status: 400 })
    }

    const idade = calcularIdadePrecisa(dataNascimento)
    const idadeAnos = Math.floor(idade)

    if (idade < 18) {
      return NextResponse.json({ error: 'Idade mínima para financiamento é 18 anos.' }, { status: 400 })
    }

    if (idade >= IDADE_MAXIMA) {
      return NextResponse.json({ error: `Não é possível financiar. Idade máxima permitida é ${Math.floor(IDADE_MAXIMA)} anos e ${Math.floor((IDADE_MAXIMA % 1) * 12)} meses.` }, { status: 400 })
    }

    const sistema = sistemaAmortizacao.toUpperCase().includes('SAC') ? 'SAC' : 'PRICE'
    const parametros = PARAMETROS[sistema]
    const prazoMaximoAmortizacao = calcularPrazoMaximo(idade, sistema)
    
    // Verificar se o prazo calculado é menor que o mínimo permitido
    if (prazoMaximoAmortizacao < PRAZO_MINIMO_AMORTIZACAO) {
      return NextResponse.json({ error: `Não é possível financiar. Prazo mínimo permitido é de 10 anos. Com a idade informada, o prazo máximo disponível é inferior ao mínimo exigido.` }, { status: 400 })
    }
    
    const prazoTotal = prazoMaximoAmortizacao + prazoObraNum

    let resultado: { 
      valorFinanciado: number
      valorEntrada: number
      prestacaoInicial: number
      prestacaoFinal: number
      amortizacao: number
      juros: number
      seguroMIP: number
      seguroDFI: number
    }

    if (sistema === 'SAC') {
      const calculoSAC = calcularValorFinanciadoSAC(rendaNum, TAXA_JUROS_MENSAL, prazoMaximoAmortizacao, valorImovelNum, idade)
      resultado = {
        valorFinanciado: calculoSAC.valorFinanciado,
        valorEntrada: valorImovelNum - calculoSAC.valorFinanciado,
        prestacaoInicial: calculoSAC.prestacaoInicial,
        prestacaoFinal: calculoSAC.prestacaoFinal,
        amortizacao: calculoSAC.amortizacao,
        juros: calculoSAC.valorFinanciado * TAXA_JUROS_MENSAL,
        seguroMIP: calculoSAC.seguroMIP,
        seguroDFI: calculoSAC.seguroDFI
      }
    } else {
      const calculoPRICE = calcularValorFinanciadoPRICE(rendaNum, TAXA_JUROS_MENSAL, prazoMaximoAmortizacao, valorImovelNum, idade)
      resultado = {
        valorFinanciado: calculoPRICE.valorFinanciado,
        valorEntrada: valorImovelNum - calculoPRICE.valorFinanciado,
        prestacaoInicial: calculoPRICE.prestacao,
        prestacaoFinal: calculoPRICE.prestacao,
        amortizacao: 0,
        juros: calculoPRICE.prestacao - calculoPRICE.seguroMIP - calculoPRICE.seguroDFI,
        seguroMIP: calculoPRICE.seguroMIP,
        seguroDFI: calculoPRICE.seguroDFI
      }
    }

    if (resultado.valorFinanciado <= 0) {
      return NextResponse.json({ error: 'Não é possível financiar com os valores informados.' }, { status: 400 })
    }

    const percentualComprometimento = (resultado.prestacaoInicial / rendaNum) * 100
    const percentualEntrada = (resultado.valorEntrada / valorImovelNum) * 100

    const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
    const formatarPrazo = (meses: number) => {
      const anos = Math.floor(meses / 12)
      const mesesRestantes = meses % 12
      if (anos > 0) return `${anos} ano${anos > 1 ? 's' : ''}${mesesRestantes > 0 ? ` e ${mesesRestantes} ${mesesRestantes > 1 ? 'meses' : 'mês'}` : ''}`
      return `${mesesRestantes} ${mesesRestantes > 1 ? 'meses' : 'mês'}`
    }

    return NextResponse.json({
      sucesso: true,
      mensagem: 'Simulação concluída com sucesso.',
      dados: {
        Sistema_Amortizacao: `${sistema} TR`,
        Prazo_Amortizacao: formatarPrazo(prazoMaximoAmortizacao),
        Prazo_Obra: formatarPrazo(prazoObraNum),
        Prazo_Total: formatarPrazo(prazoTotal),
        Valor_Imovel: formatCurrency(valorImovelNum),
        Valor_Entrada: formatCurrency(resultado.valorEntrada),
        Percentual_Entrada: `${percentualEntrada.toFixed(1)}%`,
        Valor_Total_Financiado: formatCurrency(resultado.valorFinanciado),
        Primeira_Prestacao: formatCurrency(resultado.prestacaoInicial),
        Ultima_Prestacao: formatCurrency(resultado.prestacaoFinal),
        Amortizacao_Mensal: sistema === 'SAC' ? formatCurrency(resultado.amortizacao) : 'Variável',
        Juros_Primeira_Parcela: formatCurrency(resultado.juros),
        Seguro_MIP: formatCurrency(resultado.seguroMIP),
        Seguro_DFI: formatCurrency(resultado.seguroDFI),
        Taxa_Juros_Nominal: `${(TAXA_JUROS_NOMINAL_ANUAL * 100).toFixed(4)}% a.a.`,
        Taxa_Juros_Efetivos: `${(TAXA_JUROS_EFETIVA_ANUAL * 100).toFixed(2)}% a.a.`,
        Percentual_Renda: `${percentualComprometimento.toFixed(2)}%`,
        Idade_Calculada: `${idadeAnos} anos`,
        LTV_Maximo: `${(parametros.ltvMaximo * 100).toFixed(0)}%`,
        Limite_Renda: `${(parametros.limiteRenda * 100).toFixed(0)}%`,
        Fonte: 'Cálculos baseados nas regras oficiais da Caixa Econômica Federal'
      }
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro ao processar simulação.'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
