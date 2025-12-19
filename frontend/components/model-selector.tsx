"use client"

import { useState, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader, AlertCircle } from "lucide-react"

interface ModelSelectorProps {
  onModelChange?: (model: string) => void
}

export default function ModelSelector({ onModelChange }: ModelSelectorProps) {
  const [models, setModels] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const API_BASE =
    typeof window !== "undefined"
      ? process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
      : "http://localhost:8000"

  useEffect(() => {
    fetchModels()
  }, [])

  const fetchModels = async () => {
    try {
      setIsLoading(true)
      setError("")
      const res = await fetch(`${API_BASE}/api/models`)
      if (!res.ok) throw new Error(`Failed to fetch models: ${res.status}`)
      const data = await res.json()
      // console.log("Fetched models:", data) // Optional: reduce log noise
      setModels(data || [])
      
      // Auto-select the first model if available
      if (data?.length > 0 && onModelChange) {
        setSelectedModel(data[0])
        onModelChange(data[0])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleModelChange = (value: string) => {
    setSelectedModel(value)
    if (onModelChange) onModelChange(value)
  }

  // 1. LOADING STATE: Minimal inline spinner
  if (isLoading) {
    return (
      <div className="flex items-center gap-2 h-10 px-3 text-sm text-muted-foreground border rounded-md bg-muted/20">
        <Loader className="h-4 w-4 animate-spin" />
        <span>Loading models...</span>
      </div>
    )
  }

  // 2. ERROR STATE: Red border input look-alike
  if (error) {
    return (
      <div className="flex items-center gap-2 h-10 px-3 text-sm text-destructive border border-destructive/50 bg-destructive/10 rounded-md">
        <AlertCircle className="h-4 w-4" />
        <span>Error loading models</span>
      </div>
    )
  }

  // 3. EMPTY STATE
  if (models.length === 0) {
    return (
      <div className="h-10 flex items-center px-3 text-sm border rounded-md bg-muted text-muted-foreground">
        No models found
      </div>
    )
  }

  // 4. ACTIVE STATE: Pure Select Component (No Card)
  return (
    <Select value={selectedModel} onValueChange={handleModelChange}>
      <SelectTrigger className="w-full bg-background border-input shadow-sm">
        <SelectValue placeholder="Select a model..." />
      </SelectTrigger>
      <SelectContent>
        {models.map((model) => (
          <SelectItem key={model} value={model}>
            {model}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}