import { NextResponse } from 'next/server';

// Cache em memória (válido por 6 horas)
let cache: {
  data: any;
  timestamp: number;
} | null = null;

const CACHE_TTL = 6 * 60 * 60 * 1000; 

interface IndexData {
  avg180: number;
  avg12: number;
  source: string;
  indicator: string;
  isFallback: boolean;
}

interface ApiResponse {
  incc: IndexData;
  ipca: IndexData;
}

/**
 * Busca dados de uma série do Bacen SGS com tratamento de erro robusto
 */
async function fetchBacenSeries(code: number, label: string): Promise<number[]> {
  const today = new Date();
  // Busca últimos 240 meses (20 anos) para garantir histórico suficiente
  const startDate = new Date();
  startDate.setFullYear(today.getFullYear() - 20);

  const formatDate = (d: Date) => d.toLocaleDateString('pt-BR');
  
  // URL da API do Banco Central
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${code}/dados?formato=json&dataInicial=${formatDate(startDate)}&dataFinal=${formatDate(today)}`;

  try {
    // Timeout manual de 5 segundos para não travar a serverless function
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url, { 
      headers: { 
        'User-Agent': 'Mozilla/5.0 (AltoSobradinho-Simulator)',
        'Accept': 'application/json'
      },
      signal: controller.signal,
      cache: 'no-store' 
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      throw new Error(`Bacen HTTP ${res.status} para ${label}`);
    }
    
    const json = await res.json();
    
    if (!Array.isArray(json) || json.length === 0) {
      return [];
    }

    // Filtra e converte valores
    const values = json
      .filter((item: any) => item.valor && item.valor.trim() !== '')
      .map((item: any) => {
        // O Bacen retorna vírgula como decimal as vezes, dependendo da série, mas geralmente ponto.
        // Vamos garantir a troca segura.
        const valStr = item.valor.replace(',', '.');
        return parseFloat(valStr);
      })
      .filter(v => !isNaN(v));

    return values;
  } catch (error) {
    console.error(`Erro ao buscar ${label} (${code}) no Bacen:`, error);
    return [];
  }
}

/**
 * Calcula a média aritmética dos últimos N meses
 */
function calculateAverage(values: number[], count: number): number {
  if (values.length === 0) return 0;
  
  // O Bacen retorna do mais antigo para o mais recente. Pegamos os últimos 'count'.
  const subset = values.slice(-count);
  if (subset.length === 0) return 0;

  const sum = subset.reduce((acc, val) => acc + val, 0);
  const avg = sum / subset.length;
  
  return Math.round(avg * 10000) / 10000;
}

export async function GET() {
  // Verifica cache
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    // --- BUSCA IPCA (Série 433) ---
    const ipcaValues = await fetchBacenSeries(433, 'IPCA');
    const ipcaAvg12 = calculateAverage(ipcaValues, 12);
    const ipcaAvg180 = calculateAverage(ipcaValues, 180);

    // --- BUSCA INCC ---
    // Estratégia: O Bacen NÃO tem INCC-M (FGV) nativo na API pública fácil.
    // Usaremos o INCC-DI (Série 4390) que é divulgado pelo Bacen e é muito próximo.
    // Série 189 no Bacen muitas vezes falha ou é intermitente. Vamos forçar a 4390 (INCC-DI).
    let inccValues = await fetchBacenSeries(4390, 'INCC-DI');
    let inccSourceLabel = 'Bacen SGS (INCC-DI)';
    let inccIndicator = 'INCC-DI';

    // Se falhar o DI, tenta a série 189 (INCC-M) como último recurso oficial
    if (inccValues.length === 0) {
      console.warn('INCC-DI falhou, tentando INCC-M (189)...');
      inccValues = await fetchBacenSeries(189, 'INCC-M');
      if (inccValues.length > 0) {
        inccSourceLabel = 'Bacen SGS (INCC-M)';
        inccIndicator = 'INCC-M';
      }
    }

    const inccAvg12 = calculateAverage(inccValues, 12);
    const inccAvg180 = calculateAverage(inccValues, 180);

    // --- VALIDAÇÃO DE SANIDADE ---
    // Se os valores forem 0 ou absurdos (> 5% a.m.), consideramos falha na obtenção de dados reais
    const isValid = (v: number) => v > 0.05 && v < 5.0;

    let finalInccAvg12 = isValid(inccAvg12) ? inccAvg12 : 0;
    let finalInccAvg180 = isValid(inccAvg180) ? inccAvg180 : 0;
    let finalIpcaAvg12 = isValid(ipcaAvg12) ? ipcaAvg12 : 0;
    let finalIpcaAvg180 = isValid(ipcaAvg180) ? ipcaAvg180 : 0;

    let inccIsFallback = finalInccAvg12 === 0;
    let ipcaIsFallback = finalIpcaAvg12 === 0;

    // --- FALLBACK DE SEGURANÇA (APENAS SE REALMENTE FALHAR) ---
    if (inccIsFallback) {
      console.warn('Dados INCC reais indisponíveis, usando fallback histórico seguro.');
      finalInccAvg12 = 0.4600; 
      finalInccAvg180 = 0.4800;
      inccSourceLabel = 'Média Histórica Estimada (Fallback)';
    }

    if (ipcaIsFallback) {
      console.warn('Dados IPCA reais indisponíveis, usando fallback histórico seguro.');
      finalIpcaAvg12 = 0.3800;
      finalIpcaAvg180 = 0.4200;
      inccSourceLabel = 'Média Histórica Estimada (Fallback)';
    }

    const response: ApiResponse = {
      incc: {
        avg180: finalInccAvg180,
        avg12: finalInccAvg12,
        source: inccSourceLabel,
        indicator: inccIndicator,
        isFallback: inccIsFallback
      },
      ipca: {
        avg180: finalIpcaAvg180,
        avg12: finalIpcaAvg12,
        source: ipcaIsFallback ? 'Média Histórica Estimada (Fallback)' : 'Bacen SGS (IPCA)',
        indicator: 'IPCA',
        isFallback: ipcaIsFallback
      }
    };

    // Atualiza cache
    cache = { data: response, timestamp: Date.now() };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erro crítico na API de índices:', error);
    
    // Retorna fallback em caso de erro geral de execução
    return NextResponse.json({
      incc: { avg180: 0.4800, avg12: 0.4600, source: 'Erro de Sistema - Fallback', indicator: 'INCC', isFallback: true },
      ipca: { avg180: 0.4200, avg12: 0.3800, source: 'Erro de Sistema - Fallback', indicator: 'IPCA', isFallback: true }
    });
  }
}
