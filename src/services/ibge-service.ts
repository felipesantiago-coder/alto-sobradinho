export interface IBGEData {
  incc: {
    media15Anos: number; // Mapeado de avg180 (aprox 15 anos)
    media12Meses: number;
    projecao: number;
    source?: string;
    indicator?: string;
  };
  ipca: {
    media15Anos: number;
    media12Meses: number;
    projecao: number;
    source?: string;
    indicator?: string;
  };
}

/**
 * Busca índices da nossa API Route interna (/api/incc-ipca)
 * que utiliza fontes confiáveis (BrasilIndicadores/Bacen) com cache.
 */
export async function getIBGEIndices(): Promise<IBGEData> {
  try {
    const response = await fetch('/api/incc-ipca?type=ALL', {
      next: { revalidate: 3600 } // Revalida a cada hora no client side cache se necessário
    });

    if (!response.ok) throw new Error('Falha na API interna');

    const data = await response.json();
    
    // Mapeia a resposta da API (avg180) para o formato esperado pelo frontend (media15Anos)
    return {
      incc: {
        media15Anos: data.incc.avg180,
        media12Meses: data.incc.avg12,
        projecao: data.incc.projecao ?? data.incc.avg12,
        source: data.incc.source,
        indicator: data.incc.indicator
      },
      ipca: {
        media15Anos: data.ipca.avg180,
        media12Meses: data.ipca.avg12,
        projecao: data.ipca.projecao ?? data.ipca.avg12,
        source: data.ipca.source,
        indicator: data.ipca.indicator
      }
    };
  } catch (error) {
    console.error('Erro ao buscar índices da API interna, usando fallback hardcoded:', error);
    // Fallback final de segurança
    return {
      incc: { media15Anos: 0.55, media12Meses: 0.50, projecao: 0.50 },
      ipca: { media15Anos: 0.48, media12Meses: 0.42, projecao: 0.42 }
    };
  }
}
