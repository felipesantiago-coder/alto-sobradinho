'use client';

import { PropertyInfo } from '@/data/altoHorizonte';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface PropertySelectorProps {
  properties: PropertyInfo[];
  selectedProperty: string;
  onPropertyChange: (propertyId: string) => void;
}

export function PropertySelector({ properties, selectedProperty, onPropertyChange }: PropertySelectorProps) {
  return (
    <Card className="w-full max-w-2xl mx-auto mb-6">
      <CardContent className="p-6">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Selecione o Empreendimento</h2>
          <p className="text-gray-600">Escolha qual espelho de venda deseja visualizar</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {properties.map((property) => (
            <Button
              key={property.name}
              variant={selectedProperty === property.name ? "default" : "outline"}
              className={`p-6 h-auto flex flex-col items-center justify-center space-y-2 transition-all ${
                selectedProperty === property.name 
                  ? 'shadow-lg text-white' 
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => onPropertyChange(property.name)}
              style={{
                backgroundColor: selectedProperty === property.name ? property.colors.primary : undefined,
                borderColor: property.colors.primary,
              }}
            >
              <div className="text-lg font-bold">{property.name}</div>
              <div className="text-sm opacity-80">{property.subtitle}</div>
              <div className="text-xs opacity-70 mt-2">{property.totalUnits} unidades</div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}