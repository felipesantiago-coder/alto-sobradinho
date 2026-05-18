import { NextResponse } from 'next/server';

// Cache simples em memória (válido por 6 horas)
let cachedData: any = null;
let cacheTime = 0;
const CACHE_TTL = 6 * 60 * 60 * 1000;

interface IndiceResult {
  avg180: number;
  avg12: number;
  source: string;
  indicator: string;
}

async function fetchFromBacen(code: number, name: string): Promise<number[]> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 200); // Pega 200 meses para garantir 180
    
    const fmtDate = (d: Date) => d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${code}/dados?formato=json&dataInicial=${fmtDate(startDate)}&dataFinal=${fmtDate(endDate)}`;
    
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    
    const json = await res.json();
    // O Bacen retorna [{data: 'dd/mm/yyyy', valor: '0.45'}, ...]
    // Filtra valores inválidos e converte
    const values = json
      .map((item: any) => parseFloat(item.valor.replace(',', '.')))
      .filter((v: number) => !isNaN(v) && v > 0 && v < 10); // Sanidade: entre 0% e 10%

    return values;
  } catch (e) {
    console.error(`Erro Bacen ${code}:`, e);
    return [];
  }
}

function calculateAverages(values: number[]) {
  if (values.length === 0) return { avg180: 0, avg12: 0 };
  
  const last12 = values.slice(-12);
  const last180 = values.slice(-180);
  
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
  
  const avg12 = last12.length ? sum(last12) / last12.length : 0;
  const avg180 = last180.length ? sum(last180) / last180.length : avg12; // Fallback para 12 se não tiver 180
  
  return { avg12, avg180 };
}

export async function GET() {
  const now = Date.now();
  if (cachedData && now - cacheTime < CACHE_TTL) {
    return NextResponse.json(cachedData);
  }

  // INCC-M (Código SGS 192 é INCC-DI, mas é o mais próximo disponível gratuitamente via API direta sem scraping complexo)
  // Para INCC-M exato da FGV, geralmente requer scraping. Usaremos o Bacen 192 (INCC-DI) que é muito próximo.
  const inccValues = await fetchFromBacen(192, 'INCC-DI');
  const ipcaValues = await fetchFromBacen(433, 'IPCA');

  const inccStats = calculateAverages(inccValues);
  const ipcaStats = calculateAverages(ipcaValues);

  // Validação de segurança para evitar valores absurdos como 175%
  const safeIncc = {
    avg180: inccStats.avg180 > 0 && inccStats.avg180 < 5 ? inccStats.avg180 : 0.45,
    avg12: inccStats.avg12 > 0 && inccStats.avg12 < 5 ? inccStats.avg12 : 0.50,
    source: 'Bacen SGS (Série 192)',
    indicator: 'INCC-DI'
  };

  const safeIpca = {
    avg180: ipcaStats.avg180 > 0 && ipcaStats.avg180 < 5 ? ipcaStats.avg180 : 0.40,
    avg12: ipcaStats.avg12 > 0 && ipcaStats.avg12 < 5 ? ipcaStats.avg12 : 0.38,
    source: 'Bacen SGS (Série 433)',
    indicator: 'IPCA'
  };

  const response = {
    incc: safeIncc,
    ipca: safeIpca,
    lastUpdate: new Date().toLocaleDateString('pt-BR')
  };

  cachedData = response;
  cacheTime = now;

  return NextResponse.json(response);
}
