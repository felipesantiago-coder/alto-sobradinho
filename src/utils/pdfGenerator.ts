import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Unit, PropertyInfo } from '@/data/altoHorizonte';

export async function generatePDF(
  filteredUnits: Unit[], 
  propertyInfo: PropertyInfo,
  filters: {
    block: string;
    floor: string;
    status: string;
    tipologia: string;
    sol: string;
  }
): Promise<void> {
  try {
    const pdf = new jsPDF();
    const primaryColor = propertyInfo.colors.primary.replace('#', '');
    const secondaryColor = propertyInfo.colors.secondary.replace('#', '');

    // Configurações de fonte
    pdf.setFontSize(20);
    pdf.setTextColor(parseInt(primaryColor.substring(0, 2), 16), parseInt(primaryColor.substring(2, 4), 16), parseInt(primaryColor.substring(4, 6), 16));
    pdf.text(propertyInfo.name, 105, 20, { align: 'center' });
    
    pdf.setFontSize(12);
    pdf.text(propertyInfo.subtitle, 105, 28, { align: 'center' });
    
    pdf.setFontSize(16);
    pdf.text('Espelho de Vendas', 105, 40, { align: 'center' });
    
    pdf.setFontSize(10);
    pdf.setTextColor(127, 140, 141);
    pdf.text('Sobradinho - Novembro 2025', 105, 48, { align: 'center' });

    // Adicionar informações dos filtros aplicados
    let yPosition = 60;
    pdf.setFontSize(9);
    pdf.setTextColor(0, 0, 0);
    pdf.text('Filtros Aplicados:', 20, yPosition);
    yPosition += 7;

    const filterTexts = [];
    if (filters.block !== 'all') filterTexts.push(`Bloco: ${filters.block}`);
    if (filters.floor !== 'all') {
      const floorText = filters.floor === '0' ? 'Térreo' : 
                      filters.floor === '11' || filters.floor === '10' ? 'Cobertura' : 
                      `${filters.floor}º Andar`;
      filterTexts.push(`Andar: ${floorText}`);
    }
    if (filters.status !== 'all') {
      const statusText = {
        'disponivel': 'Disponível',
        'vendido': 'Vendido',
        'quitado': 'Quitado',
        'reservado-revisao': 'Reservado aguardando revisão',
        'reservado': 'Reservado',
        'mirror': 'Mirror',
        'fora-venda': 'Fora de Venda - Comercial'
      }[filters.status] || filters.status;
      filterTexts.push(`Status: ${statusText}`);
    }
    if (filters.tipologia !== 'all') {
      const tipologiaText = {
        '2Q': '2 Quartos',
        '3Q': '3 Quartos',
        'Cobertura': 'Cobertura'
      }[filters.tipologia] || filters.tipologia;
      filterTexts.push(`Tipologia: ${tipologiaText}`);
    }
    if (filters.sol !== 'all') {
      filterTexts.push(`Posição: ${filters.sol}`);
    }

    if (filterTexts.length > 0) {
      pdf.text(filterTexts.join(', '), 25, yPosition);
      yPosition += 10;
    } else {
      pdf.text('Nenhum filtro aplicado', 25, yPosition);
      yPosition += 10;
    }

    // Adicionar legenda
    yPosition += 5;
    pdf.text('Legenda:', 20, yPosition);
    yPosition += 7;

    // Posição solar
    pdf.setFillColor(parseInt(propertyInfo.colors.nascente.substring(1, 3), 16), parseInt(propertyInfo.colors.nascente.substring(3, 5), 16), parseInt(propertyInfo.colors.nascente.substring(5, 7), 16));
    pdf.circle(40, yPosition, 2, 'F');
    pdf.text('Nascente', 45, yPosition + 3);

    pdf.setFillColor(parseInt(propertyInfo.colors.poente.substring(1, 3), 16), parseInt(propertyInfo.colors.poente.substring(3, 5), 16), parseInt(propertyInfo.colors.poente.substring(5, 7), 16));
    pdf.circle(75, yPosition, 2, 'F');
    pdf.text('Poente', 80, yPosition + 3);

    yPosition += 10;

    // Status
    const statusColors = [
      { color: propertyInfo.colors.disponivel, label: 'Disponível' },
      { color: propertyInfo.colors.vendido, label: 'Vendido' },
      { color: propertyInfo.colors.quitado, label: 'Quitado' },
      { color: propertyInfo.colors.reservadoRevisao, label: 'Reservado aguardando revisão' },
      { color: propertyInfo.colors.reservado, label: 'Reservado' },
      { color: propertyInfo.colors.mirror, label: 'Mirror' },
      { color: propertyInfo.colors.foraVenda, label: 'Fora de Venda - Comercial' }
    ];

    let xPos = 20;
    let yPos = yPosition;
    for (let i = 0; i < statusColors.length; i++) {
      const status = statusColors[i];
      pdf.setFillColor(parseInt(status.color.substring(1, 3), 16), parseInt(status.color.substring(3, 5), 16), parseInt(status.color.substring(5, 7), 16));
      pdf.rect(xPos, yPos - 3, 5, 5, 'F');
      pdf.text(status.label, xPos + 7, yPos + 1);
      
      xPos += status.label.length > 20 ? 80 : 60;
      if (xPos > 140) {
        xPos = 20;
        yPos += 8;
      }
    }

    yPosition = yPos + 15;

    // Agrupar unidades por bloco
    const blocks = filteredUnits.reduce((acc, unit) => {
      if (!acc[unit.bl]) {
        acc[unit.bl] = [];
      }
      acc[unit.bl].push(unit);
      return acc;
    }, {} as Record<string, Unit[]>);

    // Adicionar resumo
    pdf.setFontSize(10);
    pdf.text(`Total de Unidades Filtradas: ${filteredUnits.length}`, 20, yPosition);
    yPosition += 7;

    Object.keys(blocks).sort().forEach(block => {
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = 20;
      }
      
      pdf.setFontSize(9);
      pdf.text(`Bloco ${block}: ${blocks[block].length} unidades`, 20, yPosition);
      yPosition += 5;
    });

    // Salvar o PDF
    const fileName = `${propertyInfo.name.replace(/\s+/g, '_')}_Espelho_Vendas_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);

  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw error;
  }
}