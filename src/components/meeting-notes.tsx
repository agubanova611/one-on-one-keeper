"use client"

import { useState } from "react"
import { updateMeeting } from "@/actions/meeting.actions"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Loader2, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { FileText } from "lucide-react"

interface MeetingNotesProps {
  meetingId: string
  initialNotes: string | null
}

export function MeetingNotes({ meetingId, initialNotes }: MeetingNotesProps) {
  const { toast } = useToast()
  const [notes, setNotes] = useState(initialNotes || "")
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await updateMeeting(meetingId, { notes: notes || undefined })
      setHasChanges(false)
      toast({ title: "Сохранено" })
    } catch {
      toast({ title: "Ошибка", variant: "destructive" })
    }
    setIsSaving(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <CardTitle>Заметки</CardTitle>
          </div>
          {hasChanges && (
            <Button size="sm" onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Сохранить
            </Button>
          )}
        </div>
        <CardDescription>
          Записывайте основные моменты встречи
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Textarea
          placeholder="Что обсудили..."
          className="min-h-[200px]"
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value)
            setHasChanges(true)
          }}
        />
      </CardContent>
    </Card>
  )
}
