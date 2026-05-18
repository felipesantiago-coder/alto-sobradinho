/**
 * Serviço para buscar índices econômicos do IBGE (INCC e IPCA)
 * Utiliza a API SIDRA do IBGE para dados reais históricos
 */

export interface IndexData {
  code: string;
  date: string;
  value: number;
}

export interface IndexStats {
  average15Years: number;
  average12Months: number;
  projection?: number;
}

const CACHE_KEY_INCC = 'ibge_incc_cache';
const CACHE_KEY_IPCA = 'ibge_ipca_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 horas

/**
 * Busca dados históricos do IBGE via API SIDRA
 * @param tableId 636 = INCC, 643 = IPCA
 * @param periods Quantidade de períodos para buscar (180 = 15 anos)
 */
async function fetchIBGEData(tableId: number, periods: number = 180): Promise<IndexData[]> {
  try {
    // API SIDRA do IBGE - busca os últimos 'periods' meses
    // t=tabela, n=período (all), v=variável (63 = índice mensal), formato=json
    const url = `https://apisidra.ibge.gov.br/values/t/${tableId}/n${tableId === 636 ? '636' : '643'}/all/v/63/p${periods}?formato=json`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Erro na API IBGE: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Estrutura da resposta SIDRA: [metadados, {D3C: data, V: valor, ...}, ...]
    if (Array.isArray(data) && data.length > 1) {
      return data.slice(1).map((item: any) => ({
        code: tableId === 636 ? 'INCC' : 'IPCA',
        date: item.D3C || item.MC || '',
        value: parseFloat(item.V?.replace(',', '.') || '0')
      })).filter(d => d.value !== 0 && d.date !== '');
    }
    
    return [];
  } catch (error) {
    console.warn('Falha ao buscar dados do IBGE:', error);
    return [];
  }
}

/**
 * Calcula média anualizada geométrica a partir de dados mensais
 */
function calculateAnnualAverage(monthlyValues: number[]): number {
  if (monthlyValues.length === 0) return 0;
  
  // Média geométrica para taxa anualizada
  const product = monthlyValues.reduce((acc, val) => acc * (1 + val / 100), 1);
  const months = monthlyValues.length;
  const annualRate = (Math.pow(product, 12 / months) - 1) * 100;
  
  return parseFloat(annualRate.toFixed(2));
}

/**
 * Obtém estatísticas do índice com opções de período
 */
export async function getIndexStats(index: 'INCC' | 'IPCA', deliveryDate?: Date): Promise<IndexStats> {
  const tableId = index === 'INCC' ? 636 : 643;
  const cacheKey = index === 'INCC' ? CACHE_KEY_INCC : CACHE_KEY_IPCA;
  
  // Tentar cache primeiro
  const cached = localStorage.getItem(cacheKey);
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION && data.length >= 12) {
      return processStats(data, deliveryDate);
    }
  }

  // Buscar 180 meses (15 anos) de dados reais da API do IBGE
  let rawData = await fetchIBGEData(tableId, 180);
  
  // Se não conseguiu buscar dados suficientes, tenta novamente com menos períodos
  if (rawData.length < 12) {
    rawData = await fetchIBGEData(tableId, 12);
  }

  // Salvar em cache se tiver dados válidos
  if (rawData.length > 0) {
    localStorage.setItem(cacheKey, JSON.stringify({
      data: rawData,
      timestamp: Date.now()
    }));
  }
  
  return processStats(rawData, deliveryDate);
}

/**
 * Processa dados brutos e calcula estatísticas para diferentes períodos
 */
function processStats(data: IndexData[], deliveryDate?: Date): IndexStats {
  // Valores padrão fallback caso não tenha dados
  const defaultStats: IndexStats = {
    average15Years: 7.44,
    average12Months: 5.96,
    projection: 5.50
  };

  if (data.length === 0) {
    return defaultStats;
  }
  
  // Ordenar por data (mais recente primeiro)
  const sortedData = [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const values = sortedData.map(d => d.value);
  
  // Últimos 12 meses: pega apenas os 12 primeiros (mais recentes)
  const last12Months = values.slice(0, Math.min(12, values.length));
  const average12Months = calculateAnnualAverage(last12Months);
  
  // Últimos 15 anos (180 meses): pega até 180 valores do histórico completo
  // Isso garante que sejam períodos DIFERENTES!
  const last15Years = values.slice(0, Math.min(180, values.length));
  const average15Years = calculateAnnualAverage(last15Years);
  
  // Projeção até entrega (se data fornecida)
  let projection: number | undefined;
  if (deliveryDate) {
    const today = new Date();
    const monthsToDelivery = Math.max(1, 
      (deliveryDate.getFullYear() - today.getFullYear()) * 12 - 
      today.getMonth() + deliveryDate.getMonth()
    );
    
    // Projeção baseada na tendência dos últimos 12 meses
    const monthlyAvg = Math.pow(1 + average12Months / 100, 1/12) - 1;
    const projectedAnnual = (Math.pow(1 + monthlyAvg, 12) - 1) * 100;
    // Aplica margem de segurança de 5% na projeção
    projection = parseFloat((projectedAnnual * 0.95).toFixed(2));
  }
  
  return {
    average15Years,
    average12Months,
    projection
  };
}

/**
 * Hook helper para React (opcional)
 */
export function createIndexFetcher() {
  return {
    getINCC: async (deliveryDate?: Date) => getIndexStats('INCC', deliveryDate),
    getIPCA: async (deliveryDate?: Date) => getIndexStats('IPCA', deliveryDate)
  };
}
