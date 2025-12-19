"use client"

import { useEffect, useState } from "react"
import { Loader, AlertCircle, FileSpreadsheet, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

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
      {/* LAYOUT UPDATE:
         - h-[100dvh] on mobile forces full screen height
         - sm:h-auto & sm:max-h-[85vh] restricts it on desktop
         - flex-col & p-0 allow us to create fixed header/footers with scrolling content
      */}
      <DialogContent className="w-full h-[80dvh] sm:h-auto sm:max-h-[85vh] sm:max-w-4xl flex flex-col gap-0 p-0 border-0 sm:border rounded-none sm:rounded-lg">
        
        {/* Fixed Header */}
        <DialogHeader className="px-6 py-4 border-b bg-background shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-full hidden sm:block">
              <FileSpreadsheet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle>Required Data Schema</DialogTitle>
              <DialogDescription className="mt-1">
                Ensure your CSV matches these specifications.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] space-y-4">
              <Loader className="w-8 h-8 text-primary animate-spin" />
              <p className="text-muted-foreground animate-pulse">Fetching column definitions...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-4">
              <div className="p-3 bg-destructive/10 rounded-full mb-3">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <h3 className="font-semibold text-foreground">Failed to Load Schema</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-xs">{error}</p>
              <button 
                onClick={() => fetchColumns()}
                className="mt-4 text-xs text-primary hover:underline"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              {columns.map((column, idx) => (
                <Card 
                  key={idx} 
                  className="p-3 sm:p-4 border shadow-sm hover:shadow-md transition-all hover:border-primary/20 bg-card flex flex-col"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center flex-wrap gap-2 mb-1.5">
                        <code className="text-sm font-bold font-mono text-foreground bg-muted px-1.5 py-0.5 rounded break-all">
                          {column.name}
                        </code>
                        {column.required && (
                          <Badge variant="destructive" className="h-5 px-1.5 text-[10px] uppercase tracking-wider">
                            Required
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-snug">
                        {column.description}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                       <span className="font-medium bg-primary/5 px-2 py-0.5 rounded text-primary">
                         {column.type}
                       </span>
                    </div>
                    <div className="font-mono bg-muted/50 px-1.5 py-0.5 rounded max-w-[120px] truncate" title={column.example}>
                      Ex: {column.example}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
        
      </DialogContent>
    </Dialog>
  )
}