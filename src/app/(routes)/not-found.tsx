'use client'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Home, Building2 } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto border-0 shadow-lg">
          <CardContent className="p-12 text-center">
            <div className="mb-6">
              <Building2 className="h-20 w-20 mx-auto text-muted-foreground mb-4" />
              <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-2">
                404
              </h1>
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Página Não Encontrada
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                A página que você está procurando não existe ou foi movida.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/">
                <Button className="w-full sm:w-auto bg-primary hover:bg-primary/90">
                  <Home className="h-4 w-4 mr-2" />
                  Voltar para Home
                </Button>
              </Link>
              <Link href="/empreendimento/alto-da-alvorada">
                <Button variant="outline" className="w-full sm:w-auto">
                  Alto da Alvorada
                </Button>
              </Link>
              <Link href="/empreendimento/alto-do-horizonte">
                <Button variant="outline" className="w-full sm:w-auto">
                  Alto do Horizonte
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}