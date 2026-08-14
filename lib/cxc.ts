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
