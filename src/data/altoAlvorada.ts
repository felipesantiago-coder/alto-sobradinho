import { PropertyInfo, Unit } from './altoHorizonte';

export const altoAlvoradaInfo: PropertyInfo = {
  name: "ALTO DA ALVORADA",
  subtitle: "RESIDENCIAL",
  description: "Lista organizada de todas as 344 unidades por bloco e andar",
  totalUnits: 344,
  blocksAndUnits: [
    { block: "A e D", count: 90 },
    { block: "B e C", count: 82 }
  ],
  colors: {
    primary: "#2c3e50",
    secondary: "#3498db",
    accent: "#e74c3c",
    light: "#ecf0f1",
    dark: "#34495e",
    nascente: "#f39c12",
    poente: "#9b59b6",
    disponivel: "#2ecc71",
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

export function generateAltoAlvoradaUnits(): Unit[] {
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
    'A-1': 'vendido', 'A-2': 'vendido', 'A-4': 'vendido', 'A-6': 'vendido',
    'A-7': 'disponivel', 'A-8': 'vendido', 'A-101': 'vendido', 'A-102': 'vendido',
    'A-103': 'vendido', 'A-104': 'vendido', 'A-105': 'disponivel', 'A-106': 'vendido',
    'A-107': 'vendido', 'A-108': 'vendido', 'A-201': 'disponivel', 'A-202': 'vendido',
    'A-203': 'vendido', 'A-204': 'vendido', 'A-205': 'vendido', 'A-206': 'vendido',
    'A-207': 'vendido', 'A-208': 'vendido', 'A-301': 'disponivel', 'A-302': 'disponivel',
    'A-303': 'vendido', 'A-304': 'vendido', 'A-305': 'vendido', 'A-306': 'vendido',
    'A-307': 'disponivel', 'A-308': 'vendido', 'A-401': 'disponivel', 'A-402': 'vendido',
    'A-403': 'vendido', 'A-404': 'vendido', 'A-405': 'vendido', 'A-406': 'vendido',
    'A-407': 'vendido', 'A-408': 'vendido', 'A-501': 'disponivel', 'A-502': 'disponivel',
    'A-503': 'vendido', 'A-504': 'vendido', 'A-505': 'vendido', 'A-506': 'vendido',
    'A-507': 'vendido', 'A-508': 'vendido', 'A-601': 'disponivel', 'A-602': 'disponivel',
    'A-603': 'vendido', 'A-604': 'vendido', 'A-605': 'vendido', 'A-606': 'vendido',
    'A-607': 'disponivel', 'A-608': 'vendido', 'A-701': 'disponivel', 'A-702': 'disponivel',
    'A-703': 'vendido', 'A-704': 'vendido', 'A-705': 'vendido', 'A-706': 'vendido',
    'A-707': 'vendido', 'A-708': 'reservado-revisao', 'A-801': 'disponivel', 'A-802': 'disponivel',
    'A-803': 'vendido', 'A-804': 'vendido', 'A-805': 'vendido', 'A-806': 'vendido',
    'A-807': 'disponivel', 'A-808': 'vendido', 'A-901': 'vendido', 'A-902': 'disponivel',
    'A-903': 'vendido', 'A-904': 'vendido', 'A-905': 'vendido', 'A-906': 'disponivel',
    'A-907': 'vendido', 'A-908': 'disponivel', 'A-1001': 'vendido', 'A-1002': 'disponivel',
    'A-1003': 'vendido', 'A-1004': 'mirror', 'A-1005': 'vendido', 'A-1006': 'disponivel',
    'A-1007': 'vendido', 'A-1008': 'disponivel', 'A-1101': 'vendido', 'A-1102': 'disponivel',
    'A-1107': 'vendido', 'A-1108': 'disponivel',
    
    'B-1': 'disponivel', 'B-2': 'disponivel', 'B-4': 'vendido', 'B-6': 'vendido',
    'B-7': 'vendido', 'B-8': 'disponivel', 'B-101': 'disponivel', 'B-102': 'vendido',
    'B-103': 'disponivel', 'B-104': 'vendido', 'B-105': 'disponivel', 'B-106': 'vendido',
    'B-107': 'disponivel', 'B-108': 'vendido', 'B-201': 'disponivel', 'B-202': 'vendido',
    'B-203': 'disponivel', 'B-204': 'vendido', 'B-205': 'disponivel', 'B-206': 'reservado',
    'B-207': 'vendido', 'B-208': 'reservado', 'B-301': 'vendido', 'B-302': 'disponivel',
    'B-303': 'disponivel', 'B-304': 'disponivel', 'B-305': 'disponivel', 'B-306': 'vendido',
    'B-307': 'disponivel', 'B-308': 'vendido', 'B-401': 'vendido', 'B-402': 'disponivel',
    'B-403': 'disponivel', 'B-404': 'vendido', 'B-405': 'disponivel', 'B-406': 'vendido',
    'B-407': 'disponivel', 'B-408': 'reservado', 'B-501': 'disponivel', 'B-502': 'disponivel',
    'B-503': 'vendido', 'B-504': 'vendido', 'B-505': 'vendido', 'B-506': 'vendido',
    'B-507': 'vendido', 'B-508': 'disponivel', 'B-601': 'disponivel', 'B-602': 'disponivel',
    'B-603': 'disponivel', 'B-604': 'disponivel', 'B-605': 'vendido', 'B-606': 'vendido',
    'B-607': 'disponivel', 'B-608': 'disponivel', 'B-701': 'disponivel', 'B-702': 'disponivel',
    'B-703': 'disponivel', 'B-704': 'disponivel', 'B-705': 'disponivel', 'B-706': 'disponivel',
    'B-707': 'disponivel', 'B-708': 'disponivel', 'B-801': 'disponivel', 'B-802': 'disponivel',
    'B-803': 'disponivel', 'B-804': 'disponivel', 'B-805': 'disponivel', 'B-806': 'disponivel',
    'B-807': 'disponivel', 'B-808': 'disponivel', 'B-901': 'reservado', 'B-902': 'disponivel',
    'B-903': 'disponivel', 'B-904': 'disponivel', 'B-905': 'vendido', 'B-906': 'disponivel',
    'B-907': 'disponivel', 'B-908': 'disponivel', 'B-1001': 'disponivel', 'B-1002': 'disponivel',
    'B-1007': 'disponivel', 'B-1008': 'disponivel',
    
    'C-1': 'reservado-revisao', 'C-2': 'disponivel', 'C-4': 'vendido', 'C-6': 'vendido',
    'C-7': 'disponivel', 'C-8': 'disponivel', 'C-101': 'vendido', 'C-102': 'vendido',
    'C-103': 'vendido', 'C-104': 'vendido', 'C-105': 'quitado', 'C-106': 'vendido',
    'C-107': 'vendido', 'C-108': 'vendido', 'C-201': 'vendido', 'C-202': 'vendido',
    'C-203': 'vendido', 'C-204': 'vendido', 'C-205': 'vendido', 'C-206': 'vendido',
    'C-207': 'vendido', 'C-208': 'reservado-revisao', 'C-301': 'vendido', 'C-302': 'vendido',
    'C-303': 'vendido', 'C-304': 'vendido', 'C-305': 'vendido', 'C-306': 'vendido',
    'C-307': 'vendido', 'C-308': 'vendido', 'C-401': 'reservado-revisao', 'C-402': 'disponivel',
    'C-403': 'vendido', 'C-404': 'vendido', 'C-405': 'vendido', 'C-406': 'vendido',
    'C-407': 'vendido', 'C-408': 'disponivel', 'C-501': 'vendido', 'C-502': 'vendido',
    'C-503': 'vendido', 'C-504': 'vendido', 'C-505': 'vendido', 'C-506': 'vendido',
    'C-507': 'vendido', 'C-508': 'disponivel', 'C-601': 'vendido', 'C-602': 'disponivel',
    'C-603': 'vendido', 'C-604': 'vendido', 'C-605': 'vendido', 'C-606': 'vendido',
    'C-607': 'vendido', 'C-608': 'disponivel', 'C-701': 'vendido', 'C-702': 'disponivel',
    'C-703': 'vendido', 'C-704': 'vendido', 'C-705': 'vendido', 'C-706': 'vendido',
    'C-707': 'disponivel', 'C-708': 'disponivel', 'C-801': 'vendido', 'C-802': 'disponivel',
    'C-803': 'vendido', 'C-804': 'reservado-revisao', 'C-805': 'vendido', 'C-806': 'vendido',
    'C-807': 'quitado', 'C-808': 'disponivel', 'C-901': 'vendido', 'C-902': 'disponivel',
    'C-903': 'vendido', 'C-904': 'disponivel', 'C-905': 'vendido', 'C-906': 'vendido',
    'C-907': 'vendido', 'C-908': 'disponivel', 'C-1001': 'disponivel', 'C-1002': 'disponivel',
    'C-1007': 'disponivel', 'C-1008': 'disponivel',
    
    'D-1': 'disponivel', 'D-2': 'disponivel', 'D-4': 'vendido', 'D-6': 'vendido',
    'D-7': 'vendido', 'D-8': 'vendido', 'D-101': 'vendido', 'D-102': 'vendido',
    'D-103': 'vendido', 'D-104': 'vendido', 'D-105': 'vendido', 'D-106': 'vendido',
    'D-107': 'vendido', 'D-108': 'vendido', 'D-201': 'vendido', 'D-202': 'vendido',
    'D-203': 'vendido', 'D-204': 'vendido', 'D-205': 'vendido', 'D-206': 'vendido',
    'D-207': 'vendido', 'D-208': 'disponivel', 'D-301': 'disponivel', 'D-302': 'vendido',
    'D-303': 'quitado', 'D-304': 'vendido', 'D-305': 'vendido', 'D-306': 'vendido',
    'D-307': 'vendido', 'D-308': 'vendido', 'D-401': 'mirror', 'D-402': 'disponivel',
    'D-403': 'vendido', 'D-404': 'vendido', 'D-405': 'vendido', 'D-406': 'vendido',
    'D-407': 'disponivel', 'D-408': 'vendido', 'D-501': 'disponivel', 'D-502': 'disponivel',
    'D-503': 'vendido', 'D-504': 'vendido', 'D-505': 'vendido', 'D-506': 'vendido',
    'D-507': 'disponivel', 'D-508': 'disponivel', 'D-601': 'disponivel', 'D-602': 'vendido',
    'D-603': 'quitado', 'D-604': 'vendido', 'D-605': 'vendido', 'D-606': 'vendido',
    'D-607': 'disponivel', 'D-608': 'disponivel', 'D-701': 'vendido', 'D-702': 'disponivel',
    'D-703': 'vendido', 'D-704': 'vendido', 'D-705': 'vendido', 'D-706': 'vendido',
    'D-707': 'disponivel', 'D-708': 'disponivel', 'D-801': 'vendido', 'D-802': 'disponivel',
    'D-803': 'vendido', 'D-804': 'vendido', 'D-805': 'vendido', 'D-806': 'disponivel',
    'D-807': 'disponivel', 'D-808': 'disponivel', 'D-901': 'vendido', 'D-902': 'disponivel',
    'D-903': 'vendido', 'D-904': 'vendido', 'D-905': 'disponivel', 'D-906': 'vendido',
    'D-907': 'disponivel', 'D-908': 'disponivel', 'D-1001': 'vendido', 'D-1002': 'vendido',
    'D-1003': 'disponivel', 'D-1004': 'disponivel', 'D-1005': 'disponivel', 'D-1006': 'disponivel',
    'D-1007': 'vendido', 'D-1008': 'disponivel', 'D-1101': 'disponivel', 'D-1102': 'disponivel',
    'D-1107': 'disponivel', 'D-1108': 'disponivel'
  };

  const realSaleValues = {
    'A-1': 'R$ 791.347,00', 'A-2': 'R$ 781.959,88', 'A-4': 'R$ 590.666,30', 'A-6': 'R$ 590.666,30',
    'A-7': 'R$ 791.347,00', 'A-8': 'R$ 781.959,88', 'A-101': 'R$ 606.276,77', 'A-102': 'R$ 565.908,18',
    'A-103': 'R$ 545.420,64', 'A-104': 'R$ 507.580,55', 'A-105': 'R$ 545.420,64', 'A-106': 'R$ 522.691,47',
    'A-107': 'R$ 606.276,77', 'A-108': 'R$ 565.908,18', 'A-201': 'R$ 611.268,80', 'A-202': 'R$ 570.728,95',
    'A-203': 'R$ 549.291,29', 'A-204': 'R$ 511.319,13', 'A-205': 'R$ 549.291,29', 'A-206': 'R$ 511.319,13',
    'A-207': 'R$ 611.268,80', 'A-208': 'R$ 612.832,70', 'A-301': 'R$ 659.869,42', 'A-302': 'R$ 617.653,02',
    'A-303': 'R$ 553.162,93', 'A-304': 'R$ 515.059,66', 'A-305': 'R$ 553.162,93', 'A-306': 'R$ 515.059,66',
    'A-307': 'R$ 659.869,42', 'A-308': 'R$ 649.228,67', 'A-401': 'R$ 697.082,75', 'A-402': 'R$ 654.050,62',
    'A-403': 'R$ 557.036,58', 'A-404': 'R$ 518.797,21', 'A-405': 'R$ 557.036,58', 'A-406': 'R$ 518.797,21',
    'A-407': 'R$ 697.082,75', 'A-408': 'R$ 654.050,62', 'A-501': 'R$ 702.075,43', 'A-502': 'R$ 658.871,07',
    'A-503': 'R$ 560.908,22', 'A-504': 'R$ 522.535,76', 'A-505': 'R$ 560.908,22', 'A-506': 'R$ 522.535,76',
    'A-507': 'R$ 677.637,67', 'A-508': 'R$ 658.871,07', 'A-601': 'R$ 707.066,11', 'A-602': 'R$ 663.692,45',
    'A-603': 'R$ 564.778,87', 'A-604': 'R$ 526.271,34', 'A-605': 'R$ 564.778,87', 'A-606': 'R$ 526.271,34',
    'A-607': 'R$ 707.066,11', 'A-608': 'R$ 663.692,45', 'A-701': 'R$ 712.062,79', 'A-702': 'R$ 668.511,88',
    'A-703': 'R$ 568.649,52', 'A-704': 'R$ 530.010,87', 'A-705': 'R$ 568.649,52', 'A-706': 'R$ 530.010,87',
    'A-707': 'R$ 691.402,02', 'A-708': 'R$ 668.511,88', 'A-801': 'R$ 717.052,77', 'A-802': 'R$ 673.332,60',
    'A-803': 'R$ 572.521,16', 'A-804': 'R$ 533.749,36', 'A-805': 'R$ 572.521,16', 'A-806': 'R$ 533.749,40',
    'A-807': 'R$ 717.052,77', 'A-808': 'R$ 673.332,60', 'A-901': 'R$ 722.045,77', 'A-902': 'R$ 678.154,32',
    'A-903': 'R$ 580.581,02', 'A-904': 'R$ 537.486,98', 'A-905': 'R$ 576.392,81', 'A-906': 'R$ 537.486,98',
    'A-907': 'R$ 701.385,00', 'A-908': 'R$ 678.154,32', 'A-1001': 'R$ 727.037,80', 'A-1002': 'R$ 682.973,08',
    'A-1003': 'R$ 580.265,46', 'A-1004': 'R$ 541.227,52', 'A-1005': 'R$ 580.265,46', 'A-1006': 'R$ 541.227,52',
    'A-1007': 'R$ 706.379,00', 'A-1008': 'R$ 682.973,08', 'A-1101': 'R$ 1.233.653,00', 'A-1102': 'R$ 1.233.653,00',
    'A-1107': 'R$ 1.233.653,00', 'A-1108': 'R$ 1.233.653,00',
    
    'B-1': 'R$ 791.347,00', 'B-2': 'R$ 781.959,88', 'B-4': 'R$ 590.666,30', 'B-6': 'R$ 590.666,30',
    'B-7': 'R$ 791.347,00', 'B-8': 'R$ 781.959,88', 'B-101': 'R$ 606.276,77', 'B-102': 'R$ 565.908,13',
    'B-103': 'R$ 545.420,64', 'B-104': 'R$ 507.580,55', 'B-105': 'R$ 545.420,64', 'B-106': 'R$ 507.580,55',
    'B-107': 'R$ 606.276,77', 'B-108': 'R$ 565.908,18', 'B-201': 'R$ 611.268,77', 'B-202': 'R$ 570.728,92',
    'B-203': 'R$ 549.291,29', 'B-204': 'R$ 511.319,13', 'B-205': 'R$ 549.291,29', 'B-206': 'R$ 511.319,13',
    'B-207': 'R$ 611.268,77', 'B-208': 'R$ 570.728,92', 'B-301': 'R$ 659.869,42', 'B-302': 'R$ 617.653,02',
    'B-303': 'R$ 553.162,93', 'B-304': 'R$ 515.059,66', 'B-305': 'R$ 553.162,93', 'B-306': 'R$ 515.059,66',
    'B-307': 'R$ 659.869,42', 'B-308': 'R$ 649.228,67', 'B-401': 'R$ 697.082,75', 'B-402': 'R$ 654.050,62',
    'B-403': 'R$ 557.036,58', 'B-404': 'R$ 518.797,21', 'B-405': 'R$ 557.036,58', 'B-406': 'R$ 518.797,21',
    'B-407': 'R$ 697.082,75', 'B-408': 'R$ 654.050,62', 'B-501': 'R$ 702.075,43', 'B-502': 'R$ 658.871,07',
    'B-503': 'R$ 560.908,22', 'B-504': 'R$ 522.535,76', 'B-505': 'R$ 560.908,22', 'B-506': 'R$ 522.535,76',
    'B-507': 'R$ 702.075,43', 'B-508': 'R$ 658.871,07', 'B-601': 'R$ 707.066,11', 'B-602': 'R$ 663.692,45',
    'B-603': 'R$ 564.778,87', 'B-604': 'R$ 526.271,34', 'B-605': 'R$ 564.778,87', 'B-606': 'R$ 526.271,34',
    'B-607': 'R$ 707.066,11', 'B-608': 'R$ 663.692,45', 'B-701': 'R$ 712.062,79', 'B-702': 'R$ 668.511,88',
    'B-703': 'R$ 568.649,52', 'B-704': 'R$ 530.010,87', 'B-705': 'R$ 568.649,52', 'B-706': 'R$ 515.630,44',
    'B-707': 'R$ 712.062,79', 'B-708': 'R$ 668.511,88', 'B-801': 'R$ 717.052,77', 'B-802': 'R$ 673.332,60',
    'B-803': 'R$ 572.521,16', 'B-804': 'R$ 533.749,40', 'B-805': 'R$ 572.521,16', 'B-806': 'R$ 533.749,40',
    'B-807': 'R$ 717.052,77', 'B-808': 'R$ 673.332,60', 'B-901': 'R$ 722.045,77', 'B-902': 'R$ 678.154,32',
    'B-903': 'R$ 576.392,81', 'B-904': 'R$ 537.486,98', 'B-905': 'R$ 576.392,81', 'B-906': 'R$ 537.486,98',
    'B-907': 'R$ 722.045,77', 'B-908': 'R$ 678.154,32', 'B-1001': 'R$ 1.233.653,00', 'B-1002': 'R$ 1.216.874,00',
    'B-1007': 'R$ 1.233.653,00', 'B-1008': 'R$ 1.216.874,00',
    
    'C-1': 'R$ 791.347,00', 'C-2': 'R$ 781.959,88', 'C-4': 'R$ 590.667,30', 'C-6': 'R$ 590.666,30',
    'C-7': 'R$ 791.347,00', 'C-8': 'R$ 781.959,88', 'C-101': 'R$ 585.615,55', 'C-102': 'R$ 565.908,18',
    'C-103': 'R$ 524.758,87', 'C-104': 'R$ 517.836,87', 'C-105': 'R$ 524.758,87', 'C-106': 'R$ 517.836,87',
    'C-107': 'R$ 585.615,55', 'C-108': 'R$ 565.908,18', 'C-201': 'R$ 590.610,75', 'C-202': 'R$ 582.251,75',
    'C-203': 'R$ 528.631,52', 'C-204': 'R$ 521.651,52', 'C-205': 'R$ 528.631,52', 'C-206': 'R$ 521.651,52',
    'C-207': 'R$ 590.610,75', 'C-208': 'R$ 582.251,75', 'C-301': 'R$ 639.207,65', 'C-302': 'R$ 630.132,65',
    'C-303': 'R$ 532.502,16', 'C-304': 'R$ 525.466,16', 'C-305': 'R$ 532.502,16', 'C-306': 'R$ 525.466,16',
    'C-307': 'R$ 639.207,65', 'C-308': 'R$ 649.228,67', 'C-401': 'R$ 676.421,98', 'C-402': 'R$ 654.050,62',
    'C-403': 'R$ 536.374,81', 'C-404': 'R$ 529.277,81', 'C-405': 'R$ 536.374,81', 'C-406': 'R$ 518.797,21',
    'C-407': 'R$ 697.082,75', 'C-408': 'R$ 654.050,62', 'C-501': 'R$ 681.414,66', 'C-502': 'R$ 672.192,66',
    'C-503': 'R$ 540.247,45', 'C-504': 'R$ 522.535,76', 'C-505': 'R$ 540.247,45', 'C-506': 'R$ 533.094,45',
    'C-507': 'R$ 681.414,66', 'C-508': 'R$ 658.871,07', 'C-601': 'R$ 686.407,34', 'C-602': 'R$ 663.692,45',
    'C-603': 'R$ 544.118,10', 'C-604': 'R$ 536.909,10', 'C-605': 'R$ 544.118,10', 'C-606': 'R$ 536.908,10',
    'C-607': 'R$ 686.407,34', 'C-608': 'R$ 663.692,45', 'C-701': 'R$ 691.402,02', 'C-702': 'R$ 668.511,88',
    'C-703': 'R$ 547.989,75', 'C-704': 'R$ 530.010,87', 'C-705': 'R$ 547.989,75', 'C-706': 'R$ 530.010,87',
    'C-707': 'R$ 712.062,79', 'C-708': 'R$ 668.511,88', 'C-801': 'R$ 696.393,00', 'C-802': 'R$ 673.332,60',
    'C-803': 'R$ 551.862,39', 'C-804': 'R$ 533.749,40', 'C-805': 'R$ 551.862,39', 'C-806': 'R$ 533.749,40',
    'C-807': 'R$ 696.393,00', 'C-808': 'R$ 673.332,60', 'C-901': 'R$ 701.385,00', 'C-902': 'R$ 678.154,32',
    'C-903': 'R$ 555.734,04', 'C-904': 'R$ 537.486,98', 'C-905': 'R$ 555.734,04', 'C-906': 'R$ 548.352,04',
    'C-907': 'R$ 701.385,00', 'C-908': 'R$ 678.154,32', 'C-1001': 'R$ 1.233.653,00', 'C-1002': 'R$ 1.216.874,00',
    'C-1007': 'R$ 1.233.653,00', 'C-1008': 'R$ 1.216.874,00',
    
    'D-1': 'R$ 791.347,00', 'D-2': 'R$ 781.959,88', 'D-4': 'R$ 590.667,30', 'D-6': 'R$ 590.667,30',
    'D-7': 'R$ 791.347,00', 'D-8': 'R$ 781.959,88', 'D-101': 'R$ 585.616,00', 'D-102': 'R$ 577.332,55',
    'D-103': 'R$ 524.759,87', 'D-104': 'R$ 517.836,87', 'D-105': 'R$ 524.758,87', 'D-106': 'R$ 507.580,55',
    'D-107': 'R$ 585.616,00', 'D-108': 'R$ 565.908,18', 'D-201': 'R$ 590.610,70', 'D-202': 'R$ 582.251,70',
    'D-203': 'R$ 528.631,52', 'D-204': 'R$ 521.651,52', 'D-205': 'R$ 528.632,52', 'D-206': 'R$ 511.319,13',
    'D-207': 'R$ 590.610,70', 'D-208': 'R$ 644.408,87', 'D-301': 'R$ 671.426,30', 'D-302': 'R$ 662.354,30',
    'D-303': 'R$ 532.502,16', 'D-304': 'R$ 525.466,16', 'D-305': 'R$ 532.502,16', 'D-306': 'R$ 515.059,66',
    'D-307': 'R$ 660.991,30', 'D-308': 'R$ 649.228,67', 'D-401': 'R$ 676.421,98', 'D-402': 'R$ 654.050,62',
    'D-403': 'R$ 536.374,81', 'D-404': 'R$ 518.797,21', 'D-405': 'R$ 533.717,36', 'D-406': 'R$ 529.278,81',
    'D-407': 'R$ 676.421,98', 'D-408': 'R$ 654.050,62', 'D-501': 'R$ 681.414,66', 'D-502': 'R$ 658.871,07',
    'D-503': 'R$ 540.247,05', 'D-504': 'R$ 522.535,76', 'D-505': 'R$ 540.246,45', 'D-506': 'R$ 533.094,45',
    'D-507': 'R$ 681.414,66', 'D-508': 'R$ 658.871,07', 'D-601': 'R$ 686.407,34', 'D-602': 'R$ 663.692,45',
    'D-603': 'R$ 544.118,10', 'D-604': 'R$ 526.271,34', 'D-605': 'R$ 544.118,10', 'D-606': 'R$ 526.271,34',
    'D-607': 'R$ 686.407,34', 'D-608': 'R$ 663.692,45', 'D-701': 'R$ 691.402,02', 'D-702': 'R$ 668.511,88',
    'D-703': 'R$ 547.989,75', 'D-704': 'R$ 530.010,87', 'D-705': 'R$ 547.989,75', 'D-706': 'R$ 530.010,87',
    'D-707': 'R$ 691.402,02', 'D-708': 'R$ 668.511,88', 'D-801': 'R$ 696.394,00', 'D-802': 'R$ 673.332,60',
    'D-803': 'R$ 551.862,39', 'D-804': 'R$ 533.749,40', 'D-805': 'R$ 551.862,39', 'D-806': 'R$ 533.749,40',
    'D-807': 'R$ 696.394,00', 'D-808': 'R$ 673.332,60', 'D-901': 'R$ 701.385,00', 'D-902': 'R$ 678.154,32',
    'D-903': 'R$ 555.734,04', 'D-904': 'R$ 537.486,98', 'D-905': 'R$ 555.734,04', 'D-906': 'R$ 537.486,98',
    'D-907': 'R$ 701.385,00', 'D-908': 'R$ 678.153,34', 'D-1001': 'R$ 706.379,00', 'D-1002': 'R$ 675.913,00',
    'D-1003': 'R$ 559.605,69', 'D-1004': 'R$ 541.227,52', 'D-1005': 'R$ 559.605,69', 'D-1006': 'R$ 541.227,52',
    'D-1007': 'R$ 706.379,00', 'D-1008': 'R$ 682.973,08', 'D-1101': 'R$ 1.233.653,00', 'D-1102': 'R$ 1.233.653,00',
    'D-1107': 'R$ 1.233.653,00', 'D-1108': 'R$ 1.233.653,00'
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
        
        const areaTotal = tipologia.includes('3Q') ? 
          (floor === '11' || (floor === '10' && (block === 'B' || block === 'C')) ? '132,65' : 
          (floor === '0' ? '111,18' : '72,83')) : 
          (floor === '0' ? '81,45' : '59,86');
        const vagas = tipologia.includes('3Q') ? '2' : '1';
        const status = statusData[`${block}-${aptNumber}`] || 'disponivel';
        
        const valorVenda = realSaleValues[`${block}-${aptNumber}`] || 'R$ 0,00';
        
        allUnits.push({
          apt: aptNumber,
          bl: block,
          andar: floor,
          final: i.toString(),
          areaApto: tipologia.includes('3Q') ? '72,83' : '59,86',
          areaGarden: floor === '0' ? (tipologia.includes('3Q') ? '38,35' : '21,59') : 
                     ((floor === '11' || (floor === '10' && (block === 'B' || block === 'C'))) ? '14,49' : ''),
          areaTotal: areaTotal + ' m²',
          tipologia: tipologia,
          sol: sol,
          vagas: vagas,
          vagaNum: Math.floor(Math.random() * 500),
          avaliacao: tipologia.includes('3Q') ? 
            (floor === '11' || (floor === '10' && (block === 'B' || block === 'C')) ? 'R$ 1.260.000,00' : 'R$ 829.000,00') : 
            'R$ 619.000,00',
          ba: 'R$ 37.653,00',
          venda: valorVenda,
          status: status
        });
      }
    });
  });
  
  return allUnits;
}