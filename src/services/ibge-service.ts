// src/services/ibge-service.ts

interface IBGEData {
  data: string;
  value: number;
}

export async function fetchIBGEIndex(code: number): Promise<IBGEData[]> {
  // Busca os últimos 180 períodos (15 anos) diretamente da API SIDRA
  const url = `https://apisidra.ibge.gov.br/values/t/${code}/n/all/v/all/p/last%20180?formato=JSON`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);
    
    const data = await response.json();
    
    // A API retorna um array onde o índice 0 é o cabeçalho e 1+ são os dados
    if (!Array.isArray(data) || data.length < 2) {
      console.warn(`Dados insuficientes para o índice ${code}`);
      return [];
    }

    // Mapeia para o formato padrão { data, value }
    // Ordena por data crescente para garantir consistência
    return data.slice(1).map((item: any) => ({
      data: item.D2C || item.MC, // Data ou Mês de coleta
      value: parseFloat(item.V.replace(',', '.')) || 0
    })).sort((a: IBGEData, b: IBGEData) => 
      new Date(a.data).getTime() - new Date(b.data).getTime()
    );

  } catch (error) {
    console.error(`Falha ao buscar índice ${code} do IBGE:`, error);
    // Retorna array vazio para forçar o tratamento de erro na UI, SEM MOCKS
    return []; 
  }
}

export function calculateAnnualizedAverage(data: IBGEData[], months: number): number {
  if (!data || data.length === 0) return 0;
  
  // Pega apenas a quantidade de meses solicitada a partir do final (mais recentes)
  const sliceData = data.slice(-months);
  
  if (sliceData.length === 0) return 0;

  // Calcula a média geométrica para anualizar corretamente
  // Fórmula: ((1 + r1) * (1 + r2) ... )^(12/n) - 1
  let product = 1;
  let count = 0;

  for (const item of sliceData) {
    // Converte taxa mensal percentual para fator (ex: 0.5% -> 1.005)
    const factor = 1 + (item.value / 100);
    product *= factor;
    count++;
  }

  if (count === 0) return 0;

  // Eleva à potência de (12 / meses usados) para anualizar
  const annualFactor = Math.pow(product, 12 / count);
  const annualRate = (annualFactor - 1) * 100;

  return parseFloat(annualRate.toFixed(2));
}

export async function getIBGEIndices() {
  // Códigos oficiais: 189 (INCC-DI), 433 (IPCA)
  const [inccData, ipcaData] = await Promise.all([
    fetchIBGEIndex(189),
    fetchIBGEIndex(433)
  ]);

  return {
    incc: {
      full: inccData,
      avg15y: calculateAnnualizedAverage(inccData, 180), // Média 15 anos
      avg12m: calculateAnnualizedAverage(inccData, 12),  // Média 12 meses
    },
    ipca: {
      full: ipcaData,
      avg15y: calculateAnnualizedAverage(ipcaData, 180),
      avg12m: calculateAnnualizedAverage(ipcaData, 12),
    }
  };
}
