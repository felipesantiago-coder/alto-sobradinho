'use client';

import { useState, useEffect, useMemo } from 'react';
import { PropertySelector } from '@/components/PropertySelector';
import { FilterControls } from '@/components/FilterControls';
import { SummaryCards } from '@/components/SummaryCards';
import { BlocksContainer } from '@/components/BlocksContainer';
import { altoHorizonteInfo, generateAltoHorizonteUnits } from '@/data/altoHorizonte';
import { altoAlvoradaInfo, generateAltoAlvoradaUnits } from '@/data/altoAlvorada';
import { Unit } from '@/data/altoHorizonte';
import { generatePDF } from '@/utils/pdfGenerator';
import { toast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';

export default function Home() {
  const [selectedProperty, setSelectedProperty] = useState('ALTO DO HORIZONTE');
  const [filters, setFilters] = useState({
    block: 'all',
    floor: 'all',
    status: 'all',
    tipologia: 'all',
    sol: 'all'
  });

  // Carregar dados dos empreendimentos
  const [altoHorizonteUnits, setAltoHorizonteUnits] = useState<Unit[]>([]);
  const [altoAlvoradaUnits, setAltoAlvoradaUnits] = useState<Unit[]>([]);

  useEffect(() => {
    setAltoHorizonteUnits(generateAltoHorizonteUnits());
    setAltoAlvoradaUnits(generateAltoAlvoradaUnits());
  }, []);

  // Obter informações do empreendimento selecionado
  const propertyInfo = useMemo(() => {
    return selectedProperty === 'ALTO DO HORIZONTE' ? altoHorizonteInfo : altoAlvoradaInfo;
  }, [selectedProperty]);

  // Obter unidades do empreendimento selecionado
  const allUnits = useMemo(() => {
    return selectedProperty === 'ALTO DO HORIZONTE' ? altoHorizonteUnits : altoAlvoradaUnits;
  }, [selectedProperty, altoHorizonteUnits, altoAlvoradaUnits]);

  // Obter blocos e andares disponíveis
  const { availableBlocks, availableFloors } = useMemo(() => {
    const blocks = [...new Set(allUnits.map(unit => unit.bl))].sort();
    const floors = [...new Set(allUnits.map(unit => unit.andar))].sort((a, b) => parseInt(a) - parseInt(b));
    return { availableBlocks: blocks, availableFloors: floors };
  }, [allUnits]);

  // Aplicar filtros
  const filteredUnits = useMemo(() => {
    return allUnits.filter(unit => {
      if (filters.block !== 'all' && unit.bl !== filters.block) return false;
      if (filters.floor !== 'all' && unit.andar !== filters.floor) return false;
      if (filters.status !== 'all' && unit.status !== filters.status) return false;
      if (filters.tipologia !== 'all' && !unit.tipologia.includes(filters.tipologia)) return false;
      if (filters.sol !== 'all' && unit.sol !== filters.sol) return false;
      return true;
    });
  }, [allUnits, filters]);

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  const handleGeneratePDF = async () => {
    try {
      await generatePDF(filteredUnits, propertyInfo, filters);
      toast({
        title: "PDF gerado com sucesso!",
        description: "O arquivo foi baixado para o seu dispositivo.",
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Ocorreu um erro ao tentar gerar o PDF. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const properties = [altoHorizonteInfo, altoAlvoradaInfo];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <PropertySelector
          properties={properties}
          selectedProperty={selectedProperty}
          onPropertyChange={setSelectedProperty}
        />

        <SummaryCards
          units={allUnits}
          propertyInfo={propertyInfo}
          filteredUnits={filteredUnits}
        />

        <FilterControls
          propertyInfo={propertyInfo}
          filters={filters}
          onFilterChange={handleFilterChange}
          onGeneratePDF={handleGeneratePDF}
          availableBlocks={availableBlocks}
          availableFloors={availableFloors}
        />

        <BlocksContainer
          units={filteredUnits}
          colors={propertyInfo.colors}
        />

        {/* Footer */}
        <footer className="mt-12 text-center text-gray-600 text-sm">
          <p>{propertyInfo.name} - Sobradinho - Novembro 2025</p>
          <div className="mt-2">
            <p>Coordenador de Produto: Felipe Santiago</p>
            <p>Telefone: (61) 98621-3417</p>
          </div>
        </footer>
      </div>
      
      <Toaster />
    </div>
  );
}