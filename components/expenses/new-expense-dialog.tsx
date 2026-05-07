"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { ExpenseForm } from "./expense-form"

interface Category {
  id: string
  name: string
  color: string
}

export function NewExpenseDialog({ categories }: { categories: Category[] }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  function handleSuccess() {
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <PlusCircle className="h-4 w-4 mr-1" />
          Nuevo gasto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo gasto</DialogTitle>
        </DialogHeader>
        <ExpenseForm categories={categories} onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  )
}
