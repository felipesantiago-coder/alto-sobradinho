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
  lastUpdate?: string;
}

interface ApiResponse {
  incc: IndexData;
  ipca: IndexData;
}

/**
 * Busca dados de uma série do Bacen SGS
 * @param code Código da série (433=IPCA, 189=INCC-M, 4390=INCC-DI)
 * @param months Quantidade de meses para trás
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
    
    // O Bacen retorna [{ data: "dd/mm/yyyy", valor: "0.45" }, ...]
    // Filtra valores vazios e converte para float
    const values = json
      .filter((item: any) => item.valor && item.valor.trim() !== '')
      .map((item: any) => parseFloat(item.valor.replace(',', '.'))); // Garante ponto decimal

    return values;
  } catch (error) {
    console.warn(`Falha ao buscar série ${code} no Bacen:`, error);
    return [];
  }
}

/**
 * Calcula a média aritmética dos últimos N meses
 * Valida se os valores estão dentro de uma faixa realista (0% a 5% a.m.)
 */
function calculateSafeAverage(values: number[], count: number): number {
  if (values.length === 0) return 0;
  
  // Pega os últimos 'count' valores disponíveis
  const subset = values.slice(-count);
  if (subset.length === 0) return 0;

  // Validação de sanidade: nenhum valor individual deve ser absurdo (> 10% a.m. é improvável para índices oficiais recentes)
  const hasOutliers = subset.some(v => v < -5 || v > 10);
  if (hasOutliers) {
    console.warn('Dados com outliers detectados, ignorando para cálculo de média.');
    return 0; // Força fallback se houver dados suspeitos
  }

  const sum = subset.reduce((acc, val) => acc + val, 0);
  const avg = sum / subset.length;
  
  // Arredonda para 4 casas decimais
  return Math.round(avg * 10000) / 10000;
}

export async function GET() {
  // Verifica cache
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    // --- BUSCA IPCA (Série 433) ---
    const ipcaValues = await fetchBacenSeries(433);
    const ipcaAvg12 = calculateSafeAverage(ipcaValues, 12);
    const ipcaAvg180 = calculateSafeAverage(ipcaValues, 180);

    // --- BUSCA INCC (Tenta Série 189 INCC-M, fallback 4390 INCC-DI) ---
    let inccValues = await fetchBacenSeries(189); // INCC-M (FGV)
    let inccSource = 'Bacen SGS (INCC-M)';
    
    // Se INCC-M falhar ou vier vazio, tenta INCC-DI
    if (inccValues.length === 0) {
      inccValues = await fetchBacenSeries(4390);
      inccSource = 'Bacen SGS (INCC-DI)';
    }

    const inccAvg12 = calculateSafeAverage(inccValues, 12);
    const inccAvg180 = calculateSafeAverage(inccValues, 180);

    // --- FALLBACK DE SEGURANÇA (Hardcoded) ---
    // Usado se as APIs falharem ou retornarem 0 após validação
    const finalInccAvg12 = inccAvg12 > 0 ? inccAvg12 : 0.4600; // ~5.5% a.a.
    const finalInccAvg180 = inccAvg180 > 0 ? inccAvg180 : 0.4800;
    const finalIpcaAvg12 = ipcaAvg12 > 0 ? ipcaAvg12 : 0.3800; // ~4.6% a.a.
    const finalIpcaAvg180 = ipcaAvg180 > 0 ? ipcaAvg180 : 0.4200;

    const response: ApiResponse = {
      incc: {
        avg180: finalInccAvg180,
        avg12: finalInccAvg12,
        source: inccAvg12 > 0 ? inccSource : 'Fallback Estático (Média Histórica)',
        indicator: 'INCC',
        lastUpdate: new Date().toLocaleDateString('pt-BR')
      },
      ipca: {
        avg180: finalIpcaAvg180,
        avg12: finalIpcaAvg12,
        source: ipcaAvg12 > 0 ? 'Bacen SGS (IPCA)' : 'Fallback Estático (Média Histórica)',
        indicator: 'IPCA',
        lastUpdate: new Date().toLocaleDateString('pt-BR')
      }
    };

    // Atualiza cache
    cache = { data: response, timestamp: Date.now() };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Erro crítico na API de índices:', error);
    
    // Retorna fallback em caso de erro geral
    return NextResponse.json({
      incc: { avg180: 0.4800, avg12: 0.4600, source: 'Erro API - Fallback', indicator: 'INCC' },
      ipca: { avg180: 0.4200, avg12: 0.3800, source: 'Erro API - Fallback', indicator: 'IPCA' }
    });
  }
}
