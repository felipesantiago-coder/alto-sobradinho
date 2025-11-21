'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PropertyInfo } from '@/data/altoHorizonte';

interface FilterControlsProps {
  propertyInfo: PropertyInfo;
  filters: {
    block: string;
    floor: string;
    status: string;
    tipologia: string;
    sol: string;
  };
  onFilterChange: (filterType: string, value: string) => void;
  onGeneratePDF: () => void;
  availableBlocks: string[];
  availableFloors: string[];
}

export function FilterControls({ 
  propertyInfo, 
  filters, 
  onFilterChange, 
  onGeneratePDF,
  availableBlocks,
  availableFloors
}: FilterControlsProps) {
  const statusOptions = [
    { value: 'all', label: 'Todos os Status' },
    { value: 'disponivel', label: 'Disponível' },
    { value: 'vendido', label: 'Vendido' },
    { value: 'quitado', label: 'Quitado' },
    { value: 'reservado-revisao', label: 'Reservado aguardando revisão' },
    { value: 'reservado', label: 'Reservado' },
    { value: 'mirror', label: 'Mirror' },
    { value: 'fora-venda', label: 'Fora de Venda - Comercial' }
  ];

  const tipologiaOptions = [
    { value: 'all', label: 'Todas as Tipologias' },
    { value: '2Q', label: '2 Quartos' },
    { value: '3Q', label: '3 Quartos' },
    { value: 'Cobertura', label: 'Cobertura' }
  ];

  const solOptions = [
    { value: 'all', label: 'Todas as Posições' },
    { value: 'Nascente', label: 'Nascente' },
    { value: 'Poente', label: 'Poente' }
  ];

  return (
    <Card className="w-full mb-6">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-end justify-between">
          <div className="flex flex-wrap gap-3 flex-1">
            <Select 
              value={filters.block} 
              onValueChange={(value) => onFilterChange('block', value)}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Todos os Blocos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Blocos</SelectItem>
                {availableBlocks.map((block) => (
                  <SelectItem key={block} value={block}>
                    Bloco {block}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={filters.floor} 
              onValueChange={(value) => onFilterChange('floor', value)}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Todos os Andares" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Andares</SelectItem>
                {availableFloors.map((floor) => (
                  <SelectItem key={floor} value={floor}>
                    {floor === '0' ? 'Térreo' : 
                     floor === '11' || floor === '10' ? 'Cobertura' : 
                     `${floor}º Andar`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={filters.status} 
              onValueChange={(value) => onFilterChange('status', value)}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Todos os Status" />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={filters.tipologia} 
              onValueChange={(value) => onFilterChange('tipologia', value)}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Todas as Tipologias" />
              </SelectTrigger>
              <SelectContent>
                {tipologiaOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select 
              value={filters.sol} 
              onValueChange={(value) => onFilterChange('sol', value)}
            >
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Todas as Posições" />
              </SelectTrigger>
              <SelectContent>
                {solOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={onGeneratePDF}
            className="w-full sm:w-auto mt-4 lg:mt-0"
            style={{
              backgroundColor: propertyInfo.colors.secondary,
            }}
          >
            Gerar PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}