'use client';

import { Unit } from '@/data/altoHorizonte';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UnitCard } from './UnitCard';

interface BlocksContainerProps {
  units: Unit[];
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
    primary: string;
    secondary: string;
  };
}

export function BlocksContainer({ units, colors }: BlocksContainerProps) {
  // Agrupar unidades por bloco
  const blocks = units.reduce((acc, unit) => {
    if (!acc[unit.bl]) {
      acc[unit.bl] = [];
    }
    acc[unit.bl].push(unit);
    return acc;
  }, {} as Record<string, Unit[]>);

  // Ordenar blocos
  const sortedBlocks = Object.keys(blocks).sort();

  if (units.length === 0) {
    return (
      <Card className="w-full">
        <CardContent className="p-12 text-center">
          <div className="text-gray-500 text-lg">
            Nenhuma unidade encontrada com os filtros selecionados.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
      {sortedBlocks.map((block) => {
        const blockUnits = blocks[block];
        
        // Agrupar unidades do bloco por andar
        const floors = blockUnits.reduce((acc, unit) => {
          if (!acc[unit.andar]) {
            acc[unit.andar] = [];
          }
          acc[unit.andar].push(unit);
          return acc;
        }, {} as Record<string, Unit[]>);

        // Ordenar andares
        const sortedFloors = Object.keys(floors).sort((a, b) => parseInt(a) - parseInt(b));

        return (
          <Card key={block} className="h-fit">
            <CardHeader className="pb-3">
              <CardTitle 
                className="text-lg flex justify-between items-center"
                style={{ color: colors.primary }}
              >
                Bloco {block}
                <span className="text-sm font-normal text-gray-500">
                  {blockUnits.length} unidades
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {sortedFloors.map((floor) => {
                const floorUnits = floors[floor];
                
                // Ordenar unidades por número
                floorUnits.sort((a, b) => {
                  if (floor === '0') {
                    // Para térreo, ordenar pela sequência correta: 1, 2, 4, 6, 7, 8
                    const order = {'1': 1, '2': 2, '4': 3, '6': 4, '7': 5, '8': 6};
                    return (order[a.apt] || 999) - (order[b.apt] || 999);
                  } else {
                    // Para outros andares, ordenar numericamente
                    return parseInt(a.apt) - parseInt(b.apt);
                  }
                });

                // Verificar se é cobertura baseado no bloco atual
                const isCoverage = (floor === '11') || 
                                 (floor === '10' && (block === 'B' || block === 'C'));

                const floorText = floor === '0' ? 'Térreo' : 
                                 isCoverage ? 'Cobertura' : 
                                 `${floor}º Andar`;

                return (
                  <div key={floor}>
                    <div 
                      className="text-sm font-semibold mb-2 flex justify-between items-center"
                      style={{ color: colors.secondary }}
                    >
                      {floorText}
                      <span className="text-xs text-gray-500">
                        {floorUnits.length} unidades
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {floorUnits.map((unit) => (
                        <UnitCard 
                          key={`${unit.bl}-${unit.apt}`} 
                          unit={unit} 
                          colors={colors}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}