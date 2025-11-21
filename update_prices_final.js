const fs = require('fs');

// Ler o arquivo atualizado
const filePath = '/home/z/my-project/src/data/altoHorizonte.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Valores corretos da tabela XLS
const tabelaValores = {
  // Bloco A - Térreo
  'A-1': 'R$ 764.000,00', 'A-2': 'R$ 759.000,00', 'A-3': 'R$ 571.000,00', 'A-5': 'R$ 571.000,00',
  'A-7': 'R$ 764.000,00', 'A-8': 'R$ 759.000,00',
  'A-101': 'R$ 653.000,00', 'A-102': 'R$ 653.000,00', 'A-103': 'R$ 516.000,00', 'A-104': 'R$ 516.000,00',
  'A-105': 'R$ 516.000,00', 'A-106': 'R$ 516.000,00', 'A-107': 'R$ 653.000,00', 'A-108': 'R$ 653.000,00',
  'A-201': 'R$ 661.000,00', 'A-202': 'R$ 661.000,00', 'A-203': 'R$ 522.000,00', 'A-204': 'R$ 522.000,00',
  'A-205': 'R$ 522.000,00', 'A-206': 'R$ 522.000,00', 'A-207': 'R$ 661.000,00', 'A-208': 'R$ 661.000,00',
  'A-301': 'R$ 680.000,00', 'A-302': 'R$ 680.000,00', 'A-303': 'R$ 527.000,00', 'A-304': 'R$ 527.000,00',
  'A-305': 'R$ 527.000,00', 'A-306': 'R$ 527.000,00', 'A-307': 'R$ 680.000,00', 'A-308': 'R$ 680.000,00',
  'A-401': 'R$ 685.000,00', 'A-402': 'R$ 685.000,00', 'A-403': 'R$ 530.000,00', 'A-404': 'R$ 530.000,00',
  'A-405': 'R$ 530.000,00', 'A-406': 'R$ 530.000,00', 'A-407': 'R$ 685.000,00', 'A-408': 'R$ 685.000,00',
  'A-501': 'R$ 690.000,00', 'A-502': 'R$ 690.000,00', 'A-503': 'R$ 534.000,00', 'A-504': 'R$ 534.000,00',
  'A-505': 'R$ 534.000,00', 'A-506': 'R$ 534.000,00', 'A-507': 'R$ 690.000,00', 'A-508': 'R$ 690.000,00',
  'A-601': 'R$ 695.000,00', 'A-602': 'R$ 695.000,00', 'A-603': 'R$ 538.000,00', 'A-604': 'R$ 538.000,00',
  'A-605': 'R$ 538.000,00', 'A-606': 'R$ 538.000,00', 'A-607': 'R$ 695.000,00', 'A-608': 'R$ 695.000,00',
  'A-701': 'R$ 700.000,00', 'A-702': 'R$ 700.000,00', 'A-703': 'R$ 542.000,00', 'A-704': 'R$ 542.000,00',
  'A-705': 'R$ 542.000,00', 'A-706': 'R$ 542.000,00', 'A-707': 'R$ 700.000,00', 'A-708': 'R$ 700.000,00',
  'A-801': 'R$ 707.000,00', 'A-802': 'R$ 707.000,00', 'A-803': 'R$ 547.000,00', 'A-804': 'R$ 547.000,00',
  'A-805': 'R$ 547.000,00', 'A-806': 'R$ 547.000,00', 'A-807': 'R$ 707.000,00', 'A-808': 'R$ 707.000,00',
  'A-901': 'R$ 714.000,00', 'A-902': 'R$ 714.000,00', 'A-903': 'R$ 554.000,00', 'A-904': 'R$ 554.000,00',
  'A-905': 'R$ 554.000,00', 'A-906': 'R$ 554.000,00', 'A-907': 'R$ 714.000,00', 'A-908': 'R$ 714.000,00',
  'A-1001': 'R$ 714.000,00', 'A-1002': 'R$ 714.000,00', 'A-1003': 'R$ 554.000,00', 'A-1004': 'R$ 554.000,00',
  'A-1005': 'R$ 554.000,00', 'A-1006': 'R$ 554.000,00', 'A-1007': 'R$ 714.000,00', 'A-1008': 'R$ 714.000,00',
  
  // Cobertura Bloco A
  'A-1101': 'R$ 1.260.000,00', 'A-1102': 'R$ 1.260.000,00', 'A-1103': 'R$ 1.260.000,00', 'A-1104': 'R$ 1.260.000,00',
  'A-1107': 'R$ 1.260.000,00', 'A-1108': 'R$ 1.260.000,00'
};

// Função para substituir valores
function substituirValores(content, bloco, valores) {
  Object.keys(valores).forEach(unitKey => {
    if (content.includes(\`'${bloco}-${unitKey}: \`)) {
      const regex = new RegExp(\`'${bloco}-${unitKey}': {[^}]*valor: '[^}]*'[^}]*'\`);
      const match = content.match(regex);
      if (match) {
        const newValor = valores[unitKey];
        const oldLine = match[0];
        const newLine = oldLine.replace(/valor: '[^}]*'[^}]*'/, \`valor: '${newValor}'\`);
        content = content.replace(oldLine, newLine);
      }
    }
  });
  return content;
}

// Atualizar valores do Bloco A (já feito)
// content = substituirValores(content, 'A', tabelaValores);

// Adicionar valores dos Blocos B, C e D
content = substituirValores(content, 'B', valoresAdicionais.B);
content = substituirValores(content, 'C', valoresAdicionais.C);
content = substituirValores(content, 'D', valoresAdicionais.D);

// Escrever o arquivo final
fs.writeFileSync('/home/z/my-project/src/data/altoHorizonte.ts', content, 'utf8');
console.log('Todos os valores foram atualizados com sucesso!');
console.log('Total de unidades atualizadas:', Object.keys(tabelaValores).length + Object.keys(valoresAdicionais.B).length + Object.keys(valoresAdicionais.C).length + Object.keys(valoresAdicionais.D).length);
"