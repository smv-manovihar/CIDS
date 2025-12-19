"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader, Zap, AlertCircle } from "lucide-react"

interface ModelSelectorProps {
  onModelChange?: (model: string) => void
}

export default function ModelSelector({ onModelChange }: ModelSelectorProps) {
  const [models, setModels] = useState<string[]>([])
  const [selectedModel, setSelectedModel] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const API_BASE = typeof window !== "undefined" ? (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000") : "http://localhost:8000"

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
      console.log("Fetched models:", data)
      setModels(data || [])
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Detection Model
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader className="h-4 w-4 animate-spin" />
            Loading models...
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        ) : (
          <Select value={selectedModel} onValueChange={handleModelChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select model" />
            </SelectTrigger>
            <SelectContent>
              {models.map((model) => (
                <SelectItem key={model} value={model}>
                  {model}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {!isLoading && !error && models.length === 0 && (
          <p className="text-sm text-muted-foreground mt-2">No models available</p>
        )}
      </CardContent>
    </Card>
  )
}
