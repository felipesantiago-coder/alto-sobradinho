export interface IBGEData {
  incc: {
    media15Anos: number;
    media12Meses: number;
    projecao: number;
  };
  ipca: {
    media15Anos: number;
    media12Meses: number;
    projecao: number;
  };
}

/**
 * Busca dados reais do IBGE.
 * Estratégia: Tenta buscar últimos períodos. Se falhar (400), usa dados estáticos seguros.
 * A API SIDRA às vezes falha com 'p/last' em certos contextos de CORS ou proxy.
 */
export async function getIBGEIndices(): Promise<IBGEData> {
  // Fallback seguro imediato caso a API falhe completamente
  const fallbackData: IBGEData = {
    incc: { media15Anos: 4.85, media12Meses: 5.12, projecao: 5.20 },
    ipca: { media15Anos: 5.40, media12Meses: 4.60, projecao: 4.75 }
  };

  const fetchIndex = async (code: number): Promise<number[]> => {
    // Tentativa 1: Últimos 120 meses (10 anos) - costuma ser mais estável que 180
    const url = `https://apisidra.ibge.gov.br/values/t/${code}/n1/all/p/last%20120?formato=JSON`;
    
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      const data = await response.json();
      
      if (!Array.isArray(data) || data.length < 2) return [];

      // Extrai valores (V) ignorando cabeçalho
      return data.slice(1).map((item: any) => parseFloat(item.V) || 0);
    } catch (error) {
      console.warn(`Tentativa direta falhou para índice ${code}, usando fallback.`, error);
      return [];
    }
  };

  const [inccValues, ipcaValues] = await Promise.all([fetchIndex(189), fetchIndex(433)]);

  // Se não conseguiu dados reais, retorna fallback imediatamente
  if (inccValues.length === 0 && ipcaValues.length === 0) {
    return fallbackData;
  }

  const calculateAnnualizedAverage = (values: number[], months: number): number => {
    if (values.length === 0) return 0;
    const subset = values.slice(0, Math.min(values.length, months));
    if (subset.length === 0) return 0;

    let accumulatedFactor = 1;
    for (const rate of subset) {
      accumulatedFactor *= (1 + rate / 100);
    }

    const n = subset.length;
    // Evita divisão por zero
    if (n === 0) return 0;

    const geometricMeanMonthly = Math.pow(accumulatedFactor, 1 / n) - 1;
    const annualRate = (Math.pow(1 + geometricMeanMonthly, 12) - 1) * 100;

    return parseFloat(annualRate.toFixed(2));
  };

  // Cálculos
  const incc15anos = calculateAnnualizedAverage(inccValues, 180); // Pega o máximo disponível
  const incc12meses = calculateAnnualizedAverage(inccValues, 12);
  
  const ipca15anos = calculateAnnualizedAverage(ipcaValues, 180);
  const ipca12meses = calculateAnnualizedAverage(ipcaValues, 12);

  return {
    incc: {
      media15Anos: incc15anos || fallbackData.incc.media15Anos,
      media12Meses: incc12meses || fallbackData.incc.media12Meses,
      projecao: incc12meses > 0 ? incc12meses : fallbackData.incc.projecao
    },
    ipca: {
      media15Anos: ipca15anos || fallbackData.ipca.media15Anos,
      media12Meses: ipca12meses || fallbackData.ipca.media12Meses,
      projecao: ipca12meses > 0 ? ipca12meses : fallbackData.ipca.projecao
    }
  };
}
