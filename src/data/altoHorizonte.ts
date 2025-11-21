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

  // Valores exatos da coluna "VALOR DE VENDA" do arquivo XLS
  const unitData = {
    // Bloco A - Térreo (numeração corrigida: 1, 2, 4, 6, 7, 8)
    'A-1': { area: '110,52 m²', tipologia: '3Q + AP', sol: 'Nascente', vagas: '2', valor: 'R$ 729.145,75' },
    'A-2': { area: '110,92 m²', tipologia: '3Q + AP', sol: 'Poente', vagas: '2', valor: 'R$ 723.756,39' },
    'A-4': { area: '81,11 m²', tipologia: '2Q + AP', sol: 'Nascente', vagas: '1', valor: 'R$ 545.220,40' },
    'A-6': { area: '81,11 m²', tipologia: '2Q + AP', sol: 'Nascente', vagas: '1', valor: 'R$ 545.220,40' },
    'A-7': { area: '110,52 m²', tipologia: '3Q + AP', sol: 'Nascente', vagas: '2', valor: 'R$ 729.145,75' },
    'A-8': { area: '110,92 m²', tipologia: '3Q + AP', sol: 'Poente', vagas: '2', valor: 'R$ 723.756,39' },
    
    // Bloco A - 1º ao 10º Andar
    'A-101': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 623.904,18' },
    'A-102': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 610.996,14' },
    'A-103': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 492.944,00' },
    'A-104': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 483.861,79' },
    'A-105': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 492.944,00' },
    'A-106': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 483.861,79' },
    'A-107': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 623.904,14' },
    'A-108': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 613.828,14' },
    
    'A-201': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 631.559,58' },
    'A-202': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 618.592,58' },
    'A-203': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 498.763,00' },
    'A-204': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 489.633,19' },
    'A-205': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 498.762,00' },
    'A-206': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 489.633,19' },
    'A-207': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 610.923,58' },
    'A-208': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 632.677,43' },
    
    'A-301': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 648.929,44' },
    'A-302': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 638.607,12' },
    'A-303': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 503.282,00' },
    'A-304': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 494.115,46' },
    'A-305': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 503.282,00' },
    'A-306': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 494.115,46' },
    'A-307': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 648.929,12' },
    'A-308': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 641.438,12' },
    
    'A-401': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 653.749,45' },
    'A-402': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 643.388,48' },
    'A-403': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 506.930,00' },
    'A-404': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 497.732,35' },
    'A-405': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 506.929,00' },
    'A-406': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 497.732,35' },
    'A-407': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 653.749,48' },
    'A-408': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 643.388,48' },
    
    'A-501': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 658.608,16' },
    'A-502': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 648.210,16' },
    'A-503': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 510.601,00' },
    'A-504': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 501.377,12' },
    'A-505': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 510.601,00' },
    'A-506': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 501.377,12' },
    'A-507': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 658.608,16' },
    'A-508': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 648.210,74' },
    
    'A-601': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 663.467,84' },
    'A-602': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 653.029,84' },
    'A-603': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 514.277,00' },
    'A-604': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 505.023,89' },
    'A-605': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 514.277,00' },
    'A-606': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 505.023,89' },
    'A-607': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 663.467,84' },
    'A-608': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 653.028,90' },
    
    'A-701': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 668.367,50' },
    'A-702': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 657.889,85' },
    'A-703': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 517.980,00' },
    'A-704': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 508.698,53' },
    'A-705': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 517.980,00' },
    'A-706': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 508.699,44' },
    'A-707': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 668.367,85' },
    'A-708': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 657.889,85' },
    
    'A-801': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 674.540,89' },
    'A-802': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 664.011,89' },
    'A-803': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 522.647,00' },
    'A-804': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 513.327,84' },
    'A-805': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 522.647,00' },
    'A-806': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 513.327,84' },
    'A-807': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 674.541,01' },
    'A-808': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 683.223,01' },
    
    'A-901': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 682.319,89' },
    'A-902': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 671.729,89' },
    'A-903': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 528.778,00' },
    'A-904': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 519.408,07' },
    'A-905': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 528.778,00' },
    'A-906': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 519.408,07' },
    'A-907': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 682.319,89' },
    'A-908': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 671.729,89' },
    
    'A-1001': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 690.849,53' },
    'A-1002': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 680.194,53' },
    'A-1003': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 534.985,06' },
    'A-1004': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 525.565,94' },
    'A-1005': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 534.985,06' },
    'A-1006': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 525.566,06' },
    'A-1007': { area: '72,83 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 690.849,53' },
    'A-1008': { area: '72,83 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 680.194,53' },
    
    // Cobertura Bloco A
    'A-1101': { area: '132,65 m²', tipologia: 'COBERTURA 3Q (2 SUÍTES)', sol: 'Nascente', vagas: '2', valor: 'R$ 1.244.719,00' },
    'A-1102': { area: '132,65 m²', tipologia: 'COBERTURA 3Q (2 SUÍTES)', sol: 'Poente', vagas: '2', valor: 'R$ 1.232.500,00' },
    'A-1107': { area: '132,65 m²', tipologia: 'COBERTURA 3Q (2 SUÍTES)', sol: 'Nascente', vagas: '2', valor: 'R$ 1.244.719,00' },
    'A-1108': { area: '132,65 m²', tipologia: 'COBERTURA 3Q (2 SUÍTES)', sol: 'Poente', vagas: '2', valor: 'R$ 1.232.500,00' },
    
    // Bloco B - Térreo
    'B-1': { area: '110,52 m²', tipologia: '3Q + AP', sol: 'Poente', vagas: '2', valor: 'R$ 723.566,02' },
    'B-2': { area: '110,92 m²', tipologia: '3Q + AP', sol: 'Nascente', vagas: '2', valor: 'R$ 729.334,38' },
    'B-4': { area: '81,11 m²', tipologia: '2Q + AP', sol: 'Poente', vagas: '1', valor: 'R$ 539.640,40' },
    'B-6': { area: '81,11 m²', tipologia: '2Q + AP', sol: 'Poente', vagas: '1', valor: 'R$ 539.640,40' },
    'B-7': { area: '110,52 m²', tipologia: '3Q + AP', sol: 'Poente', vagas: '2', valor: 'R$ 723.565,75' },
    'B-8': { area: '110,92 m²', tipologia: '3Q + AP', sol: 'Nascente', vagas: '2', valor: 'R$ 729.334,38' },
    
    // Bloco B - 1º ao 9º Andar
    'B-101': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 613.828,14' },
    'B-102': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 623.904,14' },
    'B-103': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 483.861,79' },
    'B-104': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 492.944,00' },
    'B-105': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 483.861,79' },
    'B-106': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 492.944,00' },
    'B-107': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 613.828,14' },
    'B-108': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 623.904,20' },
    
    'B-201': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 621.423,58' },
    'B-202': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 631.559,58' },
    'B-203': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 489.633,19' },
    'B-204': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 498.762,00' },
    'B-205': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 489.633,19' },
    'B-206': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 498.762,00' },
    'B-207': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 621.423,58' },
    'B-208': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 628.727,58' },
    
    'B-301': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 638.607,12' },
    'B-302': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 648.929,12' },
    'B-303': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 494.115,46' },
    'B-304': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 503.282,00' },
    'B-305': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 494.115,46' },
    'B-306': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 503.282,00' },
    'B-307': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 638.607,12' },
    'B-308': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 648.929,12' },
    
    'B-401': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 643.388,48' },
    'B-402': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 653.749,48' },
    'B-403': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 497.732,35' },
    'B-404': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 506.929,00' },
    'B-405': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 497.732,08' },
    'B-406': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 506.930,00' },
    'B-407': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 643.388,48' },
    'B-408': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 653.749,48' },
    
    'B-501': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 648.210,49' },
    'B-502': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 658.608,16' },
    'B-503': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 501.377,12' },
    'B-504': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 510.601,00' },
    'B-505': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 501.377,12' },
    'B-506': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 510.601,00' },
    'B-507': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 648.210,16' },
    'B-508': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 658.608,16' },
    
    'B-601': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 653.029,84' },
    'B-602': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 663.467,84' },
    'B-603': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 505.023,89' },
    'B-604': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 514.277,00' },
    'B-605': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 505.023,89' },
    'B-606': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 514.277,00' },
    'B-607': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 653.029,11' },
    'B-608': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 663.467,84' },
    
    'B-701': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 657.889,85' },
    'B-702': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 668.367,85' },
    'B-703': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 508.699,53' },
    'B-704': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 517.980,00' },
    'B-705': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 508.698,53' },
    'B-706': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 517.980,00' },
    'B-707': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 657.890,12' },
    'B-708': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 668.366,85' },
    
    'B-801': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 664.011,89' },
    'B-802': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 674.541,01' },
    'B-803': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 513.327,84' },
    'B-804': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 522.647,00' },
    'B-805': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 513.327,84' },
    'B-806': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 522.647,00' },
    'B-807': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 664.012,01' },
    'B-808': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 674.541,01' },
    
    'B-901': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 671.729,89' },
    'B-902': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 682.319,89' },
    'B-903': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 519.408,07' },
    'B-904': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 528.778,00' },
    'B-905': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 519.408,07' },
    'B-906': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 528.778,00' },
    'B-907': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 671.730,00' },
    'B-908': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 682.319,89' },
    
    // Cobertura Bloco B
    'B-1001': { area: '132,65 m²', tipologia: 'COBERTURA 3Q', sol: 'Poente', vagas: '2', valor: 'R$ 1.229.667,79' },
    'B-1002': { area: '132,65 m²', tipologia: 'COBERTURA 3Q', sol: 'Nascente', vagas: '2', valor: 'R$ 1.244.719,00' },
    'B-1007': { area: '132,65 m²', tipologia: 'COBERTURA 3Q', sol: 'Poente', vagas: '2', valor: 'R$ 1.232.500,00' },
    'B-1008': { area: '132,65 m²', tipologia: 'COBERTURA 3Q', sol: 'Nascente', vagas: '2', valor: 'R$ 1.247.550,92' },
    
    // Bloco C - Térreo
    'C-1': { area: '110,52 m²', tipologia: '3Q + AP', sol: 'Poente', vagas: '2', valor: 'R$ 723.565,75' },
    'C-2': { area: '110,92 m²', tipologia: '3Q + AP', sol: 'Nascente', vagas: '2', valor: 'R$ 729.333,60' },
    'C-4': { area: '81,11 m²', tipologia: '2Q + AP', sol: 'Poente', vagas: '1', valor: 'R$ 539.640,40' },
    'C-6': { area: '81,11 m²', tipologia: '2Q + AP', sol: 'Poente', vagas: '1', valor: 'R$ 539.640,40' },
    'C-7': { area: '110,52 m²', tipologia: '3Q + AP', sol: 'Poente', vagas: '2', valor: 'R$ 723.565,75' },
    'C-8': { area: '110,92 m²', tipologia: '3Q + AP', sol: 'Nascente', vagas: '2', valor: 'R$ 729.334,38' },
    
    // Bloco C - 1º ao 9º Andar
    'C-101': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 613.828,14' },
    'C-102': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 623.904,14' },
    'C-103': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 483.861,79' },
    'C-104': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 492.944,00' },
    'C-105': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 483.861,79' },
    'C-106': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 492.944,00' },
    'C-107': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 613.828,14' },
    'C-108': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 623.904,14' },
    
    'C-201': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 621.423,58' },
    'C-202': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 628.727,58' },
    'C-203': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 489.633,19' },
    'C-204': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 498.762,00' },
    'C-205': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 489.633,19' },
    'C-206': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 498.762,00' },
    'C-207': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 621.423,58' },
    'C-208': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 582.251,75' },
    
    'C-301': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 641.438,12' },
    'C-302': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 648.929,12' },
    'C-303': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 525.466,16' },
    'C-304': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 536.374,81' },
    'C-305': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 525.466,16' },
    'C-306': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 536.374,81' },
    'C-307': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 638.607,12' },
    'C-308': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 649.228,67' },
    
    'C-401': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 643.388,48' },
    'C-402': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 653.749,48' },
    'C-403': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 536.374,81' },
    'C-404': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 529.277,81' },
    'C-405': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 536.374,81' },
    'C-406': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 518.797,21' },
    'C-407': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 643.388,48' },
    'C-408': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 653.749,48' },
    
    'C-501': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 647.808,32' },
    'C-502': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 658.608,16' },
    'C-503': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 540.247,45' },
    'C-504': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 522.535,76' },
    'C-505': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 540.247,45' },
    'C-506': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 533.094,45' },
    'C-507': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 648.210,16' },
    'C-508': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 658.608,16' },
    
    'C-601': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 653.029,84' },
    'C-602': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 663.467,84' },
    'C-603': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 544.118,10' },
    'C-604': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 536.909,10' },
    'C-605': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 544.118,10' },
    'C-606': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 536.908,10' },
    'C-607': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 655.863,84' },
    'C-608': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 663.467,84' },
    
    'C-701': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 660.720,85' },
    'C-702': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 668.367,21' },
    'C-703': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 547.989,75' },
    'C-704': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 530.010,87' },
    'C-705': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 547.989,75' },
    'C-706': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 530.010,87' },
    'C-707': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 633.360,15' },
    'C-708': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 668.367,85' },
    
    'C-801': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 664.012,26' },
    'C-802': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 673.332,60' },
    'C-803': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 551.862,39' },
    'C-804': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 533.749,40' },
    'C-805': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 551.862,39' },
    'C-806': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 533.749,40' },
    'C-807': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 664.012,01' },
    'C-808': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 673.332,60' },
    
    'C-901': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 671.729,89' },
    'C-902': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 678.154,32' },
    'C-903': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 555.734,04' },
    'C-904': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 537.486,98' },
    'C-905': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 555.734,04' },
    'C-906': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 548.352,04' },
    'C-907': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 671.730,00' },
    'C-908': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 678.154,32' },
    
    // Cobertura Bloco C
    'C-1001': { area: '132,65 m²', tipologia: 'COBERTURA 3Q', sol: 'Poente', vagas: '2', valor: 'R$ 1.232.500,00' },
    'C-1002': { area: '132,65 m²', tipologia: 'COBERTURA 3Q', sol: 'Nascente', vagas: '2', valor: 'R$ 1.244.719,00' },
    'C-1007': { area: '132,65 m²', tipologia: 'COBERTURA 3Q', sol: 'Poente', vagas: '2', valor: 'R$ 1.232.500,00' },
    'C-1008': { area: '132,65 m²', tipologia: 'COBERTURA 3Q', sol: 'Nascente', vagas: '2', valor: 'R$ 1.244.719,00' },
    
    // Bloco D - Térreo
    'D-1': { area: '110,52 m²', tipologia: '3Q + AP', sol: 'Poente', vagas: '2', valor: 'R$ 723.565,75' },
    'D-2': { area: '110,92 m²', tipologia: '3Q + AP', sol: 'Nascente', vagas: '2', valor: 'R$ 729.334,38' },
    'D-4': { area: '81,11 m²', tipologia: '2Q + AP', sol: 'Poente', vagas: '1', valor: 'R$ 539.640,40' },
    'D-6': { area: '81,11 m²', tipologia: '2Q + AP', sol: 'Poente', vagas: '1', valor: 'R$ 539.640,40' },
    'D-7': { area: '110,52 m²', tipologia: '3Q + AP', sol: 'Poente', vagas: '2', valor: 'R$ 723.565,75' },
    'D-8': { area: '110,92 m²', tipologia: '3Q + AP', sol: 'Nascente', vagas: '2', valor: 'R$ 729.333,38' },
    
    // Bloco D - 1º ao 10º Andar
    'D-101': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 610.996,14' },
    'D-102': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 623.904,14' },
    'D-103': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 483.861,79' },
    'D-104': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 492.944,00' },
    'D-105': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 483.861,79' },
    'D-106': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 492.944,00' },
    'D-107': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 598.900,14' },
    'D-108': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 621.072,14' },
    
    'D-201': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 621.423,60' },
    'D-202': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 628.727,58' },
    'D-203': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 489.633,19' },
    'D-204': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 498.763,00' },
    'D-205': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 489.633,19' },
    'D-206': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 498.763,00' },
    'D-207': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 606.342,58' },
    'D-208': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 631.559,58' },
    
    'D-301': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 638.607,12' },
    'D-302': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 648.929,12' },
    'D-303': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 525.466,16' },
    'D-304': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 503.282,00' },
    'D-305': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 525.466,16' },
    'D-306': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 503.282,00' },
    'D-307': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 608.378,12' },
    'D-308': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 648.929,12' },
    
    'D-401': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 643.388,48' },
    'D-402': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 653.749,48' },
    'D-403': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 536.374,81' },
    'D-404': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 518.797,21' },
    'D-405': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 533.717,36' },
    'D-406': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 529.278,81' },
    'D-407': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 630.644,48' },
    'D-408': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 653.749,48' },
    
    'D-501': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 648.210,16' },
    'D-502': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 658.608,16' },
    'D-503': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 540.247,05' },
    'D-504': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 522.535,76' },
    'D-505': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 540.246,45' },
    'D-506': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 533.094,45' },
    'D-507': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 635.368,16' },
    'D-508': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 658.608,16' },
    
    'D-601': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 653.029,84' },
    'D-602': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 663.467,84' },
    'D-603': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 544.118,10' },
    'D-604': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 526.271,34' },
    'D-605': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 544.118,10' },
    'D-606': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 526.271,34' },
    'D-607': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 640.275,25' },
    'D-608': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 663.467,84' },
    
    'D-701': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 657.889,85' },
    'D-702': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 668.367,85' },
    'D-703': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 547.989,75' },
    'D-704': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 530.010,87' },
    'D-705': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 547.989,75' },
    'D-706': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 530.010,87' },
    'D-707': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 644.854,85' },
    'D-708': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 668.367,85' },
    
    'D-801': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 664.011,89' },
    'D-802': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 674.541,01' },
    'D-803': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 551.862,39' },
    'D-804': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 533.749,40' },
    'D-805': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 551.862,39' },
    'D-806': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 533.749,40' },
    'D-807': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 664.012,01' },
    'D-808': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 673.332,60' },
    
    'D-901': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 671.730,15' },
    'D-902': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 678.154,32' },
    'D-903': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 555.734,04' },
    'D-904': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 537.486,98' },
    'D-905': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 555.734,04' },
    'D-906': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 537.486,98' },
    'D-907': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 671.793,89' },
    'D-908': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 678.153,34' },
    
    'D-1001': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 680.194,53' },
    'D-1002': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 690.849,53' },
    'D-1003': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 559.605,69' },
    'D-1004': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 541.227,52' },
    'D-1005': { area: '59,86 m²', tipologia: '2Q', sol: 'Poente', vagas: '1', valor: 'R$ 559.605,69' },
    'D-1006': { area: '59,86 m²', tipologia: '2Q', sol: 'Nascente', vagas: '1', valor: 'R$ 541.227,52' },
    'D-1007': { area: '72,80 m²', tipologia: '3Q', sol: 'Poente', vagas: '1', valor: 'R$ 666.714,53' },
    'D-1008': { area: '72,80 m²', tipologia: '3Q', sol: 'Nascente', vagas: '1', valor: 'R$ 690.849,53' },
    
    // Cobertura Bloco D
    'D-1101': { area: '132,65 m²', tipologia: 'COBERTURA 3Q', sol: 'Poente', vagas: '2', valor: 'R$ 1.232.500,00' },
    'D-1102': { area: '132,65 m²', tipologia: 'COBERTURA 3Q', sol: 'Nascente', vagas: '2', valor: 'R$ 1.244.719,00' },
    'D-1107': { area: '132,65 m²', tipologia: 'COBERTURA 3Q', sol: 'Poente', vagas: '2', valor: 'R$ 1.232.500,00' },
    'D-1108': { area: '132,65 m²', tipologia: 'COBERTURA 3Q', sol: 'Nascente', vagas: '2', valor: 'R$ 1.244.719,00' }
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