'use client';

import { Unit } from '@/data/altoHorizonte';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface UnitCardProps {
  unit: Unit;
  colors: {
    disponivel: string;
    vendido: string;
    reservado: string;
    quitado: string;
    reservadoRevisao: string;
    mirror: string;
    foraVenda: string;
    nascente: string;
    poente: string;
  };
}

export function UnitCard({ unit, colors }: UnitCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'disponivel':
        return colors.disponivel;
      case 'vendido':
        return colors.vendido;
      case 'reservado':
        return colors.reservado;
      case 'quitado':
        return colors.quitado;
      case 'reservado-revisao':
        return colors.reservadoRevisao;
      case 'mirror':
        return colors.mirror;
      case 'fora-venda':
        return colors.foraVenda;
      default:
        return colors.disponivel;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'disponivel':
        return 'Disponível';
      case 'vendido':
        return 'Vendido';
      case 'reservado':
        return 'Reservado';
      case 'quitado':
        return 'Quitado';
      case 'reservado-revisao':
        return 'Reservado aguardando revisão';
      case 'mirror':
        return 'Mirror';
      case 'fora-venda':
        return 'Fora de Venda - Comercial';
      default:
        return 'Disponível';
    }
  };

  const getSolColor = (sol: string) => {
    return sol === 'Nascente' ? colors.nascente : colors.poente;
  };

  const statusColor = getStatusColor(unit.status);
  const solColor = getSolColor(unit.sol);

  // Função para converter hex para rgba
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <Card 
      className="relative hover:shadow-lg transition-all duration-200 hover:-translate-y-1 min-h-[120px] flex flex-col justify-between"
      style={{
        borderLeft: `4px solid ${statusColor}`,
      }}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div className="font-bold text-sm">Apto {unit.apt}</div>
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: solColor }}
            title={unit.sol}
          />
        </div>
        
        <div className="text-xs text-gray-600 space-y-1 mb-3">
          <div>{unit.tipologia}</div>
          <div>{unit.areaTotal}</div>
          <div>{unit.vagas} vaga(s)</div>
        </div>
        
        <div className="font-bold text-sm text-blue-600 mb-2">
          {unit.venda}
        </div>
        
        <Badge 
          variant="secondary" 
          className="text-xs w-full justify-center"
          style={{ 
            backgroundColor: hexToRgba(statusColor, 0.2),
            color: statusColor,
            border: `1px solid ${hexToRgba(statusColor, 0.4)}`
          }}
        >
          {getStatusText(unit.status)}
        </Badge>
      </CardContent>
    </Card>
  );
}