"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { DebtForm } from "@/components/cxc/debt-form"
import type { CxcClient } from "@/lib/cxc"

interface Product {
  id: string
  name: string
  category: string
  price: number
}

export function NewDebtDialog({
  clients,
  products,
  defaultClientId,
  trigger,
}: {
  clients: CxcClient[]
  products: Product[]
  defaultClientId?: string
  trigger: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear deuda</DialogTitle>
        </DialogHeader>
        <DebtForm
          clients={clients}
          products={products}
          defaultClientId={defaultClientId}
          onSuccess={() => setOpen(false)}
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  )
}
