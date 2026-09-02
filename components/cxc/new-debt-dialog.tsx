"use client"

import { useState } from "react"
import { getCxcClients, getActiveProducts } from "@/app/cxc/actions"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DebtForm } from "@/components/cxc/debt-form"
import { Loader2 } from "lucide-react"
import type { CxcClient } from "@/lib/cxc"

interface Product {
  id: string
  name: string
  category: string
  price: number
}

export function NewDebtDialog({
  defaultClientId,
  trigger,
}: {
  defaultClientId?: string
  trigger: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<CxcClient[] | null>(null)
  const [products, setProducts] = useState<Product[] | null>(null)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next && clients === null) {
      setLoading(true)
      Promise.all([getCxcClients(), getActiveProducts()])
        .then(([c, p]) => {
          setClients(c)
          setProducts(p)
        })
        .finally(() => setLoading(false))
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear deuda</DialogTitle>
        </DialogHeader>
        {loading || clients === null || products === null ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Cargando...
          </div>
        ) : (
          <DebtForm
            clients={clients}
            products={products}
            defaultClientId={defaultClientId}
            onSuccess={() => setOpen(false)}
            onCancel={() => setOpen(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
