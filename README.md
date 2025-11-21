# 🏢 Espelhos de Venda - Alto do Horizonte e Alto da Alvorada

Aplicativo web para visualização e gerenciamento de espelhos de venda dos empreendimentos Alto do Horizonte e Alto da Alvorada.

## 🎯 Funcionalidades Principais

### 🏗️ Empreendimentos
- **Alto do Horizonte**: 344 unidades distribuídas em 4 blocos
- **Alto da Alvorada**: 344 unidades distribuídas em 4 blocos
- Alternância rápida entre empreendimentos através de interface intuitiva

### 🔍 Sistema de Filtros Avançados
- **Bloco**: Filtrar por blocos A, B, C, D
- **Andar**: Térreo, 1º ao 10º andar, Cobertura
- **Status**: Disponível, Vendido, Quitado, Reservado, Mirror, etc.
- **Tipologia**: 2 Quartos, 3 Quartos, Cobertura
- **Posição Solar**: Nascente, Poente

### 📊 Visualização de Dados
- Cards interativos com informações detalhadas das unidades
- Organização por blocos e andares
- Indicadores visuais de status e posição solar
- Contadores de unidades por status
- Design responsivo para desktop e mobile

### 📄 Geração de PDF
- Exportação de dados filtrados
- Formato profissional com legendas e estatísticas
- Inclusão de filtros aplicados no relatório

## 🛠️ Tecnologia

### Framework Principal
- **Next.js 15** com App Router
- **TypeScript 5** para type safety
- **React 18** com hooks modernos

### UI/UX
- **Tailwind CSS 4** para estilização
- **shadcn/ui** componentes acessíveis
- **Lucide React** ícones consistentes
- Design responsivo mobile-first

### Funcionalidades
- **jsPDF** para geração de PDF
- **html2canvas** para captura de elementos
- **React Hook Form** para formulários
- **Zod** para validação

## 🚀 Instalação e Uso

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn

### Instalação
```bash
# Clonar o repositório
git clone <url-do-repositorio>
cd espelhos-venda

# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

### Acesso
Abra [http://localhost:3000](http://localhost:3000) no navegador

## 📁 Estrutura do Projeto

```
src/
├── app/                    # Páginas Next.js
│   ├── page.tsx           # Página principal
│   ├── layout.tsx         # Layout global
│   └── globals.css        # Estilos globais
├── components/            # Componentes React
│   ├── PropertySelector.tsx    # Seletor de empreendimentos
│   ├── FilterControls.tsx       # Controles de filtro
│   ├── SummaryCards.tsx         # Cards de resumo
│   ├── UnitCard.tsx             # Card de unidade
│   ├── BlocksContainer.tsx      # Container de blocos
│   └── ui/                     # Componentes shadcn/ui
├── data/                  # Dados dos empreendimentos
│   ├── altoHorizonte.ts   # Dados Alto do Horizonte
│   └── altoAlvorada.ts   # Dados Alto da Alvorada
├── utils/                 # Utilitários
│   └── pdfGenerator.ts   # Geração de PDF
└── hooks/                # Hooks personalizados
    └── use-toast.ts      # Sistema de notificações
```

## 🎨 Interface do Usuário

### Navegação Principal
1. **Seleção de Empreendimento**: Botões para alternar entre Alto do Horizonte e Alto da Alvorada
2. **Resumo Estatístico**: Cards com totais e distribuição por status
3. **Controles de Filtro**: Selects para filtrar unidades
4. **Visualização de Unidades**: Grid organizado por blocos e andares

### Cores e Temas
- **Alto do Horizonte**: Paleta azul (#1a5276, #2980b9)
- **Alto da Alvorada**: Paleta cinza-azul (#2c3e50, #3498db)
- Indicadores visuais consistentes para status e posição solar

### Responsividade
- **Mobile**: Layout em coluna, cards ocupando largura total
- **Tablet**: Grid de 2 colunas para blocos
- **Desktop**: Grid de até 4 colunas para melhor aproveitamento de espaço

## 📊 Estrutura de Dados

### Unidade (Unit)
```typescript
interface Unit {
  apt: string;           // Número do apartamento
  bl: string;            // Bloco (A, B, C, D)
  andar: string;         // Andar (0-11)
  areaTotal: string;     // Área total
  tipologia: string;     // Tipologia (2Q, 3Q, Cobertura)
  sol: string;           // Posição solar (Nascente, Poente)
  vagas: string;         // Número de vagas
  venda: string;         // Valor de venda
  status: string;        // Status da unidade
}
```

### Empreendimento (PropertyInfo)
```typescript
interface PropertyInfo {
  name: string;                    // Nome do empreendimento
  subtitle: string;                // Subtítulo
  totalUnits: number;              // Total de unidades
  blocksAndUnits: Array<{          // Distribuição por blocos
    block: string;
    count: number;
  }>;
  colors: {                       // Paleta de cores
    primary: string;
    secondary: string;
    // ... outras cores
  };
}
```

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev          # Iniciar servidor de desenvolvimento
npm run build        # Build para produção
npm run start        # Iniciar servidor de produção

# Qualidade
npm run lint         # Verificar linting
npm run type-check   # Verificar tipos TypeScript

# Manutenção
npm run audit        # Verificar vulnerabilidades
```

## 📱 Deploy

### Vercel (Recomendado)
1. Conectar repositório ao Vercel
2. Configurar variáveis de ambiente (se necessário)
3. Deploy automático a cada push para main

### Outras Plataformas
```bash
# Build para produção
npm run build

# Arquivos gerados em .next
npm run start
```

## 🎯 Características Técnicas

### Performance
- **SSR (Server-Side Rendering)** com Next.js
- **Code splitting** automático
- **Imagens otimizadas** com Next.js Image
- **Lazy loading** de componentes

### Acessibilidade
- **ARIA labels** em componentes interativos
- **Navegação por teclado** funcional
- **Contraste** adequado conforme WCAG
- **Screen reader** friendly

### SEO
- **Meta tags** otimizadas
- **URLs amigáveis**
- **Structured data** para motores de busca
- **Performance** otimizada para Core Web Vitals

## 🤝 Contribuição

1. Fork do projeto
2. Criar branch para feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit das mudanças (`git commit -m 'Adicionar nova funcionalidade'`)
4. Push para branch (`git push origin feature/nova-funcionalidade`)
5. Abrir Pull Request

## 📄 Licença

Este projeto está sob licença MIT. Veja o arquivo [LICENSE](LICENSE) para detalhes.

## 📞 Contato

- **Coordenador de Produto**: Felipe Santiago
- **Telefone**: (61) 98621-3417
- **Email**: [email para contato]

---

Desenvolvido com ❤️ para a equipe de vendas | Powered by Next.js + TypeScript