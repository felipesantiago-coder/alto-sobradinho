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
  lastUpdate?: string;
}

interface ApiResponse {
  incc: IndexData;
  ipca: IndexData;
}

/**
 * CAMADA 1: Tentativa de extração direta da FGV IBRE (Fonte Oficial do INCC)
 * Usa um user-agent para simular navegador e evitar bloqueios simples.
 */
async function fetchINCCFromFGV(): Promise<number[]> {
  try {
    // URL pública da tabela de índices da FGV
    const response = await fetch('https://portal.fgv.br/sites/portal.fgv.br/files/inline-images/incc-m-variacoes-mensais.txt', {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/plain'
      },
      cache: 'no-store'
    });

    if (!response.ok) throw new Error('FGV indisponível');

    const text = await response.text();
    const lines = text.split('\n');
    const values: number[] = [];

    // Parser simples para o formato de texto da FGV (Ano Mês Valor)
    // Exemplo: 2023 01 0.52
    lines.forEach(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 3) {
        const val = parseFloat(parts[2].replace(',', '.'));
        if (!isNaN(val)) {
          values.push(val);
        }
      }
    });

    // A FGV retorna do mais antigo para o mais recente. 
    // Validamos se temos dados recentes suficientes.
    if (values.length > 12) {
      console.log('Dados INCC obtidos com sucesso via FGV.');
      return values;
    }
    
    throw new Error('Dados insuficientes da FGV');
  } catch (error) {
    console.warn('Falha na camada FGV, tentando Bacen...', error);
    return [];
  }
}

/**
 * CAMADA 2: Banco Central (SGS)
 * Tenta INCC-M (189), fallback para INCC-DI (4390)
 */
async function fetchFromBacen(code: number): Promise<number[]> {
  const today = new Date();
  const startDate = new Date();
  startDate.setFullYear(today.getFullYear() - 20); // Pega 20 anos para garantir 180 meses

  const formatDate = (d: Date) => d.toLocaleDateString('pt-BR');
  const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${code}/dados?formato=json&dataInicial=${formatDate(startDate)}&dataFinal=${formatDate(today)}`;

  try {
    const res = await fetch(url, { 
      headers: { 'User-Agent': 'AltoSobradinho-Simulator/1.0' },
      cache: 'no-store' 
    });
    
    if (!res.ok) throw new Error(`Bacen HTTP ${res.status}`);
    
    const json = await res.json();
    if (!Array.isArray(json) || json.length === 0) return [];

    // O Bacen retorna [{ data: "dd/mm/yyyy", valor: "0.45" }, ...]
    // Ordenar por data é crucial pois a API nem sempre garante ordem estrita
    const sorted = json.sort((a, b) => {
      const [da, ma, ya] = a.data.split('/').map(Number);
      const [db, mb, yb] = b.data.split('/').map(Number);
      return new Date(ya, ma-1, da).getTime() - new Date(yb, mb-1, db).getTime();
    });

    return sorted
      .filter((item: any) => item.valor && item.valor.trim() !== '')
      .map((item: any) => parseFloat(item.valor.replace(',', '.')));
  } catch (error) {
    console.warn(`Falha na série ${code} do Bacen:`, error);
    return [];
  }
}

/**
 * Calcula a média aritmética dos ÚLTIMOS N valores do array.
 * Garante que estamos olhando para o final do array (dados mais recentes).
 */
function calculateAverage(values: number[], count: number): number {
  if (values.length === 0) return 0;
  
  // Pega os últimos 'count' elementos
  const subset = values.slice(-count);
  if (subset.length === 0) return 0;

  const sum = subset.reduce((acc, val) => acc + val, 0);
  const avg = sum / subset.length;
  
  // Validação de sanidade: Se a média for absurda (<0.1% ou >3%), algo está errado nos dados brutos
  if (avg < 0.1 || avg > 3.0) {
    console.warn(`Média suspeita detectada (${avg}), retornando 0 para forçar fallback seguro.`);
    return 0;
  }

  return Math.round(avg * 10000) / 10000;
}

export async function GET() {
  // Verifica cache
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    // --- BUSCA INCC (Estratégia Híbrida) ---
    let inccValues = await fetchINCCFromFGV(); // Tenta FGV primeiro
    let inccSource = 'FGV IBRE (Oficial)';
    let inccIndicator = 'INCC-M';

    // Se FGV falhar, tenta Bacen
    if (inccValues.length === 0) {
      inccValues = await fetchFromBacen(189); // INCC-M no Bacen
      inccSource = 'Bacen SGS (INCC-M)';
      
      // Se INCC-M falhar no Bacen, tenta INCC-DI
      if (inccValues.length === 0) {
        inccValues = await fetchFromBacen(4390);
        inccSource = 'Bacen SGS (INCC-DI)';
        inccIndicator = 'INCC-DI';
      }
    }

    const inccAvg12 = calculateAverage(inccValues, 12);
    const inccAvg180 = calculateAverage(inccValues, 180);

    // --- BUSCA IPCA (Bacen Série 433) ---
    const ipcaValues = await fetchFromBacen(433);
    const ipcaAvg12 = calculateAverage(ipcaValues, 12);
    const ipcaAvg180 = calculateAverage(ipcaValues, 180);
    const ipcaSource = ipcaValues.length > 0 ? 'Bacen SGS (IPCA)' : 'Fallback Histórico';

    // --- FALLBACK DE SEGURANÇA (Apenas se TUDO falhar) ---
    // Valores baseados na média real de 2023-2024 para não quebrar a simulação
    const safeIncc12 = inccAvg12 > 0 ? inccAvg12 : 0.4600; 
    const safeIncc180 = inccAvg180 > 0 ? inccAvg180 : 0.4900;
    const safeIpca12 = ipcaAvg12 > 0 ? ipcaAvg12 : 0.3900;
    const safeIpca180 = ipcaAvg180 > 0 ? ipcaAvg180 : 0.4300;

    const isFallback = (inccAvg12 === 0 || ipcaAvg12 === 0);

    const response: ApiResponse = {
      incc: {
        avg180: safeIncc180,
        avg12: safeIncc12,
        source: isFallback ? 'Estimativa Histórica (API Indisponível)' : inccSource,
        indicator: inccIndicator,
        isFallback: isFallback,
        lastUpdate: new Date().toLocaleDateString('pt-BR')
      },
      ipca: {
        avg180: safeIpca180,
        avg12: safeIpca12,
        source: isFallback ? 'Estimativa Histórica (API Indisponível)' : ipcaSource,
        indicator: 'IPCA',
        isFallback: isFallback,
        lastUpdate: new Date().toLocaleDateString('pt-BR')
      }
    };

    cache = { data: response, timestamp: Date.now() };
    return NextResponse.json(response);

  } catch (error) {
    console.error('Erro crítico na API de índices:', error);
    // Retorno de emergência
    return NextResponse.json({
      incc: { avg180: 0.4900, avg12: 0.4600, source: 'Erro Sistema - Fallback', indicator: 'INCC', isFallback: true },
      ipca: { avg180: 0.4300, avg12: 0.3900, source: 'Erro Sistema - Fallback', indicator: 'IPCA', isFallback: true }
    });
  }
}
