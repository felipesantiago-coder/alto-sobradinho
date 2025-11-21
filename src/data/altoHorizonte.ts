export interface Unit {
  apt: string;
  bl: string;
  andar: string;
  final: string;
  areaApto: string;
  areaGarden: string;
  areaTotal: string;
  tipologia: string;
  sol: string;
  vagas: string;
  vagaNum: number;
  avaliacao: string;
  ba: string;
  venda: string;
  status: string;
}

export interface PropertyInfo {
  name: string;
  subtitle: string;
  description: string;
  totalUnits: number;
  blocksAndUnits: { block: string; count: number }[];
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    light: string;
    dark: string;
    nascente: string;
    poente: string;
    disponivel: string;
    vendido: string;
    reservado: string;
    quitado: string;
    reservadoRevisao: string;
    mirror: string;
    foraVenda: string;
    background: string;
    card: string;
    textPrimary: string;
    textSecondary: string;
    border: string;
  };
}

export const altoHorizonteInfo: PropertyInfo = {
  name: "ALTO DO HORIZONTE",
  subtitle: "RESIDENCIAL",
  description: "Lista organizada de todas as 344 unidades por bloco e andar",
  totalUnits: 344,
  blocksAndUnits: [
    { block: "A e D", count: 90 },
    { block: "B e C", count: 82 }
  ],
  colors: {
    primary: "#1a5276",
    secondary: "#2980b9",
    accent: "#e74c3c",
    light: "#ecf0f1",
    dark: "#2c3e50",
    nascente: "#e67e22",
    poente: "#8e44ad",
    disponivel: "#27ae60",
    vendido: "#e74c3c",
    reservado: "#f1c40f",
    quitado: "#16a085",
    reservadoRevisao: "#e67e22",
    mirror: "#95a5a6",
    foraVenda: "#7f8c8d",
    background: "#f8f9fa",
    card: "#ffffff",
    textPrimary: "#2c3e50",
    textSecondary: "#7f8c8d",
    border: "#e1e8ed"
  }
};

export function generateAltoHorizonteUnits(): Unit[] {
  const allUnits: Unit[] = [];
  const blocks = ['A', 'B', 'C', 'D'];
  
  const blockStructure = {
    'A': { total: 90, floors: {
      '0': 6, '1': 8, '2': 8, '3': 8, '4': 8, '5': 8, '6': 8, '7': 8, '8': 8, '9': 8, '10': 8, '11': 4
    }},
    'B': { total: 82, floors: {
      '0': 6, '1': 8, '2': 8, '3': 8, '4': 8, '5': 8, '6': 8, '7': 8, '8': 8, '9': 8, '10': 4
    }},
    'C': { total: 82, floors: {
      '0': 6, '1': 8, '2': 8, '3': 8, '4': 8, '5': 8, '6': 8, '7': 8, '8': 8, '9': 8, '10': 4
    }},
    'D': { total: 90, floors: {
      '0': 6, '1': 8, '2': 8, '3': 8, '4': 8, '5': 8, '6': 8, '7': 8, '8': 8, '9': 8, '10': 8, '11': 4
    }}
  };

  const statusData = {
    'A-1': 'Vendida', 'A-2': 'Vendida', 'A-4': 'Vendida', 'A-6': 'Vendida',
    'A-7': 'Vendida', 'A-8': 'Vendida', 'A-101': 'Vendida', 'A-102': 'Vendida',
    'A-103': 'Vendida', 'A-104': 'Vendida', 'A-105': 'Vendida', 'A-106': 'Vendida',
    'A-107': 'Vendida', 'A-108': 'Disponível', 'A-201': 'Vendida', 'A-202': 'Vendida',
    'A-203': 'Vendida', 'A-204': 'Vendida', 'A-205': 'Vendida', 'A-206': 'Vendida',
    'A-207': 'Vendida', 'A-208': 'Vendida', 'A-301': 'Vendida', 'A-302': 'Vendida',
    'A-303': 'Vendida', 'A-304': 'Vendida', 'A-305': 'Vendida', 'A-306': 'Vendida',
    'A-307': 'Vendida', 'A-308': 'Vendida', 'A-401': 'Vendida', 'A-402': 'Vendida',
    'A-403': 'Vendida', 'A-404': 'Vendida', 'A-405': 'Quitado', 'A-406': 'Vendida',
    'A-407': 'Vendida', 'A-408': 'Vendida', 'A-501': 'Vendida', 'A-502': 'Vendida',
    'A-503': 'Vendida', 'A-504': 'Vendida', 'A-505': 'Vendida', 'A-506': 'Vendida',
    'A-507': 'Vendida', 'A-508': 'Quitado', 'A-601': 'Vendida', 'A-602': 'Vendida',
    'A-603': 'Quitado', 'A-604': 'Vendida', 'A-605': 'Vendida', 'A-606': 'Vendida',
    'A-607': 'Vendida', 'A-608': 'Vendida', 'A-701': 'Vendida', 'A-702': 'Vendida',
    'A-703': 'Vendida', 'A-704': 'Vendida', 'A-705': 'Vendida', 'A-706': 'Vendida',
    'A-707': 'Vendida', 'A-708': 'Vendida', 'A-801': 'Vendida', 'A-802': 'Vendida',
    'A-803': 'Vendida', 'A-804': 'Vendida', 'A-805': 'Vendida', 'A-806': 'Vendida',
    'A-807': 'Vendida', 'A-808': 'Vendida', 'A-901': 'Vendida', 'A-902': 'Vendida',
    'A-903': 'Vendida', 'A-904': 'Vendida', 'A-905': 'Vendida', 'A-906': 'Vendida',
    'A-907': 'Vendida', 'A-908': 'Vendida', 'A-1001': 'Vendida', 'A-1002': 'Vendida',
    'A-1003': 'Vendida', 'A-1004': 'Vendida', 'A-1005': 'Vendida', 'A-1006': 'Vendida',
    'A-1007': 'Quitado', 'A-1008': 'Vendida', 'A-1101': 'Vendida', 'A-1102': 'Vendida',
    'A-1107': 'Quitado', 'A-1108': 'Disponível',
    
    'B-1': 'Vendida', 'B-2': 'Vendida', 'B-4': 'Vendida', 'B-6': 'Vendida',
    'B-7': 'Vendida', 'B-8': 'Vendida', 'B-101': 'Vendida', 'B-102': 'Vendida',
    'B-103': 'Vendida', 'B-104': 'Vendida', 'B-105': 'Vendida', 'B-106': 'Vendida',
    'B-107': 'Disponível', 'B-108': 'Vendida', 'B-201': 'Disponível', 'B-202': 'Vendida',
    'B-203': 'Vendida', 'B-204': 'Vendida', 'B-205': 'Vendida', 'B-206': 'Vendida',
    'B-207': 'Vendida', 'B-208': 'Quitado', 'B-301': 'Vendida', 'B-302': 'Vendida',
    'B-303': 'Quitado', 'B-304': 'Vendida', 'B-305': 'Vendida', 'B-306': 'Vendida',
    'B-307': 'Vendida', 'B-308': 'Vendida', 'B-401': 'Vendida', 'B-402': 'Vendida',
    'B-403': 'Vendida', 'B-404': 'Vendida', 'B-405': 'Vendida', 'B-406': 'Vendida',
    'B-407': 'Vendida', 'B-408': 'Quitado', 'B-501': 'Vendida', 'B-502': 'Vendida',
    'B-503': 'Vendida', 'B-504': 'Vendida', 'B-505': 'Vendida', 'B-506': 'Quitado',
    'B-507': 'Vendida', 'B-508': 'Vendida', 'B-601': 'Vendida', 'B-602': 'Vendida',
    'B-603': 'Vendida', 'B-604': 'Vendida', 'B-605': 'Vendida', 'B-606': 'Quitado',
    'B-607': 'Vendida', 'B-608': 'Quitado', 'B-701': 'Vendida', 'B-702': 'Vendida',
    'B-703': 'Vendida', 'B-704': 'Vendida', 'B-705': 'Vendida', 'B-706': 'Vendida',
    'B-707': 'Vendida', 'B-708': 'Vendida', 'B-801': 'Vendida', 'B-802': 'Vendida',
    'B-803': 'Vendida', 'B-804': 'Vendida', 'B-805': 'Vendida', 'B-806': 'Vendida',
    'B-807': 'Vendida', 'B-808': 'Vendida', 'B-901': 'Vendida', 'B-902': 'Vendida',
    'B-903': 'Vendida', 'B-904': 'Vendida', 'B-905': 'Vendida', 'B-906': 'Vendida',
    'B-907': 'Vendida', 'B-908': 'Vendida', 'B-1001': 'Vendida', 'B-1002': 'Vendida',
    'B-1007': 'Mirror', 'B-1008': 'Vendida',
    
    'C-1': 'Vendida', 'C-2': 'Vendida', 'C-4': 'Vendida', 'C-6': 'Vendida',
    'C-7': 'Vendida', 'C-8': 'Vendida', 'C-101': 'Vendida', 'C-102': 'Quitado',
    'C-103': 'Vendida', 'C-104': 'Vendida', 'C-105': 'Vendida', 'C-106': 'Vendida',
    'C-107': 'Disponível', 'C-108': 'Disponível', 'C-201': 'Disponível', 'C-202': 'Vendida',
    'C-203': 'Vendida', 'C-204': 'Vendida', 'C-205': 'Vendida', 'C-206': 'Vendida',
    'C-207': 'Disponível', 'C-208': 'Vendida', 'C-301': 'Vendida', 'C-302': 'Vendida',
    'C-303': 'Vendida', 'C-304': 'Vendida', 'C-305': 'Vendida', 'C-306': 'Vendida',
    'C-307': 'Vendida', 'C-308': 'Vendida', 'C-401': 'Vendida', 'C-402': 'Vendida',
    'C-403': 'Vendida', 'C-404': 'Vendida', 'C-405': 'Vendida', 'C-406': 'Vendida',
    'C-407': 'Vendida', 'C-408': 'Vendida', 'C-501': 'Quitado', 'C-502': 'Vendida',
    'C-503': 'Vendida', 'C-504': 'Vendida', 'C-505': 'Vendida', 'C-506': 'Vendida',
    'C-507': 'Vendida', 'C-508': 'Vendida', 'C-601': 'Vendida', 'C-602': 'Vendida',
    'C-603': 'Vendida', 'C-604': 'Quitado', 'C-605': 'Vendida', 'C-606': 'Vendida',
    'C-607': 'Vendida', 'C-608': 'Vendida', 'C-701': 'Vendida', 'C-702': 'Vendida',
    'C-703': 'Vendida', 'C-704': 'Vendida', 'C-705': 'Vendida', 'C-706': 'Vendida',
    'C-707': 'Vendida', 'C-708': 'Vendida', 'C-801': 'Vendida', 'C-802': 'Vendida',
    'C-803': 'Vendida', 'C-804': 'Vendida', 'C-805': 'Vendida', 'C-806': 'Vendida',
    'C-807': 'Quitado', 'C-808': 'Vendida', 'C-901': 'Vendida', 'C-902': 'Vendida',
    'C-903': 'Vendida', 'C-904': 'Vendida', 'C-905': 'Vendida', 'C-906': 'Vendida',
    'C-907': 'Vendida', 'C-908': 'Vendida', 'C-1001': 'Disponível', 'C-1002': 'Vendida',
    'C-1007': 'Disponível', 'C-1008': 'Vendida',
    
    'D-1': 'Vendida', 'D-2': 'Vendida', 'D-4': 'Vendida', 'D-6': 'Vendida',
    'D-7': 'Vendida', 'D-8': 'Vendida', 'D-101': 'Vendida', 'D-102': 'Vendida',
    'D-103': 'Vendida', 'D-104': 'Vendida', 'D-105': 'Vendida', 'D-106': 'Vendida',
    'D-107': 'Vendida', 'D-108': 'Vendida', 'D-201': 'Vendida', 'D-202': 'Vendida',
    'D-203': 'Vendida', 'D-204': 'Vendida', 'D-205': 'Vendida', 'D-206': 'Vendida',
    'D-207': 'Vendida', 'D-208': 'Vendida', 'D-301': 'Vendida', 'D-302': 'Vendida',
    'D-303': 'Quitado', 'D-304': 'Vendida', 'D-305': 'Vendida', 'D-306': 'Vendida',
    'D-307': 'Vendida', 'D-308': 'Vendida', 'D-401': 'Mirror', 'D-402': 'Vendida',
    'D-403': 'Vendida', 'D-404': 'Vendida', 'D-405': 'Vendida', 'D-406': 'Vendida',
    'D-407': 'Vendida', 'D-408': 'Vendida', 'D-501': 'Vendida', 'D-502': 'Vendida',
    'D-503': 'Vendida', 'D-504': 'Vendida', 'D-505': 'Vendida', 'D-506': 'Vendida',
    'D-507': 'Vendida', 'D-508': 'Vendida', 'D-601': 'Vendida', 'D-602': 'Vendida',
    'D-603': 'Quitado', 'D-604': 'Vendida', 'D-605': 'Vendida', 'D-606': 'Vendida',
    'D-607': 'Vendida', 'D-608': 'Vendida', 'D-701': 'Vendida', 'D-702': 'Vendida',
    'D-703': 'Vendida', 'D-704': 'Vendida', 'D-705': 'Quitado', 'D-706': 'Vendida',
    'D-707': 'Vendida', 'D-708': 'Vendida', 'D-801': 'Vendida', 'D-802': 'Vendida',
    'D-803': 'Vendida', 'D-804': 'Vendida', 'D-805': 'Vendida', 'D-806': 'Vendida',
    'D-807': 'Vendida', 'D-808': 'Quitado', 'D-901': 'Vendida', 'D-902': 'Vendida',
    'D-903': 'Vendida', 'D-904': 'Vendida', 'D-905': 'Vendida', 'D-906': 'Quitado',
    'D-907': 'Vendida', 'D-908': 'Vendida', 'D-1001': 'Vendida', 'D-1002': 'Vendida',
    'D-1003': 'Vendida', 'D-1004': 'Vendida', 'D-1005': 'Vendida', 'D-1006': 'Vendida',
    'D-1007': 'Vendida', 'D-1008': 'Vendida', 'D-1101': 'Disponível', 'D-1102': 'Vendida',
    'D-1107': 'Vendida', 'D-1108': 'Vendida'
  };

  const unitData = {
    // Bloco A - Térreo (numeração corrigida: 1, 2, 4, 6, 7, 8)
    'A-1': { area: '110,52 m²', tipologia: '3Q + AP', sol: 'Nascente', vagas: '2', valor: 'R$ 791.347,00' },
    'A-2': { area: '110,92 m²', tipologia: '3Q + AP', sol: 'Poente', vagas: '2', valor: 'R$ 781.959,88' },
    'A-4': { area: '81,11 m²', tipologia: '2Q + AP', sol: 'Nascente', vagas: '1', valor: 'R$ 590.666,30' },
    'A-6': { area: '81,11 m²', tipologia: '2Q + AP', sol: 'Nascente', vagas: '1', valor: 'R$ 590.666,30' },
    'A-7': { area: '110,52 m²', tipologia: '3Q + AP', sol: 'Nascente', vagas: '2', valor: 'R$ 791.347,00' },
    'A-8': { area: '110,92 m²', tipologia: '3Q + AP', sol: 'Poente', vagas: '2', valor: 'R$ 781.959,88' },
    
    // Bloco A - 1º ao 10º Andar
    'A-101': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 606.276,77' },
    'A-102': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 565.908,18' },
    'A-103': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 545.420,64' },
    'A-104': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 507.580,55' },
    'A-105': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 545.420,64' },
    'A-106': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 522.691,47' },
    'A-107': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 606.276,77' },
    'A-108': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 565.908,18' },
    
    'A-201': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 611.268,80' },
    'A-202': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 570.728,95' },
    'A-203': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 549.291,29' },
    'A-204': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 511.319,13' },
    'A-205': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 549.291,29' },
    'A-206': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 511.319,13' },
    'A-207': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 611.268,80' },
    'A-208': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 612.832,70' },
    
    'A-301': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 659.869,42' },
    'A-302': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 617.653,02' },
    'A-303': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 553.162,93' },
    'A-304': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 515.059,66' },
    'A-305': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 553.162,93' },
    'A-306': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 515.059,66' },
    'A-307': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 659.869,42' },
    'A-308': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 649.228,67' },
    
    'A-401': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 697.082,75' },
    'A-402': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 654.050,62' },
    'A-403': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 557.036,58' },
    'A-404': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 518.797,21' },
    'A-405': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 557.036,58' },
    'A-406': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 518.797,21' },
    'A-407': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 697.082,75' },
    'A-408': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 654.050,62' },
    
    'A-501': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 702.075,43' },
    'A-502': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 658.871,07' },
    'A-503': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 560.908,22' },
    'A-504': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 522.535,76' },
    'A-505': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 560.908,22' },
    'A-506': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 522.535,76' },
    'A-507': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 677.637,67' },
    'A-508': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 658.871,07' },
    
    'A-601': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 707.066,11' },
    'A-602': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 663.692,45' },
    'A-603': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 564.778,87' },
    'A-604': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 526.271,34' },
    'A-605': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 564.778,87' },
    'A-606': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 526.271,34' },
    'A-607': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 707.066,11' },
    'A-608': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 663.692,45' },
    
    'A-701': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 712.062,79' },
    'A-702': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 668.511,88' },
    'A-703': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 568.649,52' },
    'A-704': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 530.010,87' },
    'A-705': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 568.649,52' },
    'A-706': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 530.010,87' },
    'A-707': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 691.402,02' },
    'A-708': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 668.511,88' },
    
    'A-801': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 717.052,77' },
    'A-802': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 673.332,60' },
    'A-803': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 572.521,16' },
    'A-804': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 533.749,36' },
    'A-805': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 572.521,16' },
    'A-806': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 533.749,40' },
    'A-807': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 717.052,77' },
    'A-808': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 673.332,60' },
    
    'A-901': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 722.045,77' },
    'A-902': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 678.154,32' },
    'A-903': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 580.581,02' },
    'A-904': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 537.486,98' },
    'A-905': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 576.392,81' },
    'A-906': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 537.486,98' },
    'A-907': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 701.385,00' },
    'A-908': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 678.154,32' },
    
    'A-1001': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 727.037,80' },
    'A-1002': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 682.973,08' },
    'A-1003': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 580.265,46' },
    'A-1004': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 541.227,52' },
    'A-1005': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 580.265,46' },
    'A-1006': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 541.227,52' },
    'A-1007': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 706.379,00' },
    'A-1008': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 682.973,08' },
    
    // Cobertura Bloco A
    'A-1101': { area: '132,65 m²', tipologia: 'COBERTURA 3Q (2 SUÍTES)', sol: 'Nascente', vagas: '2', valor: 'R$ 1.233.653,00' },
    'A-1102': { area: '132,65 m²', tipologia: 'COBERTURA 3Q (2 SUÍTES)', sol: 'Poente', vagas: '2', valor: 'R$ 1.233.653,00' },
    'A-1107': { area: '132,65 m²', tipologia: 'COBERTURA 3Q (2 SUÍTES)', sol: 'Nascente', vagas: '2', valor: 'R$ 1.233.653,00' },
    'A-1108': { area: '132,65 m²', tipologia: 'COBERTURA 3Q (2 SUÍTES)', sol: 'Poente', vagas: '2', valor: 'R$ 1.233.653,00' },
    
    // Bloco B - Térreo
    'B-1': { area: '110,52 m²', tipologia: '3Q + AP', sol: 'Poente', vagas: '2', valor: 'R$ 791.347,00' },
    'B-2': { area: '110,92 m²', tipologia: '3Q + AP', sol: 'Nascente', vagas: '2', valor: 'R$ 781.959,88' },
    'B-4': { area: '81,11 m²', tipologia: '2Q + AP', sol: 'Poente', vagas: '1', valor: 'R$ 590.666,30' },
    'B-6': { area: '81,11 m²', tipologia: '2Q + AP', sol: 'Poente', vagas: '1', valor: 'R$ 590.666,30' },
    'B-7': { area: '110,52 m²', tipologia: '3Q + AP', sol: 'Poente', vagas: '2', valor: 'R$ 791.347,00' },
    'B-8': { area: '110,92 m²', tipologia: '3Q + AP', sol: 'Nascente', vagas: '2', valor: 'R$ 781.959,88' },
    
    // Bloco B - 1º ao 10º Andar
    'B-101': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 606.276,77' },
    'B-102': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 565.908,13' },
    'B-103': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 545.420,64' },
    'B-104': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 507.580,55' },
    'B-105': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 545.420,64' },
    'B-106': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 507.580,55' },
    'B-107': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 606.276,77' },
    'B-108': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 565.908,18' },
    
    'B-201': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 611.268,80' },
    'B-202': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 570.728,92' },
    'B-203': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 549.291,29' },
    'B-204': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 511.319,13' },
    'B-205': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 549.291,29' },
    'B-206': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 511.319,13' },
    'B-207': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 611.268,80' },
    'B-208': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 612.832,70' },
    
    'B-301': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 659.869,42' },
    'B-302': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 617.653,02' },
    'B-303': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 553.162,93' },
    'B-304': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 515.059,66' },
    'B-305': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 553.162,93' },
    'B-306': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 515.059,66' },
    'B-307': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 659.869,42' },
    'B-308': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 649.228,67' },
    
    'B-401': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 697.082,75' },
    'B-402': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 654.050,62' },
    'B-403': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 557.036,58' },
    'B-404': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 518.797,21' },
    'B-405': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 557.036,58' },
    'B-406': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 518.797,21' },
    'B-407': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 697.082,75' },
    'B-408': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 654.050,62' },
    
    'B-501': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 702.075,43' },
    'B-502': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 658.871,07' },
    'B-503': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 560.908,22' },
    'B-504': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 522.535,76' },
    'B-505': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 560.908,22' },
    'B-506': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 522.535,76' },
    'B-507': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 702.075,43' },
    'B-508': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 658.871,07' },
    
    'B-601': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 707.066,11' },
    'B-602': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 663.692,45' },
    'B-603': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 564.778,87' },
    'B-604': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 526.271,34' },
    'B-605': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 564.778,87' },
    'B-606': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 526.271,34' },
    'B-607': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 707.066,11' },
    'B-608': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 663.692,45' },
    
    'B-701': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 712.062,79' },
    'B-702': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 668.511,88' },
    'B-703': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 568.649,52' },
    'B-704': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 530.010,87' },
    'B-705': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 568.649,52' },
    'B-706': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 530.010,87' },
    'B-707': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 712.062,79' },
    'B-708': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 668.511,88' },
    
    'B-801': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 717.052,77' },
    'B-802': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 673.332,60' },
    'B-803': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 572.521,16' },
    'B-804': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 533.749,40' },
    'B-805': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 572.521,16' },
    'B-806': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 533.749,40' },
    'B-807': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 717.052,77' },
    'B-808': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 673.332,60' },
    
    'B-901': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 722.045,77' },
    'B-902': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 678.154,32' },
    'B-903': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 576.392,81' },
    'B-904': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 537.486,98' },
    'B-905': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 576.392,81' },
    'B-906': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 537.486,98' },
    'B-907': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 722.045,77' },
    'B-908': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 678.154,32' },
    
    // Cobertura Bloco B
    'B-1001': { area: '132,65 m²', tipologia: 'COBERTURA 3Q (2 SUÍTES)', sol: 'Nascente', vagas: '2', valor: 'R$ 1.233.653,00' },
    'B-1002': { area: '132,65 m²', tipologia: 'COBERTURA 3Q (2 SUÍTES)', sol: 'Poente', vagas: '2', valor: 'R$ 1.216.874,00' },
    'B-1007': { area: '132,65 m²', tipologia: 'COBERTURA 3Q (2 SUÍTES)', sol: 'Nascente', vagas: '2', valor: 'R$ 1.233.653,00' },
    'B-1008': { area: '132,65 m²', tipologia: 'COBERTURA 3Q (2 SUÍTES)', sol: 'Poente', vagas: '2', valor: 'R$ 1.216.874,00' },
    'B-1003': { area: '580,27 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 580.265,46' },
    'B-1004': { area: '541,23 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 541.227,52' },
    
    'C-1': { area: '110,52 m²', tipologia: '3Q + AP', sol: 'Nascente', vagas: '2', valor: 'R$ 791.347,00' },
    'C-2': { area: '110,92 m²', tipologia: '3Q + AP', sol: 'Poente', vagas: '2', valor: 'R$ 781.959,88' },
    'C-4': { area: '81,11 m²', tipologia: '2Q + AP', sol: 'Nascente', vagas: '1', valor: 'R$ 590.667,30' },
    'C-6': { area: '81,11 m²', tipologia: '2Q + AP', sol: 'Nascente', vagas: '1', valor: 'R$ 590.666,30' },
    'C-7': { area: '110,52 m²', tipologia: '3Q + AP', sol: 'Nascente', vagas: '2', valor: 'R$ 791.347,00' },
    'C-8': { area: '110,92 m²', tipologia: '3Q + AP', sol: 'Poente', vagas: '2', valor: 'R$ 781.959,88' },
    
    // Bloco C - 1º ao 10º Andar
    'C-101': { area: '585,62 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 585.615,55' },
    'C-102': { area: '565,91 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 565.908,18' },
    'C-103': { area: '524,76 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 524.758,87' },
    'C-104': { area: '517,84 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 517.836,87' },
    'C-105': { area: '524,76 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 524.758,87' },
    'C-106': { area: '517,84 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 517.836,87' },
    'C-107': { area: '585,62 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 585.615,55' },
    'C-108': { area: '565,91 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 565.908,18' },
    
    'C-201': { area: '590,61 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 590.610,75' },
    'C-202': { area: '582,25 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 582.251,75' },
    'C-203': { area: '528,63 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 528.631,52' },
    'C-204': { area: '521,65 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 521.651,52' },
    'C-205': { area: '528,63 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 528.631,52' },
    'C-206': { area: '521,65 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 521.651,52' },
    'C-207': { area: '590,61 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 590.610,75' },
    'C-208': { area: '582,25 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 582.251,75' },
    
    'C-301': { area: '639,21 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 639.207,65' },
    'C-302': { area: '630,13 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 630.132,65' },
    'C-303': { area: '532,50 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 532.502,16' },
    'C-304': { area: '525,47 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 525.466,16' },
    'C-305': { area: '532,50 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 532.502,16' },
    'C-306': { area: '525,47 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 525.466,16' },
    'C-307': { area: '639,21 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 639.207,65' },
    'C-308': { area: '649,23 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 649.228,67' },
    
    'C-401': { area: '676,42 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 676.421,98' },
    'C-402': { area: '654,05 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 654.050,62' },
    'C-403': { area: '536,37 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 536.374,81' },
    'C-404': { area: '529,28 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 529.277,81' },
    'C-405': { area: '536,37 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 536.374,81' },
    'C-406': { area: '518,80 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 518.797,21' },
    'C-407': { area: '697,08 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 697.082,75' },
    'C-408': { area: '654,05 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 654.050,62' },
    
    'C-501': { area: '681,41 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 681.414,66' },
    'C-502': { area: '672,19 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 672.192,66' },
    'C-503': { area: '540,25 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 540.247,45' },
    'C-504': { area: '522,54 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 522.535,76' },
    'C-505': { area: '540,25 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 540.247,45' },
    'C-506': { area: '533,09 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 533.094,45' },
    'C-507': { area: '681,41 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 681.414,66' },
    'C-508': { area: '658,87 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 658.871,07' },
    
    'C-601': { area: '686,41 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 686.407,34' },
    'C-602': { area: '663,69 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 663.692,45' },
    'C-603': { area: '544,12 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 544.118,10' },
    'C-604': { area: '536,91 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 536.909,10' },
    'C-605': { area: '544,12 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 544.118,10' },
    'C-606': { area: '536,91 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 536.909,10' },
    'C-607': { area: '686,41 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 686.407,34' },
    'C-608': { area: '663,69 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 663.692,45' },
    
    'C-701': { area: '691,40 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 691.402,02' },
    'C-702': { area: '668,51 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 668.511,88' },
    'C-703': { area: '547,99 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 547.989,75' },
    'C-704': { area: '530,01 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 530.010,87' },
    'C-705': { area: '547,99 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 547.989,75' },
    'C-706': { area: '530,01 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 530.010,87' },
    'C-707': { area: '712,06 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 712.062,79' },
    'C-708': { area: '668,51 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 668.511,88' },
    
    'C-801': { area: '696,39 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 696.393,00' },
    'C-802': { area: '673,33 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 673.332,60' },
    'C-803': { area: '551,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 551.862,39' },
    'C-804': { area: '533,75 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 533.749,40' },
    'C-805': { area: '551,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 551.862,39' },
    'C-806': { area: '533,75 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 533.749,40' },
    'C-807': { area: '696,39 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 696.393,00' },
    'C-808': { area: '673,33 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 673.332,60' },
    
    'C-901': { area: '701,39 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 701.385,00' },
    'C-902': { area: '678,15 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 678.154,32' },
    'C-903': { area: '555,73 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 555.734,04' },
    'C-904': { area: '537,49 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 537.486,98' },
    'C-905': { area: '555,73 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 555.734,04' },
    'C-906': { area: '548,35 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 548.352,04' },
    'C-907': { area: '701,39 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 701.385,00' },
    'C-908': { area: '678,15 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 678.154,32' },
    
    // Cobertura Bloco C
    'C-1001': { area: '132,65 m²', tipologia: 'COBERTURA 3Q (2 SUÍTES)', sol: 'Nascente', vagas: '2', valor: 'R$ 1.233.653,00' },
    'C-1002': { area: '132,65 m²', tipologia: 'COBERTURA 3Q (2 SUÍTES)', sol: 'Poente', vagas: '2', valor: 'R$ 1.216.874,00' },
    'C-1007': { area: '132,65 m²', tipologia: 'COBERTURA 3Q (2 SUÍTES)', sol: 'Nascente', vagas: '2', valor: 'R$ 1.233.653,00' },
    'C-1008': { area: '132,65 m²', tipologia: 'COBERTURA 3Q (2 SUÍTES)', sol: 'Poente', vagas: '2', valor: 'R$ 1.216.874,00' },
    'C-1003': { area: '132,65 m²', tipologia: 'COBERTURA 3Q (2 SUÍTES)', sol: 'Nascente', vagas: '2', valor: 'R$ 1.233.653,00' },
    'C-1004': { area: '132,65 m²', tipologia: 'COBERTURA 3Q (2 SUÍTES)', sol: 'Poente', vagas: '2', valor: 'R$ 1.216.874,00' },
    
    'D-1': { area: '110,52 m²', tipologia: '3Q + AP', sol: 'Nascente', vagas: '2', valor: 'R$ 791.347,00' },
    'D-2': { area: '110,92 m²', tipologia: '3Q + AP', sol: 'Poente', vagas: '2', valor: 'R$ 781.959,88' },
    'D-4': { area: '81,11 m²', tipologia: '2Q + AP', sol: 'Nascente', vagas: '1', valor: 'R$ 590.667,30' },
    'D-6': { area: '81,11 m²', tipologia: '2Q + AP', sol: 'Nascente', vagas: '1', valor: 'R$ 590.667,30' },
    'D-7': { area: '110,52 m²', tipologia: '3Q + AP', sol: 'Nascente', vagas: '2', valor: 'R$ 791.347,00' },
    'D-8': { area: '110,92 m²', tipologia: '3Q + AP', sol: 'Poente', vagas: '2', valor: 'R$ 781.959,88' },
    
    // Bloco D - 1º ao 10º Andar
    'D-101': { area: '585,62 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 585.616,00' },
    'D-102': { area: '577,33 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 577.332,55' },
    'D-103': { area: '524,76 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 524.759,87' },
    'D-104': { area: '517,84 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 517.836,87' },
    'D-105': { area: '524,76 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 524.758,87' },
    'D-106': { area: '507,58 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 507.580,55' },
    'D-107': { area: '585,62 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 585.616,00' },
    'D-108': { area: '565,91 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 565.908,18' },
    
    'D-201': { area: '590,61 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 590.610,70' },
    'D-202': { area: '582,25 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 582.251,70' },
    'D-203': { area: '528,63 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 528.631,52' },
    'D-204': { area: '521,65 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 521.651,52' },
    'D-205': { area: '528,63 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 528.632,52' },
    'D-206': { area: '511,32 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 511.319,13' },
    'D-207': { area: '590,61 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 590.610,70' },
    'D-208': { area: '644,41 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 644.408,87' },
    
    'D-301': { area: '671,43 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 671.426,30' },
    'D-302': { area: '662,35 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 662.354,30' },
    'D-303': { area: '532,50 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 532.502,16' },
    'D-304': { area: '525,47 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 525.466,16' },
    'D-305': { area: '532,50 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 532.502,16' },
    'D-306': { area: '515,06 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 515.059,66' },
    'D-307': { area: '660,99 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 660.991,30' },
    'D-308': { area: '649,23 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 649.228,67' },
    
    'D-401': { area: '676,42 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 676.421,98' },
    'D-402': { area: '654,05 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 654.050,62' },
    'D-403': { area: '536,37 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 536.374,81' },
    'D-404': { area: '518,80 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 518.797,21' },
    'D-405': { area: '533,72 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 533.717,36' },
    'D-406': { area: '529,28 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 529.278,81' },
    'D-407': { area: '676,42 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 676.421,98' },
    'D-408': { area: '654,05 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 654.050,62' },
    
    'D-501': { area: '681,41 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 681.414,66' },
    'D-502': { area: '658,87 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 658.871,07' },
    'D-503': { area: '540,25 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 540.247,05' },
    'D-504': { area: '522,54 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 522.535,76' },
    'D-505': { area: '540,25 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 540.246,45' },
    'D-506': { area: '533,09 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 533.094,45' },
    'D-507': { area: '681,41 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 681.414,66' },
    'D-508': { area: '658,87 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 658.871,07' },
    
    'D-601': { area: '686,41 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 686.407,34' },
    'D-602': { area: '663,69 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 663.692,45' },
    'D-603': { area: '544,12 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 544.118,10' },
    'D-604': { area: '526,27 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 526.271,34' },
    'D-605': { area: '544,12 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 544.118,10' },
    'D-606': { area: '526,27 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 526.271,34' },
    'D-607': { area: '686,41 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 686.407,34' },
    'D-608': { area: '663,69 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 663.692,45' },
    
    'D-701': { area: '691,40 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 691.402,02' },
    'D-702': { area: '668,51 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 668.511,88' },
    'D-703': { area: '547,99 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 547.989,75' },
    'D-704': { area: '530,01 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 530.010,87' },
    'D-705': { area: '547,99 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 547.989,75' },
    'D-706': { area: '530,01 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 530.010,87' },
    'D-707': { area: '691,40 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 691.402,02' },
    'D-708': { area: '668,51 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 668.511,88' },
    
    'D-801': { area: '696,39 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 696.394,00' },
    'D-802': { area: '673,33 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 673.332,60' },
    'D-803': { area: '551,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 551.862,39' },
    'D-804': { area: '533,75 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 533.749,40' },
    'D-805': { area: '551,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 551.862,39' },
    'D-806': { area: '533,75 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 533.749,40' },
    'D-807': { area: '696,39 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 696.394,00' },
    'D-808': { area: '673,33 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 673.332,60' },
    
    'D-901': { area: '701,39 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 701.385,00' },
    'D-902': { area: '678,15 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 678.154,32' },
    'D-903': { area: '555,73 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 555.734,04' },
    'D-904': { area: '537,49 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 537.486,98' },
    'D-905': { area: '555,73 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 555.734,04' },
    'D-906': { area: '537,49 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 537.486,98' },
    'D-907': { area: '701,39 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 701.385,00' },
    'D-908': { area: '678,15 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 678.153,34' },
    
    'D-1001': { area: '706,38 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 706.379,00' },
    'D-1002': { area: '675,91 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 675.913,00' },
    'D-1003': { area: '559,61 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 559.605,69' },
    'D-1004': { area: '541,23 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 541.227,52' },
    'D-1005': { area: '559,61 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 559.605,69' },
    'D-1006': { area: '541,23 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 541.227,52' },
    'D-1007': { area: '706,38 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 706.379,00' },
    'D-1008': { area: '682,97 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 682.973,08' },
    'D-1101': { area: '132,65 m²', tipologia: 'COBERTURA 3Q (2 SUÍTES)', sol: 'Nascente', vagas: '2', valor: 'R$ 1.233.653,00' },
    'D-1102': { area: '132,65 m²', tipologia: 'COBERTURA 3Q (2 SUÍTES)', sol: 'Poente', vagas: '2', valor: 'R$ 1.233.653,00' },
    'D-1107': { area: '132,65 m²', tipologia: 'COBERTURA 3Q (2 SUÍTES)', sol: 'Nascente', vagas: '2', valor: 'R$ 1.233.653,00' },
    'D-1108': { area: '132,65 m²', tipologia: 'COBERTURA 3Q (2 SUÍTES)', sol: 'Poente', vagas: '2', valor: 'R$ 1.233.653,00' }
  };

  const terreoSequence = [1, 2, 4, 6, 7, 8];

  blocks.forEach(block => {
    const structure = blockStructure[block];
    const floors = Object.keys(structure.floors);
    
    floors.forEach(floor => {
      const unitsPerFloor = structure.floors[floor];
      
      for (let i = 1; i <= unitsPerFloor; i++) {
        let aptNumber;
        if (floor === '11') {
          if (block === 'A' || block === 'D') {
            aptNumber = ['1101', '1102', '1107', '1108'][i-1];
          } else {
            aptNumber = ['1001', '1002', '1007', '1008'][i-1];
          }
        } else if (floor === '0') {
          aptNumber = terreoSequence[i-1].toString();
        } else {
          aptNumber = (parseInt(floor) * 100 + i).toString();
        }
        
        let sol;
        if (floor === '0') {
          const positionInSequence = terreoSequence[i-1];
          sol = (positionInSequence === 1 || positionInSequence === 4 || positionInSequence === 7) ? 'Nascente' : 'Poente';
        } else {
          sol = i % 2 === 1 ? 'Nascente' : 'Poente';
        }
        
        const tipologia = floor === '0' ? 
          (terreoSequence[i-1] <= 2 || terreoSequence[i-1] >= 7 ? '3Q + AP' : '2Q + AP') : 
          (floor === '11' || floor === '10' && (block === 'B' || block === 'C') ? '3Q Cobertura' : 
          (i <= 2 || i >= 7 ? '3Q' : '2Q'));
        
        let status = statusData[`${block}-${aptNumber}`] || 'Disponível';
        if (status === 'Vendida') status = 'vendido';
        else if (status === 'Disponível') status = 'disponivel';
        else if (status === 'Quitado') status = 'quitado';
        else if (status === 'Mirror') status = 'mirror';
        
        const data = unitData[`${block}-${aptNumber}`] || {
          area: tipologia.includes('3Q') ? '72,83 m²' : '59,86 m²',
          tipologia: tipologia,
          sol: sol,
          vagas: tipologia.includes('3Q') ? '2' : '1',
          valor: 'R$ 600.000,00'
        };
        
        allUnits.push({
          apt: aptNumber,
          bl: block,
          andar: floor,
          final: i.toString(),
          areaApto: tipologia.includes('3Q') ? '72,83' : '59,86',
          areaGarden: floor === '0' ? (tipologia.includes('3Q') ? '38,35' : '21,59') : 
                     ((floor === '11' || (floor === '10' && (block === 'B' || block === 'C'))) ? '14,49' : ''),
          areaTotal: data.area,
          tipologia: data.tipologia,
          sol: data.sol,
          vagas: data.vagas,
          vagaNum: Math.floor(Math.random() * 500),
          avaliacao: tipologia.includes('3Q') ? 
            (floor === '11' || (floor === '10' && (block === 'B' || block === 'C')) ? 'R$ 1.260.000,00' : 'R$ 829.000,00') : 
            'R$ 619.000,00',
          ba: 'R$ 37.653,00',
          venda: data.valor,
          status: status
        });
      }
    });
  });
  
  return allUnits;
}