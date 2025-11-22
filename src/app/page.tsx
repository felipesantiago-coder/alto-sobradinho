'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Eye } from 'lucide-react';

export default function Home() {
  const [selectedProject, setSelectedProject] = useState<'alvorada' | 'horizonte' | null>(null);

  if (selectedProject === 'alvorada') {
    return <AltoAlvoradaMirror onBack={() => setSelectedProject(null)} />;
  }

  if (selectedProject === 'horizonte') {
    return <AltoHorizonteMirror onBack={() => setSelectedProject(null)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Espelhos de Vendas - Alto Sobradinho
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Sistema de visualização de unidades disponíveis para os projetos Alto da Alvorada e Alto do Horizonte
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl text-slate-900">Alto da Alvorada</CardTitle>
              <CardDescription className="text-slate-600">
                344 unidades distribuídas em 4 blocos com 2 e 3 quartos
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                onClick={() => setSelectedProject('alvorada')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                size="lg"
              >
                <Eye className="w-4 h-4 mr-2" />
                Visualizar Espelho de Vendas
              </Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Building2 className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-slate-900">Alto do Horizonte</CardTitle>
              <CardDescription className="text-slate-600">
                344 unidades distribuídas em 4 blocos com 2 e 3 quartos
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button 
                onClick={() => setSelectedProject('horizonte')}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                <Eye className="w-4 h-4 mr-2" />
                Visualizar Espelho de Vendas
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center text-slate-500">
          <p>© 2025 Alto Sobradinho - Todos os direitos reservados</p>
          <p className="text-sm mt-2">Coordenador de Produto: Felipe Santiago</p>
        </div>
      </div>
    </div>
  );
}

function AltoAlvoradaMirror({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button 
            onClick={onBack}
            variant="outline"
            className="mb-4"
          >
            ← Voltar
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">Alto da Alvorada - Espelho de Vendas</h1>
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-4">
        <iframe 
          src="/alto-alvorada.html" 
          className="w-full h-screen border-0 rounded-lg shadow-lg"
          title="Alto da Alvorada - Espelho de Vendas"
        />
      </div>
    </div>
  );
}

function AltoHorizonteMirror({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Button 
            onClick={onBack}
            variant="outline"
            className="mb-4"
          >
            ← Voltar
          </Button>
          <h1 className="text-3xl font-bold text-slate-900">Alto do Horizonte - Espelho de Vendas</h1>
        </div>
      </div>
      <div className="max-w-7xl mx-auto p-4">
        <iframe 
          src="/alto-horizonte.html" 
          className="w-full h-screen border-0 rounded-lg shadow-lg"
          title="Alto do Horizonte - Espelho de Vendas"
        />
      </div>
    </div>
  );
}