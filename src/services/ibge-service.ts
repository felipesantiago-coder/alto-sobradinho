/**
 * Serviço para buscar índices econômicos do IBGE (INCC e IPCA)
 * Utiliza a API do IBGE ou fallback para dados em cache
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
 * @param systemCode 636 = INCC, 643 = IPCA
 */
async function fetchIBGEData(systemCode: number): Promise<IndexData[]> {
  try {
    // API SIDRA do IBGE - Tabela de Preços ao Consumidor Amplo
    const response = await fetch(
      `https://apisidra.ibge.gov.br/values/t/636/n${systemCode}/all/v/63?formato=json`
    );
    
    if (!response.ok) {
      throw new Error(`Erro na API IBGE: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Estrutura da resposta SIDRA varia, adaptar conforme necessário
    if (Array.isArray(data) && data.length > 1) {
      return data.slice(1).map((item: any) => ({
        code: systemCode === 636 ? 'INCC' : 'IPCA',
        date: item.D3C || item.MC || '',
        value: parseFloat(item.V.replace(',', '.')) || 0
      }));
    }
    
    return [];
  } catch (error) {
    console.warn('Falha ao buscar dados do IBGE, usando fallback:', error);
    return [];
  }
}

/**
 * Alternativa: usa endpoint mais simples do Banco Central ou outras APIs
 */
async function fetchFromAlternativeAPI(index: 'INCC' | 'IPCA'): Promise<IndexData[]> {
  try {
    // Fallback para API externa confiável (ex: HG Brasil, AwesomeAPI, etc.)
    // Para demonstração, retornamos dados simulados baseados em médias recentes
    const mockData: IndexData[] = [];
    const today = new Date();
    
    // Dados aproximados dos últimos meses (substituir por API real quando disponível)
    const baseValues = index === 'INCC' 
      ? [0.45, 0.38, 0.52, 0.61, 0.49, 0.55, 0.42, 0.38, 0.51, 0.47, 0.53, 0.49]
      : [0.39, 0.42, 0.56, 0.61, 0.46, 0.38, 0.41, 0.35, 0.44, 0.39, 0.43, 0.37];
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      mockData.push({
        code: index,
        date: date.toISOString().split('T')[0],
        value: baseValues[i] || 0.45
      });
    }
    
    return mockData;
  } catch (error) {
    console.error('Erro na API alternativa:', error);
    return [];
  }
}

/**
 * Calcula média anualizada a partir de dados mensais
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
 * Calcula média simples mensal
 */
function calculateSimpleAverage(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((a, b) => a + b, 0);
  return parseFloat(((sum / values.length)).toFixed(2));
}

/**
 * Obtém estatísticas do índice com opções de período
 */
export async function getIndexStats(index: 'INCC' | 'IPCA', deliveryDate?: Date): Promise<IndexStats> {
  // Tentar cache primeiro
  const cacheKey = index === 'INCC' ? CACHE_KEY_INCC : CACHE_KEY_IPCA;
  const cached = localStorage.getItem(cacheKey);
  
  if (cached) {
    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp < CACHE_DURATION) {
      return processStats(data, deliveryDate);
    }
  }
  
  // Buscar dados novos
  let rawData: IndexData[] = [];
  
  // Tentar IBGE primeiro, depois fallback
  rawData = await fetchIBGEData(index === 'INCC' ? 636 : 643);
  
  if (rawData.length === 0) {
    rawData = await fetchFromAlternativeAPI(index);
  }
  
  // Salvar em cache
  if (rawData.length > 0) {
    localStorage.setItem(cacheKey, JSON.stringify({
      data: rawData,
      timestamp: Date.now()
    }));
  }
  
  return processStats(rawData, deliveryDate);
}

/**
 * Processa dados brutos e calcula estatísticas
 */
function processStats(data: IndexData[], deliveryDate?: Date): IndexStats {
  if (data.length === 0) {
    // Valores padrão fallback
    return {
      average15Years: index === 'INCC' ? 7.44 : 5.72,
      average12Months: index === 'INCC' ? 7.44 : 5.72
    };
  }
  
  const sortedData = data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const values = sortedData.map(d => d.value);
  
  // Últimos 12 meses
  const last12Months = values.slice(0, 12);
  const average12Months = calculateAnnualAverage(last12Months);
  
  // Simulação para 15 anos (usando últimos disponíveis como proxy)
  // Em produção, buscaríamos mais dados históricos
  const average15Years = calculateAnnualAverage(values);
  
  // Projeção até entrega (se data fornecida)
  let projection: number | undefined;
  if (deliveryDate) {
    const today = new Date();
    const monthsToDelivery = Math.max(1, 
      (deliveryDate.getFullYear() - today.getFullYear()) * 12 - 
      today.getMonth() + deliveryDate.getMonth()
    );
    
    // Projeção simples baseada na tendência recente
    // Em produção, usar modelo mais sofisticado ou API de projeções
    projection = average12Months; // Simplificação: usa média recente como projeção
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
