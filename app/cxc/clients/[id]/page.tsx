import { notFound } from "next/navigation"
import { getCxcClient, getCxcDebtsByClient } from "@/app/cxc/actions"
import { ClientDetail } from "@/components/cxc/client-detail"

export default async function CxcClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [client, debts] = await Promise.all([getCxcClient(id), getCxcDebtsByClient(id)])

  if (!client) notFound()

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <ClientDetail client={client} debts={debts} />
    </main>
  )
}
