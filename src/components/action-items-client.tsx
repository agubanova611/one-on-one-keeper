"use client"

import { useState } from "react"
import { toggleActionItem, deleteActionItem } from "@/actions/action-item.actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckSquare, AlertCircle, CheckCircle2, Circle, Trash2 } from "lucide-react"
import { format, parseISO, isPast } from "date-fns"
import { ru } from "date-fns/locale"
import { ActionItem } from "@/types/database"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface ActionItemsClientProps {
  allItems: ActionItem[]
  openItems: ActionItem[]
  completedItems: ActionItem[]
  overdueItems: ActionItem[]
}

export function ActionItemsClient({
  allItems,
  openItems: initialOpenItems,
  completedItems: initialCompletedItems,
  overdueItems: initialOverdueItems,
}: ActionItemsClientProps) {
  const { toast } = useToast()
  const router = useRouter()
  const [openItems, setOpenItems] = useState(initialOpenItems)
  const [completedItems, setCompletedItems] = useState(initialCompletedItems)
  const [overdueItems] = useState(initialOverdueItems)

  const handleToggle = async (id: string, completed: boolean) => {
    try {
      await toggleActionItem(id, !completed)
      
      if (!completed) {
        const item = openItems.find(i => i.id === id)
        if (item) {
          setOpenItems(openItems.filter(i => i.id !== id))
          setCompletedItems([{ ...item, completed: true }, ...completedItems])
        }
      } else {
        const item = completedItems.find(i => i.id === id)
        if (item) {
          setCompletedItems(completedItems.filter(i => i.id !== id))
          setOpenItems([{ ...item, completed: false }, ...openItems])
        }
      }
      
      toast({ title: completed ? "Отмечено как невыполненное" : "Выполнено" })
    } catch {
      toast({ title: "Ошибка", variant: "destructive" })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteActionItem(id)
      setOpenItems(openItems.filter(i => i.id !== id))
      setCompletedItems(completedItems.filter(i => i.id !== id))
      toast({ title: "Удалено" })
    } catch {
      toast({ title: "Ошибка", variant: "destructive" })
    }
  }

  return (
    <Tabs defaultValue="open" className="space-y-4">
      <TabsList>
        <TabsTrigger value="open">
          Открытые ({openItems.length})
        </TabsTrigger>
        <TabsTrigger value="overdue">
          Просроченные ({overdueItems.length})
        </TabsTrigger>
        <TabsTrigger value="completed">
          Выполненные ({completedItems.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="open" className="space-y-3">
        {openItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Все задачи выполнены!</h3>
              <p className="text-muted-foreground">Нет открытых экшн-айтемов</p>
            </CardContent>
          </Card>
        ) : (
          openItems.map((item) => (
            <ActionItemCard
              key={item.id}
              item={item}
              onToggle={() => handleToggle(item.id, item.completed)}
              onDelete={() => handleDelete(item.id)}
            />
          ))
        )}
      </TabsContent>

      <TabsContent value="overdue" className="space-y-3">
        {overdueItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Нет просроченных задач</p>
            </CardContent>
          </Card>
        ) : (
          overdueItems.map((item) => (
            <ActionItemCard
              key={item.id}
              item={item}
              onToggle={() => handleToggle(item.id, item.completed)}
              onDelete={() => handleDelete(item.id)}
              isOverdue
            />
          ))
        )}
      </TabsContent>

      <TabsContent value="completed" className="space-y-3">
        {completedItems.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">Нет выполненных задач</p>
            </CardContent>
          </Card>
        ) : (
          completedItems.map((item) => (
            <ActionItemCard
              key={item.id}
              item={item}
              onToggle={() => handleToggle(item.id, item.completed)}
              onDelete={() => handleDelete(item.id)}
            />
          ))
        )}
      </TabsContent>
    </Tabs>
  )
}

function ActionItemCard({
  item,
  onToggle,
  onDelete,
  isOverdue = false,
}: {
  item: ActionItem
  onToggle: () => void
  onDelete: () => void
  isOverdue?: boolean
}) {
  return (
    <Card className={isOverdue ? "border-destructive" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <button onClick={onToggle} className="mt-0.5">
            {item.completed ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <p className={`font-medium ${item.completed ? "line-through text-muted-foreground" : ""}`}>
              {item.title}
            </p>
            {item.description && (
              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2">
              {item.due_date && (
                <span className={`text-xs flex items-center gap-1 ${
                  isOverdue && !item.completed ? "text-destructive" : "text-muted-foreground"
                }`}>
                  {isOverdue && !item.completed && <AlertCircle className="h-3 w-3" />}
                  {format(parseISO(item.due_date), "d MMM yyyy", { locale: ru })}
                </span>
              )}
              <Badge variant="outline" className="text-xs">
                {item.priority === "high" ? "Высокий" : 
                 item.priority === "medium" ? "Средний" : "Низкий"}
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
