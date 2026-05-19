import { NextResponse } from 'next/server';

// Cache simples em memória (válido por 6 horas)
let cache: {
  data: any;
  timestamp: number;
} | null = null;

const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 horas

interface IndexData {
  avg180: number;
  avg12: number;
  source: string;
  indicator: string;
  isFallback: boolean;
  lastUpdate?: string;
}

interface ApiResponse {
  incc: IndexData;
  ipca: IndexData;
}

/**
 * Busca dados de uma série do Bacen SGS
 * O Bacen retorna dados cronológicos: [antigo, ..., recente]
 */
async function fetchBacenSeries(code: number, months: number = 200): Promise<number[]> {
  const today = new Date();
  const startDate = new Date();
  startDate.setMonth(today.getMonth() - months);

  const formatDate = (d: Date) => d.toLocaleDateString('pt-BR');
  
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${code}/dados?formato=json&dataInicial=${formatDate(startDate)}&dataFinal=${formatDate(today)}`;

  try {
    const res = await fetch(url, { 
      headers: { 'User-Agent': 'AltoSobradinho-Simulator/1.0' },
      cache: 'no-store' 
    });
    
    if (!res.ok) throw new Error(`Bacen HTTP ${res.status}`);
    
    const json = await res.json();
    
    // O Bacen retorna [{  "dd/mm/yyyy", valor: "0.45" }, ...] ordenado do mais antigo ao mais recente
    const values = json
      .filter((item: any) => item.valor && item.valor.trim() !== '')
      .map((item: any) => parseFloat(item.valor.replace(',', '.')));

    return values;
  } catch (error) {
    console.warn(`Falha ao buscar série ${code} no Bacen:`, error);
    return [];
  }
}

/**
 * Calcula a média aritmética dos últimos N meses
 * CORREÇÃO: Pega os últimos N itens do array (que são os mais recentes)
 */
function calculateSafeAverage(values: number[], count: number): { result: number, isReliable: boolean } {
  if (values.length === 0) return { result: 0, isReliable: false };
  
  // CORREÇÃO CRÍTICA: Pegar os ÚLTIMOS 'count' valores (final do array)
  // Se o array tem 200 itens, slice(-12) pega os índices 188 a 199 (os mais recentes)
  const subset = values.slice(-count);
  
  if (subset.length === 0) return { result: 0, isReliable: false };

  const sum = subset.reduce((acc, val) => acc + val, 0);
  const avg = sum / subset.length;
  
  // Validação de Sanidade:
  // O INCC/IPCA recente raramente fica abaixo de 0.1% a.m. ou acima de 2.0% a.m. de forma sustentada.
  // Se der 0.05%, significa que pegamos o período errado ou dados zerados.
  if (avg < 0.1 || avg > 3.0) {
    console.warn(`Média suspeita detectada (${avg.toFixed(4)}%) para código. Provável erro de período.`);
    return { result: avg, isReliable: false };
  }

  return { 
    result: Math.round(avg * 10000) / 10000, 
    isReliable: true 
  };
}

export async function GET() {
  // Verifica cache
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    // --- BUSCA IPCA (Série 433) ---
    const ipcaValues = await fetchBacenSeries(433);
    const ipcaCalc12 = calculateSafeAverage(ipcaValues, 12);
    const ipcaCalc180 = calculateSafeAverage(ipcaValues, 180);

    // --- BUSCA INCC (Tenta Série 189 INCC-M, fallback 4390 INCC-DI) ---
    let inccValues = await fetchBacenSeries(189); 
    let inccSource = 'Bacen SGS (INCC-M)';
    
    if (inccValues.length === 0) {
      inccValues = await fetchBacenSeries(4390);
      inccSource = 'Bacen SGS (INCC-DI)';
    }

    const inccCalc12 = calculateSafeAverage(inccValues, 12);
    const inccCalc180 = calculateSafeAverage(inccValues, 180);

    // --- LÓGICA DE FALLBACK AUTOMÁTICO ---
    // Se os dados retornados não forem confiáveis (muito baixos), usa hardcoded seguro
    const useInccFallback = !inccCalc12.isReliable || !inccCalc180.isReliable;
    const useIpcaFallback = !ipcaCalc12.isReliable || !ipcaCalc180.isReliable;

    const finalInccAvg12 = useInccFallback ? 0.4800 : inccCalc12.result;
    const finalInccAvg180 = useInccFallback ? 0.5100 : inccCalc180.result;
    
    const finalIpcaAvg12 = useIpcaFallback ? 0.4200 : ipcaCalc12.result;
    const finalIpcaAvg180 = useIpcaFallback ? 0.4500 : ipcaCalc180.result;

    const response: ApiResponse = {
      incc: {
        avg180: finalInccAvg180,
        avg12: finalInccAvg12,
        source: useInccFallback ? 'Estimativa Histórica (Dados oficiais inconsistentes)' : inccSource,
        indicator: 'INCC',
        isFallback: useInccFallback,
        lastUpdate: new Date().toLocaleDateString('pt-BR')
      },
      ipca: {
        avg180: finalIpcaAvg180,
        avg12: finalIpcaAvg12,
        source: useIpcaFallback ? 'Estimativa Histórica (Dados oficiais inconsistentes)' : 'Bacen SGS (IPCA)',
        indicator: 'IPCA',
        isFallback: useIpcaFallback,
        lastUpdate: new Date().toLocaleDateString('pt-BR')
      }
    };

    cache = { data: response, timestamp: Date.now() };
    return NextResponse.json(response);

  } catch (error) {
    console.error('Erro crítico na API de índices:', error);
    
    return NextResponse.json({
      incc: { avg180: 0.5100, avg12: 0.4800, source: 'Erro API - Fallback Seguro', indicator: 'INCC', isFallback: true },
      ipca: { avg180: 0.4500, avg12: 0.4200, source: 'Erro API - Fallback Seguro', indicator: 'IPCA', isFallback: true }
    });
  }
}
