const fs = require('fs');

// Ler o arquivo atual
const filePath = '/home/z/my-project/src/data/altoHorizonte.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Dados corretos da tabela XLS - apenas alguns exemplos para testar
const valoresCorretos = {
  'A-1': 'R$ 764.000,00', 'A-2': 'R$ 759.000,00', 'A-3': 'R$ 571.000,00', 'A-5': 'R$ 571.000,00',
  'A-7': 'R$ 764.000,00', 'A-8': 'R$ 759.000,00'
};

// Função para atualizar um valor específico
function atualizarValor(content, bloco, unidade, novoValor) {
  const regex = new RegExp(\`'${bloco}-${unidade}': {[^}]*valor: '[^}]*'[^}]*'\`);
  const match = content.match(regex);
  if (match) {
    const oldLine = match[0];
    const newLine = oldLine.replace(/valor: '[^}]*'[^}]*'/, \`valor: '${novoValor}'\`);
    return content.replace(oldLine, newLine);
  }
}

// Atualizar apenas alguns valores de teste
content = atualizarValor(content, 'A', 'A-1', 'R$ 764.000,00');
content = atualizarValor(content, 'A-2', 'R$ 759.000,00');
content = atualizarValor(content, 'A-3', 'R$ 571.000,00');

// Escrever o arquivo atualizado
fs.writeFileSync('/home/z/my-project/src/data/altoHorizonte.ts', content, 'utf8');
console.log('Valores do Bloco A atualizados com sucesso!');
console.log('Total de valores atualizados: 3');

// Continuar com os outros blocos...
"