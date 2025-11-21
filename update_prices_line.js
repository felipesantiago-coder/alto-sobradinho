const fs = require('fs');

// Ler o arquivo atual
const filePath = '/home/z/my-project/src/data/altoHorizonte.ts';
const lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Dados corretos da tabela XLS
const tabelaValores = {
  // Bloco A - Térreo
  'A-1': 'R$ 764.000,00', 'A-2': 'R$ 759.000,00', 'A-3': 'R$ 571.000,00', 'A-5': 'R$ 571.000,00',
  'A-7': 'R$ 764.000,00', 'A-8': 'R$ 759.000,00'
};

// Função para atualizar um valor específico
function atualizarValor(content, bloco, unidade, novoValor) {
  const searchStr = `'${bloco}-${unidade}: {[^}]*valor: '[^}]*'[^}]*'\`;
  const match = content.match(searchStr);
  if (match) {
    const oldLine = match[0];
    const newLine = oldLine.replace(/valor: '[^}]*'[^}]*'/, \`valor: '${novoValor}'\`);
    return content.replace(oldLine, newLine);
  }
}

// Atualizar valores do Bloco A
let updatedContent = content;
const valoresA = Object.keys(tabelaValores);
for (let i = 0; i < valoresA.length; i++) {
  const unidade = valoresA[i];
  updatedContent = atualizarValor(updatedContent, 'A', unidade, tabelaValores[unidade]);
}

// Escrever o arquivo atualizado
fs.writeFileSync('/home/z/my-project/src/data/altoHorizonte.ts', updatedContent, 'utf8');
console.log('Valores do Bloco A atualizados:', Object.keys(tabelaValores).length);
console.log('Arquivo salvo com sucesso!');
"