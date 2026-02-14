import { NextRequest, NextResponse } from 'next/server'

// =============================================================================
// SIMULADOR CAIXA - CÁLCULOS CORRIGIDOS BASEADOS NO PDF OFICIAL
// =============================================================================

const TAXA_JUROS_NOMINAL_ANUAL = 0.109259
const TAXA_JUROS_MENSAL = TAXA_JUROS_NOMINAL_ANUAL / 12
const TAXA_JUROS_EFETIVA_ANUAL = Math.pow(1 + TAXA_JUROS_MENSAL, 12) - 1

// Taxa base MIP mensal (derivada do PDF oficial)
const TAXA_MIP_BASE_MENSAL = 0.000116

// Taxa DFI mensal (correta - validada com PDF)
const TAXA_DFI_MENSAL = 0.000066

// Taxa operacional mensal (do PDF oficial)
const TAXA_OPERACIONAL_MENSAL = 25.00

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

// =============================================================================
// REGRA DO PRAZO MÁXIMO - Descoberta em simulações oficiais Caixa (13/02/2026)
// =============================================================================
// REGRA: IDADE_EM_MESES_COMPLETOS + PRAZO_AMORTIZAÇÃO = 929 meses
//
// Prova (com data de simulação 13/02/2026):
// - Sim 1: 798 + 131 = 929 ✓ (nasc. 31/07/1959, idade: 66 anos 6 meses)
// - Sim 2: 774 + 155 = 929 ✓ (nasc. 31/07/1961, idade: 64 anos 6 meses)
// - Sim 3: 738 + 191 = 929 ✓ (nasc. 31/07/1964, idade: 61 anos 6 meses)
// - Sim 4: 702 + 227 = 929 ✓ (nasc. 31/07/1967, idade: 58 anos 6 meses)
// - Sim 5: 630 + 299 = 929 ✓ (nasc. 31/07/1973, idade: 52 anos 6 meses)
//
// Isso equivale a uma IDADE MÁXIMA no final da amortização de:
// 929 / 12 = 77.42 anos = 77 anos e 5 meses
// =============================================================================
const LIMITE_IDADE_PRAZO_MESES = 929

// =============================================================================
// TABELA MIP - 100% FIDELIDADE com Simulações Oficiais Caixa (13/02/2026)
// =============================================================================
// MIP = SALDO_DEVEDOR × TAXA_BASE × FATOR_IDADE
// TAXA_BASE = 0.000116 (0.0116% a.m.)
//
// Fatores MIP calculados das simulações oficiais:
// Fator = MIP / (Valor_Financiado × 0.000116)
//
// DADOS OFICIAIS (Idade no INÍCIO da amortização = idade atual + prazo_obra/12):
//
// | Nasc.       | Idade Atual | Início Amort. | MIP R$    | Fator   |
// |-------------|-------------|---------------|-----------|---------|
// | 31/07/1973  | 52.5 anos   | 55.5 → 55     | 270.40    | 5.83    |
// | 31/07/1967  | 58.5 anos   | 61.5 → 61     | 613.20    | 13.22   |
// | 31/07/1964  | 61.5 anos   | 64.5 → 64     | 1092.40   | 23.54   |
// | 31/07/1961  | 64.5 anos   | 67.5 → 67     | 1092.40   | 23.54   |
// | 31/07/1959  | 66.5 anos   | 69.5 → 69     | 1303.60   | 28.09   |
//
// OBSERVAÇÃO CRÍTICA: Idades 64 e 67 têm o MESMO fator (23.54)
// Isso confirma que a Caixa usa TABELA DE FAIXAS (degraus), não fórmula contínua
// =============================================================================

/**
 * Tabela MIP Oficial Caixa - cada entrada: [idade_máxima_da_faixa, fator]
 * O fator é aplicado para idades <= idade_máxima_da_faixa
 */
const TABELA_MIP_OFICIAL: [number, number][] = [
  // Faixas jovens (inferidas da tendência exponencial)
  [18, 0.40],   // 18-25 anos
  [25, 0.50],   // 25-30 anos
  [30, 0.65],   // 30-35 anos
  [35, 0.85],   // 35-40 anos
  
  // Faixas calibradas com 9 simulações oficiais de 13/02/2026 (100% fidelidade)
  // Idade início amort = idade atual + 3 anos (prazo obra padrão)
  //
  // | Nasc.       | Idade Atual | Início Amort | Floor | MIP R$   | Fator |
  // |-------------|-------------|--------------|-------|----------|-------|
  // | 31/07/1986  | 39.5 anos   | 42.5         | 42    | 61.60    | 1.33  |
  // | 31/07/1983  | 42.5 anos   | 45.5         | 45    | 100.80   | 2.17  |
  // | 31/07/1979  | 46.5 anos   | 49.5         | 49    | 154.40   | 3.33  |
  // | 31/07/1976  | 49.5 anos   | 52.5         | 52    | 154.40   | 3.33  | ← MESMO!
  // | 31/07/1973  | 52.5 anos   | 55.5         | 55    | 270.40   | 5.83  |
  // | 31/07/1967  | 58.5 anos   | 61.5         | 61    | 613.20   | 13.22 |
  // | 31/07/1964  | 61.5 anos   | 64.5         | 64    | 1092.40  | 23.54 |
  // | 31/07/1961  | 64.5 anos   | 67.5         | 67    | 1092.40  | 23.54 | ← MESMO!
  // | 31/07/1959  | 66.5 anos   | 69.5         | 69    | 1303.60  | 28.09 |
  //
  // OBSERVAÇÕES CRÍTICAS:
  // - Idades 49 e 52 têm o MESMO fator (3.33) → faixa de degraus
  // - Idades 64 e 67 têm o MESMO fator (23.54) → faixa de degraus
  // - A Caixa usa TABELA DE FAIXAS, não fórmula contínua
  
  [42, 1.33],   // 36-42 anos → fator 1.33
  [45, 2.17],   // 43-45 anos → fator 2.17
  [52, 3.33],   // 46-52 anos → fator 3.33 (idades 49 e 52 têm MESMO fator!)
  [56, 5.83],   // 53-56 anos → fator 5.83
  [61, 13.22],  // 57-61 anos → fator 13.22
  [67, 23.54],  // 62-67 anos → fator 23.54 (idades 64 e 67 têm MESMO fator!)
  [71, 28.09],  // 68-71 anos → fator 28.09
  
  // Faixas superiores (extrapolação conservadora)
  [75, 35.00],  // 72-75 anos
  [80, 45.00],  // 76-80 anos
  [200, 55.00], // Máximo absoluto
]

/**
 * Calcula o fator MIP usando tabela oficial Caixa
 * 
 * @param idade - Idade do proponente em anos (pode ser decimal)
 * @returns Fator multiplicador da taxa base MIP (0.0116% a.m.)
 */
function obterFatorMIP(idade: number): number {
  // Usar idade inteira (floor) para consulta à tabela
  // Prática padrão: seguro é calculado com base na idade atingida
  const idadeAnos = Math.floor(idade)
  
  // Buscar na tabela oficial
  for (let i = 0; i < TABELA_MIP_OFICIAL.length; i++) {
    const [idadeLimite, fator] = TABELA_MIP_OFICIAL[i]
    if (idadeAnos <= idadeLimite) {
      return fator
    }
  }
  
  // Fallback para idades muito avançadas
  return 55.0
}

function ajustarParcela(valor: number): number {
  const truncado = Math.floor(valor * 100) / 100
  return truncado - 0.01
}

/**
 * Calcula a idade em MESES COMPLETOS
 * Este é o método usado pela Caixa para a regra de 929 meses
 */
function calcularIdadeEmMeses(dataNasc: string): number {
  const hoje = new Date()
  let nascimento: Date
  
  if (dataNasc.includes('-')) {
    nascimento = new Date(dataNasc + 'T00:00:00')
  } else if (dataNasc.includes('/')) {
    const partes = dataNasc.split('/')
    nascimento = new Date(`${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}T00:00:00`)
  } else {
    nascimento = new Date(dataNasc)
  }
  
  if (isNaN(nascimento.getTime())) {
    return 0
  }
  
  // Cálculo de meses completos (método Caixa)
  let meses = (hoje.getFullYear() - nascimento.getFullYear()) * 12
  meses += hoje.getMonth() - nascimento.getMonth()
  
  // Ajustar se o dia de nascimento ainda não chegou neste mês
  if (hoje.getDate() < nascimento.getDate()) {
    meses--
  }
  
  return meses
}

/**
 * Calcula a idade em anos decimais (usado para MIP)
 */
function calcularIdadeAnos(dataNasc: string): number {
  const hoje = new Date()
  let nascimento: Date
  
  if (dataNasc.includes('-')) {
    nascimento = new Date(dataNasc + 'T00:00:00')
  } else if (dataNasc.includes('/')) {
    const partes = dataNasc.split('/')
    nascimento = new Date(`${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}T00:00:00`)
  } else {
    nascimento = new Date(dataNasc)
  }
  
  if (isNaN(nascimento.getTime())) {
    return 0
  }
  
  const diffMs = hoje.getTime() - nascimento.getTime()
  const msPorAno = 365.25 * 24 * 60 * 60 * 1000
  return diffMs / msPorAno
}

// Manter compatibilidade com código existente
function calcularIdadePrecisa(dataNasc: string): number {
  return calcularIdadeAnos(dataNasc)
}

function calcularPrazoMaximo(
  idadeEmMeses: number, 
  sistema: 'SAC' | 'PRICE'
): number {
  const prazoBase = PARAMETROS[sistema].prazoMaximoAmortizacao
  
  // ==========================================================================
  // REGRA OFICIAL CAIXA (descoberta em simulações de 13/02/2026):
  // ==========================================================================
  // IDADE_EM_MESES_COMPLETOS + PRAZO_AMORTIZAÇÃO = 929 meses
  //
  // Portanto: prazo_amortização = 929 - idade_em_meses
  //
  // A idade é calculada no MOMENTO DA ASSINATURA DO CONTRATO (agora),
  // não inclui o período de obra.
  // ==========================================================================
  
  const prazoPorIdade = LIMITE_IDADE_PRAZO_MESES - idadeEmMeses
  
  // O prazo não pode exceder o prazo base do sistema nem ser menor que o mínimo
  const prazoCalculado = Math.min(prazoBase, prazoPorIdade)
  
  return Math.max(PRAZO_MINIMO_AMORTIZACAO, prazoCalculado)
}

function calcularSeguroMIP(saldoDevedor: number, idade: number): number {
  // Passar idade diretamente - obterFatorMIP já faz o floor internamente
  const fatorIdade = obterFatorMIP(idade)
  return saldoDevedor * TAXA_MIP_BASE_MENSAL * fatorIdade
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

function calcularValorFinanciadoFromPrestacao(prestacao: number, taxaMensal: number, prazoAmortizacao: number): number {
  const n = prazoAmortizacao
  const i = taxaMensal
  if (i === 0) return prestacao * n
  const fator = Math.pow(1 + i, n)
  return prestacao * (fator - 1) / (i * fator)
}

function calcularValorFinanciadoPRICE(
  rendaMensal: number,
  taxaMensal: number,
  prazoAmortizacao: number,
  valorImovel: number,
  idade: number,
  prazoObra: number
) {
  const limiteRenda = PARAMETROS.PRICE.limiteRenda
  const ltvMaximo = PARAMETROS.PRICE.ltvMaximo
  const prestacaoMaxima = rendaMensal * limiteRenda
  const valorFinanciadoMaximoPorLTV = valorImovel * ltvMaximo

  // =========================================================================
  // ANÁLISE DA METODOLOGIA CAIXA (baseada em simulação oficial):
  // =========================================================================
  // 
  // 1. Durante OBRA (36 meses):
  //    - Saldo devedor é liberado gradualmente
  //    - MIP é calculado sobre saldo PARCIAL (menor que total financiado)
  //    - Pagamentos são menores (apenas juros + seguros)
  //    - Restrição de renda (25%) é aplicada AQUI
  //    
  // 2. Durante AMORTIZAÇÃO:
  //    - Saldo devedor = valor total financiado
  //    - MIP é maior (sobre saldo total)
  //    - Pagamento PODE EXCEDER 25% da renda!
  //    - Primeira prestação oficial: R$ 4.854,47 (27% de R$ 18.000)
  //
  // 3. Determinação do valor financiado:
  //    - Não é limitado pela prestação de amortização
  //    - É limitado pelo LTV (80%) e capacidade de pagamento durante OBRA
  //    
  // 4. MIP durante obra (oficial: R$ 280,07):
  //    - Corresponde a um fator ~5.83 (para idade ~55)
  //    - Muito menor que MIP de amortização (~R$ 681,67)
  //
  // CONCLUSÃO: O valor financiado é determinado principalmente pelo LTV,
  // não pela restrição de renda na amortização.
  // =========================================================================

  // Idade no início da amortização (para cálculo do MIP na prestação)
  const idadeNoInicioAmortizacao = idade + (prazoObra / 12)

  // =========================================================================
  // NOVA ABORDAGEM: Calcular valor financiado baseado no LTV máximo
  // e verificar se é viável durante a fase de obra
  // =========================================================================
  
  // Valor financiado inicial: tentar LTV máximo
  let valorFinanciado = valorFinanciadoMaximoPorLTV
  
  // Durante obra, o saldo devedor médio é aproximadamente metade do total
  // Isso é porque o saldo cresce linearmente de 0 até o valor financiado
  const saldoMedioObra = valorFinanciado / 2
  
  // MIP durante obra é calculado sobre o saldo médio (não o total)
  // Usar idade ATUAL para MIP de obra (mais jovem = menor MIP)
  const seguroMIPMedioObra = calcularSeguroMIP(saldoMedioObra, idade)
  const seguroDFI = calcularSeguroDFI(valorImovel)
  
  // Última prestação de obra (a maior) - interesse sobre saldo total
  const jurosUltimaObra = valorFinanciado * taxaMensal
  const prestacaoUltimaObra = jurosUltimaObra + seguroMIPMedioObra * 2 + seguroDFI + TAXA_OPERACIONAL_MENSAL
  
  // Se a última prestação de obra excede o limite de renda, reduzir valor financiado
  const prestacaoMaximaObra = rendaMensal * limiteRenda
  
  if (prestacaoUltimaObra > prestacaoMaximaObra) {
    // Reduzir valor financiado proporcionalmente
    const fatorReducao = prestacaoMaximaObra / prestacaoUltimaObra
    valorFinanciado = valorFinanciado * fatorReducao
  }

  // =========================================================================
  // Agora calcular a prestação de AMORTIZAÇÃO (que pode exceder 25%!)
  // =========================================================================
  
  // Calcular prestação PRICE
  let prestacaoBase = calcularPrestacaoPRICE(valorFinanciado, taxaMensal, prazoAmortizacao)
  
  // MIP na amortização: calculado com idade no início da amortização
  // E sobre o SALDO TOTAL (não médio)
  const seguroMIPAmortizacao = calcularSeguroMIP(valorFinanciado, idadeNoInicioAmortizacao)

  // Prestação total de amortização = base + seguros + taxa
  let prestacaoTotal = prestacaoBase + seguroMIPAmortizacao + seguroDFI + TAXA_OPERACIONAL_MENSAL

  // Ajustar prestação para 1 centavo a menos (prática da Caixa)
  const prestacaoAjustada = ajustarParcela(prestacaoTotal)

  // Recalcular prestação base ajustada
  const prestacaoBaseAjustada = prestacaoAjustada - seguroMIPAmortizacao - seguroDFI - TAXA_OPERACIONAL_MENSAL

  // Recalcular valor financiado com a prestação ajustada
  const valorFinanciadoAjustado = calcularValorFinanciadoFromPrestacao(prestacaoBaseAjustada, taxaMensal, prazoAmortizacao)

  return {
    valorFinanciado: valorFinanciadoAjustado,
    prestacao: prestacaoAjustada,
    prestacaoBase: prestacaoBaseAjustada,
    seguroMIP: seguroMIPAmortizacao,
    seguroDFI,
    taxaOperacional: TAXA_OPERACIONAL_MENSAL
  }
}

function calcularValorFinanciadoSAC(
  rendaMensal: number,
  taxaMensal: number,
  prazoAmortizacao: number,
  valorImovel: number,
  idade: number,
  prazoObra: number
) {
  const limiteRenda = PARAMETROS.SAC.limiteRenda
  const ltvMaximo = PARAMETROS.SAC.ltvMaximo
  const prestacaoMaxima = rendaMensal * limiteRenda
  const valorFinanciadoMaximoPorLTV = valorImovel * ltvMaximo

  // =========================================================================
  // MESMA METODOLOGIA CAIXA: Valor financiado determinado por LTV e obra
  // =========================================================================
  
  // Idade no início da amortização
  const idadeNoInicioAmortizacao = idade + (prazoObra / 12)

  // Valor financiado inicial: tentar LTV máximo
  let valorFinanciado = valorFinanciadoMaximoPorLTV
  
  // Durante obra, o saldo devedor médio é aproximadamente metade do total
  const saldoMedioObra = valorFinanciado / 2
  
  // MIP durante obra (sobre saldo médio, com idade atual)
  const seguroMIPMedioObra = calcularSeguroMIP(saldoMedioObra, idade)
  const seguroDFI = calcularSeguroDFI(valorImovel)
  
  // Última prestação de obra (juros sobre saldo total + seguros)
  const jurosUltimaObra = valorFinanciado * taxaMensal
  const prestacaoUltimaObra = jurosUltimaObra + seguroMIPMedioObra * 2 + seguroDFI + TAXA_OPERACIONAL_MENSAL
  
  // Se excede limite de renda durante obra, reduzir valor financiado
  if (prestacaoUltimaObra > prestacaoMaxima) {
    const fatorReducao = prestacaoMaxima / prestacaoUltimaObra
    valorFinanciado = valorFinanciado * fatorReducao
  }

  // Calcular amortização e juros
  let amortizacaoMensal = valorFinanciado / prazoAmortizacao
  let jurosPrimeira = valorFinanciado * taxaMensal
  
  // MIP na amortização: sobre saldo total, com idade no início da amortização
  let seguroMIP = calcularSeguroMIP(valorFinanciado, idadeNoInicioAmortizacao)

  // Prestação inicial = amortização + juros + seguros + taxa operacional
  let prestacaoInicial = amortizacaoMensal + jurosPrimeira + seguroMIP + seguroDFI + TAXA_OPERACIONAL_MENSAL

  // Ajustar prestação inicial para 1 centavo a menos
  const prestacaoInicialAjustada = ajustarParcela(prestacaoInicial)

  // Recalcular valor financiado com a prestação ajustada
  const prestacaoBaseAjustada = prestacaoInicialAjustada - seguroMIP - seguroDFI - TAXA_OPERACIONAL_MENSAL
  const valorFinanciadoAjustado = prestacaoBaseAjustada / (1 / prazoAmortizacao + taxaMensal)

  // Recalcular valores com valor financiado ajustado
  amortizacaoMensal = valorFinanciadoAjustado / prazoAmortizacao
  jurosPrimeira = valorFinanciadoAjustado * taxaMensal
  seguroMIP = calcularSeguroMIP(valorFinanciadoAjustado, idadeNoInicioAmortizacao)

  // Prestação final (última parcela) - juros sobre última amortização
  const jurosUltima = amortizacaoMensal * taxaMensal
  const prestacaoFinal = amortizacaoMensal + jurosUltima + seguroMIP + seguroDFI + TAXA_OPERACIONAL_MENSAL

  return {
    valorFinanciado: valorFinanciadoAjustado,
    prestacaoInicial: prestacaoInicialAjustada,
    prestacaoFinal: ajustarParcela(prestacaoFinal),
    amortizacao: amortizacaoMensal,
    jurosPrimeira,
    seguroMIP,
    seguroDFI,
    taxaOperacional: TAXA_OPERACIONAL_MENSAL
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { renda, dataNascimento, valorImovel, sistemaAmortizacao, prazoObra } = body

    if (!renda || !dataNascimento || !valorImovel || !sistemaAmortizacao) {
      return NextResponse.json({ error: 'Faltam dados obrigatórios para a simulação.' }, { status: 400 })
    }

    // Função para parsear valores monetários (suporta formato brasileiro e simples)
    const parseValorMonetario = (valor: string | number): number => {
      if (typeof valor === 'number') return valor
      
      const limpo = valor.toString().trim()
      
      // Se não tem vírgula nem ponto, é um número simples
      if (!limpo.includes(',') && !limpo.includes('.')) {
        return parseFloat(limpo)
      }
      
      // Detectar formato brasileiro (ex: 18.000,00)
      // Brasil: usa ponto como separador de milhares e vírgula como decimal
      // Internacional: usa vírgula como separador de milhares e ponto como decimal
      
      const temVirgula = limpo.includes(',')
      const temPonto = limpo.includes('.')
      
      if (temVirgula && temPonto) {
        // Determinar qual é o separador decimal pela posição
        const ultimaVirgula = limpo.lastIndexOf(',')
        const ultimoPonto = limpo.lastIndexOf('.')
        
        if (ultimaVirgula > ultimoPonto) {
          // Formato brasileiro: 1.000,00
          return parseFloat(limpo.replace(/\./g, '').replace(',', '.'))
        } else {
          // Formato internacional: 1,000.00
          return parseFloat(limpo.replace(/,/g, ''))
        }
      } else if (temVirgula) {
        // Só vírgula - pode ser decimal brasileiro (18,00) ou milhar internacional (18,000)
        const partes = limpo.split(',')
        if (partes[1] && partes[1].length <= 2) {
          // Decimal brasileiro: 18,50
          return parseFloat(limpo.replace(',', '.'))
        } else {
          // Separador de milhar internacional: 18,000
          return parseFloat(limpo.replace(',', ''))
        }
      } else {
        // Só ponto - pode ser decimal simples (18.50) ou milhar brasileiro (18.000)
        const partes = limpo.split('.')
        if (partes.length === 2 && partes[1] && partes[1].length <= 2) {
          // Decimal simples: 18.50
          return parseFloat(limpo)
        } else if (partes.length > 2) {
          // Separador de milhar brasileiro: 18.000.000
          return parseFloat(limpo.replace(/\./g, ''))
        } else if (partes[1] && partes[1].length === 3) {
          // Provavelmente separador de milhar: 18.000
          return parseFloat(limpo.replace('.', ''))
        } else {
          // Decimal normal
          return parseFloat(limpo)
        }
      }
    }

    const rendaNum = parseValorMonetario(renda)
    const valorImovelNum = parseValorMonetario(valorImovel)
    const prazoObraNum = prazoObra ? parseInt(prazoObra) : PRAZO_OBRA_PADRAO

    if (isNaN(rendaNum) || isNaN(valorImovelNum)) {
      return NextResponse.json({ error: 'Valores inválidos para renda ou valor do imóvel.' }, { status: 400 })
    }

    // Calcular idade de duas formas:
    // 1. Em anos decimais (para MIP)
    // 2. Em meses completos (para regra de prazo)
    const idadeAnos = calcularIdadePrecisa(dataNascimento)
    const idadeEmMeses = calcularIdadeEmMeses(dataNascimento)
    const idadeAnosInt = Math.floor(idadeAnos)

    if (idadeAnos < 18) {
      return NextResponse.json({ error: 'Idade mínima para financiamento é 18 anos.' }, { status: 400 })
    }

    // ==========================================================================
    // VALIDAÇÃO DE IDADE MÁXIMA (regra de 929 meses)
    // ==========================================================================
    // REGRA: IDADE_EM_MESES_COMPLETOS + PRAZO_AMORTIZAÇÃO ≤ 929
    // Para prazo mínimo de 120 meses: IDADE_EM_MESES ≤ 929 - 120 = 809 meses
    // 809 meses = 67.42 anos ≈ 67 anos e 5 meses
    // ==========================================================================
    const idadeMaximaMeses = LIMITE_IDADE_PRAZO_MESES - PRAZO_MINIMO_AMORTIZACAO
    
    if (idadeEmMeses > idadeMaximaMeses) {
      const idadeMaximaAnos = idadeMaximaMeses / 12
      return NextResponse.json({
        error: `Não é possível financiar. Com a idade informada (${idadeAnosInt} anos), o prazo mínimo de 10 anos ultrapassaria o limite de ${LIMITE_IDADE_PRAZO_MESES} meses (idade + amortização). Idade máxima permitida: ${idadeMaximaAnos.toFixed(1)} anos.`
      }, { status: 400 })
    }

    const sistema = sistemaAmortizacao.toUpperCase().includes('SAC') ? 'SAC' : 'PRICE'
    const parametros = PARAMETROS[sistema]
    const prazoMaximoAmortizacao = calcularPrazoMaximo(idadeEmMeses, sistema)

    if (prazoMaximoAmortizacao < PRAZO_MINIMO_AMORTIZACAO) {
      return NextResponse.json({
        error: `Não é possível financiar. Prazo mínimo permitido é de 10 anos. Com a idade informada, o prazo máximo disponível é inferior ao mínimo exigido.`
      }, { status: 400 })
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
      taxaOperacional: number
      prestacaoBase: number
    }

    if (sistema === 'SAC') {
      const calculoSAC = calcularValorFinanciadoSAC(rendaNum, TAXA_JUROS_MENSAL, prazoMaximoAmortizacao, valorImovelNum, idadeAnos, prazoObraNum)
      resultado = {
        valorFinanciado: calculoSAC.valorFinanciado,
        valorEntrada: valorImovelNum - calculoSAC.valorFinanciado,
        prestacaoInicial: calculoSAC.prestacaoInicial,
        prestacaoFinal: calculoSAC.prestacaoFinal,
        amortizacao: calculoSAC.amortizacao,
        juros: calculoSAC.jurosPrimeira,
        seguroMIP: calculoSAC.seguroMIP,
        seguroDFI: calculoSAC.seguroDFI,
        taxaOperacional: calculoSAC.taxaOperacional,
        prestacaoBase: calculoSAC.amortizacao + calculoSAC.jurosPrimeira
      }
    } else {
      const calculoPRICE = calcularValorFinanciadoPRICE(rendaNum, TAXA_JUROS_MENSAL, prazoMaximoAmortizacao, valorImovelNum, idadeAnos, prazoObraNum)
      resultado = {
        valorFinanciado: calculoPRICE.valorFinanciado,
        valorEntrada: valorImovelNum - calculoPRICE.valorFinanciado,
        prestacaoInicial: calculoPRICE.prestacao,
        prestacaoFinal: calculoPRICE.prestacao,
        amortizacao: 0,
        juros: calculoPRICE.prestacaoBase,
        seguroMIP: calculoPRICE.seguroMIP,
        seguroDFI: calculoPRICE.seguroDFI,
        taxaOperacional: calculoPRICE.taxaOperacional,
        prestacaoBase: calculoPRICE.prestacaoBase
      }
    }

    if (resultado.valorFinanciado <= 0) {
      return NextResponse.json({ error: 'Não é possível financiar com os valores informados.' }, { status: 400 })
    }

    const percentualComprometimento = (resultado.prestacaoInicial / rendaNum) * 100
    const percentualEntrada = (resultado.valorEntrada / valorImovelNum) * 100
    
    // Fator MIP: usar idade no início da amortização (não idade atual)
    const idadeNoInicioAmortizacao = idadeAnos + (prazoObraNum / 12)
    const fatorMIP = obterFatorMIP(idadeNoInicioAmortizacao)

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
        Prazo_Amortizacao_Meses: prazoMaximoAmortizacao,
        Valor_Imovel: formatCurrency(valorImovelNum),
        Valor_Entrada: formatCurrency(resultado.valorEntrada),
        Percentual_Entrada: `${percentualEntrada.toFixed(1)}%`,
        Valor_Total_Financiado: formatCurrency(resultado.valorFinanciado),
        Primeira_Prestacao: formatCurrency(resultado.prestacaoInicial),
        Ultima_Prestacao: formatCurrency(resultado.prestacaoFinal),
        Prestacao_Base: formatCurrency(resultado.prestacaoBase),
        Amortizacao_Mensal: sistema === 'SAC' ? formatCurrency(resultado.amortizacao) : 'Variável',
        Juros_Primeira_Parcela: formatCurrency(resultado.juros),
        Seguro_MIP: formatCurrency(resultado.seguroMIP),
        Seguro_DFI: formatCurrency(resultado.seguroDFI),
        Taxa_Operacional: formatCurrency(resultado.taxaOperacional),
        Taxa_Juros_Nominal: `${(TAXA_JUROS_NOMINAL_ANUAL * 100).toFixed(4)}% a.a.`,
        Taxa_Juros_Efetivos: `${(TAXA_JUROS_EFETIVA_ANUAL * 100).toFixed(2)}% a.a.`,
        Percentual_Renda: `${percentualComprometimento.toFixed(2)}%`,
        Idade_Calculada: `${idadeAnosInt} anos`,
        Fator_MIP: fatorMIP.toFixed(1),
        LTV_Maximo: `${(parametros.ltvMaximo * 100).toFixed(0)}%`,
        Limite_Renda: `${(parametros.limiteRenda * 100).toFixed(0)}%`,
        Fonte: 'Simulador calibrado com simulações oficiais Caixa (13/02/2026)'
      }
    })
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro ao processar simulação.'
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
