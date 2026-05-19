import { NextResponse } from 'next/server';

// Cache em memória (TTL de 6 horas)
let cache: {
  data: any;
  timestamp: number;
} | null = null;

const CACHE_TTL = 6 * 60 * 60 * 1000; // 6 horas

interface MonthlyEntry {
  date: Date;
  data: string; // "dd/mm/aaaa"
  valor: number; // variação percentual (ex: 1.04 = 1,04%)
}

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
 * CAMADA 1: Scraping do INCC-M via brasilindicadores.com.br
 * Extrai dados da tabela HTML gerada por AJAX.
 */
async function fetchINCCmFromBrasilIndicadores(): Promise<MonthlyEntry[] | null> {
  try {
    const res = await fetch(
      "https://brasilindicadores.com.br/incc-m?handler=HistoricoValoresIndicadorPartial",
      {
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html, application/xhtml+xml",
        },
        signal: AbortSignal.timeout(15000), // 15s timeout
      }
    );

    if (!res.ok) return null;
    const html = await res.text();

    // Regex para extrair linhas da tabela
    const rows = html.match(/<tr[^>]*>(.*?)<\/tr>/gis);
    if (!rows || rows.length === 0) return null;

    const entries: MonthlyEntry[] = [];

    for (const row of rows) {
      // Extrair células <td>
      const cells = row.match(/<td[^>]*>(.*?)<\/td>/gis);
      if (!cells || cells.length < 13) continue;

      // Limpar HTML das células
      const cleanCells = cells.map(c => c.replace(/<[^>]+>/g, "").trim());

      // Primeira célula é o ano
      const yearStr = cleanCells[0];
      if (!/^\d{4}$/.test(yearStr)) continue;
      const year = parseInt(yearStr, 10);

      // Células 1 a 12 são os meses (Jan a Dez)
      for (let m = 0; m < 12; m++) {
        const raw = cleanCells[m + 1]?.replace("%", "").replace(",", ".").trim();
        
        // Ignorar células vazias (meses futuros sem dado)
        if (!raw || raw === "") continue;

        const valor = parseFloat(raw);
        if (isNaN(valor)) continue;

        entries.push({
          date: new Date(year, m, 1), // Mês 0-indexed no JS
          data: `01/${String(m + 1).padStart(2, "0")}/${year}`,
          valor,
        });
      }
    }

    // Filtrar apenas dados a partir de 2011 para garantir janela de 180 meses relevante
    const filteredEntries = entries.filter(e => e.date.getFullYear() >= 2011);

    if (filteredEntries.length < 12) return null;

    // Ordenar cronologicamente (o HTML vem em ordem decrescente de anos)
    filteredEntries.sort((a, b) => a.date.getTime() - b.date.getTime());

    return filteredEntries;
  } catch (error) {
    console.warn("Falha ao buscar INCC-M (Brasil Indicadores):", error);
    return null;
  }
}

/**
 * CAMADA 2: API do Bacen para INCC-DI (Série 192)
 * Usado como fallback confiável se o INCC-M não estiver disponível.
 */
async function fetchINCCdFromBacen(): Promise<MonthlyEntry[] | null> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 200); // Margem de segurança

    const formatDate = (d: Date) =>
      `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.192/dados?formato=json&dataInicial=${formatDate(startDate)}&dataFinal=${formatDate(endDate)}`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return null;

    const rawData: Array<{ data: string; valor: string }> = await res.json();
    if (!Array.isArray(rawData) || rawData.length === 0) return null;

    const entries: MonthlyEntry[] = rawData
      .map(item => ({
        date: new Date(
          parseInt(item.data.split("/")[2]),
          parseInt(item.data.split("/")[1]) - 1,
          1
        ),
        data: item.data,
        valor: parseFloat(item.valor), // Bacen usa ponto decimal
      }))
      .filter(e => !isNaN(e.valor));

    if (entries.length < 12) return null;

    // Já vêm ordenados, mas garantimos a ordenação
    entries.sort((a, b) => a.date.getTime() - b.date.getTime());

    return entries;
  } catch (error) {
    console.warn("Falha ao buscar INCC-DI (Bacen):", error);
    return null;
  }
}

/**
 * CAMADA 3: IPCA via Bacen (Série 433)
 * Sempre disponível e confiável.
 */
async function fetchIPCAFromBacen(): Promise<MonthlyEntry[] | null> {
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 200);

    const formatDate = (d: Date) =>
      `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;

    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.433/dados?formato=json&dataInicial=${formatDate(startDate)}&dataFinal=${formatDate(endDate)}`;

    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;

    const rawData: Array<{ data: string; valor: string }> = await res.json();
    
    const entries = rawData
      .map(item => ({
        date: new Date(parseInt(item.data.split("/")[2]), parseInt(item.data.split("/")[1]) - 1, 1),
        data: item.data,
        valor: parseFloat(item.valor),
      }))
      .filter(e => !isNaN(e.valor));

    if (entries.length < 12) return null;
    entries.sort((a, b) => a.date.getTime() - b.date.getTime());
    return entries;

  } catch (error) {
    console.warn("Falha ao buscar IPCA (Bacen):", error);
    return null;
  }
}

/**
 * Calcula médias aritméticas simples dos últimos N meses
 */
function calcAverages(entries: MonthlyEntry[]) {
  if (entries.length === 0) return { avg12: 0, avg180: 0 };

  const values = entries.map(e => e.valor);
  
  // Slice negativo pega os últimos N elementos (já que o array está ordenado cronologicamente)
  const last12 = values.slice(-12);
  const last180 = values.slice(-180);

  const sum = (arr: number[]) => arr.reduce((s, v) => s + v, 0);

  return {
    avg12: sum(last12) / last12.length,
    avg180: sum(last180) / last180.length,
  };
}

// Valores de fallback estático (Referência Maio/2026 conforme especificação)
const FALLBACK_INCC = { avg12: 0.5092, avg180: 0.5570 };
const FALLBACK_IPCA = { avg12: 0.3800, avg180: 0.4200 };

export async function GET() {
  // Verificar Cache
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json(cache.data);
  }

  try {
    // --- PROCESSAMENTO INCC ---
    let inccEntries: MonthlyEntry[] | null = null;
    let inccSource = "";
    let inccIndicator = "";
    let inccIsFallback = false;

    // Tentativa 1: INCC-M (Scraping)
    inccEntries = await fetchINCCmFromBrasilIndicadores();
    if (inccEntries) {
      inccSource = "brasilindicadores.com.br (FGV IBRE)";
      inccIndicator = "INCC-M";
    } else {
      // Tentativa 2: INCC-DI (Bacen)
      inccEntries = await fetchINCCdFromBacen();
      if (inccEntries) {
        inccSource = "Bacen SGS Série 192 (FGV IBRE)";
        inccIndicator = "INCC-DI";
      }
    }

    let inccAverages;
    if (inccEntries && inccEntries.length > 0) {
      inccAverages = calcAverages(inccEntries);
      // Validação de sanidade: se a média for irreal (<0.1% ou >2%), usa fallback
      if (inccAverages.avg12 < 0.1 || inccAverages.avg12 > 2.5) {
        console.warn("Dados INCC fora da faixa realista, ativando fallback estático.");
        inccAverages = FALLBACK_INCC;
        inccSource = "Fallback Estático (Dados Oficiais Indisponíveis)";
        inccIndicator = "INCC-M (Ref)";
        inccIsFallback = true;
      }
    } else {
      inccAverages = FALLBACK_INCC;
      inccSource = "Fallback Estático (Fontes Offline)";
      inccIndicator = "INCC-M (Ref)";
      inccIsFallback = true;
    }

    // --- PROCESSAMENTO IPCA ---
    let ipcaEntries = await fetchIPCAFromBacen();
    let ipcaSource = "";
    let ipcaIndicator = "IPCA";
    let ipcaIsFallback = false;
    let ipcaAverages;

    if (ipcaEntries && ipcaEntries.length > 0) {
      ipcaAverages = calcAverages(ipcaEntries);
      ipcaSource = "Bacen SGS Série 433 (IBGE)";
      
      // Validação de sanidade IPCA
      if (ipcaAverages.avg12 < 0.1 || ipcaAverages.avg12 > 2.5) {
        ipcaAverages = FALLBACK_IPCA;
        ipcaSource = "Fallback Estático";
        ipcaIsFallback = true;
      }
    } else {
      ipcaAverages = FALLBACK_IPCA;
      ipcaSource = "Fallback Estático (Bacen Offline)";
      ipcaIsFallback = true;
    }

    const lastUpdate = inccEntries?.[inccEntries.length - 1]?.data || new Date().toLocaleDateString('pt-BR');

    const response: ApiResponse = {
      incc: {
        avg180: parseFloat(inccAverages.avg180.toFixed(4)),
        avg12: parseFloat(inccAverages.avg12.toFixed(4)),
        source: inccSource,
        indicator: inccIndicator,
        isFallback: inccIsFallback,
        lastUpdate
      },
      ipca: {
        avg180: parseFloat(ipcaAverages.avg180.toFixed(4)),
        avg12: parseFloat(ipcaAverages.avg12.toFixed(4)),
        source: ipcaSource,
        indicator: ipcaIndicator,
        isFallback: ipcaIsFallback,
        lastUpdate
      }
    };

    // Atualizar Cache
    cache = { data: response, timestamp: Date.now() };

    return NextResponse.json(response);

  } catch (error) {
    console.error("Erro crítico na API de índices:", error);
    // Retorno de emergência
    return NextResponse.json({
      incc: { avg180: FALLBACK_INCC.avg180, avg12: FALLBACK_INCC.avg12, source: "Erro Sistema", indicator: "INCC", isFallback: true },
      ipca: { avg180: FALLBACK_IPCA.avg180, avg12: FALLBACK_IPCA.avg12, source: "Erro Sistema", indicator: "IPCA", isFallback: true }
    });
  }
}
