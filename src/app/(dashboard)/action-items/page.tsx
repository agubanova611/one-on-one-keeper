import Link from "next/link"
import { getActionItems } from "@/actions/action-item.actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckSquare, AlertCircle, CheckCircle2, Circle } from "lucide-react"
import { format, parseISO, isPast } from "date-fns"
import { ru } from "date-fns/locale"
import { toggleActionItem } from "@/actions/action-item.actions"
import { ActionItemsClient } from "@/components/action-items-client"

export const metadata = {
  title: "Экшн-айтемы - 1:1 Keeper",
}

export default async function ActionItemsPage() {
  const [allItems, openItems, completedItems, overdueItems] = await Promise.all([
    getActionItems(),
    getActionItems({ completed: false }),
    getActionItems({ completed: true }),
    getActionItems({ overdue: true }),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Экшн-айтемы</h1>
        <p className="text-muted-foreground">
          Все задачи с ваших встреч 1:1
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Открытые</CardTitle>
            <Circle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openItems.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Выполненные</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedItems.length}</div>
          </CardContent>
        </Card>
        <Card className={overdueItems.length > 0 ? "border-destructive" : ""}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Просроченные</CardTitle>
            <AlertCircle className={`h-4 w-4 ${overdueItems.length > 0 ? "text-destructive" : "text-muted-foreground"}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${overdueItems.length > 0 ? "text-destructive" : ""}`}>
              {overdueItems.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items List */}
      <ActionItemsClient
        allItems={allItems}
        openItems={openItems}
        completedItems={completedItems}
        overdueItems={overdueItems}
      />
    </div>
  )
}
