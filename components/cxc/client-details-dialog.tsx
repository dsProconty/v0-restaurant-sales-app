"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ClientDetailContent } from "@/components/cxc/client-detail-content"
import type { CxcClient, CxcDebt } from "@/lib/cxc"

interface Product {
  id: string
  name: string
  category: string
  price: number
}

export function ClientDetailsDialog({
  client,
  debts,
  products,
  allClients,
  trigger,
}: {
  client: CxcClient
  debts: CxcDebt[]
  products: Product[]
  allClients: CxcClient[]
  trigger: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">Detalles de {client.name}</DialogTitle>
        </DialogHeader>
        <ClientDetailContent client={client} debts={debts} products={products} allClients={allClients} />
      </DialogContent>
    </Dialog>
  )
}
