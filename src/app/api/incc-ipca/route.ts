import { NextResponse } from 'next/server';

// Configurações de Cache (6 horas)
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

interface CachedData {
  data: any;
  timestamp: number;
}

// Cache em memória (server-side)
let memoryCache: Record<string, CachedData> = {};

interface MonthlyValue {
  data: string; // "dd/mm/yyyy"
  valor: number; // variação %
}

interface IndexResponse {
  avg180: number;
  avg12: number;
  projection: number;
  lastUpdate: string;
  totalMonths: number;
  values: MonthlyValue[];
  source: string;
  indicator: string;
  fallback?: boolean;
}

// --- FUNÇÕES DE BUSCA INCC ---

async function fetchINCCFromBrasilIndicadores(): Promise<MonthlyValue[] | null> {
  try {
    const response = await fetch('https://brasilindicadores.com.br/incc-m?handler=HistoricoValoresIndicadorPartial', {
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      next: { revalidate: 3600 } // Revalida a cada hora no edge se possível
    });

    if (!response.ok) return null;
    const html = await response.text();

    // Parser simples para extrair da tabela HTML
    // Estrutura esperada: <tr><td>Ano</td><td>Jan</td>...<td>Dez</td><td>Acum</td></tr>
    const rows = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/g);
    if (!rows) return null;

    const values: MonthlyValue[] = [];
    const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

    for (const row of rows) {
      const cells = row.match(/<td[^>]*>(.*?)<\/td>/gis);
      if (!cells || cells.length < 13) continue;

      // A primeira célula é o ano
      const yearCell = cells[0].replace(/<[^>]*>/g, '').trim();
      const year = parseInt(yearCell);
      if (isNaN(year) || year < 1990 || year > new Date().getFullYear() + 1) continue;

      // Células 1 a 12 são os meses
      for (let i = 0; i < 12; i++) {
        const rawValue = cells[i + 1].replace(/<[^>]*>/g, '').trim().replace('%', '').replace(',', '.');
        const val = parseFloat(rawValue);
        
        // Ignora células vazias ou futuras
        if (!isNaN(val)) {
          // Verifica se o mês já passou no ano atual
          const now = new Date();
          if (year === now.getFullYear() && i + 1 > now.getMonth() + 1) continue;

          values.push({
            data: `01/${String(i + 1).padStart(2, '0')}/${year}`,
            valor: val
          });
        }
      }
    }

    // Ordenar cronologicamente
    values.sort((a, b) => new Date(a.data.split('/').reverse().join('-')).getTime() - new Date(b.data.split('/').reverse().join('-')).getTime());
    
    // Filtro de sanidade: apenas a partir de 2011 para garantir volume
    const filtered = values.filter(v => new Date(v.data.split('/').reverse().join('-')).getFullYear() >= 2011);
    
    if (filtered.length < 12) return null;
    return filtered;

  } catch (e) {
    console.error('Erro BrasilIndicadores INCC:', e);
    return null;
  }
}

async function fetchINCCFromBacen(): Promise<MonthlyValue[] | null> {
  try {
    // Série 192: INCC-DI
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 200);

    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.192/dados?formato=json&dataInicial=${startDate.toLocaleDateString('pt-BR').replace(/\//g, '-')}&dataFinal=${endDate.toLocaleDateString('pt-BR').replace(/\//g, '-')}`;
    
    const response = await fetch(url);
    if (!response.ok) return null;
    const json = await response.json();

    if (!Array.isArray(json)) return null;

    return json.map((item: any) => ({
      data: item.data, // já vem dd/mm/yyyy
      valor: parseFloat(item.valor)
    })).sort((a: any, b: any) => new Date(a.data.split('/').reverse().join('-')).getTime() - new Date(b.data.split('/').reverse().join('-')).getTime());

  } catch (e) {
    console.error('Erro Bacen INCC:', e);
    return null;
  }
}

// --- FUNÇÕES DE BUSCA IPCA ---

async function fetchIPCAFromBrasilIndicadores(): Promise<MonthlyValue[] | null> {
  try {
    // URL hipotética baseada no padrão do site, ajustada para IPCA
    // Se o site não tiver endpoint direto similar, usamos o Bacen como primary para IPCA
    // Muitos sites de indicadores tratam IPCA de forma similar. 
    // Vamos tentar o Bacen como fonte primária para IPCA pois é mais estável para este índice.
    return null; 
  } catch (e) {
    return null;
  }
}

async function fetchIPCAFromBacen(): Promise<MonthlyValue[] | null> {
  try {
    // Série 433: IPCA
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 200);

    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados?formato=json&dataInicial=${startDate.toLocaleDateString('pt-BR').replace(/\//g, '-')}&dataFinal=${endDate.toLocaleDateString('pt-BR').replace(/\//g, '-')}`;
    
    const response = await fetch(url);
    if (!response.ok) return null;
    const json = await response.json();

    if (!Array.isArray(json)) return null;

    return json.map((item: any) => ({
      data: item.data,
      valor: parseFloat(item.valor)
    })).sort((a: any, b: any) => new Date(a.data.split('/').reverse().join('-')).getTime() - new Date(b.data.split('/').reverse().join('-')).getTime());

  } catch (e) {
    console.error('Erro Bacen IPCA:', e);
    return null;
  }
}

// --- CÁLCULOS E FALLBACKS ---

function calculateAverages(values: MonthlyValue[]): { avg180: number, avg12: number } {
  if (values.length === 0) return { avg180: 0, avg12: 0 };

  const last12 = values.slice(-12);
  const last180 = values.slice(-180);

  const sum12 = last12.reduce((acc, v) => acc + v.valor, 0);
  const sum180 = last180.reduce((acc, v) => acc + v.valor, 0);

  return {
    avg12: parseFloat((sum12 / last12.length).toFixed(4)),
    avg180: parseFloat((sum180 / last180.length).toFixed(4))
  };
}

function getFallbackINCC(): IndexResponse {
  return {
    avg180: 0.5570,
    avg12: 0.5092,
    projection: 0.5092,
    lastUpdate: new Date().toLocaleDateString('pt-BR'),
    totalMonths: 180,
    values: [],
    source: 'Cache Local (Fallback)',
    indicator: 'INCC-M (Estimado)',
    fallback: true
  };
}

function getFallbackIPCA(): IndexResponse {
  return {
    avg180: 0.4800,
    avg12: 0.4200,
    projection: 0.4200,
    lastUpdate: new Date().toLocaleDateString('pt-BR'),
    totalMonths: 180,
    values: [],
    source: 'Cache Local (Fallback)',
    indicator: 'IPCA (Estimado)',
    fallback: true
  };
}

async function getIndexData(type: 'INCC' | 'IPCA'): Promise<IndexResponse> {
  const cacheKey = type;
  const cached = memoryCache[cacheKey];
  
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data;
  }

  let values: MonthlyValue[] | null = null;
  let source = '';
  let indicator = '';

  if (type === 'INCC') {
    indicator = 'INCC-M';
    // Camada 1: Brasil Indicadores
    values = await fetchINCCFromBrasilIndicadores();
    if (values) source = 'brasilindicadores.com.br';

    // Camada 2: Bacen
    if (!values) {
      values = await fetchINCCFromBacen();
      if (values) {
        source = 'Bacen SGS (Série 192 - INCC-DI)';
        indicator = 'INCC-DI';
      }
    }
  } else {
    indicator = 'IPCA';
    // Para IPCA, Bacen é muito confiável como camada 1
    values = await fetchIPCAFromBacen();
    if (values) source = 'Bacen SGS (Série 433)';
  }

  // Camada 3: Fallback
  if (!values || values.length < 12) {
    const fallback = type === 'INCC' ? getFallbackINCC() : getFallbackIPCA();
    memoryCache[cacheKey] = { data: fallback, timestamp: Date.now() };
    return fallback;
  }

  const { avg12, avg180 } = calculateAverages(values);
  
  const result: IndexResponse = {
    avg180,
    avg12,
    projection: avg12, // Projeção usa a média recente
    lastUpdate: values[values.length - 1].data,
    totalMonths: values.length,
    values,
    source,
    indicator
  };

  memoryCache[cacheKey] = { data: result, timestamp: Date.now() };
  return result;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') as 'INCC' | 'IPCA' | 'ALL';

  try {
    if (type === 'ALL' || !type) {
      const [incc, ipca] = await Promise.all([
        getIndexData('INCC'),
        getIndexData('IPCA')
      ]);
      return NextResponse.json({ incc, ipca });
    } else if (type === 'INCC' || type === 'IPCA') {
      const data = await getIndexData(type);
      return NextResponse.json({ [type.toLowerCase()]: data });
    } else {
      return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 });
    }
  } catch (error) {
    console.error('Erro crítico na API de índices:', error);
    // Retorna fallbacks em caso de erro geral
    return NextResponse.json({
      incc: getFallbackINCC(),
      ipca: getFallbackIPCA()
    });
  }
}
