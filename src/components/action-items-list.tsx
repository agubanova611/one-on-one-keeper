"use client"

import { useState } from "react"
import { toggleActionItem, deleteActionItem, createActionItem } from "@/actions/action-item.actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Plus, Trash2, CheckCircle2, Circle, AlertCircle, CheckSquare } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { ActionItem, ActionItemFormData } from "@/types/database"
import { format, parseISO, isPast } from "date-fns"
import { ru } from "date-fns/locale"

interface ActionItemsListProps {
  meetingId: string
  actionItems: ActionItem[]
  progress: number
  completedCount: number
  totalCount: number
}

export function ActionItemsList({
  meetingId,
  actionItems: initialItems,
  progress,
  completedCount,
  totalCount,
}: ActionItemsListProps) {
  const { toast } = useToast()
  const [items, setItems] = useState(initialItems)
  const [newItemTitle, setNewItemTitle] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleToggle = async (id: string, completed: boolean) => {
    try {
      await toggleActionItem(id, !completed)
      setItems(items.map(item => 
        item.id === id ? { ...item, completed: !completed } : item
      ))
      toast({
        title: !completed ? "Выполнено" : "Отмечено как невыполненное",
      })
    } catch {
      toast({ title: "Ошибка", variant: "destructive" })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteActionItem(id)
      setItems(items.filter(item => item.id !== id))
      toast({ title: "Удалено" })
    } catch {
      toast({ title: "Ошибка", variant: "destructive" })
    }
  }

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newItemTitle.trim()) return
    
    setLoading(true)
    try {
      const newItem = await createActionItem({
        title: newItemTitle,
        meeting_id: meetingId,
        priority: "medium",
      } as ActionItemFormData)
      setItems([...items, newItem])
      setNewItemTitle("")
      setIsAdding(false)
      toast({ title: "Добавлено" })
    } catch {
      toast({ title: "Ошибка", variant: "destructive" })
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              Экшн-айтемы
            </CardTitle>
            <CardDescription>
              {completedCount} из {totalCount} выполнено
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setIsAdding(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Добавить
          </Button>
        </div>
        {totalCount > 0 && (
          <Progress value={progress} className="mt-4" />
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 && !isAdding && (
          <p className="text-muted-foreground text-sm text-center py-4">
            Нет экшн-айтемов для этой встречи
          </p>
        )}

        {items.map((item) => {
          const isOverdue = !item.completed && item.due_date && isPast(parseISO(item.due_date))
          
          return (
            <div
              key={item.id}
              className={`flex items-start gap-3 p-3 rounded-lg border ${
                item.completed ? "bg-muted/50" : ""
              }`}
            >
              <button
                onClick={() => handleToggle(item.id, item.completed)}
                className="mt-0.5"
              >
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
                {item.due_date && (
                  <p className={`text-xs mt-1 flex items-center gap-1 ${
                    isOverdue ? "text-destructive" : "text-muted-foreground"
                  }`}>
                    {isOverdue && <AlertCircle className="h-3 w-3" />}
                    Дедлайн: {format(parseISO(item.due_date), "d MMM", { locale: ru })}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                onClick={() => handleDelete(item.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )
        })}

        {isAdding && (
          <form onSubmit={handleAdd} className="flex gap-2">
            <Input
              placeholder="Новый экшн-айтем..."
              value={newItemTitle}
              onChange={(e) => setNewItemTitle(e.target.value)}
              className="flex-1"
              autoFocus
            />
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? "..." : "Добавить"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAdding(false)
                setNewItemTitle("")
              }}
            >
              Отмена
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
