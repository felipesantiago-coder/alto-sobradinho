import { NextResponse } from 'next/server';

// Cache em memória (Server-side)
let cache: {
  data: any;
  timestamp: number;
} | null = null;

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 horas

interface IndiceResult {
  avg180: number;
  avg12: number;
  source: string;
  indicator: string;
}

async function fetchFromBrasilIndicadores(type: 'INCC' | 'IPCA'): Promise<number[] | null> {
  try {
    // Mapeamento simples para URLs (ajuste conforme a disponibilidade real das URLs se mudarem)
    // Nota: A lógica de scraping de HTML é frágil. Se a estrutura mudar, este bloco falhará e irá para o Bacen.
    // Para IPCA, muitas vezes o BrasilIndicadores tem endpoint similar ou usamos o Bacen direto como primary para IPCA.
    // Vamos tentar simular a requisição que funcionaria para INCC-M.
    
    const url = type === 'INCC' 
      ? 'https://brasilindicadores.com.br/incc-m?handler=HistoricoValoresIndicadorPartial'
      : null; // Para IPCA, vamos pular direto para o Bacen que é mais estável para este índice neste contexto

    if (!url) return null;

    const response = await fetch(url, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      cache: 'no-store'
    });

    if (!response.ok) return null;
    const html = await response.text();
    
    // Parser simples de tabela HTML
    const rows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/g);
    if (!rows) return null;

    const values: number[] = [];
    // Pula cabeçalho, processa linhas de anos
    for (let i = 1; i < rows.length; i++) {
      const cells = rows[i].match(/<td[^>]*>(.*?)<\/td>/gis);
      if (cells && cells.length >= 12) {
        for (let j = 0; j < 12; j++) {
          const raw = cells[j].replace(/<[^>]*>/g, '').trim().replace('%', '').replace(',', '.');
          const val = parseFloat(raw);
          if (!isNaN(val)) values.push(val);
        }
      }
    }
    return values.length > 0 ? values : null;
  } catch (e) {
    console.warn(`Falha no scraping ${type}:`, e);
    return null;
  }
}

async function fetchFromBacen(code: number): Promise<number[] | null> {
  try {
    // 192 = INCC-DI, 433 = IPCA
    const today = new Date();
    const tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(today.getFullYear() - 15); // Pegar 15 anos para garantir 180 meses
    
    const formatDate = (d: Date) => d.toLocaleDateString('pt-BR');
    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${code}/dados?formato=json&dataInicial=${formatDate(tenYearsAgo)}&dataFinal=${formatDate(today)}`;

    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    
    if (!Array.isArray(json)) return null;
    
    // Ordenar por data e extrair valores
    return json
      .map((item: any) => ({ date: new Date(item.data + 'T12:00:00'), value: parseFloat(item.valor) }))
      .sort((a: any, b: any) => a.date.getTime() - b.date.getTime())
      .map((item: any) => item.value);
  } catch (e) {
    console.warn(`Falha no Bacen ${code}:`, e);
    return null;
  }
}

function calculateAverages(values: number[]): { avg180: number; avg12: number } {
  if (values.length === 0) return { avg180: 0, avg12: 0 };
  
  const last12 = values.slice(-12);
  const last180 = values.slice(-180);
  
  const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);
  
  return {
    avg12: last12.length ? Number((sum(last12) / last12.length).toFixed(4)) : 0,
    avg180: last180.length ? Number((sum(last180) / last180.length).toFixed(4)) : Number((sum(values) / values.length).toFixed(4))
  };
}

export async function GET() {
  // Verificar Cache
  if (cache && Date.now() - cache.timestamp < CACHE_TTL_MS) {
    return NextResponse.json(cache.data);
  }

  // --- Processar INCC ---
  let inccValues = await fetchFromBrasilIndicadores('INCC'); // Tenta INCC-M
  let inccSource = 'Brasil Indicadores (INCC-M)';
  let inccIndicator = 'INCC-M';
  
  if (!inccValues || inccValues.length < 12) {
    inccValues = await fetchFromBacen(192); // Fallback INCC-DI
    inccSource = 'Bacen SGS (INCC-DI)';
    inccIndicator = 'INCC-DI';
  }

  // --- Processar IPCA ---
  let ipcaValues = await fetchFromBacen(433); // IPCA direto do Bacen
  let ipcaSource = 'Bacen SGS (IPCA)';
  let ipcaIndicator = 'IPCA';

  if (!ipcaValues || ipcaValues.length < 12) {
    // Fallback estático se tudo falhar
    ipcaValues = [0.40, 0.45, 0.38, 0.42, 0.50, 0.41, 0.39, 0.44, 0.48, 0.36, 0.43, 0.40]; 
    ipcaSource = 'Fallback Estático';
  }
  
  if (!inccValues || inccValues.length < 12) {
    inccValues = [0.50, 0.55, 0.48, 0.52, 0.60, 0.51, 0.49, 0.54, 0.58, 0.46, 0.53, 0.50];
    inccSource = 'Fallback Estático';
  }

  const inccStats = calculateAverages(inccValues);
  const ipcaStats = calculateAverages(ipcaValues);

  const result = {
    incc: { ...inccStats, source: inccSource, indicator: inccIndicator },
    ipca: { ...ipcaStats, source: ipcaSource, indicator: ipcaIndicator },
    lastUpdate: new Date().toISOString()
  };

  // Atualizar Cache
  cache = { data: result, timestamp: Date.now() };

  return NextResponse.json(result);
}
