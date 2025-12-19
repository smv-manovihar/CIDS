"use client"

import { useEffect, useState } from "react"
import { Loader, AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"

interface ColumnsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ColumnSchema {
  name: string
  type: string
  description: string
  required: boolean
  example: string
}

const API_BASE =
  typeof window !== "undefined"
    ? process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
    : "http://localhost:8000"

export default function ColumnsDialog({ open, onOpenChange }: ColumnsDialogProps) {
  const [columns, setColumns] = useState<ColumnSchema[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open && columns.length === 0 && !isLoading) {
      void fetchColumns()
    }
  }, [open])

  const fetchColumns = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const res = await fetch(`${API_BASE}/api/schema/columns`)
      if (!res.ok) {
        throw new Error(`Failed to load schema: ${res.status}`)
      }
      const data: ColumnSchema[] = await res.json()
      setColumns(data)
    } catch (err: any) {
      console.error("Error fetching schema:", err)
      setError(err.message || "Unable to load schema from backend")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>NetFlow Data Column Requirements</DialogTitle>
          <DialogDescription>Your CSV file must include these columns for proper analysis</DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <Loader className="w-8 h-8 text-accent animate-spin" />
            <p className="text-muted-foreground">Loading column specifications...</p>
          </div>
        ) : error ? (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Error Loading Schema</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3">
              {columns.map((column, idx) => (
                <Card key={idx} className="p-4 border-border hover:border-accent/50 transition-colors">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <code className="text-sm font-mono text-accent bg-card/50 px-2 py-1 rounded">
                          {column.name}
                        </code>
                        <span className="text-xs font-medium text-muted-foreground">{column.type}</span>
                        {column.required && <span className="text-xs font-bold text-destructive">REQUIRED</span>}
                      </div>
                      <p className="text-sm text-foreground mt-1">{column.description}</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Example: <code className="bg-background px-1.5 py-0.5 rounded">{column.example}</code>
                  </div>
                </Card>
              ))}
            </div>

            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 space-y-2">
              <p className="text-sm font-medium text-foreground">✓ CSV format with headers in first row</p>
              <p className="text-sm font-medium text-foreground">✓ All required fields must be present</p>
              <p className="text-sm font-medium text-foreground">✓ Maximum file size: 100MB</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
