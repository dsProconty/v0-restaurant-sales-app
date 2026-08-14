export interface CxcClient {
  id: string
  name: string
  phone: string | null
  notes: string | null
  is_active: boolean
}

export interface CxcDebtItem {
  id: string
  debt_id: string
  product_id: string | null
  product_name: string
  quantity: number
  unit_price: number
  subtotal: number
}

export interface CxcPayment {
  id: string
  debt_id: string
  amount: number
  payment_date: string
  notes: string | null
}

export interface CxcDebt {
  id: string
  client_id: string
  consumption_date: string
  due_date: string | null
  total_amount: number
  notes: string | null
  created_at: string
  cxc_clients: CxcClient | null
  cxc_debt_items: CxcDebtItem[]
  cxc_payments: CxcPayment[]
}

export type CxcStatus = "pending" | "partial" | "paid"

export function getCxcPaidAmount(debt: Pick<CxcDebt, "cxc_payments">) {
  return debt.cxc_payments.reduce((sum, p) => sum + Number(p.amount), 0)
}

export function getCxcBalance(debt: Pick<CxcDebt, "total_amount" | "cxc_payments">) {
  return Number(debt.total_amount) - getCxcPaidAmount(debt)
}

export function getCxcStatus(debt: Pick<CxcDebt, "total_amount" | "cxc_payments">): CxcStatus {
  const paid = getCxcPaidAmount(debt)
  if (paid <= 0) return "pending"
  if (paid >= Number(debt.total_amount)) return "paid"
  return "partial"
}

export function isCxcOverdue(debt: Pick<CxcDebt, "due_date" | "total_amount" | "cxc_payments">, todayStr: string) {
  if (!debt.due_date) return false
  if (getCxcBalance(debt) <= 0) return false
  return debt.due_date < todayStr
}

export function getCxcStatusLabel(status: CxcStatus, overdue: boolean) {
  if (status === "paid") return "Pagada"
  if (overdue) return "Vencida"
  if (status === "partial") return "Parcial"
  return "Pendiente"
}

export interface CxcClientSummary {
  client: CxcClient
  debts: CxcDebt[]
  debtCount: number
  totalAmount: number
  totalPaid: number
  totalBalance: number
  lastConsumptionDate: string
  status: CxcStatus
  overdue: boolean
}

export function summarizeClientDebts(debts: CxcDebt[], todayStr: string): CxcClientSummary[] {
  const byClient = new Map<string, CxcClientSummary>()

  for (const debt of debts) {
    if (!debt.cxc_clients) continue
    const balance = getCxcBalance(debt)
    const paid = getCxcPaidAmount(debt)
    const overdue = isCxcOverdue(debt, todayStr)

    let entry = byClient.get(debt.client_id)
    if (!entry) {
      entry = {
        client: debt.cxc_clients,
        debts: [],
        debtCount: 0,
        totalAmount: 0,
        totalPaid: 0,
        totalBalance: 0,
        lastConsumptionDate: debt.consumption_date,
        status: "pending",
        overdue: false,
      }
      byClient.set(debt.client_id, entry)
    }

    entry.debts.push(debt)
    entry.debtCount += 1
    entry.totalAmount += Number(debt.total_amount)
    entry.totalPaid += paid
    entry.totalBalance += balance
    entry.overdue = entry.overdue || overdue
    if (debt.consumption_date > entry.lastConsumptionDate) entry.lastConsumptionDate = debt.consumption_date
  }

  for (const entry of byClient.values()) {
    if (entry.totalBalance <= 0.001) entry.status = "paid"
    else if (entry.totalPaid > 0) entry.status = "partial"
    else entry.status = "pending"
  }

  return Array.from(byClient.values())
}
