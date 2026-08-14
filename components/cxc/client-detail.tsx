"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ClientDetailContent } from "@/components/cxc/client-detail-content"
import { ArrowLeft } from "lucide-react"
import type { CxcClient, CxcDebt } from "@/lib/cxc"

export function ClientDetail({ client, debts }: { client: CxcClient; debts: CxcDebt[] }) {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <Button variant="ghost" size="sm" className="w-fit" onClick={() => router.push("/cxc")}>
        <ArrowLeft className="h-4 w-4 mr-1" />
        Volver
      </Button>
      <ClientDetailContent client={client} debts={debts} />
    </div>
  )
}
