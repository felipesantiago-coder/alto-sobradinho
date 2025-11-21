'use client';

import { Unit } from '@/data/altoHorizonte';
import { Card, CardContent } from '@/components/ui/card';
import { PropertyInfo } from '@/data/altoHorizonte';

interface SummaryCardsProps {
  units: Unit[];
  propertyInfo: PropertyInfo;
  filteredUnits: Unit[];
}

export function SummaryCards({ units, propertyInfo, filteredUnits }: SummaryCardsProps) {
  const getStatusCount = (status: string) => {
    return filteredUnits.filter(unit => unit.status === status).length;
  };

  const statusCounts = {
    disponivel: getStatusCount('disponivel'),
    vendido: getStatusCount('vendido'),
    quitado: getStatusCount('quitado'),
    reservado: getStatusCount('reservado'),
    reservadoRevisao: getStatusCount('reservado-revisao'),
    mirror: getStatusCount('mirror'),
    foraVenda: getStatusCount('fora-venda')
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="text-center">
        <h1 
          className="text-3xl md:text-4xl font-bold mb-2"
          style={{ color: propertyInfo.colors.primary }}
        >
          {propertyInfo.name}
        </h1>
        <div 
          className="text-lg md:text-xl mb-2"
          style={{ color: propertyInfo.colors.secondary }}
        >
          {propertyInfo.subtitle}
        </div>
        <p className="text-gray-600 mb-6">{propertyInfo.description}</p>
        
        {/* Main Summary */}
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          <Card className="min-w-[140px]">
            <CardContent className="p-4 text-center">
              <div 
                className="text-2xl md:text-3xl font-bold"
                style={{ color: propertyInfo.colors.secondary }}
              >
                {propertyInfo.totalUnits}
              </div>
              <div className="text-sm text-gray-600">Total de Unidades</div>
            </CardContent>
          </Card>
          
          {propertyInfo.blocksAndUnits.map((blockInfo, index) => (
            <Card key={index} className="min-w-[140px]">
              <CardContent className="p-4 text-center">
                <div 
                  className="text-2xl md:text-3xl font-bold"
                  style={{ color: propertyInfo.colors.secondary }}
                >
                  {blockInfo.count}
                </div>
                <div className="text-sm text-gray-600">Blocos {blockInfo.block}</div>
              </CardContent>
            </Card>
          ))}
          
          <Card className="min-w-[140px]">
            <CardContent className="p-4 text-center">
              <div 
                className="text-2xl md:text-3xl font-bold"
                style={{ color: propertyInfo.colors.secondary }}
              >
                {filteredUnits.length}
              </div>
              <div className="text-sm text-gray-600">Unidades Filtradas</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Status Summary */}
      <div className="flex flex-wrap justify-center gap-3">
        <div className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: propertyInfo.colors.disponivel }}
          />
          <span className="text-sm">Disponível ({statusCounts.disponivel})</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: propertyInfo.colors.vendido }}
          />
          <span className="text-sm">Vendido ({statusCounts.vendido})</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: propertyInfo.colors.quitado }}
          />
          <span className="text-sm">Quitado ({statusCounts.quitado})</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: propertyInfo.colors.reservadoRevisao }}
          />
          <span className="text-sm">Reservado aguardando revisão ({statusCounts.reservadoRevisao})</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: propertyInfo.colors.reservado }}
          />
          <span className="text-sm">Reservado ({statusCounts.reservado})</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: propertyInfo.colors.mirror }}
          />
          <span className="text-sm">Mirror ({statusCounts.mirror})</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: propertyInfo.colors.foraVenda }}
          />
          <span className="text-sm">Fora de Venda - Comercial ({statusCounts.foraVenda})</span>
        </div>
      </div>

      {/* Solar Position Legend */}
      <div className="flex justify-center gap-6">
        <div className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: propertyInfo.colors.nascente }}
          />
          <span className="text-sm">Nascente</span>
        </div>
        
        <div className="flex items-center gap-2">
          <div 
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: propertyInfo.colors.poente }}
          />
          <span className="text-sm">Poente</span>
        </div>
      </div>
    </div>
  );
}