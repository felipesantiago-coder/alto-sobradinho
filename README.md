# 🏢 Alto Sobradinho - Disponibilidade

Espelho de vendas em tempo real dos empreendimentos Alto da Alvorada e Alto do Horizonte. Consulte a disponibilidade de unidades, valores e status de forma interativa e responsiva.

## ✨ Tecnologias Utilizadas

Este projeto foi construído com as tecnologias mais modernas do mercado:

### 🎯 Framework Principal
- **⚡ Next.js 16** - Framework React de última geração com App Router
- **📘 TypeScript 5** - Tipagem segura para melhor experiência de desenvolvimento
- **🎨 Tailwind CSS 4** - Framework CSS utilitário para desenvolvimento rápido de UI

### 🧩 Componentes & Estilização
- **🧩 shadcn/ui** - Componentes acessíveis de alta qualidade construídos com Radix UI
- **🎯 Lucide React** - Biblioteca de ícones bonita e consistente
- **🎨 Framer Motion** - Biblioteca de motion para React pronta para produção
- **🌈 Next Themes** - Modo dark perfeito em 2 linhas de código

### 📊 Funcionalidades Avançadas
- **📋 Filtros Inteligentes** - Filtragem por bloco, andar, tipologia, disponibilidade
- **📊 Cards Informativos** - Exibição completa de valores, metragens e status
- **📈 Estatísticas em Tempo Real** - Contadores dinâmicos de disponibilidade
- **📱 Interface Responsiva** - Design mobile-first com animações suaves

### 🔄 Estado & Dados
- **🗄️ Dados Estáticos** - Armazenamento otimizado dos empreendimentos
- **🔄 Estado Global** - Gerenciamento de estado simplificado e eficiente
- **⚡ Performance** - Build otimizado com Turbopack

## 🏢 Empreendimentos

### 🌅 Alto da Alvorada
- **95 unidades** distribuídas em 1 bloco
- **3 e 4 quartos** com diferentes tipologias
- **Áreas variadas** de 59m² a 111m²
- **Vagas de estacionamento** de 1 a 2 por unidade

### 🌇 Alto do Horizonte  
- **344 unidades** distribuídas em 4 blocos
- **Diversas tipologias** para diferentes perfis de moradia
- **Posição solar** otimizada (Nascente/Poente)
- **Valores competitivos** com bônus da construtora

## 🚀 Início Rápido

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build para produção
npm run build

# Iniciar servidor de produção
npm start
```

Abra [http://localhost:3000](http://localhost:3000) para ver a aplicação em execução.

## 📁 Estrutura do Projeto

```
src/
├── app/                 # Páginas Next.js com App Router
│   ├── api/            # Endpoints da API
│   ├── page.tsx        # Página principal do espelho de vendas
│   └── layout.tsx      # Layout da aplicação
├── components/          # Componentes React reutilizáveis
│   ├── ui/             # Componentes shadcn/ui
│   ├── unidade-card.tsx # Card individual da unidade
│   ├── filters.tsx      # Sistema de filtros
│   └── status-summary.tsx # Resumo de estatísticas
├── data/               # Dados estáticos dos empreendimentos
├── hooks/              # Hooks personalizados React
└── lib/                # Funções utilitárias e configurações
```

## 🎨 Funcionalidades Disponíveis

### 📋 Sistema de Filtros
- **Por Empreendimento** - Seleção entre Alto da Alvorada e Alto do Horizonte
- **Por Disponibilidade** - Disponível, Vendida, Reservada, etc.
- **Por Bloco** - Filtragem por blocos (A, B, C, D)
- **Por Andar** - Seleção por andar específico
- **Por Tipologia** - 2Q, 3Q, 3Q+AP, etc.
- **Por Posição Solar** - Nascente ou Poente
- **Busca por Texto** - Pesquisa por unidade ou valores

### 📊 Cards de Unidades
- **Informações Completas** - Unidade, andar, área, tipologia
- **Valores Financeiros** - Valor de venda, avaliação bancária, bônus
- **Status Visual** - Cores diferenciadas por disponibilidade
- **Ícones Informativos** - Vagas, posição solar, etc.

### 📈 Estatísticas em Tempo Real
- **Total de Unidades** - Contagem geral por empreendimento
- **Disponíveis** - Unidades prontas para venda
- **Vendidas** - Unidades já comercializadas
- **Reservadas** - Unidades com proposta em análise

## 🌐 Deploy

Este projeto está otimizado para deploy na Vercel:

- ✅ **Next.js 16** - Totalmente compatível
- ✅ **Build Estático** - Performance otimizada
- ✅ **Configurações Prontas** - Deploy automático
- ✅ **SEO Otimizado** - Meta tags completas

## 📱 Responsividade

- **Mobile-First** - Design priorizado para dispositivos móveis
- **Tablet Adaptável** - Layout flexível para tablets
- **Desktop Otimizado** - Experiência completa em computadores
- **Touch-Friendly** - Interação otimizada para toque

---

**Desenvolvido com ❤️ para o mercado imobiliário.**