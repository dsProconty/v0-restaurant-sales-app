import { notFound } from "next/navigation"
import { getCxcDebt } from "@/app/cxc/actions"
import { DebtDetail } from "@/components/cxc/debt-detail"

export default async function CxcDebtPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const debt = await getCxcDebt(id)

  if (!debt) notFound()

  return (
    <main className="mx-auto max-w-4xl px-4 py-6">
      <DebtDetail debt={debt} />
    </main>
  )
}
